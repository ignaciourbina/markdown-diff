import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Served at https://ignaciourbina.github.io/markdown-diff/
export default defineConfig({
  base: '/markdown-diff/',
  plugins: [react()],
});
