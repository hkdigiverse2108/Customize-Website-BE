import crypto from "crypto";
import { ACCOUNT_TYPE, HTTP_STATUS, PAYMENT_FOR, PAYMENT_METHOD, PAYMENT_STATUS, PLAN_DURATION, SUBSCRIPTION_STATUS } from "../../common";
import { orderModel, paymentModel, planModel, settingModel, userModel } from "../../database";
import { applySubscription, getFirstMatch, reqInfo, resolvePaymentContext, responseMessage, updateData, validate, verifyStoreAccess } from "../../helper";
import { apiResponse } from "../../type";
import { createRazorpayPaymentSchema, razorpayPaymentVerifySchema } from "../../validation";
export { createPhonePeSubscriptionPayment, phonePeCallback } from "../phonePe";

const getRazorpaySdk = () => {
  try { return require("razorpay"); } 
  catch (error) { throw new Error("Razorpay SDK is missing."); }
};

export const createRazorpaySubscriptionPayment = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(createRazorpayPaymentSchema, req.body, res);
    if (!value) return;

    const loggedInUser = req.headers.user as any;
    const paymentContext: any = await resolvePaymentContext(value, loggedInUser, res);
    if (paymentContext?.errorResponse) return paymentContext.errorResponse;

    const setting = await resolveRazorpaySetting();
    if (!setting) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, "Razorpay config missing.", {}, {}));

    const Razorpay = getRazorpaySdk();
    const rzp = new Razorpay({ key_id: setting.razorpayApiKey, key_secret: setting.razorpayApiSecret });
    
    const receipt = `rzp_${Date.now()}`;
    const order = await rzp.orders.create({
      amount: Math.round(paymentContext.amount * 100),
      currency: value.currency || "INR",
      receipt
    });

    const paymentUserId = paymentContext.order ? paymentContext.order.customerId : loggedInUser?._id;

    await new paymentModel({
      userId: paymentUserId,
      planId: paymentContext.plan?._id || null,
      themeId: paymentContext.theme?._id || null,
      orderId: paymentContext.order?._id || null,
      amount: paymentContext.amount,
      paymentMethod: PAYMENT_METHOD.RAZORPAY,
      transactionId: receipt,
      providerOrderId: order.id,
      status: PAYMENT_STATUS.PENDING,
    }).save();

    return res.status(HTTP_STATUS.CREATED).json(apiResponse(HTTP_STATUS.CREATED, "Order created", { order, keyId: setting.razorpayApiKey }, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Internal server error", {}, error));
  }
};

export const verifyRazorpaySubscriptionPayment = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(razorpayPaymentVerifySchema, req.body, res);
    if (!value) return;

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = value;
    const setting = await resolveRazorpaySetting();
    
    const expected = crypto.createHmac("sha256", setting.razorpayApiSecret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
    if (expected !== razorpay_signature) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, "Invalid signature", {}, {}));

    const existingPayment: any = await getFirstMatch(paymentModel, { providerOrderId: razorpay_order_id }, {}, {});
    if (!existingPayment) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Payment not found", {}, {}));

    const paidAt = new Date();
    await updateData(paymentModel, { _id: existingPayment._id }, { status: PAYMENT_STATUS.SUCCESS, paidAt }, {});

    if (existingPayment.planId) {
        await applySubscription(existingPayment.userId, existingPayment.planId);
    }

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "Verified", { verified: true }, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Internal server error", {}, error));
  }
};

/* --- Helpers --- */

const resolveRazorpaySetting = async () => 
  getFirstMatch(settingModel, { isDeleted: { $ne: true }, razorpayApiKey: { $exists: true } }, {}, { sort: { updatedAt: -1 } });

