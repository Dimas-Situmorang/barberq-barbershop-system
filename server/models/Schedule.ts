import { Schema, model, models, type InferSchemaType } from "mongoose";
import { scheduleStatuses, workDays } from "../domain";

const scheduleSchema = new Schema(
  {
    barberId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    workDays: [{ type: String, required: true, enum: workDays }],
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: { type: String, required: true, enum: scheduleStatuses, default: "available" }
  },
  { timestamps: true }
);

scheduleSchema.index({ barberId: 1 });
scheduleSchema.index({ workDays: 1 });

export type ScheduleDocument = InferSchemaType<typeof scheduleSchema> & { _id: unknown };
export const Schedule = models.Schedule || model("Schedule", scheduleSchema);
