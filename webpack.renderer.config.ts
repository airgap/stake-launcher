import type { Configuration } from "webpack";
import { resolve } from "path";

import { rules as baseRules } from "./webpack.rules";
import { plugins } from "./webpack.plugins";

const rules = [
  ...baseRules,
  {
    test: /\.module\.sass$/,
    use: [
      "style-loader",
      {
        loader: "css-loader",
        options: {
          modules: true,
        },
      },
      "sass-loader",
    ],
    include: resolve(__dirname, "frontend"),
  },
  {
    test: /\.css$/,
    use: ["style-loader", "css-loader"],
  },
];

export const rendererConfig: Configuration = {
  module: {
    rules,
  },
  plugins,
  resolve: {
    extensions: [".js", ".ts", ".jsx", ".tsx", ".sass", ".css"],
    fallback: {
      fs: false,
      path: require.resolve("path-browserify"),
    },
  },
};
