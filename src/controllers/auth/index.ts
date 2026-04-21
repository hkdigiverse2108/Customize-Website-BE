import axios from "axios";
import { ACCOUNT_TYPE, compareHash, generateHash, generateOtpCode, generateToken, HTTP_STATUS, otpValidityMinutes, sanitizeUser, tokenExpireIn } from "../../common";
import { userModel } from "../../database";
import { forgotPasswordOtpMail, loginOtpMail, reqInfo, responseMessage } from "../../helper";
import { apiResponse } from "../../type";
import { resetPasswordSchema, forgotPasswordSchema, changePasswordSchema, googleSignupSchema, loginSchema, signupSchema, verifyLoginOtpSchema } from "../../validation";


const resolveGoogleClientId = () => process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_WEB_CLIENT_ID || "";

const verifyGoogleIdToken = async (idToken: string) => {
  try {
    const response = await axios.get(process.env.GOOGLE_TOKENINFO_URL, { params: { id_token: idToken } });
    const payload = response?.data || {};

    const email = String(payload?.email || "").trim().toLowerCase();
    const firstName = String(payload?.given_name || "").trim();
    const lastName = String(payload?.family_name || "").trim();
    const fullName = String(payload?.name || "").trim();
    const emailVerified = payload?.email_verified === true || String(payload?.email_verified || "").toLowerCase() === "true";
    const audience = String(payload?.aud || "").trim();
    const subject = String(payload?.sub || "").trim();

    if (!email || !subject || !emailVerified) throw new Error("INVALID_GOOGLE_TOKEN");

    const googleClientId = resolveGoogleClientId();
    if (!googleClientId) throw new Error("GOOGLE_CLIENT_ID_MISSING");
    if (audience !== googleClientId) throw new Error("GOOGLE_AUDIENCE_MISMATCH");

    const splitName = fullName ? fullName.split(" ") : [];
    const fallbackFirstName = splitName[0] || "Google";
    const fallbackLastName = splitName.slice(1).join(" ") || "User";

    return {
      email,
      firstName: firstName || fallbackFirstName,
      lastName: lastName || fallbackLastName,
    };
  } catch (error) {
    if (error?.message === "INVALID_GOOGLE_TOKEN" || error?.message === "GOOGLE_CLIENT_ID_MISSING" || error?.message === "GOOGLE_AUDIENCE_MISMATCH") throw error;
    if (axios.isAxiosError(error) && error?.response?.status === 400) throw new Error("INVALID_GOOGLE_TOKEN");
    throw error;
  }
};

