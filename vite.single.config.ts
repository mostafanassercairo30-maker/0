import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'path';

// بيطلّع ملف HTML واحد شغّال بدبل كليك من غير سيرفر: npm run build:single
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  resolve: { alias: { '@instinct/files': path.resolve(__dirname, 'src/shim/instinct-files.tsx') } },
  build: { outDir: 'dist-single', assetsInlineLimit: 100000000 },
});
