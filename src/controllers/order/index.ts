import { ACCOUNT_TYPE, getPaginationState, HTTP_STATUS, resolveSortAndFilter } from "../../common";
import { orderModel, storeModel, userModel } from "../../database";
import { countData, deleteData, getData, getFirstMatch, reqInfo, responseMessage, updateData, validate, verifyStoreAccess, checkFieldDuplicate } from "../../helper";
import { apiResponse } from "../../type";
import { createOrderSchema, getAllOrdersQuerySchema, orderIdSchema, updateOrderSchema } from "../../validation";

export const createOrder = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(createOrderSchema, req.body, res);
    if (!value) return;

    const user = req.headers.user as any;
    if (!await verifyStoreAccess(user, value.storeId)) {
        return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Store"), {}, {}));
    }

    // Resolve Customer
    let targetCustomerId = value.customerId;
    if (!targetCustomerId && value.email) {
      let existingUser: any = await getFirstMatch(userModel, { email: value.email.toLowerCase(), isDeleted: { $ne: true } }, {}, {});
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

    const orderNumber = value?.orderNumber || (await getNextOrderNumber(value.storeId));
    if (await checkFieldDuplicate(orderModel, "orderNumber", orderNumber, undefined, { storeId: value.storeId })) {
        return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, "Order number already exists for this store", {}, {}));
    }

    const finalPayload = buildPayload(value, {}, true, orderNumber);
    finalPayload.customerId = targetCustomerId;

    const order = await new orderModel(finalPayload).save();
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

    const value = validate(updateOrderSchema, body, res);
    if (!value) return;

    const existing: any = await getFirstMatch(orderModel, { _id: idValue.id, isDeleted: { $ne: true } }, {}, {});
    if (!existing) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Order"), {}, {}));

    if (!await verifyStoreAccess(req.headers.user, String(existing.storeId))) {
        return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Order"), {}, {}));
    }

    const payload = buildPayload(value, existing);
    if (payload.orderNumber && await checkFieldDuplicate(orderModel, "orderNumber", payload.orderNumber, idValue.id, { storeId: existing.storeId })) {
        return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, "Order number exists", {}, {}));
    }

    const updated = await updateData(orderModel, { _id: idValue.id, isDeleted: { $ne: true } }, payload, {});
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

    const existing: any = await getFirstMatch(orderModel, { _id: value.id, isDeleted: { $ne: true } }, {}, {});
    if (!existing) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Order"), {}, {}));

    if (!await verifyStoreAccess(req.headers.user, String(existing.storeId))) {
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
    const user = req.headers.user as any;

    if (user?.role === ACCOUNT_TYPE.VENDOR) {
      criteria.storeId = await getVendorStoreIds(user._id);
    }

    if (value?.statusFilter) criteria.status = value.statusFilter;
    if (value?.financialStatusFilter) criteria.financialStatus = value.financialStatusFilter;
    if (value?.fulfillmentStatusFilter) criteria.fulfillmentStatus = value.fulfillmentStatusFilter;

    const [orders, count] = await Promise.all([
        getData(orderModel, criteria, {}, options),
        countData(orderModel, criteria)
    ]);

    const pagination = getPaginationState(count, Number(page), Number(limit));
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.getDataSuccess("Orders"), { orders, ...pagination, total_count: count }, {}));
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

    const order: any = await getFirstMatch(orderModel, { _id: value.id, isDeleted: { $ne: true } }, {}, {});
    if (!order) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Order"), {}, {}));

    if (!await verifyStoreAccess(req.headers.user, order.storeId)) {
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
  const last: any = await getFirstMatch(orderModel, { storeId, isDeleted: { $ne: true } }, { orderNumber: 1 }, { sort: { orderNumber: -1 } });
  return Number(last?.orderNumber || 1000) + 1;
};

const getVendorStoreIds = async (userId: string) => {
    const stores = await getData(storeModel, { userId, isDeleted: { $ne: true } }, { _id: 1 }, {});
    return { $in: stores.map((s) => s._id) };
};

const buildPayload = (data: any, existing: any = {}, isCreate = false, orderNumber?: number) => {
  const payload: any = { ...data };
  if (isCreate) {
    payload.orderNumber = orderNumber;
    payload.orderName = data?.orderName || `#${orderNumber}`;
  }
  // Normalization logic (Simplified for space)
  return payload;
};
