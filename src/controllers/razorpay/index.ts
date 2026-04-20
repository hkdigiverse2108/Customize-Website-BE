import crypto from "crypto";
import { ACCOUNT_TYPE, HTTP_STATUS, PAYMENT_FOR, PAYMENT_METHOD, PAYMENT_STATUS, PLAN_DURATION, SUBSCRIPTION_STATUS } from "../../common";
import { orderModel, paymentModel, planModel, settingModel, storeModel, themeModel, userModel } from "../../database";
import { getFirstMatch, reqInfo, responseMessage, updateData } from "../../helper";
import { apiResponse } from "../../type";
import { createRazorpayPaymentSchema, razorpayPaymentVerifySchema } from "../../validation";
export { createPhonePeSubscriptionPayment, phonePeCallback } from "../phonePe";

const generateReceipt = () => `rzp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

const getRazorpaySdk = () => {
  try {
    return require("razorpay");
  } catch (error) {
    throw new Error("Razorpay SDK is missing. Please run npm install razorpay.");
  }
};

const resolveRazorpaySetting = async () =>
  getFirstMatch(
    settingModel,
    {
      isDeleted: { $ne: true },
      razorpayApiKey: { $exists: true, $nin: ["", null] },
      razorpayApiSecret: { $exists: true, $nin: ["", null] },
    },
    {},
    { sort: { updatedAt: -1 } }
  );

const getConfig = (o?: any) => {
  const keyId = o?.keyId;
  const keySecret = o?.keySecret;
  if (typeof keyId !== "string" || typeof keySecret !== "string" || !keyId || !keySecret) throw new Error("Missing Razorpay credentials");
  return { keyId, keySecret };
};

const verifySignature = (orderId: string, paymentId: string, signature: string, o?: any) => {
  const { keySecret } = getConfig(o);
  const expected = crypto.createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  return expected === signature;
};

const resolveSubscriptionEndDate = (duration: PLAN_DURATION, startDate: Date) => {
  const nextDate = new Date(startDate);
  if (duration === PLAN_DURATION.YEARLY) nextDate.setFullYear(nextDate.getFullYear() + 1);
  else nextDate.setMonth(nextDate.getMonth() + 1);
  return nextDate;
};

const applySubscriptionForPayment = async (existingPayment: any) => {
  const existingPlan: any = await getFirstMatch(planModel, { _id: existingPayment.planId, isDeleted: { $ne: true } }, {}, {});
  if (!existingPlan) return;

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
  paidAt: Date;
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
  };
};

export const createRazorpayOrder = async ({
  amount,
  currency,
  receipt,
  keyId,
  keySecret,
}: {
  amount: number;
  currency: string;
  receipt: string;
  keyId: string;
  keySecret: string;
}) => {
  const Razorpay = getRazorpaySdk();
  const amountInPaise = Math.round((amount + Number.EPSILON) * 100);
  const razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  return razorpay.orders.create({
    amount: amountInPaise,
    currency,
    receipt,
  });
};

export const createRazorpaySubscriptionPayment = async (req, res) => {
  reqInfo(req);
  try {
    const { error, value } = createRazorpayPaymentSchema.validate(req.body || {});
    if (error) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, error.details[0].message, {}, {}));

    const loggedInUser = req.headers.user as any;
    const paymentContext = await resolvePaymentContext(value, res, loggedInUser);
    if (paymentContext?.errorResponse) return paymentContext.errorResponse;

    const setting = await resolveRazorpaySetting();
    if (!setting) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(apiResponse(HTTP_STATUS.BAD_REQUEST, "Razorpay configuration missing. Please configure it in setting.", {}, {}));
    }

    const { keyId, keySecret } = getConfig({ keyId: setting.razorpayApiKey, keySecret: setting.razorpayApiSecret });
    const currency = value.currency || "INR";
    const receipt = value.receipt || generateReceipt();
    const order = await createRazorpayOrder({ amount: paymentContext.amount, currency, receipt, keyId, keySecret });
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
      currency,
      paymentMethod: PAYMENT_METHOD.RAZORPAY,
      transactionId: receipt,
      providerOrderId: order?.id || "",
      providerResponse: order || {},
      status: PAYMENT_STATUS.PENDING,
    }).save();

    return res.status(HTTP_STATUS.CREATED).json(
      apiResponse(
        HTTP_STATUS.CREATED,
        "Razorpay order created",
        {
          order,
          keyId,
          receipt,
          amount: paymentContext.amount,
          currency,
          paymentFor: paymentContext.paymentFor,
          planId: paymentContext.plan?._id || null,
          themeId: paymentContext.theme?._id || null,
          orderId: paymentContext.order?._id || null,
        },
        {}
      )
    );
  } catch (error) {
    const errorPayload = error?.response?.data || error;
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, errorPayload));
  }
};

export const verifyRazorpaySubscriptionPayment = async (req, res) => {
  reqInfo(req);
  try {
    const { error, value } = razorpayPaymentVerifySchema.validate(req.body || {});
    if (error) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, error.details[0].message, {}, {}));

    const orderId = value.razorpay_order_id || value.razorpayOrderId;
    const paymentId = value.razorpay_payment_id || value.razorpayPaymentId;
    const signature = value.razorpay_signature || value.razorpaySignature;
    if (!orderId || !paymentId || !signature) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, responseMessage.customMessage("Payment verification data missing"), {}, {}));
    }

    const setting = await resolveRazorpaySetting();
    if (!setting) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, "Razorpay configuration missing. Please configure it in setting.", {}, {}));
    }

    const config = { keyId: setting.razorpayApiKey, keySecret: setting.razorpayApiSecret };
    if (!verifySignature(orderId, paymentId, signature, config)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, responseMessage.customMessage("Invalid Razorpay signature"), { verified: false }, {}));
    }

    const loggedInUser = req.headers.user as any;
    const criteria: any = {
      paymentMethod: PAYMENT_METHOD.RAZORPAY,
      providerOrderId: orderId,
    };
    if (loggedInUser?.role === ACCOUNT_TYPE.USER && loggedInUser?._id) criteria.userId = loggedInUser._id;
    if (value.transactionId) criteria.transactionId = value.transactionId;
    if (value.orderId) criteria.orderId = value.orderId;

    const existingPayment: any = await getFirstMatch(paymentModel, criteria, {}, {});
    if (!existingPayment) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Payment not found", {}, {}));

    if (existingPayment?.paymentFor === PAYMENT_FOR.ORDER_PURCHASE && existingPayment?.orderId) {
      const existingOrder: any = await getFirstMatch(orderModel, { _id: existingPayment.orderId, isDeleted: { $ne: true } }, {}, {});
      if (!existingOrder) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Order"), {}, {}));

      const isOrderAccessible = await hasOrderAccess(loggedInUser, existingOrder);
      if (!isOrderAccessible) {
        return res.status(HTTP_STATUS.FORBIDDEN).json(apiResponse(HTTP_STATUS.FORBIDDEN, responseMessage.accessDenied, {}, {}));
      }
    }

    const isPlanPayment = existingPayment?.paymentFor === PAYMENT_FOR.PLAN_SUBSCRIPTION || !!existingPayment?.planId;
    const isOrderPayment = existingPayment?.paymentFor === PAYMENT_FOR.ORDER_PURCHASE || !!existingPayment?.orderId;
    const shouldUpdateSubscription = isPlanPayment && existingPayment?.status !== PAYMENT_STATUS.SUCCESS;
    const shouldUpdateOrderPayment = isOrderPayment && existingPayment?.status !== PAYMENT_STATUS.SUCCESS;
    const paidAt = new Date();

    const updatedPayment = await updateData(
      paymentModel,
      { _id: existingPayment._id },
      {
        status: PAYMENT_STATUS.SUCCESS,
        paidAt,
        providerResponse: {
          ...(existingPayment?.providerResponse || {}),
          verification: req.body || {},
        },
      },
      { runValidators: true }
    );

    if (shouldUpdateSubscription) await applySubscriptionForPayment(existingPayment);
    if (shouldUpdateOrderPayment) {
      await applyOrderPayment({
        orderId: String(existingPayment.orderId),
        paymentMethod: PAYMENT_METHOD.RAZORPAY,
        transactionId: paymentId,
        paidAt,
        paymentStatus: PAYMENT_STATUS.SUCCESS,
      });
    }

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.customMessage("Payment verified"), { verified: true, payment: updatedPayment }, {}));
  } catch (error) {
    console.log(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, {}));
  }
};

export const create_razorpay_payment = createRazorpaySubscriptionPayment;
export const razorpay_verify_payment = verifyRazorpaySubscriptionPayment;
