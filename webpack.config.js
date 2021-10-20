import path from 'path';

export default {
  entry: './src/index.ts',
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    path: path.resolve('dist'),
    filename: 'index.js',
    library: 'jval',
    globalObject: 'this',
    clean: true,
  },
};
