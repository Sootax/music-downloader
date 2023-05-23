const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ffmpegPath = require('ffmpeg-static');

module.exports = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: './src/main.js',
  // Put your normal webpack config below here
  module: {
    rules: require('./webpack.rules'),
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.FLUENTFFMPEG_COV': false,
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: ffmpegPath,
          to: '.',
        },
      ],
    }),
  ],
};
