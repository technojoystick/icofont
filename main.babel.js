// Main gulp components
import fs from 'fs';
import path from 'path';
import gulp from 'gulp';
import glob from 'glob';
import _ from 'lodash';
import merge2 from 'merge2';
import run from 'gulp-run';
import rimraf from 'rimraf';
import runSequence from 'run-sequence';

// const argv = yargs.argv;
const $ = require('gulp-load-plugins')();


var pathTo = {
  pug: {
    src: 'src/components/**/*.pug',
    dest: '../local/templates/idws/build/pug',
  },
};

gulp.task('iconfont', function () {
  let stream = merge2();

  let pathToFonts = path.join(__dirname, 'src', 'globals', 'icons');
  if (fs.existsSync(pathToFonts)) {
    let fontDirs = getDirectories(pathToFonts);
    for (let k = 0; k < fontDirs.length; k++) {
      stream.add(
        gulp.src([path.relative(__dirname, fontDirs[k].path).replace('\\', '/') + '/*.svg'])
          .pipe($.plumber())
          .pipe($.iconfontCss({
            fontName: fontDirs[k].name,
            path: 'src/devdep/gulp/_icons.scss',
            targetPath: './stylesheet.scss',
            cssClass: fontDirs[k].name,
            fontPath: './',
          }))
          .pipe($.iconfont({
            fontName: fontDirs[k].name,
            formats: ['ttf', 'woff', 'woff2'],
            descent: fontDirs[k].settings.descent !== 'default' ? fontDirs[k].settings.descent : 0,
            fixedWidth: fontDirs[k].settings.monospaced,
          }))
          .pipe($.if('stylesheet.scss', $.splitFiles()))
          .pipe(gulp.dest(path.join(__dirname, 'src', 'globals', 'fonts', 'icons', fontDirs[k].name.replace('icon-', ''))))
      );
    }

    stream.on('finish', function () {
      let icons = {};
      for (let i = 0; i < fontDirs.length; i++) {
        let name = fontDirs[i].name.replace('icon-', '');
        _.map(glob.sync('*.svg', {
          cwd: fontDirs[i].path,
        }), function (icon) {
          icon = icon.replace('.svg', '');
          if (!icons.hasOwnProperty(name))
            icons[name] = {};
          icons[name][icon] = 'icon-' + name + '-' + icon;
        });
      }
      fs.writeFileSync(path.join(__dirname, 'src', 'globals', 'fonts', 'icons', 'icons.json'),
        JSON.stringify(icons, null, 2));
    });
  }

  return stream;

  function getDirectories(srcpath) {
    return fs.readdirSync(srcpath).filter(function (file) {
      return fs.statSync(path.join(srcpath, file)).isDirectory() && fs.readdirSync(path.join(srcpath, file)).length > 0;
    }).map(function (file) {
      return {
        name: 'icon-' + file,
        path: path.join(srcpath, file),
        settings: fs.existsSync(path.join(srcpath, file, '_settings.json')) ?
          require(path.join(srcpath, file, '_settings.json')) : {
            'descent': 'default',
            'monospaced': false,
          },
      };
    });
  }
});


/*
 *
 * ===== Build scripts =====
 *
 * */

// DEv and masterpages masterpages
gulp.task('build-server', (callback) => {
  runSequence('build-server-dev', '_build-server-webpack-masterpages', callback);
});
// Only dev
gulp.task('build-server-dev', (callback) => {
  runSequence('clean:pug', '_build-server-pug', '_build-server-webpack-dev', callback);
});


// Webpack tasks
gulp.task('_build-server-webpack-dev', function () {
  return run('npm run build-server-dev').exec();
});

gulp.task('_build-server-webpack-masterpages', function () {
  return run('npm run build-server-masterpages').exec();
});


// Copy pug
gulp.task('_build-server-pug', function () {
  return gulp.src(pathTo.pug.src)
    .pipe(gulp.dest(pathTo.pug.dest));
});


// Clean pug
gulp.task('clean:pug', function (cb) {
  rimraf(pathTo.pug.dest, cb);
});


// gulp.task('webpack-build-server', () => {
//   run('npm run build').exec('whatever', )
//     .pipe(console.warn);
// });
