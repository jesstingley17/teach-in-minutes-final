const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  mode: process.env.NODE_ENV || 'production',
  entry: './index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.[contenthash].js',
    clean: true,
    publicPath: '/',
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
      inject: 'body',
      scriptLoading: 'defer',
    }),
    new webpack.DefinePlugin({
      'import.meta.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || ''),
      'import.meta.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''),
      'import.meta.env.SUPABASE_ANON_KEY': JSON.stringify(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''),
      'import.meta.env.ADOBE_CLIENT_ID': JSON.stringify(process.env.ADOBE_CLIENT_ID || process.env.VITE_ADOBE_CLIENT_ID || ''),
      'import.meta.env.ADOBE_CLIENT_SECRET': JSON.stringify(process.env.ADOBE_CLIENT_SECRET || process.env.VITE_ADOBE_CLIENT_SECRET || ''),
      'import.meta.env.ADOBE_ORGANIZATION_ID': JSON.stringify(process.env.ADOBE_ORGANIZATION_ID || process.env.VITE_ADOBE_ORGANIZATION_ID || ''),
      'import.meta.env.ADOBE_ACCOUNT_ID': JSON.stringify(process.env.ADOBE_ACCOUNT_ID || process.env.VITE_ADOBE_ACCOUNT_ID || ''),
      'import.meta.env.ADOBE_PRIVATE_KEY': JSON.stringify(process.env.ADOBE_PRIVATE_KEY || process.env.VITE_ADOBE_PRIVATE_KEY || ''),
      'import.meta.env.GAMMA_API_KEY': JSON.stringify(process.env.GAMMA_API_KEY || process.env.VITE_GAMMA_API_KEY || ''),
      'import.meta.env.OPENAI_API_KEY': JSON.stringify(process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || ''),
      'import.meta.env.ANTHROPIC_API_KEY': JSON.stringify(process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY || ''),
    }),
  ],
};

