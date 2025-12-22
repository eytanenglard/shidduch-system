/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
      bodySizeLimit: "12mb"
    }
  },
  webpack: (config, { dev, isServer }) => {
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
  
  // ==================== START: Security Headers Block ====================
  async headers() {
    const siteUrl = process.env.NODE_ENV === 'production' 
      ? 'https://www.neshamatech.com' // הדומיין שלך, כפי שמופיע במטא-דאטה
      : 'http://localhost:3000';

    return [
      {
        // החל את כותרות האבטחה הגלובליות על כל הנתיבים באתר
        source: '/:path*',
        headers: [
          // (HSTS) מאלץ את הדפדפן לתקשר רק ב-HTTPS, מונע התקפות הורדת דרגה
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // מונע טעינת האתר בתוך iframe באתרים אחרים, הגנה קריטית מפני Clickjacking
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN', // אפשר גם 'DENY' אם אין צורך ב-iframes כלל
          },
          // הגנה מובנית בדפדפנים מפני התקפות XSS
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // מונע מהדפדפן "לנחש" את סוג התוכן של קבצים, מונע התקפות מסוימות
          {
            key: 'X-Content-Type-Options',
            value: 'nosiff',
          },
          // (CSP) - מדיניות אבטחת תוכן. זוהי ההגנה החזקה ביותר נגד XSS.
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' *.google-analytics.com www.googletagmanager.com maps.googleapis.com",
              "script-src-elem 'self' 'unsafe-inline' *.google-analytics.com www.googletagmanager.com maps.googleapis.com",
              "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
              // כאן התיקון: הוספנו את blob: כדי לאפשר תצוגה מקדימה של תמונות
              "img-src 'self' data: blob: https://res.cloudinary.com",
              "font-src 'self' fonts.gstatic.com",
              // הוספנו את הדומיין של Google Maps גם ל-connect-src
              `connect-src 'self' ${siteUrl} *.google-analytics.com www.googletagmanager.com https://api.upstash.com vitals.vercel-insights.com maps.googleapis.com`,
              "form-action 'self'",
              "frame-ancestors 'self'",
            ].join('; '),
          },
        ],
      },
      // הגדרות CORS עבור נתיבי ה-API שלך
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          // חשוב: בסביבת פרודקשן, אנו מגבילים את הגישה רק לדומיין שלך
          { key: 'Access-Control-Allow-Origin', value: siteUrl },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
  // ==================== END: Security Headers Block ====================

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },
  
  images: {
    loader: 'custom',
    loaderFile: './cloudinary-loader.js',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  }
};

module.exports = nextConfig;