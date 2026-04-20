import axios from "axios";
import { ACCOUNT_TYPE, HTTP_STATUS, PAYMENT_FOR, PAYMENT_METHOD, PAYMENT_STATUS, PLAN_DURATION, SUBSCRIPTION_STATUS } from "../../common";
import { orderModel, paymentModel, planModel, settingModel, storeModel, themeModel, userModel } from "../../database";
import { getFirstMatch, reqInfo, responseMessage, updateData } from "../../helper";
import { apiResponse } from "../../type";
import { createPhonePePaymentSchema } from "../../validation";

const isProd = process.env.NODE_ENV === "production";
const PHONEPE_AUTH_URL = isProd ? "https://api.phonepe.com/apis/identity-manager/v1/oauth/token" : "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token";
const PHONEPE_PAY_URL = isProd ? "https://api.phonepe.com/apis/pg/checkout/v2/pay" : "https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay";

const generateMerchantOrderId = () => `pp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

const resolvePhonePeSetting = async () => {
  return getFirstMatch(
    settingModel,
    {
      isDeleted: { $ne: true },
      phonePeApiKey: { $exists: true, $nin: ["", null] },
      phonePeApiSecret: { $exists: true, $nin: ["", null] },
      phonePeVersion: { $exists: true, $nin: ["", null] },
    },
    {},
    { sort: { updatedAt: -1 } }
  );
};

const getPhonePeAccessToken = async (setting: any) => {
  const clientId = setting?.phonePeApiKey;
  const clientSecret = setting?.phonePeApiSecret;
  const clientVersion = setting?.phonePeVersion;

  if (!clientId || !clientSecret || !clientVersion) {
    throw new Error("PhonePe configuration missing. Please set phonePeApiKey, phonePeApiSecret and phonePeVersion in setting.");
  }

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("client_version", String(clientVersion));
  params.append("client_secret", clientSecret);
  params.append("grant_type", "client_credentials");

  const response = await axios.post(PHONEPE_AUTH_URL, params.toString(), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
  });

  const accessToken = response?.data?.access_token || response?.data?.accessToken;
  if (!accessToken) throw new Error("Access token not received from PhonePe API");
  return accessToken;
};

const extractPaymentUrl = (responseData: any) => {
  return responseData?.data?.instrumentResponse?.redirectInfo?.url || responseData?.data?.redirectUrl || responseData?.redirectUrl || responseData?.url || "";
};

const mapPaymentStateToStatus = (state: string = "") => {
  if (state === "COMPLETED" || state === "SUCCESS" || state === "completed" || state === "success") return PAYMENT_STATUS.SUCCESS;
  return PAYMENT_STATUS.FAILED;
};

const resolveSubscriptionEndDate = (duration: PLAN_DURATION, startDate: Date) => {
  const nextDate = new Date(startDate);
  if (duration === PLAN_DURATION.YEARLY) nextDate.setFullYear(nextDate.getFullYear() + 1);
  else nextDate.setMonth(nextDate.getMonth() + 1);
  return nextDate;
};

const hasOrderAccess = async (loggedInUser: any, existingOrder: any) => {
  if (!loggedInUser || !existingOrder) return false;
  if (loggedInUser?.role === ACCOUNT_TYPE.ADMIN) return true;

  if (loggedInUser?.role === ACCOUNT_TYPE.VENDOR) {
    const existingStore = await getFirstMatch(
      storeModel,
      {
        _id: existingOrder.storeId,
        userId: loggedInUser._id,
        isDeleted: { $ne: true },
      },
      {},
      {}
    );

    return !!existingStore;
  }

  return String(existingOrder?.customerId) === String(loggedInUser?._id);
};

const applyOrderPayment = async (paymentData: {
  orderId: string;
  paymentMethod: PAYMENT_METHOD;
  transactionId: string;
  paidAt: Date | null;
  paymentStatus: PAYMENT_STATUS;
}) => {
  const existingOrder: any = await getFirstMatch(orderModel, { _id: paymentData.orderId, isDeleted: { $ne: true } }, {}, {});
  if (!existingOrder) return;

  const existingPaymentDetails = existingOrder?.paymentDetails || {};
  const orderPaymentDetailsStatus = paymentData.paymentStatus === PAYMENT_STATUS.SUCCESS ? "success" : paymentData.paymentStatus === PAYMENT_STATUS.FAILED ? "failed" : "pending";

  const updatePayload: any = {
    paymentDetails: {
      ...existingPaymentDetails,
      method: paymentData.paymentMethod,
      transactionId: paymentData.transactionId,
      status: orderPaymentDetailsStatus,
      paidAt: paymentData.paymentStatus === PAYMENT_STATUS.SUCCESS ? paymentData.paidAt : null,
    },
  };

  if (paymentData.paymentStatus === PAYMENT_STATUS.SUCCESS) {
    updatePayload.financialStatus = "paid";
    updatePayload.isPaid = true;
  } else if (paymentData.paymentStatus === PAYMENT_STATUS.FAILED) {
    updatePayload.financialStatus = existingOrder?.isPaid ? existingOrder?.financialStatus : "failed";
    updatePayload.isPaid = existingOrder?.isPaid === true;
  }

  await updateData(orderModel, { _id: existingOrder._id, isDeleted: { $ne: true } }, updatePayload, { runValidators: true });
};

const resolvePaymentContext = async (value: any, res: any, loggedInUser: any) => {
  if (value?.planId) {
    const existingPlan: any = await getFirstMatch(planModel, { _id: value.planId, isActive: true, isDeleted: { $ne: true } }, {}, {});
    if (!existingPlan) {
      return {
        errorResponse: res
          .status(HTTP_STATUS.NOT_FOUND)
          .json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Plan"), {}, {})),
      };
    }

    const amount = Number(existingPlan?.price || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      return {
        errorResponse: res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, "Plan amount is invalid", {}, {})),
      };
    }

    return {
      paymentFor: PAYMENT_FOR.PLAN_SUBSCRIPTION,
      amount,
      plan: existingPlan,
      theme: null,
      order: null,
      message: `Subscription payment for plan ${existingPlan?.name}`,
    };
  }

  if (value?.themeId) {
    const existingTheme: any = await getFirstMatch(themeModel, { _id: value.themeId, isActive: true, isDeleted: { $ne: true } }, {}, {});
    if (!existingTheme) {
      return {
        errorResponse: res
          .status(HTTP_STATUS.NOT_FOUND)
          .json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Theme"), {}, {})),
      };
    }

    const amount = Number(existingTheme?.price || 0);
    if (existingTheme?.isPremium !== true || !Number.isFinite(amount) || amount <= 0) {
      return {
        errorResponse: res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, "Theme payment is not required", {}, {})),
      };
    }

    return {
      paymentFor: PAYMENT_FOR.THEME_PURCHASE,
      amount,
      plan: null,
      theme: existingTheme,
      order: null,
      message: `Theme purchase payment for theme ${existingTheme?.name}`,
    };
  }

  const existingOrder: any = await getFirstMatch(orderModel, { _id: value.orderId, isDeleted: { $ne: true } }, {}, {});
  if (!existingOrder) {
    return {
      errorResponse: res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Order"), {}, {})),
    };
  }

  const isOrderAccessible = await hasOrderAccess(loggedInUser, existingOrder);
  if (!isOrderAccessible) {
    return {
      errorResponse: res.status(HTTP_STATUS.FORBIDDEN).json(apiResponse(HTTP_STATUS.FORBIDDEN, responseMessage.accessDenied, {}, {})),
    };
  }

  if (existingOrder?.isCancelled === true || existingOrder?.status === "cancelled") {
    return {
      errorResponse: res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, "Cancelled order cannot be paid", {}, {})),
    };
  }

  if (existingOrder?.isPaid === true || existingOrder?.financialStatus === "paid") {
    return {
      errorResponse: res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, "Order is already paid", {}, {})),
    };
  }

  const amount = Number(existingOrder?.totalPrice || 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    return {
      errorResponse: res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, "Order amount is invalid", {}, {})),
    };
  }

  return {
    paymentFor: PAYMENT_FOR.ORDER_PURCHASE,
    amount,
    plan: null,
    theme: null,
    order: existingOrder,
    message: `Order payment for ${existingOrder?.orderName || `#${existingOrder?.orderNumber}`}`,
  };
};

export const createPhonePeSubscriptionPayment = async (req, res) => {
  reqInfo(req);
  try {
    const { error, value } = createPhonePePaymentSchema.validate(req.body);
    if (error) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, error?.details[0]?.message, {}, {}));

    const loggedInUser = req.headers.user as any;
    const paymentContext = await resolvePaymentContext(value, res, loggedInUser);
    if (paymentContext?.errorResponse) return paymentContext.errorResponse;

    const setting = await resolvePhonePeSetting();
    if (!setting) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(apiResponse(HTTP_STATUS.BAD_REQUEST, "PhonePe configuration missing. Please configure it in setting.", {}, {}));
    }

    const accessToken = await getPhonePeAccessToken(setting);
    const merchantOrderId = generateMerchantOrderId();
    const paymentPayload = {
      merchantOrderId,
      amount: Math.round(paymentContext.amount * 100),
      expireAfter: 500,
      metaInfo: {
        udf1: merchantOrderId,
      },
      paymentFlow: {
        type: "PG_CHECKOUT",
        message: paymentContext.message,
        merchantUrls: {
          redirectUrl: value.redirectUrl,
        },
      },
    };

    const paymentResponse = await axios.post(PHONEPE_PAY_URL, paymentPayload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `O-Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    const paymentUrl = extractPaymentUrl(paymentResponse?.data);
    if (!paymentUrl) throw new Error("Payment URL not found in PhonePe response");

    const providerOrderId = paymentResponse?.data?.orderId || paymentResponse?.data?.data?.orderId || "";
    const paymentUserId = paymentContext.order ? paymentContext.order.customerId : loggedInUser?._id;
    if (!paymentUserId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, "Unable to resolve payment user", {}, {}));
    }

    await new paymentModel({
      userId: paymentUserId,
      planId: paymentContext.plan?._id || null,
      themeId: paymentContext.theme?._id || null,
      orderId: paymentContext.order?._id || null,
      paymentFor: paymentContext.paymentFor,
      amount: paymentContext.amount,
      currency: value.currency || "INR",
      paymentMethod: PAYMENT_METHOD.PHONEPE,
      transactionId: merchantOrderId,
      providerOrderId,
      providerResponse: paymentResponse?.data || {},
      status: PAYMENT_STATUS.PENDING,
    }).save();

    return res.status(HTTP_STATUS.OK).json(
      apiResponse(
        HTTP_STATUS.OK,
        "PhonePe payment initiated successfully",
        {
          merchantOrderId,
          providerOrderId,
          paymentUrl,
          amount: paymentContext.amount,
          currency: value.currency || "INR",
          paymentFor: paymentContext.paymentFor,
          planId: paymentContext.plan?._id || null,
          themeId: paymentContext.theme?._id || null,
          orderId: paymentContext.order?._id || null,
        },
        {}
      )
    );
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("PhonePe create payment error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    } else {
      console.error("PhonePe create payment error:", error);
    }
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to initiate PhonePe payment", {}, { message: error?.message || "Unknown error" }));
  }
};

