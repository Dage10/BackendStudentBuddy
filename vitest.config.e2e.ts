import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    setupFiles: ['test/setup.ts', 'test/gemini.mock.ts'],
    mockReset: true,
    fileParallelism: false,
    testTimeout: 20_000,
  },
});
