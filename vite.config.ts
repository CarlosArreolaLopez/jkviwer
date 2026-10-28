import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visorProxyPlugin } from './server/proxyPlugin';

export default defineConfig({
  plugins: [react(), visorProxyPlugin()],
});
