const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  target: 'node',
  devtool: 'cheap-eval-src-map',
  externals: [nodeExternals()],
  entry: {
    'pomodoro-nag': './src/nagProcess/main.js',
    'pomodoro-intrusive': './src/client/main.js',
    'pomodoro-screenlock': './src/screenLock/main.js',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'commonjs2',
  },
  resolve: {
    extensions: ['.js'],
    modules: [path.resolve('./src'), path.resolve('./node_modules')],
  },
  stats: {
    colors: true,
    chunks: true,
    reasons: true,
  },
  module: {
    noParse: [/dtrace-provider/, /safe-json-stringify/, /mv/],
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                'env',
                {
                  targets: {
                    node: '4.7.2',
                  },
                },
              ],
            ],
          },
        },
      },
      {
        test: /\.(png|jpg|gif|svg|wav|json)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              publicPath: 'dist/',
              name: '[path][name].[ext]',
            },
          },
        ],
      },
    ],
  },
};
