import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  // Add build configuration for the main process
  build: {
    rollupOptions: {
      external: ['better-sqlite3'],
    },
  },
});
