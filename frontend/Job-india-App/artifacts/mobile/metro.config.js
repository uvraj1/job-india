const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Watch all files in the workspace
config.watchFolders = [workspaceRoot];

// 2. Resolve modules from both local and root node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// 3. Enable symlink support for pnpm (CRITICAL)
config.resolver.unstable_enableSymlinks = true;

// 4. Disable unstable package exports to prevent ESM/CJS interop issues with RN internals
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
