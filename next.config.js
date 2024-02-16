const TerserPlugin = require("terser-webpack-plugin");
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

const withOptimizedImages = require('next-optimized-images');

const withPWA = require("next-pwa")({
  pwa: {
    dest: "public",
    // register: true,
    skipWaiting: true,
    disable:process.env.NODE_ENV === 'development'
  },
});



const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})
/** @type {import('next').NextConfig} */
const nextConfig =
// withPWA(
  // withBundleAnalyzer(
    {
  // withPWA,
  // withOptimizedImages,
  experimental: {
    // appDir: true,
    // optimizeCss: true,
    esmExternals: true,
    forceSwcTransforms: true,
    scrollRestoration: true,
    legacyBrowsers: false,
  },
  typescript: {
    ignoreBuildErrors: true
  },
  // eslint: {
  //   ignoreDuringBuilds: true
  // },
  assetPrefix: 'http://localhost:3000/',
  
  // basePath: '/tmp/webpage/out',
  // basePath: '/home/roger/Downloads/github/webpage/out',
  // assetPrefix: 'https://cdn.jsdelivr.net/gh/visnkmr/visnkmr.github.io@main/',
  // assetPrefix: 'https://visnk.pages.dev/',
  // assetPrefix: 'https://cdn.jsdelivr.net/gh/visnkmr/hv2static@main/',
  // amp:false,
  // basePath: 'https://cdn.jsdelivr.net/gh/visnkmr/hv2static@master/',
  // async rewrites(){
  //   return [
  //     {
  //       source: `/tmp/webpage/out/_next/:path*`,
  //       destination: 'https://cdn.jsdelivr.net/gh/visnkmr/hv2static@master/_next/:path*',
  //       permanent:true
  //     }
  //   ]
  // },
  webpack: (config,{nextRuntime}
    // , { dev, isServer }
    ) => {
      // if (!isServer) {
        // config.optimization.minimize = false;
      // }
      // if (options.isServer) {
      //   config.externals = ['@tanstack/react-query', ...config.externals];
      // }
      // config.resolve.alias['@tanstack/react-query'] = path.resolve(
      //   './node_modules/@tanstack/react-query'
      // );
    
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false
      };
      config.optimization = {
        minimize: false,
        minimizer: [
          new TerserPlugin({
            // minify: TerserPlugin.swcMinify,
            parallel: true,
            extractComments:false,
            terserOptions: {
              ecma: 10,
              warnings: false,
              output: {
                comments: false,
                indent_level: 2,
                ecma:10,
                indent_start: 0,
                quote_keys: false,
                wrap_iife: true,
              },
              compress: {
                drop_console: false,
                drop_debugger: false,
                hoist_funs: false,
                hoist_props: false,
                hoist_vars: false,
                inline: false,
                loops: false,
                negate_iife: false,
                passes: 3,
                reduce_funcs: false,
                reduce_vars: false,
                switches: false,
                toplevel: false,
                typeofs: false,
                unsafe: false,
                unsafe_arrows: false,
                unsafe_comps: false,
                unsafe_Function: false,
                unsafe_math: false,
                unsafe_methods: false,
                unsafe_proto: false,
                unsafe_regexp: false,
                unsafe_undefined: false,
              },
              ie8: false
            }
          }),
          new CssMinimizerPlugin({
            parallel: true,
            minify: [
              CssMinimizerPlugin.cssnanoMinify,
              CssMinimizerPlugin.cleanCssMinify
            ],
          }),
        ],
        
      };
    // Set the output path to /tmp/next
    // config.output.path = '/tmp/.next';
    // if (!isServer) {
    //   config.module.rules.forEach(rule => {
    //     if (rule.loader === 'babel-loader') {
    //       rule.options.cacheDirectory = '/tmp/.next';
    //     }
    //   });
    // }
    
    // Disable code splitting
    // config.optimization.splitChunks.cacheGroups = {
    //   default: false,
    // };

    // Merge chunks instead of creating new ones
    config.optimization.minimize = false;
//     if (typeof nextRuntime === "undefined") {
//       config.resolve.fallback = {
//                 ...config.resolve.fallback,
//                 fs: false,
//          };  
// }
    // Always create a single chunk for all code
    config.optimization.splitChunks = {
      cacheGroups: {
        default: false,
      },
    };

    // Disable file-based dynamic imports
    // config.module.rules.push({
    //   test: /\.js$/,
    //   use: {
    //     loader: 'next-babel-loader',
    //     options: {
    //       isServer,
    //     },
    //   },
    // });

    return config;
  },

  // webpackDevMiddleware: config => {
  //   // Perform customizations to webpack dev middleware config
  //   // console.log(config, '@@')
  //   // Important: return the modified config
  //   return config;
  // },
  // serverRuntimeConfig: { // Will only be available on the server side
  //   // rootDir: path.join(__dirname, './'),
  //   PORT: isDev ? 3006 : (process.env.PORT || 5999)
  // },
  // publicRuntimeConfig: { // Will be available on both server and client
  //   // staticFolder: '/static',
  //   isDev, // Pass through env variables
  // },
  // experimental:{
  //   serverActions:true,
  // },
  reactStrictMode: false,
  output:"export",
};

// )
// );
module.exports = (_phase, { defaultConfig }) => {
  const plugins = [
    // [withPWA], 
    // [withBundleAnalyzer]
  ]
  const KEYS_TO_OMIT = ['webpackDevMiddleware', 'configOrigin', 'target', 'analyticsId', 'webpack5', 'amp', 'assetPrefix']

  const wConfig = plugins.reduce((acc, [plugin, config]) => plugin({ ...acc, ...config }), {
    ...defaultConfig,
    ...nextConfig,
  })
const finalConfig = {}
  Object.keys(wConfig).forEach((key) => {
    if (!KEYS_TO_OMIT.includes(key)) {
      finalConfig[key] = wConfig[key]
    }
  })

  return finalConfig;
  // );
}