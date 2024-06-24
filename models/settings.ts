import { ObjectSchema, FromSchema } from "from-schema";
export const settings = {
  // title: "Settings",
  type: "object",
  properties: {
    farmEmail: {
      type: "string",
      format: "email",
      // title: "Farm email",
    },
    farmPassword: {
      type: "string",
      // title: "Farm password",
    },
    notifyThreshold: {
      type: "number",
      // title: "SMS threshold $",
    },
    apiKey: {
      type: "string",
      // title: "SMS API key",
    },
    sms: {
      type: "boolean",
      // title: "SMS notifications",
    },
    autobuy: {
      type: "boolean",
      // title: "Automatic staking",
    },
    autobuyThreshold: {
      type: "number",
      // title: "Auto stake threshold",
    },
    disableChat: {
      type: "boolean",
      // title: "Disable support chatbox on StakingFarm UI",
    },
    headless: {
      type: "boolean",
      // title: "Hide the browser when possible",
    },
  },
  required: [],
} as const satisfies ObjectSchema;
export type Settings = FromSchema<typeof settings>;
export type Setting = keyof Settings;
