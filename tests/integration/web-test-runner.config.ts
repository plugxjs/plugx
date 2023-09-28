import { type TestRunnerConfig } from '@web/test-runner';
import { esbuildPlugin } from '@web/dev-server-esbuild';

export const config: TestRunnerConfig = {
  testRunnerHtml: (testFramework: string): string =>
    `<html>
      <body>
        <script>window.process = { env: { NODE_ENV: 'development' } }</script>
        <script type="module" src="${testFramework}"></script>
      </body>
    </html>`,
  files: ['tests/**/*.spec.ts'],
  nodeResolve: true,
  plugins: [
    esbuildPlugin({
      ts: true,
      target: 'esnext',
    }),
  ],
};
