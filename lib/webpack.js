/**
 * Webpack helpers.
 * 
 * All of the exports from the `utils` sub-module are exported
 * from this one as well.
 * 
 * @module @lumjs/web-build/webpack
 */

import core from '@lumjs/core';
import fs from 'node:fs';
import path from 'node:path';
export * from './utils.js';

const { isObj } = core.types;
const cp = Object.assign;
const dps = Object.defineProperties;
const cwd = process.cwd();
const PACKAGE_FILE = 'package.json';
const SY_CACHE = Symbol.for('@lumjs/web-build/webpack~loadFileCache');

// : Default options for the entrify() function.
const DEF_ENTRY = {
  alt: 2,
  ext: '.js',
  one: 1,
  path: './src/entry',
}

// : Default options for the loadFile() function.
const DEF_LOAD = {
  basepath: cwd,
  encoding: 'utf8',
}

// : A package.json without a type defaults to commonjs.
const DEF_TYPE = 'commonjs';

// : An internal cache for loadFile() function.
const loadFileCache = new Map();

/**
 * Set the parsed data for the package.json file.
 *
 * Meant for if you load the package.json in your webpack.config.js via:
 * `import pkg from './package.json' with { type: 'json' };`
 * 
 * Calls to loadFile() without any arguments will then return this
 * instead of loading the text content and parsing it.
 * 
 * @param {object} data - Must have at least `name` and `version` to
 * be recognized as package.json data.
 * @returns {boolean} If the `data` was considered valid and set.
 */
export function setPackage(data) {
  if (isObj(data)
    && typeof data.name === 'string' 
    && typeof data.version === 'string')
  {
    let pp = path.join(cwd, PACKAGE_FILE);
    loadFileCache.set(pp, {js: data});
    return true;
  }
  return false;
}

/**
 * Load a project file synchronously.
 * 
 * @param {string} [filename="package.json"] Filename to load.
 * 
 * If not specified it will default to `'package.json'`, as a quick way to
 * get the package metadata for the current project.
 *
 * @param {object} [opts] Options.
 *
 * @param {string} [opts.basepath=CWD] Base path to look for files in.
 * 
 * Defaults to the current working directory. Should usually be the
 * project root. All filenames will be resolved as relative of this.
 *
 * @param {?string} [opts.encoding='utf8'] Encoding for files.
 * 
 * Default is `'utf8'`, which is a pretty safe bet these days.
 * 
 * @param {boolean} [opts.json] Attempt to decode file as JSON?
 * 
 * The default is true if the filename ends with `.json`, or false otherwise.
 * 
 * @param {function} [opts.reviver] Optional JSON reviver function.
 *
 * Only used during the auto-decoding of '.json' files; no default.
 *
 * @returns {(null|string|object|Buffer)}
 *
 * - Will be `null` if the file did not exist or could not be read.
 * - A Buffer if `opts.encoding` was explicitly set to null.
 * - An object if a `.json` file was successfully decoded.
 * - A string if none of the above apply.
 *
 * An internal cache is used so that if loadFile() is called multiple times 
 * with the same combination of filename and basepath, it will use the cached
 * data if available.
 */
export function loadFile(filename=PACKAGE_FILE, opts) {
  opts = cp({}, DEF_LOAD, opts);

  if (typeof filename !== 'string' || typeof opts.basepath !== 'string') {
    throw new TypeError('invalid arguments');
  }

  let content;
  let filepath = path.join(opts.basepath, filename);
  let info = {};
  let isJSON = opts.json ?? filename.endsWith('.json');
  let noEnc = (opts.encoding === null);

  if (loadFileCache.has(filepath)) {
    info = loadFileCache.get(filepath);
    if (noEnc) {
      if (info.buf instanceof Buffer) { 
        return info.buf; 
      }
    }
    else {
      if (isJSON && isObj(info.json)) { 
        return info.js 
      } 
      else if (typeof info.text === 'string') {
        return info.text;
      }
    }
  }

  try {
    content = fs.readFileSync(filepath, opts);
  } catch (err) {
    console.error(err);
    return null;
  }

  if (typeof content === 'string') {
    info.text = content;
    if (isJSON) {
      // Decode the JSON file into a JS Object or Array.
      let js = JSON.parse(content, opts.reviver);
      if (isObj(js)) {
        info.js = js;
      }
    }
  }
  else if (content instanceof Buffer) {
    info.buf = content;
  }

  // Save cached info.
  loadFileCache.set(filepath, info);

  if (noEnc) return info.buf ?? null;
  if (isJSON) return info.js ?? info.text ?? null;
  return info.text ?? null;
}

