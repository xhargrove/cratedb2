import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      /** Cover artwork uploads (validated to 3MB server-side). */
      bodySizeLimit: '4mb',
    },
  },
};

export default nextConfig;
