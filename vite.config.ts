import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'WizardApiClient',
      fileName: (format) => `wizard-api-client.${format}.js`,
      formats: ['es', 'umd']
    },
    rollupOptions: {
      external: ['vue', 'axios', 'pinia', 'vue-router'],
      output: {
        globals: {
          vue: 'Vue',
          axios: 'axios',
          pinia: 'Pinia',
          'vue-router': 'VueRouter'
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true,
    cors: true
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`
      }
    }
  }
});