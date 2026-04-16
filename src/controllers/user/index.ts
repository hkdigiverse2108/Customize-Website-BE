import { getPaginationState, HTTP_STATUS, resolveSortAndFilter, sanitizeUser } from "../../common";
import { userModel } from "../../database";
import { countData, getData, getFirstMatch, reqInfo, responseMessage, updateData } from "../../helper";
import { apiResponse } from "../../type";
import { getAllUsersQuerySchema, updateUserByAdminSchema, userIdSchema } from "../../validation";

export const updateUser = async (req, res) => {
  reqInfo(req);
  try {
    const { error: idError, value: idValue } = userIdSchema.validate(req.params);
    if (idError) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, idError?.details[0]?.message, {}, {}));

    const { error: bodyError, value: bodyValue } = updateUserByAdminSchema.validate(req.body);
    if (bodyError) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, bodyError?.details[0]?.message, {}, {}));

    const existingUser: any = await getFirstMatch(userModel, { _id: idValue.id, isDeleted: { $ne: true } }, {}, {});
    if (!existingUser) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("User"), {}, {}));

    const updatePayload: any = { ...bodyValue };
    if (updatePayload?.email) updatePayload.email = String(updatePayload.email).trim().toLowerCase();

    if (updatePayload?.email && updatePayload.email !== existingUser.email) {
      const emailExists = await getFirstMatch(userModel, { email: updatePayload.email, _id: { $ne: idValue.id }, isDeleted: { $ne: true } }, {}, {});
      if (emailExists) return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("email"), {}, {}));
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
    const { error, value } = getAllUsersQuerySchema.validate(req.query);
    if (error) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, error?.details[0]?.message, {}, {}));

    const { criteria, options, page, limit } = resolveSortAndFilter(value, ["firstName", "lastName", "email"]);

    const users: any[] = await getData(userModel, criteria, {}, options);
    const totalCount = await countData(userModel, criteria);
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
    const { error, value } = userIdSchema.validate(req.params);
    if (error) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, error?.details[0]?.message, {}, {}));

    const existingUser: any = await getFirstMatch(userModel, { _id: value.id, isDeleted: { $ne: true } }, {}, {});
    if (!existingUser) return res.status(HTTP_STATUS.NOT_FOUND).json(apiResponse(HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("User"), {}, {}));

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.getDataSuccess("User"), sanitizeUser(existingUser), {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};
