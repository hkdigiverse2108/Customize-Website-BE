import axios from "axios";
import { HTTP_STATUS, PAYMENT_FOR, PAYMENT_METHOD, PAYMENT_STATUS } from "../../common";
import { orderModel, paymentModel, planModel, paymentSettingModel } from "../../database";
import { applySubscription, getFirstMatch, grantTheme, reqInfo, resolvePaymentContext, updateData, validate, verifyStoreAccess } from "../../helper";
import { apiResponse } from "../../type";
import { createPhonePePaymentSchema } from "../../validation";

const isProd = process.env.NODE_ENV === "production";
const PHONEPE_AUTH_URL = isProd ? "https://api.phonepe.com/apis/identity-manager/v1/oauth/token" : "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token";
const PHONEPE_PAY_URL = isProd ? "https://api.phonepe.com/apis/pg/checkout/v2/pay" : "https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay";

export const createPhonePeSubscriptionPayment = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(createPhonePePaymentSchema, req.body, res);
    if (!value) return;

    const loggedInUser = req.headers.user as any;
    const paymentContext: any = await resolvePaymentContext(value, loggedInUser, res);
    if (paymentContext?.errorResponse) return paymentContext.errorResponse;

    const setting = await resolvePhonePeSetting();
    if (!setting) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, "PhonePe configuration missing.", {}, {}));
    }

    const accessToken = await getPhonePeAccessToken(setting);
    const merchantOrderId = `pp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    
    const paymentPayload = {
      merchantOrderId,
      amount: Math.round(paymentContext.amount * 100),
      expireAfter: 500,
      paymentFlow: {
        type: "PG_CHECKOUT",
        message: paymentContext.message,
        merchantUrls: { redirectUrl: value.redirectUrl },
      },
    };

    const paymentResponse = await axios.post(PHONEPE_PAY_URL, paymentPayload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `O-Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    const paymentUrl = paymentResponse?.data?.data?.instrumentResponse?.redirectInfo?.url || paymentResponse?.data?.redirectUrl || "";
    if (!paymentUrl) throw new Error("Payment URL not found");

    const providerOrderId = paymentResponse?.data?.orderId || "";
    const paymentUserId = paymentContext.order ? paymentContext.order.customerId : loggedInUser?._id;

    await new paymentModel({
      userId: paymentUserId,
      planId: paymentContext.plan?._id || null,
      themeId: paymentContext.theme?._id || null,
      orderId: paymentContext.order?._id || null,
      storeId: value.storeId || paymentContext.order?.storeId || null,
      paymentFor: paymentContext.paymentFor,
      amount: paymentContext.amount,
      currency: value.currency || "INR",
      paymentMethod: PAYMENT_METHOD.PHONEPE,
      transactionId: merchantOrderId,
      providerOrderId,
      status: PAYMENT_STATUS.PENDING,
    }).save();

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "Payment initiated", { merchantOrderId, paymentUrl, amount: paymentContext.amount }, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to initiate payment", {}, error));
  }
};

export const phonePeCallback = async (req, res) => {
    // Callback logic (Simplified with standardized patterns)
    reqInfo(req);
    try {
        const payload = req.body?.payload || req.body || {};
        const merchantOrderId = payload?.merchantOrderId;
        if (!merchantOrderId) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, "Invalid callback", {}, {}));

        const existingPayment: any = await getFirstMatch(paymentModel, { transactionId: merchantOrderId }, {}, {});
        if (!existingPayment) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Payment not found", {}, {}));

        const status = (payload.state === "COMPLETED" || payload.state === "SUCCESS") ? PAYMENT_STATUS.SUCCESS : PAYMENT_STATUS.FAILED;
        const updated = await updateData(paymentModel, { _id: existingPayment._id }, { status, providerResponse: req.body, paidAt: status === PAYMENT_STATUS.SUCCESS ? new Date() : null }, {});

        if (status === PAYMENT_STATUS.SUCCESS && existingPayment.planId) {
            await applySubscription(existingPayment.userId, existingPayment.planId);
        }

        if (status === PAYMENT_STATUS.SUCCESS && existingPayment.themeId) {
            await grantTheme(existingPayment.storeId, existingPayment.themeId);
        }

        return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "Processed", updated, {}));
    } catch (error) {
        console.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Callback failed", {}, error));
    }
};

/* --- Helpers --- */

const resolvePhonePeSetting = async () => {
    return getFirstMatch(paymentSettingModel, { isDeleted: { $ne: true }, phonePeApiKey: { $exists: true }, isPhonePe: true }, {}, { sort: { updatedAt: -1 } });
};

const getPhonePeAccessToken = async (setting: any) => {
    const params = new URLSearchParams();
    params.append("client_id", setting.phonePeApiKey);
    params.append("client_secret", setting.phonePeApiSecret);
    params.append("grant_type", "client_credentials");

    const resp = await axios.post(PHONEPE_AUTH_URL, params.toString(), { headers: { "Content-Type": "application/x-www-form-urlencoded" } });
    return resp.data.access_token;
};
