import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { getFirstMatch } from "../helper";
 import { userModel } from "../database";
import { Types } from "mongoose";

/* --------------------------------------
              OTP
-------------------------------------- */

const jwtSecretKey = process.env.JWT_TOKEN_SECRET;

const generateOtp = () => Math.floor(100000 + Math.random() * 900000);

const maxOtpTime = 10;

export const otpValidityMinutes = maxOtpTime;
export const generateOtpCode = generateOtp;

export const getUniqueOtp = async () => {
  let attempts = 0;
  const maxAttempts = maxOtpTime;

  while (attempts < maxAttempts) {
    const otp = generateOtp();
    const isAlreadyAssign = await getFirstMatch(userModel, { otp }, {}, {});
    if (!isAlreadyAssign) return otp;
    attempts++;
  }

  throw new Error("Failed To Generate Otp");
};

export const getOtpExpireTime = () => new Date(Date.now() + maxOtpTime * 60 * 1000);

/* --------------------------------------
              Password
-------------------------------------- */

export const generateHash = async (password = "") => {
  const salt = await bcryptjs.genSalt(10);
  const hashPassword = bcryptjs.hash(password, salt);
  return hashPassword;
};

export const compareHash = async (password = "", hash = "") => {
  return await bcryptjs.compare(password, hash);
};

/* --------------------------------------
              Token
-------------------------------------- */

export const generateToken = async (data = {}, expiresIn = {}) => {
  const token = jwt.sign(data, jwtSecretKey, expiresIn);
  return token;
};

export const tokenExpireIn = process.env.JWT_EXPIRES_IN || "7d";

export const verifyToken = (authorization?: string) => {
  if (!authorization) return null;
  const token = authorization.startsWith("Bearer ") ? authorization.split(" ")[1] : authorization;
  return jwt.verify(token, jwtSecretKey) as any;
};

export const sanitizeUser = (user: any) => {
  const userData = { ...user };
  delete userData.password;
  delete userData.otp;
  delete userData.otpExpireTime;
  return userData;
};

/* --------------------------------------
              Object Id
-------------------------------------- */

export const isValidObjectId = (id:any = "") => {
  return Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : false;
};

/* --------------------------------------
              Date
-------------------------------------- */

export const parseDateRange = (start?: any, end?: any) => {
  if (!start || !end) return null;

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return null;

  return { startDate, endDate };
};

/* --------------------------------------
              Pagination
-------------------------------------- */

export const resolvePagination = (page?: any, limit?: any) => {
  const parsedLimit = Number(limit);
  const hasLimit = Number.isFinite(parsedLimit) && parsedLimit > 0;
  const limitValue = hasLimit ? Math.floor(parsedLimit) : 0;

  const parsedPage = Number(page);
  const pageValue = hasLimit ? Math.max(Math.floor(parsedPage || 1), 1) : 1;
  const skip = hasLimit ? (pageValue - 1) * limitValue : 0;

  return { page: pageValue, limit: limitValue, skip, hasLimit };
};

export const getPaginationState = (totalCount: number, pageValue: number, limitValue: number) => {
  const pageLimit = limitValue > 0 ? Math.ceil(totalCount / limitValue) || 1 : 1;

  return {
    page: pageValue,
    limit: limitValue > 0 ? limitValue : totalCount,
    page_limit: pageLimit,
  };
};

/* --------------------------------------
              Sort and Filter
-------------------------------------- */

export const resolveSortAndFilter = (value: any, searchFields: string[] = ["name"]) => {
  let { activeFilter, page, limit, startDateFilter, endDateFilter, search, sortFilter } = value;
  let criteria: any = { isDeleted: { $ne: true } },
    options: any = { lean: true };

  if (search) {
    if (searchFields.length === 1) {
      criteria[searchFields[0]] = { $regex: search, $options: "si" };
    } else {
      criteria.$or = searchFields.map((field) => ({ [field]: { $regex: search, $options: "si" } }));
    }
  }

  if (activeFilter === true) criteria.isActive = true;
  else if (activeFilter === false) criteria.isActive = false;

  if (startDateFilter && endDateFilter) {
    criteria.createdAt = { $gte: new Date(startDateFilter), $lte: new Date(endDateFilter) };
  }

  if (sortFilter === "nameAsc") options.sort = { [searchFields[0] || "name"]: 1 };
  else if (sortFilter === "nameDesc") options.sort = { [searchFields[0] || "name"]: -1 };
  else if (sortFilter === "newest") options.sort = { createdAt: -1 };
  else if (sortFilter === "oldest") options.sort = { createdAt: 1 };
  else options.sort = { createdAt: -1 }; // Default sort

  const { skip, limit: limitValue, hasLimit } = resolvePagination(page, limit);
  if (hasLimit) {
    options.skip = skip;
    options.limit = limitValue;
  }

  return { criteria, options, page: page || 1, limit: limitValue };
};
