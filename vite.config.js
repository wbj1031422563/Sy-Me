/*
 * @Author: FMC
 * @Date: 2024-06-22 22:12:35
 * @LastEditors: FMC
 * @LastEditTime: 2024-07-15 21:25:38
 * @FilePath: \fmc-personal-blog\vite.config.js
 * @Description: 
 */
import { defineConfig } from 'vite'
import glsl from "vite-plugin-glsl";
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

// 将 import.meta.url 转换为文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  publicDir: "./public/",
  build:
  {
      outDir: '../dist',
      emptyOutDir: true,
      sourcemap: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  plugins: [react(), glsl()],
})
