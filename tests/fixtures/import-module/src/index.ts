import './utils';
import { a } from 'plugxjs-mock-module';

export const b = a + 1;

// @ts-expect-error - not exist module
import { c } from 'not-exist-module';

export function d() {
  return c;
}

export { d as e };
