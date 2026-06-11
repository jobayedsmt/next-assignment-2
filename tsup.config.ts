import { defineConfig } from "tsup";
export default defineConfig({
 entry: ["src/server.ts"],
 format: ["esm",], // Keep this as ESM
 target: "esnext",
 outDir: "dist",
 clean: true,
 bundle: true,
 splitting: false,
 sourcemap: true,
 // Add this banner to shim require() for CJS dependencies
 banner: {
  js: `
   import { createRequire } from 'module';
   const require = createRequire(import.meta.url);
  `,
 },
});

// "include": ["src/**/*"],
//  "exclude": []
// Command: [npm i -g vercel, vercel login, vercel –prod] 
// vercel.json
// {
//  "version": 2,
//  "builds": [
//   {
//    "src": "dist/server.js",
//    "use": "@vercel/node"
//   }
//  ],
//  "routes": [
//   {
//    "src": "/(.*)",
//    "dest": "dist/server.js"
//   }
//  ]
// }