export const signup = async (req, res) => {
  reqInfo(req);

  try {
    const { error, value } = signupSchema.validate(req.body);
    if (error) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, error?.details[0]?.message, {}, {}));

    const email = String(value.email).trim().toLowerCase();
    const existingUser = await userModel.findOne({ email, isDeleted: { $ne: true } }, {}, { lean: true });
    if (existingUser) return res.status(HTTP_STATUS.CONFLICT).json(apiResponse(HTTP_STATUS.CONFLICT, responseMessage.dataAlreadyExist("email"), {}, {}));

    const hashPassword = await generateHash(value.password);

    const userPayload: any = {
      firstName: value.firstName,
      lastName: value.lastName,
      email,
      password: hashPassword,
      role: value.role || ACCOUNT_TYPE.VENDOR,
    };

    if (value.subscription) userPayload.subscription = value.subscription;

    const createdUser = await new userModel(userPayload).save();
    const userData = sanitizeUser(createdUser.toObject());
    const token = await generateToken({ _id: String(createdUser._id), email: createdUser.email, role: createdUser.role }, { expiresIn: tokenExpireIn });

    return res.status(HTTP_STATUS.CREATED).json(apiResponse(HTTP_STATUS.CREATED, responseMessage.signupSuccess, { user: userData, token }, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const googleAuth = async (req, res) => {
  reqInfo(req);

  try {
    const { error, value } = googleSignupSchema.validate(req.body);
    if (error) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, error?.details[0]?.message, {}, {}));

    const googleToken = value.idToken || value.credential;
    const googleProfile = await verifyGoogleIdToken(googleToken);
    
    let user: any = await userModel.findOne({ email: googleProfile.email, isDeleted: { $ne: true } });

    if (user) {
      if (user.isActive === false) return res.status(HTTP_STATUS.FORBIDDEN).json(apiResponse(HTTP_STATUS.FORBIDDEN, responseMessage.accountBlock, {}, {}));
      
      // Update missing names if necessary
      let shouldSave = false;
      if (!user.firstName && googleProfile.firstName) { user.firstName = googleProfile.firstName; shouldSave = true; }
      if (!user.lastName && googleProfile.lastName) { user.lastName = googleProfile.lastName; shouldSave = true; }
      if (shouldSave) await user.save();
    } else {
      // Create new user if doesn't exist
      user = await new userModel({
        firstName: googleProfile.firstName,
        lastName: googleProfile.lastName,
        email: googleProfile.email,
        role: ACCOUNT_TYPE.VENDOR,
      }).save();
    }

    const userData = sanitizeUser(user.toObject());
    const token = await generateToken({ _id: String(user._id), email: user.email, role: user.role }, { expiresIn: tokenExpireIn });
    
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.loginSuccess, { user: userData, token }, {}));
  } catch (error) {
    const errorMap = {
        "GOOGLE_CLIENT_ID_MISSING": "Google configuration missing on server",
        "GOOGLE_AUDIENCE_MISMATCH": "Google token audience mismatch",
        "INVALID_GOOGLE_TOKEN": "Invalid Google token"
    };

    if (errorMap[error?.message]) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, errorMap[error.message], {}, {}));
    }

    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const login = async (req, res) => {
  reqInfo(req);

  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, error?.details[0]?.message, {}, {}));

    const email = String(value.email).trim().toLowerCase();
    const existingUser: any = await userModel.findOne({ email, isDeleted: { $ne: true } });
    if (!existingUser) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, responseMessage.invalidEmail, {}, {}));
    if (existingUser?.isActive === false) return res.status(HTTP_STATUS.FORBIDDEN).json(apiResponse(HTTP_STATUS.FORBIDDEN, responseMessage.accountBlock, {}, {}));
    if (!existingUser?.password) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, "This account uses Google sign-in. Please continue with Google.", {}, {}));
    }

    const passwordMatched = await compareHash(value.password, existingUser.password);
    if (!passwordMatched) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, responseMessage.invalidPassword, {}, {}));

    const token = await generateToken({ _id: String(existingUser._id), email: existingUser.email, role: existingUser.role }, { expiresIn: tokenExpireIn });
    const userData = sanitizeUser(existingUser.toObject());

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.loginSuccess, { user: userData, token }, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const verifyOtp = async (req, res) => {
  reqInfo(req);
  try {
    const { error, value } = verifyLoginOtpSchema.validate(req.body);
    if (error) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, error?.details[0]?.message, {}, {}));

    const email = String(value.email).trim().toLowerCase();
    const existingUser: any = await userModel.findOne({ email, isDeleted: { $ne: true } });
    if (!existingUser) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, responseMessage.invalidEmail, {}, {}));
    if (existingUser?.isActive === false) return res.status(HTTP_STATUS.FORBIDDEN).json(apiResponse(HTTP_STATUS.FORBIDDEN, responseMessage.accountBlock, {}, {}));

    if (!existingUser.otp || Number(existingUser.otp) !== Number(value.otp)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, responseMessage.invalidOTP, {}, {}));
    }

    if (!existingUser.otpExpireTime || new Date(existingUser.otpExpireTime).getTime() < Date.now()) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, responseMessage.expireOTP, {}, {}));
    }

    const token = await generateToken({ _id: String(existingUser._id), email: existingUser.email, role: existingUser.role }, { expiresIn: tokenExpireIn });
    const userData = sanitizeUser(existingUser.toObject());

    existingUser.otp = null;
    existingUser.otpExpireTime = null;
    await existingUser.save();

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.loginSuccess, { user: userData, token }, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const forgotPassword = async (req, res) => {
  reqInfo(req);

  try {
    const { error, value } = forgotPasswordSchema.validate(req.body);
    if (error) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, error?.details[0]?.message, {}, {}));

    const email = String(value.email).trim().toLowerCase();
    const existingUser: any = await userModel.findOne({ email, isDeleted: { $ne: true } });
    if (!existingUser) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, responseMessage.invalidEmail, {}, {}));
    if (existingUser?.isActive === false) return res.status(HTTP_STATUS.FORBIDDEN).json(apiResponse(HTTP_STATUS.FORBIDDEN, responseMessage.accountBlock, {}, {}));

    const otp = generateOtpCode();
    existingUser.otp = otp;
    existingUser.otpExpireTime = new Date(Date.now() + otpValidityMinutes * 60 * 1000);
    await existingUser.save();

    await forgotPasswordOtpMail(existingUser, otp);

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.otpSendSuccess, {}, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const resendOtp = async (req, res) => {
  reqInfo(req);
  try {
    const { error, value } = forgotPasswordSchema.validate(req.body);
    if (error) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, error?.details[0]?.message, {}, {}));

    const email = String(value.email).trim().toLowerCase();
    const existingUser: any = await userModel.findOne({ email, isDeleted: { $ne: true } });
    if (!existingUser) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, responseMessage.invalidEmail, {}, {}));
    if (existingUser?.isActive === false) return res.status(HTTP_STATUS.FORBIDDEN).json(apiResponse(HTTP_STATUS.FORBIDDEN, responseMessage.accountBlock, {}, {}));

    const otp = generateOtpCode();
    existingUser.otp = otp;
    existingUser.otpExpireTime = new Date(Date.now() + otpValidityMinutes * 60 * 1000);
    await existingUser.save();

    await loginOtpMail(existingUser, otp);
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.otpSendSuccess, {}, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};


