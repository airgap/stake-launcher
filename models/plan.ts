import { FromSchema, ObjectSchema } from "from-schema";

export const plan = {
  // title: "Plan",
  type: "object",
  properties: {
    name: {
      type: "string",
    },
    amount: {
      type: "number",
    },
    daily: {
      type: "number",
    },
    duration: {
      type: "number",
    },
    total: {
      type: "number",
    },
  },
  required: ["name", "amount", "daily", "duration", "total"],
} as const satisfies ObjectSchema;
export type Plan = FromSchema<typeof plan>;
