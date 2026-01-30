import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async redirects() {
    return [
      {
        source: '/',
        destination: '/random',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;


module.exports = {
  output: 'standalone',
}