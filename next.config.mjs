/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pg', 'xlsx'],
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
  },
  allowedDevOrigins: ['10.0.93.194', 'localhost'],
};

export default nextConfig;
