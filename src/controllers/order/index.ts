import { Types } from "mongoose";
import { ACCOUNT_TYPE, getPaginationState, HTTP_STATUS, resolveSortAndFilter } from "../../common";
import { orderModel, storeModel, userModel } from "../../database";
import { countData, deleteData, getData, getFirstMatch, reqInfo, responseMessage, updateData, validate, verifyStoreAccess, checkFieldDuplicate, normalizeDomain, resolveRequestDomain } from "../../helper";
import { apiResponse, IAuthenticatedUser, ICreateOrderPayload, IOrder, IUser } from "../../type";
import { createOrderSchema, getAllOrdersQuerySchema, orderIdSchema, updateOrderSchema } from "../../validation";

export const createOrder = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(createOrderSchema, req.body, res) as ICreateOrderPayload | null;
    if (!value) return;

    const user = req.headers.user as IAuthenticatedUser;
    if (!await verifyStoreAccess(user, String(value.storeId))) {
        return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Store"), {}, {}));
    }

    // Resolve Customer
    let targetCustomerId: ICreateOrderPayload["customerId"] = value.customerId || null;
    if (!targetCustomerId && value.email) {
      let existingUser = (await getFirstMatch(userModel, { email: value.email.toLowerCase(), isDeleted: { $ne: true } }, {}, {})) as IUser | null;
      if (!existingUser) {
        existingUser = await new userModel({
          email: value.email.toLowerCase(),
          phone: value.phone,
          role: ACCOUNT_TYPE.USER,
          storeId: value.storeId,
          firstName: value?.shippingAddress?.firstName || "",
          lastName: value?.shippingAddress?.lastName || ""
        }).save();
      }
      targetCustomerId = existingUser._id;
    }

    const orderNumber = value?.orderNumber || (await getNextOrderNumber(String(value.storeId)));
    if (await checkFieldDuplicate(orderModel, "orderNumber", orderNumber, undefined, { storeId: value.storeId })) {
        return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, "Order number already exists for this store", {}, {}));
    }

    const finalPayload = buildPayload(value, true, orderNumber);
    finalPayload.customerId = targetCustomerId;
    const sourceDomain = resolveRequestDomain(req, value.sourceDomain, { includeHost: false });
    if (sourceDomain) finalPayload.sourceDomain = sourceDomain;

    const order = (await new orderModel(finalPayload).save()) as IOrder;
    return res.status(HTTP_STATUS.CREATED).json(apiResponse(HTTP_STATUS.CREATED, responseMessage.addDataSuccess("Order"), order, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const updateOrder = async (req, res) => {
  reqInfo(req);
  try {
    const { id, ...body } = req.body;
    const idValue = validate(orderIdSchema, { id }, res);
    if (!idValue) return;

    const value = validate(updateOrderSchema, body, res) as Partial<ICreateOrderPayload> | null;
    if (!value) return;

    const existing = (await getFirstMatch(orderModel, { _id: idValue.id, isDeleted: { $ne: true } }, {}, {})) as IOrder | null;
    if (!existing) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Order"), {}, {}));

    const user = req.headers.user as IAuthenticatedUser;
    if (!await verifyStoreAccess(user, String(existing.storeId))) {
        return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Order"), {}, {}));
    }

    const payload = buildPayload(value);
    if (payload.orderNumber && await checkFieldDuplicate(orderModel, "orderNumber", payload.orderNumber, idValue.id, { storeId: existing.storeId })) {
        return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, "Order number exists", {}, {}));
    }

    const updated = (await updateData(orderModel, { _id: idValue.id, isDeleted: { $ne: true } }, payload, {})) as IOrder | null;
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.updateDataSuccess("Order"), updated, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const deleteOrder = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(orderIdSchema, req.params, res);
    if (!value) return;

    const existing = (await getFirstMatch(orderModel, { _id: value.id, isDeleted: { $ne: true } }, {}, {})) as IOrder | null;
    if (!existing) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Order"), {}, {}));

    const user = req.headers.user as IAuthenticatedUser;
    if (!await verifyStoreAccess(user, String(existing.storeId))) {
        return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Order"), {}, {}));
    }

    const deleted = await deleteData(orderModel, { _id: value.id }, {
        isActive: false, status: "cancelled", isCancelled: true, cancelledAt: new Date(), cancelReason: "Order deleted"
    });
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.deleteDataSuccess("Order"), deleted, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const getOrders = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(getAllOrdersQuerySchema, req.query, res);
    if (!value) return;

    const { criteria, options, page, limit } = resolveSortAndFilter(value, ["orderName", "email", "phone"]);
    const user = req.headers.user as IAuthenticatedUser;

    if (user?.role === ACCOUNT_TYPE.VENDOR) {
      criteria.storeId = await getVendorStoreIds(String(user._id));
    }

    if (value?.statusFilter) criteria.status = value.statusFilter;
    if (value?.financialStatusFilter) criteria.financialStatus = value.financialStatusFilter;
    if (value?.fulfillmentStatusFilter) criteria.fulfillmentStatus = value.fulfillmentStatusFilter;
    if (value?.sourceDomain) criteria.sourceDomain = normalizeDomain(value.sourceDomain);

    const [orders, count] = await Promise.all([
        getData(orderModel, criteria, {}, options),
        countData(orderModel, criteria)
    ]);

    const state = getPaginationState(count, Number(page), Number(limit));
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.getDataSuccess("Orders"), { orders, state, total_count: count }, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const getOrderById = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(orderIdSchema, req.params, res);
    if (!value) return;

    const order = (await getFirstMatch(orderModel, { _id: value.id, isDeleted: { $ne: true } }, {}, {})) as IOrder | null;
    if (!order) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Order"), {}, {}));

    const user = req.headers.user as IAuthenticatedUser;
    if (!await verifyStoreAccess(user, String(order.storeId))) {
        return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Order"), {}, {}));
    }

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.getDataSuccess("Order"), order, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

/* --- Utils --- */

const getNextOrderNumber = async (storeId: string) => {
  const last = (await getFirstMatch(orderModel, { storeId, isDeleted: { $ne: true } }, { orderNumber: 1 }, { sort: { orderNumber: -1 } })) as Pick<IOrder, "orderNumber"> | null;
  return Number(last?.orderNumber || 1000) + 1;
};

const getVendorStoreIds = async (userId: string) => {
    const stores = await getData(storeModel, { userId, isDeleted: { $ne: true } }, { _id: 1 }, {});
    return { $in: stores.map((s: { _id: Types.ObjectId | string }) => s._id) };
};

const buildPayload = (data: Partial<ICreateOrderPayload>, isCreate = false, orderNumber?: number) => {
  const payload: Partial<ICreateOrderPayload> = { ...data };
  if (isCreate) {
    payload.orderNumber = orderNumber;
    payload.orderName = data?.orderName || `#${orderNumber}`;
  }
  // Normalization logic (Simplified for space)
  return payload;
};