export const resetPassword = async (req, res) => {
  reqInfo(req);

  try {
    const { error, value } = resetPasswordSchema.validate(req.body);
    if (error) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, error?.details[0]?.message, {}, {}));

    const email = String(value.email).trim().toLowerCase();
    const existingUser: any = await userModel.findOne({ email, isDeleted: { $ne: true } });
    if (!existingUser) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, responseMessage.invalidEmail, {}, {}));

    if (existingUser?.password) {
      const isSamePassword = await compareHash(value.password, existingUser.password);
      if (isSamePassword) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, responseMessage.passwordSameError, {}, {}));
    }

    existingUser.password = await generateHash(value.password);
    existingUser.otp = null;
    existingUser.otpExpireTime = null;
    await existingUser.save();

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.resetPasswordSuccess, {}, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const changePassword = async (req, res) => {
  reqInfo(req);

  try {
    const { error, value } = changePasswordSchema.validate(req.body);
    if (error) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, error?.details[0]?.message, {}, {}));

    const authUser: any = req.headers.user;
    if (!authUser?._id) return res.status(HTTP_STATUS.UNAUTHORIZED).json(apiResponse(HTTP_STATUS.UNAUTHORIZED, responseMessage.tokenNotFound, {}, {}));

    const existingUser: any = await userModel.findOne({ _id: authUser._id, isDeleted: { $ne: true } });
    if (!existingUser) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, responseMessage.invalidToken, {}, {}));
    if (!existingUser?.password) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, "This account uses Google sign-in. Set password using forgot-password flow first.", {}, {}));
    }

    const oldPasswordMatched = await compareHash(value.oldPassword, existingUser.password);
    if (!oldPasswordMatched) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, responseMessage.invalidPassword, {}, {}));

    const isSamePassword = await compareHash(value.newPassword, existingUser.password);
    if (isSamePassword) return res.status(HTTP_STATUS.BAD_REQUEST).json(apiResponse(HTTP_STATUS.BAD_REQUEST, responseMessage.passwordSameError, {}, {}));

    existingUser.password = await generateHash(value.newPassword);
    await existingUser.save();

    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.resetPasswordSuccess, {}, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};

export const logout = async (req, res) => {
  reqInfo(req);

  try {
    return res.status(HTTP_STATUS.OK).json(apiResponse(HTTP_STATUS.OK, responseMessage.logoutSuccess, {}, {}));
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(apiResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
  }
};
