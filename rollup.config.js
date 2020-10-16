//@ts-check

import { build } from 'rollup-simple-configer'
import pkg from './package.json'

const input = './src/index.js'

export default [].concat(
  build(
    input,
    {
      file: pkg.main,
      format: 'cjs',
    },
    { external: ['mobx'] }
  ),
  build(
    input,
    {
      file: pkg.module,
      format: 'esm',
    },
    { external: ['mobx'] }
  ),
  build(
    input,
    {
      file: 'dist/umd/mobx-langer.umd.js',
      format: 'umd',
      name: 'mobxLanger',
      globals: {
        mobx: 'mobx',
      },
    },
    { withMin: true, external: ['mobx'] }
  )
)
