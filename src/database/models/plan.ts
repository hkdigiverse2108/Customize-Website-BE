import { Schema, model } from "mongoose";
import { PLAN_DURATION, SUBSCRIPTION_TYPE } from "../../common";
import { IPlan } from "../../type";

const planSchema = new Schema<IPlan>(
  {
    name: {type: String,enum: Object.values(SUBSCRIPTION_TYPE),required: true,},
    price: {type: Number,required: true,min: 0,},
    duration: {type: String,enum: Object.values(PLAN_DURATION),required: true,},
    features: {type: [String],required: true,default: [],},
    isActive: {type: Boolean,required: true,default: true,},
    isDeleted: { type: Boolean, required: true, default: false },
  },
  {timestamps: true,versionKey: false,}
);

planSchema.index({ name: 1, duration: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

export const planModel = model<IPlan>("plan", planSchema);
