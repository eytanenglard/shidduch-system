// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
      bodySizeLimit: "2mb"
    }
  },
  webpack: (config, { dev, isServer }) => {
    // ... (חלק זה נשאר ללא שינוי)
    config.module.rules.push({
      test: /\.hbs$/,
      use: [
        {
          loader: 'handlebars-loader',
          options: {
            knownHelpersOnly: false,
            runtime: 'handlebars',
            precompiled: true
          }
        }
      ]
    });
    config.resolve = {
      ...config.resolve,
      fallback: {
        ...config.resolve?.fallback,
        fs: false,
        path: false
      }
    };
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            commons: {
              name: 'commons',
              chunks: 'all',
              minChunks: 2,
              reuseExistingChunk: true
            },
            lib: {
              test: /[\\/]node_modules[\\/]/,
              name(module) {
                if (!module.context) return 'vendor';
                const match = module.context.match(
                  /[\\/]node_modules[\\/](.*?)([\\/]|$)/
                );
                if (!match || !match[1]) return 'vendor';
                return `npm.${match[1].replace('@', '')}`;
              },
              chunks: 'all',
              priority: 1
            }
          }
        },
        runtimeChunk: {
          name: 'runtime'
        }
      };
    }
    return config;
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // ==================== הקטע שעודכן ====================
  images: {
    // 1. זו השורה שמעבירה את עבודת עיבוד התמונות ל-Cloudinary
    loader: 'cloudinary',

    // 2. זו הכתובת הבסיסית של התמונות בחשבון שלך
    path: 'https://res.cloudinary.com/dmfxoi6g0/image/upload/',

    // 3. עדכון לשיטה המודרנית והמאובטחת יותר במקום 'domains'
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
    
    // את השורה הזו אפשר להשאיר, זה לא מזיק
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  }
  // =======================================================
};

module.exports = nextConfig;