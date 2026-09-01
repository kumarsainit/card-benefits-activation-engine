/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    const rawApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL;
    if (rawApiUrl && rawApiUrl.startsWith('http')) {
      const baseHost = rawApiUrl.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
      return [
        {
          source: '/api/v1/:path*',
          destination: `${baseHost}/api/v1/:path*`,
        },
      ];
    }
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:8080/api/v1/:path*',
      },
    ];
  },
};

export default nextConfig;
