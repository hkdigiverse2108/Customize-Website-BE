import { ACCOUNT_TYPE, HTTP_STATUS } from "../../common";
import { userModel } from "../../database";
import { countData, getFirstMatch, reqInfo, responseMessage, validate, verifyStoreAccess } from "../../helper";
import { apiResponse } from "../../type";
import Joi from "joi";
import { objectId } from "../../validation/common";

const addCustomerSchema = Joi.object({
  firstName: Joi.string().trim().required(),
  lastName: Joi.string().trim().required(),
  email: Joi.string().trim().email().lowercase().required(),
  phone: Joi.string().trim().allow("").optional(),
  storeId: objectId().required(),
});

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
        const { storeId } = req.params;
        const loggedInUser = req.headers.user as any;

        if (!await verifyStoreAccess(loggedInUser, storeId)) {
            return res.status(HTTP_STATUS.FORBIDDEN).json(apiResponse(HTTP_STATUS.FORBIDDEN, responseMessage.accessDenied, {}, {}));
        }

        const customers = await userModel.find({ storeId, role: ACCOUNT_TYPE.USER, isDeleted: { $ne: true } }).sort({ createdAt: -1 });
        const total = await countData(userModel, { storeId, role: ACCOUNT_TYPE.USER, isDeleted: { $ne: true } });

        return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.getDataSuccess("Customers"), { customers, total_count: total }, {}));
    } catch (error) {
        console.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
};
