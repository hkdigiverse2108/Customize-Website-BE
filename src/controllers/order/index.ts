import { ACCOUNT_TYPE, getPaginationState, HTTP_STATUS, resolveSortAndFilter } from "../../common";
import { orderModel, storeModel, userModel } from "../../database";
import { countData, deleteData, getData, getFirstMatch, reqInfo, responseMessage, updateData } from "../../helper";
import { apiResponse } from "../../type";
import { createOrderSchema, getAllOrdersQuerySchema, orderIdSchema, updateOrderSchema } from "../../validation";

/* ---------------- COMMON HELPERS ---------------- */

const sendError = (res, status, message, error = {}) => res.status(status).json(apiResponse(status, message, {}, error));

const asyncHandler = (fn) => async (req, res) => {
  reqInfo(req);
  try {
    await fn(req, res);
  } catch (error) {
    if (error?.status) return sendError(res, error.status, error.message);
    if (error?.code === 11000) {
      const field = Object.keys(error?.keyPattern || {})[0] || "value";
      return sendError(res, HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist(field === "orderNumber" ? "order number" : field));
    }
    console.error(error);
    return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, error);
  }
};

const validateOrFail = (schema, data) => {
  const { error, value } = schema.validate(data);
  if (error) throw { status: HTTP_STATUS.BAD_REQUEST, message: error.details[0].message };
  return value;
};

const findOne = (model, query) => getFirstMatch(model, query, {}, {});

const checkStoreAccess = async (user, storeId) => {
  const store = await findOne(storeModel, {
    _id: storeId,
    isDeleted: { $ne: true },
    ...(user?.role === ACCOUNT_TYPE.VENDOR && { userId: user._id }),
  });
  if (!store) throw { status: HTTP_STATUS.NOT_FOUND, message: responseMessage.getDataNotFound("Store") };
  return store;
};

const getNextOrderNumber = async (storeId: string) => {
  const last: any = await getFirstMatch(orderModel, { storeId, isDeleted: { $ne: true } }, { orderNumber: 1 }, { sort: { orderNumber: -1 } });
  return Number(last?.orderNumber || 1000) + 1;
};

const ensureUniqueOrderNumber = async (storeId: string, orderNumber: number, orderId?: string) => {
  const existing = await findOne(orderModel, {
    orderNumber,
    storeId,
    isDeleted: { $ne: true },
    ...(orderId && { _id: { $ne: orderId } }),
  });

  if (existing) throw { status: HTTP_STATUS.CONFLICT, message: responseMessage.dataAlreadyExist("order number") };
};

/* ---------------- NORMALIZERS ---------------- */

const str = (v: any = "") => String(v || "").trim();
const nullableStr = (v: any) => {
  if (v === null || v === undefined) return null;
  const parsed = str(v);
  return parsed || null;
};
const num = (v: any, def = 0) => {
  const parsed = Number(v);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : def;
};

const arr = (items: any = []) => [...new Set((items || []).map((i) => str(i)).filter(Boolean))];

const normalizeAddress = (a: any = {}) => ({
  firstName: str(a.firstName),
  lastName: str(a.lastName),
  address1: str(a.address1),
  address2: str(a.address2),
  city: str(a.city),
  state: str(a.state),
  country: str(a.country),
  pincode: str(a.pincode),
  phone: str(a.phone),
});

const normalizeLineItems = (items: any = []) =>
  (items || []).map((i) => {
    const quantity = Math.max(1, Math.floor(Number(i?.quantity) || 1));
    const price = num(i?.price);
    return {
      productId: i?.productId,
      variantId: i?.variantId || null,
      title: str(i?.title),
      quantity,
      price,
      total: num(i?.total, quantity * price),
    };
  });

