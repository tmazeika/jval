import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

export default [
  {
    input: 'src/index.ts',
    output: {
      name: 'jval',
      file: pkg.browser,
      format: 'umd',
    },
    plugins: [typescript(), terser({ format: { comments: false } })],
  },
  {
    input: 'src/index.ts',
    output: [
      { file: pkg.main, format: 'cjs' },
      { file: pkg.module, format: 'es' },
    ],
    plugins: [typescript(), terser({ format: { comments: false } })],
  },
];
