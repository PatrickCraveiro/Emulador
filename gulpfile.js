const gulp = require("gulp");
const clean = require("gulp-clean");
const concat = require("gulp-concat");
const sass = require("gulp-sass")(require("sass"));
// const scan = require("gulp-scan");
// const terser = require("gulp-terser");

// CSS build

function buildCss() {
  let arrayFiles = [
    `src/style/**/*.scss`,
    //   `css/${type}/_scss/funcoes/*.scss`,
    //   `css/${type}/_scss/**/*.scss`,
  ];

  let stream = gulp
    .src(arrayFiles)
    .pipe(concat(`emulador.min.css`))
    .pipe(sass());

  return stream.pipe(gulp.dest("dist"));
}
// function buildStaticCss() {
//   return buildCss("static");
// }
// function buildDynamicCss() {
//   return buildCss("dynamic");
// }

// function cleanDist() {
//   return gulp
//     .src(["build", "dist"], {
//       allowEmpty: true,
//     })
//     .pipe(
//       clean({
//         read: false,
//       })
//     );
// }

gulp.task(
  "bundle",
  gulp.series(buildCss)
  //   gulp.series(
  //     gulp.parallel(
  //       // Dynamic CSS (downloaded from server)
  //       buildDynamicCss,
  //       // Static CSS (bundled with app)
  //       buildStaticCss,
  //       // JS source
  //       gulp.series(
  //         gulp.parallel(
  //           // Dynamic JS (downloaded from server)
  //           'buildDynamicJs',
  //           // Static JS (bundled with app)
  //           buildStaticJs
  //         ),
  //         // Check module count
  //         checkModuleCount
  //       ),
  //       // Electron Main.js
  //       buildMainJs,
  //       // Main page HTML (downloaded from server)
  //       buildDynamicHtmlMainPage,
  //       ...pagesComponents
  //     )
  //   )
  // )
);
