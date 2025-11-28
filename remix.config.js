import { defineConfig } from "@remix-run/dev";

export default defineConfig({
  appDirectory: "app",
  assetsBuildDirectory: "public/build",
  serverBuildPath: "build/index.js",
  publicPath: "/build/",
  future: {
    v3_fetcherPersist: true,
    v3_relativeSplatPath: true,
    v3_routeConvention: true
  },
  ignoredRouteFiles: ["**/.*"],
  serverModuleFormat: "esm",
  serverDependenciesToBundle: [
    /^@shopify\//,
    /^@remix-run\//
  ]
});
