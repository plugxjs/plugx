import { compile } from '@plugxjs/vite-plugin';

describe('vite plugin', async () => {
  it('should not throw error', async () => {
    await compile(`console.log('1');`, 'test.js');
  });
});
