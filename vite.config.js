import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build`          -> dist/ (deploy normal: Vercel, Netlify, Hostinger…)
// `npm run build:artifact` -> dist-artifact/index.html (un solo archivo, todo inline)
export default defineConfig(({ mode }) => {
  const single = mode === 'artifact';
  return {
    plugins: single ? [viteSingleFile({ removeViteModuleLoader: true })] : [],
    build: {
      outDir: single ? 'dist-artifact' : 'dist',
      target: 'es2020',
      cssCodeSplit: !single,
      assetsInlineLimit: single ? 100_000_000 : 4096,
      chunkSizeWarningLimit: 1200,
    },
    server: { host: true },
  };
});
