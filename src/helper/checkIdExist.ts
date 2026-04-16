import { HTTP_STATUS, isValidObjectId } from "../common";
import { getFirstMatch } from "./databaseServices";
import { responseMessage } from "./responseMessage";
import { apiResponse } from "../type";

export const checkIdExist = async (model, id, name, res) => {
  if (!id) return true;

  const exists = await getFirstMatch(model, { _id: isValidObjectId(id), isDeleted: { $ne: true } }, {}, {});

  if (!exists) {
    if (res) res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, responseMessage?.getDataNotFound(name), {}, {}));
    return false;
  }
  return true;
};
