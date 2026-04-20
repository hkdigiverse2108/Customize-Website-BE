import { getPaginationState, HTTP_STATUS, resolveSortAndFilter, sanitizeUser } from "../../common";
import { userModel } from "../../database";
import { countData, getData, getFirstMatch, reqInfo, responseMessage, updateData, validate, checkFieldDuplicate } from "../../helper";
import { apiResponse } from "../../type";
import { getAllUsersQuerySchema, updateUserByAdminSchema, userIdSchema } from "../../validation";

export const updateUser = async (req, res) => {
  reqInfo(req);
  try {
    const idValue = validate(userIdSchema, req.params, res);
    if (!idValue) return;

    const bodyValue = validate(updateUserByAdminSchema, req.body, res);
    if (!bodyValue) return;

    const existingUser: any = await getFirstMatch(userModel, { _id: idValue.id, isDeleted: { $ne: true } }, {}, {});
    if (!existingUser) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("User"), {}, {}));

    const updatePayload: any = { ...bodyValue };
    if (updatePayload?.email) {
      updatePayload.email = String(updatePayload.email).trim().toLowerCase();
      if (await checkFieldDuplicate(userModel, "email", updatePayload.email, idValue.id)) {
        return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("email"), {}, {}));
      }
    }

    const updatedUser: any = await updateData(userModel, { _id: idValue.id, isDeleted: { $ne: true } }, updatePayload, {});
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.updateDataSuccess("User"), sanitizeUser(updatedUser), {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const getAllUsers = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(getAllUsersQuerySchema, req.query, res);
    if (!value) return;

    const { criteria, options, page, limit } = resolveSortAndFilter(value, ["firstName", "lastName", "email"]);

    const [users, totalCount]: [any[], number] = await Promise.all([
      getData(userModel, criteria, {}, options),
      countData(userModel, criteria)
    ]);

    const pagination = getPaginationState(totalCount, Number(page), Number(limit));
    const sanitizedUsers = users.map((user) => sanitizeUser(user));

    return res
      .status(HTTP_STATUS.OK)
      .json(apiResponse(HTTP_STATUS.OK, responseMessage.getDataSuccess("Users"), { users: sanitizedUsers, ...pagination, total_count: totalCount }, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const getUserById = async (req, res) => {
  reqInfo(req);
  try {
    const value = validate(userIdSchema, req.params, res);
    if (!value) return;

    const existingUser: any = await getFirstMatch(userModel, { _id: value.id, isDeleted: { $ne: true } }, {}, {});
    if (!existingUser) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("User"), {}, {}));

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.getDataSuccess("User"), sanitizeUser(existingUser), {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};
