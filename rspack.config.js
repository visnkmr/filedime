// const resolve = require('@rollup/plugin-node-resolve').default;
// const commonjs = require('@rollup/plugin-commonjs');
const path = require('path');

module.exports = {
  entry: './src/file-explorer.ts',
  output: {
    filename: 'file-explorer.js',
    path: path.resolve(__dirname, "./src/"),
    // format: 'iife',
  },
  plugins: [
    // resolve(),
    // commonjs(),
  ],
  // optimization: {
  //   minimize: false, // disable minimization
  // },
};