const normalizePayment = (p: any = {}, existing: any = {}) => {
  const src = { ...(existing || {}), ...(p || {}) };
  const status = str(src?.status || "pending").toLowerCase();
  let paidAt: Date | null = null;

  if (p?.paidAt === null) paidAt = null;
  else if (src?.paidAt) {
    const parsed = new Date(src.paidAt);
    paidAt = Number.isNaN(parsed.getTime()) ? null : parsed;
  } else if (status === "success") paidAt = new Date();

  return {
    method: str(src?.method || "cod").toLowerCase(),
    transactionId: str(src?.transactionId),
    status,
    paidAt,
  };
};

const normalizeFulfillments = (items: any = []) =>
  (items || []).map((f) => ({
    trackingNumber: str(f?.trackingNumber),
    carrier: str(f?.carrier),
    status: str(f?.status || "pending").toLowerCase(),
    shippedAt: f?.shippedAt ? new Date(f.shippedAt) : null,
    deliveredAt: f?.deliveredAt ? new Date(f.deliveredAt) : null,
  }));

/* ---------------- CORE LOGIC ---------------- */

const resolveAmounts = (payload: any, existing: any = {}) => {
  const items = payload?.lineItems ?? existing?.lineItems ?? [];
  const subtotal = items.reduce((s, i) => s + num(i?.total, num(i?.price) * Math.max(1, Number(i?.quantity) || 1)), 0);

  const totalTax = num(payload?.totalTax ?? existing?.totalTax);
  const shipping = num(payload?.shippingPrice ?? existing?.shippingPrice);
  const discount = num(payload?.discountTotal ?? existing?.discountTotal);
  const explicitTotal = payload?.totalPrice;
  const computed = Math.max(subtotal + totalTax + shipping - discount, 0);

  return {
    subtotalPrice: subtotal,
    totalTax,
    shippingPrice: shipping,
    discountTotal: discount,
    totalPrice: explicitTotal !== undefined ? num(explicitTotal, computed) : computed,
  };
};

const resolveState = (payload: any, existing: any = {}) => {
  let status = str(payload?.status ?? existing?.status ?? "pending").toLowerCase();
  let financialStatus = str(payload?.financialStatus ?? existing?.financialStatus ?? "pending").toLowerCase();
  let fulfillmentStatus = str(payload?.fulfillmentStatus ?? existing?.fulfillmentStatus ?? "unfulfilled").toLowerCase();

  let isPaid = payload?.isPaid ?? existing?.isPaid ?? false;
  let isDelivered = payload?.isDelivered ?? existing?.isDelivered ?? false;
  let isCancelled = payload?.isCancelled ?? existing?.isCancelled ?? false;

  if (payload?.paymentDetails?.status === "success") isPaid = true;
  if (isPaid && !payload?.financialStatus) financialStatus = "paid";
  if (financialStatus === "paid") isPaid = true;

  if (payload?.isDelivered === true && !payload?.fulfillmentStatus) fulfillmentStatus = "delivered";
  if (fulfillmentStatus === "delivered") isDelivered = true;

  if (status === "cancelled" || fulfillmentStatus === "cancelled" || isCancelled) {
    return {
      status: "cancelled",
      financialStatus,
      fulfillmentStatus,
      isPaid,
      isDelivered,
      isCancelled: true,
      cancelReason: nullableStr(payload?.cancelReason ?? existing?.cancelReason),
      cancelledAt: payload?.cancelledAt || existing?.cancelledAt || new Date(),
    };
  }

  return {
    status,
    financialStatus,
    fulfillmentStatus,
    isPaid,
    isDelivered,
    isCancelled: false,
    cancelReason: null,
    cancelledAt: null,
  };
};

/* ---------------- BUILDERS ---------------- */

