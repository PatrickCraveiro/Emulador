const gulp = require("gulp");
const clean = require("gulp-clean");
const concat = require("gulp-concat");
const sass = require("gulp-sass")(require("sass"));

function buildCss() {
  let arrayFiles = [`src/style/**/*.scss`];

  let stream = gulp
    .src(arrayFiles)
    .pipe(concat(`emulador.min.css`))
    .pipe(sass());

  return stream.pipe(gulp.dest("dist"));
}

function cleanDist() {
  return gulp
    .src(["dist"], {
      allowEmpty: true,
    })
    .pipe(
      clean({
        read: false,
      })
    );
}

gulp.task(
  "bundle",
  gulp.series(cleanDist, gulp.series(gulp.parallel(buildCss)))
);
