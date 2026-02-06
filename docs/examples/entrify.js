////////////////////////////////////////////
// [File: webpack.config.js]              //
////////////////////////////////////////////

import {entrify} from '@lumjs/web-build';
import path from 'node:path';

const mode = process.env.WP_MODE ?? 'development';
const outPath = path.join(process.cwd(), 'dist', mode);

export default {
  mode,
  optimization: { runtimeChunk: single },
  output: {
    clean: true,
    path: outPath,
    filename: 'js/[name].js',
  },
  entry: entrify({
    pwa: { runtime: false },
    eruda: 0,
    lum: 2,
    idb: 1,
    model: ['lum','idb'],
    views: 'model',
  }),

  // the rest of your webpack config rules go here.
}

////////////////////////////////////////////
// [Exported Value: webpackConfig.entry]  //
////////////////////////////////////////////

const entry =  {
  pwa: { 
    import: './src/entry/pwa.js',
    runtime: false,
  },
  eruda: {
    import: './src/entry/eruda.js',
  },
  lum: { 
    import: './src/entry/lum.cjs', // ← alt extension
  },
  idb: {
    import: 'idb',
  },
  model: {
    import: './src/entry/model.js',
    dependsOn: ['lum','idb'],
  },
  views: {
    import: './src/entry/views.js',
    dependsOn: 'model',
  },
}
