/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'standalone', // removed: causes chunk layout bug
  experimental: { serverActions: { bodySizeLimit: '2mb' } }
};
module.exports = nextConfig;