export const phonePeCallback = async (req, res) => {
  reqInfo(req);
  try {
    const payload = req.body?.payload || req.body || {};
    const merchantOrderId = payload?.merchantOrderId || req.body?.merchantOrderId;
    const state = payload?.state || req.body?.state;
    const providerTxnId = payload?.transactionId || req.body?.transactionId;

    if (!merchantOrderId) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, "merchantOrderId is required", {}, {}));
    if (!state) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, "state is required", {}, {}));

    const existingPayment: any = await getFirstMatch(paymentModel, { transactionId: merchantOrderId }, {}, {});
    if (!existingPayment) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Payment not found", {}, {}));

    const paymentStatus = mapPaymentStateToStatus(state);
    const isPlanPayment = existingPayment?.paymentFor === PAYMENT_FOR.PLAN_SUBSCRIPTION || !!existingPayment?.planId;
    const isOrderPayment = existingPayment?.paymentFor === PAYMENT_FOR.ORDER_PURCHASE || !!existingPayment?.orderId;
    const shouldUpdateSubscription = paymentStatus === PAYMENT_STATUS.SUCCESS && isPlanPayment && existingPayment?.status !== PAYMENT_STATUS.SUCCESS;
    const paidAt = paymentStatus === PAYMENT_STATUS.SUCCESS ? new Date() : null;
    const paymentUpdatePayload: any = {
      status: paymentStatus,
      providerResponse: req.body,
      paidAt,
    };

    const updatedPayment = await updateData(paymentModel, { _id: existingPayment._id }, paymentUpdatePayload, { runValidators: true });

    if (isOrderPayment && existingPayment?.orderId) {
      await applyOrderPayment({
        orderId: String(existingPayment.orderId),
        paymentMethod: PAYMENT_METHOD.PHONEPE,
        transactionId: providerTxnId || merchantOrderId,
        paidAt,
        paymentStatus,
      });
    }

    if (shouldUpdateSubscription) {
      const existingPlan: any = await getFirstMatch(planModel, { _id: existingPayment.planId, isDeleted: { $ne: true } }, {}, {});
      if (existingPlan) {
        const startDate = new Date();
        const endDate = resolveSubscriptionEndDate(existingPlan.duration, startDate);
        await updateData(
          userModel,
          { _id: existingPayment.userId, isDeleted: { $ne: true } },
          {
            subscription: {
              planId: existingPlan._id,
              type: existingPlan.name,
              status: SUBSCRIPTION_STATUS.ACTIVE,
              startDate,
              endDate,
              autoRenew: false,
            },
          },
          {}
        );
      }
    }

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "PhonePe callback processed successfully", updatedPayment, {}));
  } catch (error) {
    console.error("PhonePe callback error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Callback processing failed", {}, error));
  }
};
