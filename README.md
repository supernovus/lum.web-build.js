# lum.web-build.js

A collection of snippets, helper functions, and extras for making building
and bundling web apps. It's designed primarily for my own projects, and as
such is not trying to be a "one size fits all" solution.

## What, Why, & How

A long time ago I made [@lumjs/webpack-helper] to try to make common build
tasks with webpack easier. Prior to that I made [@lumjs/gulp-helper] to do
the same with Gulp. Those libraries were overly complex, yet not flexible
enough to actually be useful in many cases. So I retired them.

Unlike those packages, this package is simply a collection of bits and pieces
that can be used separately, or together in whatever way works best for each
individual project.

It does include a bunch of Webpack and PostCSS dependencies that I use a lot,
simply so I can have one quick `devDependencies` entry that pulls in all
the usual components I use for bundling. Eventually it may also pull in the
TypeScript compiler if/when I get around to trying that out.

## Official URLs

This library can be found in two places:

 * [Github](https://github.com/supernovus/lum.web-build.js)
 * [NPM](https://www.npmjs.com/package/@lumjs/web-build)

## Author

Timothy Totten <2010@totten.ca>

## License

[MIT](https://spdx.org/licenses/MIT.html)

[@lumjs/gulp-helper]: https://github.com/supernovus/lum.gulp-helper.js
[@lumjs/webpack-helper]: https://github.com/supernovus/lum.webpack-helper.js