const buildPayload = (data: any, existing: any = {}, isCreate = false, orderNumber?: number) => {
  const payload: any = { ...data };

  if (isCreate) {
    payload.orderNumber = orderNumber;
    payload.orderName = str(data?.orderName) || `#${orderNumber}`;
    payload.isActive = data?.isActive !== false;
  } else if (data?.orderName !== undefined || data?.orderNumber !== undefined) {
    const resolvedNumber = Number(data?.orderNumber || existing?.orderNumber);
    payload.orderName = str(data?.orderName) || `#${resolvedNumber}`;
  }

  if (data?.tags !== undefined) payload.tags = arr(data.tags);
  if (data?.lineItems !== undefined) payload.lineItems = normalizeLineItems(data.lineItems);
  if (data?.shippingAddress !== undefined) payload.shippingAddress = normalizeAddress(data.shippingAddress);
  if (data?.billingAddress !== undefined) payload.billingAddress = normalizeAddress(data.billingAddress);
  if (data?.paymentDetails !== undefined) payload.paymentDetails = normalizePayment(data.paymentDetails, existing?.paymentDetails);
  if (data?.fulfillments !== undefined) payload.fulfillments = normalizeFulfillments(data.fulfillments);
  if (data?.notes !== undefined) payload.notes = str(data.notes);

  Object.assign(payload, resolveAmounts(payload, existing));
  Object.assign(payload, resolveState(payload, existing));

  if (!payload?.billingAddress && payload?.shippingAddress) payload.billingAddress = payload.shippingAddress;

  return payload;
};


export const createOrder = asyncHandler(async (req, res) => {
  const value = validateOrFail(createOrderSchema, req.body);
  const user = req.headers.user as any;

  await checkStoreAccess(user, value.storeId);

  if (value.customerId) {
    const customer = await findOne(userModel, { _id: value.customerId, isDeleted: { $ne: true } });
    if (!customer) throw { status: HTTP_STATUS.NOT_FOUND, message: responseMessage.getDataNotFound("Customer") };
  }

  let targetCustomerId = value.customerId;

  if (!targetCustomerId && value.email) {
    let existingUser: any = await findOne(userModel, { email: value.email, isDeleted: { $ne: true } });
    if (!existingUser) {
      const names = value?.shippingAddress?.firstName ? { firstName: value.shippingAddress.firstName, lastName: value.shippingAddress.lastName } : {};
      existingUser = await new userModel({
        email: value.email,
        phone: value.phone,
        role: ACCOUNT_TYPE.USER,
        ...names
      }).save();
      
      try {
        const { customerModel } = require("../../database");
        await new customerModel({ userId: existingUser._id, storeId: value.storeId, addresses: [value.shippingAddress] }).save();
      } catch (err) {} // Fail gracefully if customerModel is not yet fully utilized
    }
    targetCustomerId = existingUser._id;
  }

  const orderNumber = value?.orderNumber || (await getNextOrderNumber(value.storeId));
  await ensureUniqueOrderNumber(value.storeId, orderNumber);

  const finalPayload = buildPayload(value, {}, true, orderNumber);
  finalPayload.customerId = targetCustomerId; // Link actual or newly created target customer

  const order = await new orderModel(finalPayload).save();

  res.status(HTTP_STATUS.CREATED).json(apiResponse(HTTP_STATUS.CREATED, responseMessage.addDataSuccess("Order"), order, {}));
});

export const updateOrder = asyncHandler(async (req, res) => {
  const { id, ...body } = req.body;

  const { id: orderId } = validateOrFail(orderIdSchema, { id });
  const value = validateOrFail(updateOrderSchema, body);

  const existing: any = await findOne(orderModel, { _id: orderId, isDeleted: { $ne: true } });
  if (!existing) throw { status: HTTP_STATUS.NOT_FOUND, message: responseMessage.getDataNotFound("Order") };

  await checkStoreAccess(req.headers.user, existing.storeId);

  const nextOrderNumber = value?.orderNumber !== undefined ? Number(value.orderNumber) : Number(existing.orderNumber);
  if (nextOrderNumber !== Number(existing.orderNumber)) {
    await ensureUniqueOrderNumber(String(existing.storeId), nextOrderNumber, orderId);
  }

  const updated = await updateData(orderModel, { _id: orderId, isDeleted: { $ne: true } }, buildPayload(value, existing), { runValidators: true });

  res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.updateDataSuccess("Order"), updated, {}));
});

