/*
 * @Author: FMC
 * @Date: 2024-06-22 22:12:35
 * @LastEditors: FMC
 * @LastEditTime: 2024-07-03 21:04:59
 * @FilePath: \react-and-three.js\vite.config.js
 * @Description: 
 */
import { defineConfig } from 'vite'
import glsl from "vite-plugin-glsl";
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  publicDir: "./public/",
  build:
  {
      outDir: '../dist',
      emptyOutDir: true,
      sourcemap: true
  },
  plugins: [react(), glsl()],
})
