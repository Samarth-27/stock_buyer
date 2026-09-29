import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
  },
  resolve: {
    alias: {
      '@marketeye/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
});
