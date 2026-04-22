import { HTTP_STATUS } from "../../common";
import { policyModel } from "../../database";
import { handlePostUpdate, reqInfo, responseMessage, validate, verifyStoreAccess } from "../../helper";
import { apiResponse } from "../../type";
import { addOrEditPolicySchema, getPoliciesQuerySchema } from "../../validation";

export const addOrEditPolicy = async (req, res) => {
  reqInfo(req);
  try {
    const val = validate(addOrEditPolicySchema, req.body, res);
    if (!val) return;

    const user = req.headers.user as any;
    if (!(await verifyStoreAccess(user, val.storeId))) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, "Store not found", {}, {}));
    }

    const filter = { storeId: val.storeId, type: val.type, isDeleted: false };
    const existing = await policyModel.findOne(filter);

    let result;
    if (existing) {
      result = await policyModel.findOneAndUpdate(filter, val, { new: true });
      await handlePostUpdate({ user, action: "update", resourceType: "policy", resourceId: String(result._id), oldData: existing, newData: result, storeId: val.storeId, req });
    } else {
      result = await new policyModel(val).save();
      await handlePostUpdate({ user, action: "create", resourceType: "policy", resourceId: String(result._id), newData: result, storeId: val.storeId, req });
    }

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.updateDataSuccess("Policy"), result, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const getPolicies = async (req, res) => {
  reqInfo(req);
  try {
    const val = validate(getPoliciesQuerySchema, req.query, res);
    if (!val) return;

    const policies = await policyModel.find({ storeId: val.storeId, isDeleted: false, isActive: true });

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, "Success", policies, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};
