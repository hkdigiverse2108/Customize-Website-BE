import Joi from "joi";
import { Document, Schema } from "mongoose";


type ApiResponse<T = any> = {
  status: number;
  message: string;
  data?: T;
  error?: any;
};

export const apiResponse = <T>(status: number, message: string, data: T, error: any): ApiResponse<T> => ({
  status,
  message,
  data,
  error,
});

