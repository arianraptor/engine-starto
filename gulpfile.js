var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var post = require('postcss-load-plugins')();
var browser = require('browser-sync');
var rimraf = require('rimraf');
var autoprefixer = require('autoprefixer');
var cssnano = require('cssnano');
var stylefmt = require('stylefmt');
var panini = require('panini');
var yargs = require('yargs');

var PRODUCTION = !!(yargs.argv.production);

gulp.task('clean', function (done) {
  rimraf('dist', done);
});

gulp.task('pages', function () {
  return gulp.src('src/pages/**/*.html')
  .pipe(panini({
    root: 'src/pages',
    layouts: 'src/layouts',
    partials: 'src/partials',
    helpers: 'src/helpers'
  }))
  .pipe(gulp.dest('dist'));
});

gulp.task('server', function (done) {
  browser.init({
    injectChanges: true,
    server: 'dist',
    open: false,
    domain: 'http://localhost:3000',
    ghostMode: {
      clicks: false,
      forms: false,
      scroll: false
    }
  });
  done();
});

gulp.task('css', function () {
  var CONFIG = [
    post.neat({
      'neatMaxWidth': '65em'
    }),
    post.clearfix,
    post.import,
    post.nested,
    post.simpleVars,
    post.mediaMinmax,
    post.discardComments,
    post.easysprites({
      imagePath: './src/assets/img',
      spritePath: './dist/img',
      stylesheetPath: './dist/css'
    })
  ];

  return gulp.src('src/assets/css/app.css')
  .pipe($.if(!PRODUCTION, $.sourcemaps.init()))
  .pipe($.postcss(CONFIG))
  .pipe($.postcss([post.colorFunction]))
  .pipe($.postcss([autoprefixer]))
  .pipe($.if(!PRODUCTION, $.postcss([stylefmt])))
  .pipe($.if(PRODUCTION, $.postcss([cssnano])))
  .pipe($.if(!PRODUCTION, $.sourcemaps.write()))
  .pipe(gulp.dest('dist/css'));
});

gulp.task('js', function () {
  return gulp.src('src/assets/scripts/**/*.js')
  .pipe(gulp.dest('dist/scripts'));
});

gulp.task('resetPages', function (done) {
  panini.refresh();
  done();
});

gulp.task('images', function () {
  return gulp.src('src/assets/img/**/*')
  .pipe($.if(PRODUCTION, $.imagemin()))
  .pipe(gulp.dest('./dist/img'));
});

gulp.task('watch', function () {
  gulp.watch('src/pages/**/*.html').on('change', gulp.series('pages', browser.reload));
  gulp.watch(['src/layouts/**/*', 'src/partials/**/*']).on('change', gulp.series('resetPages', 'pages', browser.reload));
  gulp.watch(['../css/**/*.css', 'src/assets/css/**/*.css']).on('change', gulp.series('resetPages', 'css', 'pages', browser.reload));
  gulp.watch(['../scripts/**/*.js', 'src/assets/scripts/**/*.js']).on('change', gulp.series('resetPages', 'js', 'pages', browser.reload));
  gulp.watch(['../img/**/*', 'src/assets/img/**/*']).on('change', gulp.series('images', browser.reload));
});

gulp.task('default', gulp.series('clean', 'pages', 'images', 'css', 'js', 'server', 'watch'));
