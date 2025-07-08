/** @type {import('next').NextConfig} */
const nextConfig = {
  // 開発時のホットリロード設定
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // 開発時のホットリロードを有効化
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    return config
  },
  // 開発サーバーの設定
  devIndicators: {
    buildActivity: true,
  },
}

module.exports = nextConfig 