import { fileURLToPath } from 'node:url';

export function resolveFixturePath(fixturePath: string) {
  return fileURLToPath(new URL(`../../fixtures/${fixturePath}`, import.meta.url));
}
