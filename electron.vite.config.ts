import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

const isLightBuild = process.env.CHRONODESK_LIGHT === '1'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    define: {
      __LIGHT_BUILD__: JSON.stringify(isLightBuild)
    },
    build: {
      rollupOptions: {
        input: { index: resolve(__dirname, 'src/main/index.ts') }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    define: {
      __LIGHT_BUILD__: JSON.stringify(isLightBuild)
    },
    build: {
      rollupOptions: {
        input: { index: resolve(__dirname, 'src/preload/index.ts') }
      }
    }
  },
  renderer: {
    plugins: [react()],
    root: resolve(__dirname, 'src/renderer'),
    define: {
      __LIGHT_BUILD__: JSON.stringify(isLightBuild)
    },
    build: {
      rollupOptions: {
        input: { index: resolve(__dirname, 'src/renderer/index.html') }
      }
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src/renderer')
      }
    }
  }
})
