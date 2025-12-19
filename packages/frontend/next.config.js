const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure Turbopack resolves the workspace root inside Docker (monorepo + pnpm).
  turbopack: {
    root: path.resolve(__dirname, "..", ".."),
  },
};

module.exports = nextConfig;
