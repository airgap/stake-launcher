import { FromSchema, ObjectSchema } from "from-schema";

export const order = {
  // title: "Order",
  type: "object",
  properties: {
    contract: {
      type: "string",
    },
    amount: {
      type: "number",
    },
    lastPayment: {
      type: "number",
    },
    nextPayment: {
      type: "number",
    },
    expires: {
      type: "number",
    },
  },
  required: ["contract", "amount", "lastPayment", "nextPayment", "expires"],
} as const satisfies ObjectSchema;
export type Order = FromSchema<typeof order>;
