const path = require('path');

module.exports = {
  entry: "./src/file-explorer.ts",
    
  output: {
    filename: "file-explorer.js",
    path: path.resolve(__dirname, "./src/"),
  },
  module: {
    rules: [
      {
        test: /\.ts$/, // match TypeScript files
        use: 'ts-loader', // use ts-loader to transpile them
        exclude: /node_modules/, // exclude node_modules directory
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js','.d.ts'], // resolve both TypeScript and JavaScript extensions
  },
  optimization: {
    minimize: false, // disable minimization
  },
  // devtool: "source-map", 
};