export const deleteOrder = asyncHandler(async (req, res) => {
  const { id } = validateOrFail(orderIdSchema, req.params);

  const existing: any = await findOne(orderModel, { _id: id, isDeleted: { $ne: true } });
  if (!existing) throw { status: HTTP_STATUS.NOT_FOUND, message: responseMessage.getDataNotFound("Order") };

  await checkStoreAccess(req.headers.user, existing.storeId);

  const deleted = await deleteData(orderModel, { _id: id, isDeleted: { $ne: true } }, {
    isActive: false,
    status: "cancelled",
    isCancelled: true,
    cancelledAt: existing?.cancelledAt || new Date(),
    cancelReason: existing?.cancelReason || "Order deleted",
  });

  res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.deleteDataSuccess("Order"), deleted, {}));
});

export const getOrders = asyncHandler(async (req, res) => {
  const value = validateOrFail(getAllOrdersQuerySchema, req.query);

  const { criteria, options, page, limit } = resolveSortAndFilter(value, ["orderName", "email", "phone"]);

  if (value?.storeId) criteria.storeId = value.storeId;
  if (value?.customerId) criteria.customerId = value.customerId;
  if (value?.orderNumber) criteria.orderNumber = Number(value.orderNumber);
  if (value?.statusFilter) criteria.status = value.statusFilter;
  if (value?.financialStatusFilter) criteria.financialStatus = value.financialStatusFilter;
  if (value?.fulfillmentStatusFilter) criteria.fulfillmentStatus = value.fulfillmentStatusFilter;
  if (value?.currency) criteria.currency = value.currency;

  ["isPaid", "isDelivered", "isCancelled"].forEach((k) => {
    if (value?.[`${k}Filter`] !== undefined) criteria[k] = value[`${k}Filter`];
  });

  const sortMap = {
    totalAsc: { totalPrice: 1 },
    totalDesc: { totalPrice: -1 },
    orderNumberAsc: { orderNumber: 1 },
    orderNumberDesc: { orderNumber: -1 },
  };

  if (value?.sortFilter && sortMap[value.sortFilter]) options.sort = sortMap[value.sortFilter];

  const loggedInUser = req.headers.user as any;
  if (loggedInUser?.role === ACCOUNT_TYPE.VENDOR) {
    const stores = await getData(storeModel, { userId: loggedInUser._id, isDeleted: { $ne: true } }, { _id: 1 }, {});
    const storeIds = stores.map((s) => String(s._id));

    if (!storeIds.length) {
      return res.status(HTTP_STATUS.OK).json(
        apiResponse(HTTP_STATUS.OK, responseMessage.getDataSuccess("Orders"), { orders: [], ...getPaginationState(0, Number(page), Number(limit)), total_count: 0 }, {})
      );
    }

    if (criteria?.storeId) {
      if (!storeIds.includes(String(criteria.storeId))) {
        return res.status(HTTP_STATUS.OK).json(
          apiResponse(HTTP_STATUS.OK, responseMessage.getDataSuccess("Orders"), { orders: [], ...getPaginationState(0, Number(page), Number(limit)), total_count: 0 }, {})
        );
      }
    } else {
      criteria.storeId = { $in: storeIds };
    }
  }

  const orders = await getData(orderModel, criteria, {}, options);
  const count = await countData(orderModel, criteria);

  res.status(HTTP_STATUS.OK).json(
    apiResponse(
      HTTP_STATUS.OK,
      responseMessage.getDataSuccess("Orders"),
      {
        orders,
        ...getPaginationState(count, Number(page), Number(limit)),
        total_count: count,
      },
      {}
    )
  );
});

export const getOrderById = asyncHandler(async (req, res) => {
  const { id } = validateOrFail(orderIdSchema, req.params);

  const order: any = await findOne(orderModel, { _id: id, isDeleted: { $ne: true } });
  if (!order) throw { status: HTTP_STATUS.NOT_FOUND, message: responseMessage.getDataNotFound("Order") };

  await checkStoreAccess(req.headers.user, order.storeId);

  res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.getDataSuccess("Order"), order, {}));
});
