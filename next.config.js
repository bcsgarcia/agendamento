/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'standalone',  // REMOVED: cause chunk layout bug in Coolify builds
  experimental: { serverActions: { bodySizeLimit: '2mb' } }
};
module.exports = nextConfig;