dps(loadFile, {
  [SY_CACHE]: { value: loadFileCache },
  clearCache: { value: () => loadFileCache.clear() },
  defaults:   { value: DEF_LOAD },
});

/**
 * Create entry items using a shortcut spec format.
 * 
 * @param {object} [opts] Options.
 * 
 * Omit this argument entirely to use all default options.
 * 
 * @param {(number|string)} [opts.alt=2] Value to use alt file extension.
 * 
 * If an entry is set to this special value, then we will look for an entry
 * source file using the _alternative_ file extension.
 * 
 * The alt extension will be `.cjs` if `opts.type === 'module'`,
 * or `.mjs` otherwise. Basically it's the inverse of the default type.
 * 
 * @param {string} [opts.ext='.js'] The primary file extension.
 * 
 * The default extension used when looking for entry source files.
 * Not used if the entry was set to the `opts.alt` value, or the
 * entry value was an object with an explicit `import` property.
 * 
 * @param {(number|string)} [opts.one=1] Value for a single-package import.
 * 
 * If an entry is set to this special value, then the entry key is assumed
 * to be the name of a single package that will be imported as the entry.
 * 
 * @param {string} [opts.path='./src/entry'] Base folder for entry files.
 * 
 * When adding an implicit `import` statement to an entry, this is the
 * base folder that the entry file will be assumed to be in.
 * The default, `'./src/entry'`, is simply where I put my entry files.
 * 
 * @param {('commonjs'|'module')} [opts.type] The default type of module.
 * 
 * If this is not explicitly specified, the function will use loadFile()
 * to check for a `type` property in the `project.json` file. If it wasn't
 * set there either, the fallback is `'commonjs'` since that is what Node.js
 * uses if you don't set a type property.
 * 
 * @param {object} spec - Entry spec.
 * 
 * Each `key` in the spec is the name of a Webpack entry point,
 * and the value it is set to will determine the entry value
 * that will be used.
 * 
 * - If set to an object, that object will be the entry value.
 * - If set to `opts.one`, the entry value will be:  
 *   `{ import: value }`;
 * - If set to `opts.alt`, the entry value will be:
 *   `{ import: path.join(opts.path, key+altExt) };
 * - If set to any other string, or an Array of strings:
 *   `{ dependOn: value }`
 * - If set to any other number, or an unsupported value,
 *   an empty object will be used.
 * 
 * Any entry values that don't have an `import` property assigned
 * using one of the above rules, will have an implicit one added
 * using: `path.join(opts.path, key+opts.ext)` as the import path.
 * 
 * @returns {object} Actual `entry` definitions as used by Webpack.
 * 
 * See the `docs/examples/entrify.js` file for an example of this
 * function in use, and the value it would generate.
 */
export function entrify(...args) {
  let opts, spec;

  if (args.length === 0) {
    throw new RangeError('no arguments passed');
  }

  if (args.length === 1) {
    opts = cp({}, DEF_ENTRY);
    spec = args[0];
  }
  else if (args.length === 2) {
    opts = cp({}, DEF_ENTRY, args[0]);
    spec = args[1];
  }

  if (!isObj(spec)) {
    throw new TypeError('invalid entry spec');
  }

  if (typeof opts.type !== 'string') {
    // The type wasn't specified, get it from the package info.
    let pinfo = loadFile();
    opts.type = pinfo?.type ?? DEF_TYPE;
  }

  let altExt = (opts.type === 'module') ? '.cjs' : '.mjs';
  let ents = {};

  for (const ename in spec)
  {
    let ent = spec[ename];
    let ext = opts.ext;

    if (ent === opts.one) { 
      // A single npm library that uses its own name.
      ent = {import: ename};
    }
    else if (ent === opts.alt) { 
      // A file using the non-default module type.
      ext = altExt;
    }
    else if (typeof ent === 'string' || Array.isArray(ent)) { 
      // One or more dependencies
      ent = {dependOn: ent};
    }

    if (!isObj(ent))
    {
      ent = {};
    }

    if (!ent.import)
    { // default import
      ent.import = path.join(cwd, opts.path, ename+ext); 
    }

    ents[ename] = ent;
  }

  return ents;  
}

dps(entrify, {
  defaults: { value: DEF_ENTRY },
});
