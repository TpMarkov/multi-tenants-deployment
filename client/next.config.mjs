import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  async redirects() {
    return [
      {
        source: '/',
        destination: '/admin/login',
        permanent: false,
      },
    ];
  },
};

export default withPWA(nextConfig);
