import { ACCOUNT_TYPE, HTTP_STATUS, getPaginationState, resolveSortAndFilter } from "../../common";
import { userModel } from "../../database";
import { countData, getData, getFirstMatch, reqInfo, responseMessage, validate, verifyStoreAccess } from "../../helper";
import { apiResponse } from "../../type";
import { addCustomerSchema, getStoreCustomersQuerySchema } from "../../validation";

export const addCustomerByVendor = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(addCustomerSchema, req.body, res);
    if (!value) return;

    const loggedInUser = req.headers.user as any;
    
    // 1. Verify Vendor owns the store
    if (!await verifyStoreAccess(loggedInUser, value.storeId)) {
        return res.status(HTTP_STATUS.FORBIDDEN).json(apiResponse(HTTP_STATUS.FORBIDDEN, responseMessage.accessDenied, {}, {}));
    }

    // 2. Check if customer already exists for THIS store
    const existing = await getFirstMatch(userModel, { 
        email: value.email, 
        storeId: value.storeId, 
        isDeleted: { $ne: true } 
    }, {}, {});

    if (existing) {
        return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, "Customer with this email already exists in your store", {}, {}));
    }

    // 3. Create Customer User (role: USER)
    const customerPayload = {
        ...value,
        role: ACCOUNT_TYPE.USER,
        isActive: true,
    };

    const created = await new userModel(customerPayload).save();
    return res.status(HTTP_STATUS.CREATED).json(apiResponse(HTTP_STATUS.CREATED, responseMessage.addDataSuccess("Customer"), created, {}));

  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const getStoreCustomers = async (req, res) => {
    reqInfo(req);
    try {
        const value = validate(getStoreCustomersQuerySchema, { ...req.query, storeId: req.params.storeId }, res);
        if (!value) return;
        const loggedInUser = req.headers.user as any;

        if (!await verifyStoreAccess(loggedInUser, value.storeId)) {
            return res.status(HTTP_STATUS.FORBIDDEN).json(apiResponse(HTTP_STATUS.FORBIDDEN, responseMessage.accessDenied, {}, {}));
        }

        const { criteria, options, page, limit } = resolveSortAndFilter(value, ["firstName", "lastName", "email", "phone"]);
        criteria.storeId = value.storeId;
        criteria.role = ACCOUNT_TYPE.USER;

        const [customers, total] = await Promise.all([
          getData(userModel, criteria, {}, options),
          countData(userModel, criteria),
        ]);

        const pagination = getPaginationState(total, Number(page), Number(limit));

        return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.getDataSuccess("Customers"), { customers, ...pagination, total_count: total }, {}));
    } catch (error) {
        console.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
};
