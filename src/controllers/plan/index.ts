import { HTTP_STATUS } from "../../common";
import { deleteData, getData, getFirstMatch, reqInfo, responseMessage, updateData } from "../../helper";
import { planModel } from "../../database";
import { apiResponse } from "../../type";
import { createPlanSchema, planIdSchema, updatePlanSchema } from "../../validation";

export const createPlan = async (req, res) => {
  reqInfo(req);
  try {
    const { error, value } = createPlanSchema.validate(req.body);
    if (error) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, error?.details[0]?.message, {}, {}));
    const existingPlan = await getFirstMatch(planModel, { name: value.name, duration: value.duration, isDeleted: { $ne: true } }, {}, {});

    if (existingPlan) return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("plan"), {}, {}));
    
    const createdPlan = await new planModel(value).save();
    return res.status(HTTP_STATUS.CREATED).json(apiResponse(HTTP_STATUS.CREATED, responseMessage.addDataSuccess("Plan"), createdPlan, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const updatePlan = async (req, res) => {
  reqInfo(req);
  try {
    const { id, ...updatePayload } = req.body;
    const { error: idError, value: idValue } = planIdSchema.validate({ id });
    if (idError) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, idError?.details[0]?.message, {}, {}));
    
    const { error: bodyError, value: bodyValue } = updatePlanSchema.validate(updatePayload);
    if (bodyError) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, bodyError?.details[0]?.message, {}, {}));
    
    const existingPlan = await getFirstMatch(planModel, { _id: idValue.id, isDeleted: { $ne: true } }, {}, {});
    if (!existingPlan) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Plan"), {}, {}));
    
    const nextName = bodyValue?.name || existingPlan.name;
    const nextDuration = bodyValue?.duration || existingPlan.duration;

    const duplicatePlan = await getFirstMatch(planModel,{ _id: { $ne: idValue.id }, name: nextName, duration: nextDuration, isDeleted: { $ne: true } },{},{});

    if (duplicatePlan) return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("plan"), {}, {}));

    const updatedPlan = await updateData(planModel, { _id: idValue.id, isDeleted: { $ne: true } }, bodyValue, { new: true });
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.updateDataSuccess("Plan"), updatedPlan, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const deletePlan = async (req, res) => {
  reqInfo(req);
  try {
    const { error, value } = planIdSchema.validate(req.params);
    if (error)  return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, error?.details[0]?.message, {}, {}));
    const deletedPlan = await deleteData(planModel, { _id: value.id, isDeleted: { $ne: true } }, { isActive: false }, { new: true });

    if (!deletedPlan) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Plan"), {}, {}));

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.deleteDataSuccess("Plan"), deletedPlan, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const getPlans = async (req, res) => {
  reqInfo(req);
  try {
    const plans = await getData(planModel, { isDeleted: { $ne: true } }, {}, { sort: { createdAt: -1 } });
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.getDataSuccess("Plan"), plans, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const getPlanById = async (req, res) => {
  reqInfo(req);
  try {
    const { error, value } = planIdSchema.validate(req.params);
    if (error) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, error?.details[0]?.message, {}, {}));
    }

    const plan = await getFirstMatch(planModel, { _id: value.id, isDeleted: { $ne: true } }, {}, {});

    if (!plan) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Plan"), {}, {}));
    }

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.getDataSuccess("Plan"), plan, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};
