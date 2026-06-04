import type { DataAdapter } from "./contracts";
import { apiAdapter } from "./apiAdapter";
import { mockAdapter } from "./mockAdapter";

export function getDataAdapter(): DataAdapter {
  return process.env.NEXT_PUBLIC_DATA_SOURCE === "api" ? apiAdapter : mockAdapter;
}

export * from "./models";
export * from "./time";
