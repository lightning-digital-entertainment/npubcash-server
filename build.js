#!/usr/bin/env node

import esbuild from "esbuild";

esbuild
  .build({
    outdir: "dist/",
    format: "esm",
    platform: "node",
    entryPoints: ["src/index.ts"],
    packages: "external",
    bundle: true,
    sourcemap: "external",
  })
  .then(() => {
    console.log("Server built sucessfully");
  });
