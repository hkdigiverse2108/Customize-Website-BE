import { NextFunction, Request, Response } from "express";
import { ACCOUNT_TYPE, HTTP_STATUS, isValidObjectId, verifyToken } from "../common";
import { userModel } from "../database";
import { apiResponse } from "../type";
import { responseMessage } from "../helper";

const getTokenUserId = (decodedToken: any) => {
  return decodedToken?._id || decodedToken?.id || decodedToken?.userId || null;
};

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const { authorization } = req.headers;

  try {
    if (!authorization) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(apiResponse(HTTP_STATUS.UNAUTHORIZED, responseMessage.tokenNotFound, {}, {}));
    }

    const decodedToken: any = verifyToken(authorization as string);
    const tokenUserId = getTokenUserId(decodedToken);
    const validObjectId = isValidObjectId(tokenUserId);

    if (!tokenUserId || !validObjectId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(apiResponse(HTTP_STATUS.UNAUTHORIZED, responseMessage.invalidToken, {}, {}));
    }

    const user = await userModel.findOne({ _id: validObjectId, isDeleted: { $ne: true } }, {}, { lean: true });

    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(apiResponse(HTTP_STATUS.UNAUTHORIZED, responseMessage.invalidToken, {}, {}));
    }

    if (user?.isActive === false) {
      return res.status(HTTP_STATUS.FORBIDDEN).json(apiResponse(HTTP_STATUS.FORBIDDEN, responseMessage.accountBlock, {}, {}));
    }

    req.headers.user = user as any;
    return next();
  } catch (error) {
    if (error?.message === "invalid signature") {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(apiResponse(HTTP_STATUS.UNAUTHORIZED, responseMessage.invalidToken, {}, {}));
    }

    if (error?.name === "TokenExpiredError") {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(apiResponse(HTTP_STATUS.UNAUTHORIZED, responseMessage.tokenExpire, {}, {}));
    }

    console.error(error);
    return res.status(HTTP_STATUS.UNAUTHORIZED).json(apiResponse(HTTP_STATUS.UNAUTHORIZED, responseMessage.invalidToken, {}, {}));
  }
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  const { authorization } = req.headers;
  if (!authorization) return next();

  try {
    const decodedToken: any = verifyToken(authorization as string);
    const tokenUserId = getTokenUserId(decodedToken);
    const validObjectId = isValidObjectId(tokenUserId);

    if (tokenUserId && validObjectId) {
      const user = await userModel.findOne({ _id: validObjectId, isDeleted: { $ne: true }, isActive: true }, {}, { lean: true });
      if (user) req.headers.user = user as any;
    }
  } catch (error) {
    // Optionally logged, but we don't throw an error for optional auth
  }
  return next();
};

export const allowRoles = (...roles: ACCOUNT_TYPE[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.headers.user as any;

    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(apiResponse(HTTP_STATUS.UNAUTHORIZED, responseMessage.tokenNotFound, {}, {}));
    }

    if (!roles.includes(user?.role)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json(apiResponse(HTTP_STATUS.FORBIDDEN, responseMessage.accessDenied, {}, {}));
    }

    return next();
  };
};
