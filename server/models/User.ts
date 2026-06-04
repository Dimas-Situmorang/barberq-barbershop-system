import { Schema, model, models, type InferSchemaType } from "mongoose";
import { accountStatuses, roles } from "../domain";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    phone: { type: String, trim: true },
    role: { type: String, required: true, enum: roles },
    status: { type: String, required: true, enum: accountStatuses, default: "active" },
    specialization: { type: String, trim: true }
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

export type UserDocument = InferSchemaType<typeof userSchema> & { _id: unknown };
export const User = models.User || model("User", userSchema);
