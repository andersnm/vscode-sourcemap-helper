const fs = require("fs/promises");
const path = require("path");
const esbuild = require("esbuild");

async function run() {

  //  --bundle --minify --sourcemap --platform=node --format=cjs --external:vscode --external:path --external:fs/promises --external:fs --external:querystring --outfile=dist/index.js",
  await esbuild.build({
    entryPoints: ['out/index.js'],
    bundle: true,
    minify: true,
    sourcemap: true,
    external: [ "vscode", "path", "fs/promises", "fs", "querystring" ],
    platform: "node",
    format: "cjs",
    outfile: 'dist/index.js',
  });

  const src = path.dirname(require.resolve("source-map")) + "/lib/mappings.wasm";
  const dest = "dist/mappings.wasm";

  await fs.copyFile(src, dest);
}

run();
