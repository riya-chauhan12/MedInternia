/**
 * Next.js configuration to ensure Turbopack uses the frontend folder as root
 * This avoids Next inferring the workspace root when multiple lockfiles exist.
 */
/** @type {import('next').NextConfig} */
const path = require('path');

// Import the PWA plugin
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

// Existing config rules
const nextConfig = {
  turbopack: {
    // Use absolute path to this frontend folder so Turbopack finds pages/app correctly
    root: __dirname
  }
};

// Wrapping config with PWA
module.exports = withPWA(nextConfig);
