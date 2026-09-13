import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { version } = require('./package.json');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  env: {
    // Exposed to the client so the UI can display the current app version
    NEXT_PUBLIC_APP_VERSION: version,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
