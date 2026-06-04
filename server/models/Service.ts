import { Schema, model, models, type InferSchemaType } from "mongoose";
import { serviceStatuses } from "../domain";

const serviceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 1 },
    duration: { type: Number, required: true, min: 1 },
    status: { type: String, required: true, enum: serviceStatuses, default: "active" }
  },
  { timestamps: true }
);

serviceSchema.index({ status: 1 });

export type ServiceDocument = InferSchemaType<typeof serviceSchema> & { _id: unknown };
export const Service = models.Service || model("Service", serviceSchema);
