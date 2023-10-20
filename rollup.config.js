import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

export default [
  {
    input: "src/index.ts",
    output: [
      {
        name: "Stimulus Typescript",
        file: "dist/index.umd.js",
        format: "umd",
      },
      {
        file: "dist/index.js",
        format: "es",
      },
    ],
    context: "window",
    plugins: [resolve(), typescript({ removeComments: false })],
  },
];
