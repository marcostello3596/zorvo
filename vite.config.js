import { defineConfig } from 'vite';

// `npm run build`          -> dist/ (deploy: Vercel, Netlify, Hostinger…)
// `npm run build:artifact` -> artifact/zorvo.html (un solo archivo con todo inline, para la preview en Claude)
export default defineConfig(({ mode }) => {
  const single = mode === 'artifact';
  return {
    build: {
      outDir: single ? 'dist-artifact' : 'dist',
      target: 'es2020',
      cssCodeSplit: !single,
      assetsInlineLimit: single ? 100_000_000 : 4096,
      chunkSizeWarningLimit: 1200,
      rollupOptions: single ? { output: { inlineDynamicImports: true } } : {},
    },
    server: { host: true },
  };
});
