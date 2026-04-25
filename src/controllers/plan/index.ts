import { getPaginationState, HTTP_STATUS, resolveSortAndFilter } from "../../common";
import { planModel } from "../../database";
import { apiResponse } from "../../type";
import { countData, deleteData, getData, getFirstMatch, reqInfo, responseMessage, updateData, validate } from "../../helper";
import { createPlanSchema, getAllPlansQuerySchema, planIdSchema, updatePlanSchema } from "../../validation";

const buildFeaturesFromLimits = (data: any): string[] => {
  const features: string[] = [];

  if (data.productLimit !== undefined)
    features.push(data.productLimit === -1 ? "Unlimited Products" : `${data.productLimit} Products`);

  if (data.themeLimit !== undefined)
    features.push(data.themeLimit === -1 ? "Unlimited Themes" : `${data.themeLimit} Theme${data.themeLimit > 1 ? 's' : ''}`);

  if (data.blogLimit !== undefined)
    features.push(data.blogLimit === -1 ? "Unlimited Blogs" : `${data.blogLimit} Blog${data.blogLimit > 1 ? 's' : ''}`);

  if (data.orderLimit !== undefined)
    features.push(data.orderLimit === -1 ? "Unlimited Orders" : `${data.orderLimit} Orders/month`);

  if (data.customDomainSupport !== undefined)
    features.push(data.customDomainSupport ? "Custom Domain" : "No Custom Domain");

  return features;
};

export const createPlan = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(createPlanSchema, req.body, res);
    if (!value) return;
    const existingPlan = await getFirstMatch(planModel, { name: value.name, duration: value.duration, isDeleted: { $ne: true } }, {}, {});

    if (existingPlan) return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("plan"), {}, {}));

    // Auto-build features from limits and merge with any manually provided features
    const autoFeatures = buildFeaturesFromLimits(value);
    const manualFeatures = (value.features || []).filter(
      (f: string) => !autoFeatures.some(af => af.toLowerCase().includes(f.toLowerCase()))
    );
    value.features = [...autoFeatures, ...manualFeatures];

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
    const idValue = validate(planIdSchema, { id }, res);
    if (!idValue) return;

    const bodyValue = validate(updatePlanSchema, updatePayload, res);
    if (!bodyValue) return;

    const existingPlan = await getFirstMatch(planModel, { _id: idValue.id, isDeleted: { $ne: true } }, {}, {});
    if (!existingPlan) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Plan"), {}, {}));

    const nextName = bodyValue?.name || existingPlan.name;
    const nextDuration = bodyValue?.duration || existingPlan.duration;

    const duplicatePlan = await getFirstMatch(planModel, { _id: { $ne: idValue.id }, name: nextName, duration: nextDuration, isDeleted: { $ne: true } }, {}, {});
    if (duplicatePlan) return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("plan"), {}, {}));

    // Rebuild features from merged limits (existing + incoming)
    const existingPlanData = existingPlan?.toObject?.() ?? existingPlan;
    const mergedData = { ...existingPlanData, ...bodyValue };
    const autoFeatures = buildFeaturesFromLimits(mergedData);
    const manualFeatures = (bodyValue.features || []).filter(
      (f: string) => !autoFeatures.some(af => af.toLowerCase().includes(f.toLowerCase()))
    );
    bodyValue.features = [...autoFeatures, ...manualFeatures];

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
    const value = validate(planIdSchema, req.params, res);
    if (!value) return;
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
    const value = validate(getAllPlansQuerySchema, req.query, res);
    if (!value) return;

    const { criteria, options, page, limit } = resolveSortAndFilter(value, ["name", "duration", "features"]);
    const [plans, totalCount] = await Promise.all([
      getData(planModel, criteria, {}, options),
      countData(planModel, criteria),
    ]);

    const pagination = getPaginationState(totalCount, Number(page), Number(limit));
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.getDataSuccess("Plan"), { plans, state: pagination, total_count: totalCount }, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const getPlanById = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(planIdSchema, req.params, res);
    if (!value) return;

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
