#!/usr/bin/env node

import esbuild from "esbuild";

esbuild
  .build({
    outdir: "dist/",
    outExtension: { ".js": ".cjs" },
    format: "cjs",
    platform: "node",
    entryPoints: ["src/index.ts"],
    bundle: true,
    sourcemap: "external",
  })
  .then(() => {
    console.log("Server built sucessfully");
  });
