const gulp = require('gulp');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const rename = require('gulp-rename');
const cleanCSS = require('gulp-clean-css');
let imageResize = require('gulp-image-resize');
const clean = require('gulp-clean');
const imagemin = require('gulp-imagemin');
const composer = require('gulp-uglify/composer');

const imageminWebp = require('imagemin-webp');
const runSequence = require('run-sequence');
const del = require('del');
const es = require('event-stream');
const uglifyes = require('uglify-es');
const uglify = composer(uglifyes, console);
const browserSync = require('browser-sync');
const sourcemaps = require('gulp-sourcemaps');
const util = require('gulp-util');

const htmlmin = require('gulp-htmlmin');

const config = {
    //assetsDir: 'app/Resources/assets',
    //sassPattern: 'sass/**/*.scss',
    production: true
};

//https://andy-carter.com/blog/a-beginners-guide-to-the-task-runner-gulp
const paths = {
    assets_root: {
        src: ['app/manifest.json', 'app/robots.txt',],
        dest: './public'
    },
    html_files: {
        src: 'app/**/*.html',
        dest: './public'
    },
    placeholder: {
        src: 'app/placeholder/',
        filename: 'placeholder.md'
    },
    images_static: {
        src: 'app/images_src/static/*',
        dest: 'public/img/'
    },
    images: {
        src: ['app/images_src/**/*.{jpg,png,tiff, svg}', '!app/images_src/icons/**/*', '!app/images_src/static/**/*'],
        dest: 'public/img/'
    },
    icons: {
        src: 'app/images_src/icons/*',
        dest: 'public/img/icons/'
    },
    styles_app: {
        src: 'app/css/**/*.css',
        dest: 'public/css/'
    },
    scripts_sw: {
        src: ['app/sw.js'],
        saveas: 'sw.js',
        dest: 'public/',
        sourcemaps: ''
    },
    scripts_app: {
        src: ['app/js/**/*.js', '!./app/js/index.js', '!app/js/restaurant.js'],
        saveas: 'main.min.js',
        dest: 'public/js/',
        sourcemaps: ''
    },
    scripts_index: {
        src: ['app/js/index.js'],
        saveas: 'index.min.js',
        dest: 'public/js/',
        sourcemaps: ''
    },
    scripts_restaurant: {
        src: ['./app/js/restaurant.js'],
        saveas: 'restaurant.min.js',
        dest: 'public/js/',
        sourcemaps: ''
    },
    scripts_dbhelper: {
        src: ['app/lib/dbhelper.js'],
        saveas: 'dbhelper.min.js',
        dest: 'public/js/',
        sourcemaps: ''
    },
    scripts_lib: {
        src: ['node_modules/idb/lib/idb.js', 'node_modules/@fortawesome/fontawesome-free/js/regular.js', 'node_modules/@fortawesome/fontawesome-free/js/fontawesome.js'],
        dest: 'public/js/'
    }
};

// create browser sync object
browserSync.create();

/* Not all tasks need to use streams, a gulpfile is just another node program
 * and you can use all packages available on npm, but it must return either a
 * Promise, a Stream or take a callback and call it
 */
function clean_build() {
    // You can use multiple globbing patterns as you would with `gulp.src`,
    // for example if you are using del 2.0 or above, return its promise
    return del(['public/**/*']);
}

function copy_assets() {

    return es.merge(
        // create folder structure with placeholders folder
        gulp.src([paths.placeholder.src + paths.placeholder.filename])
            .pipe(gulp.dest(paths.scripts_index.dest))
            .pipe(clean()),
        gulp.src([paths.placeholder.src + paths.placeholder.filename])
            .pipe(gulp.dest(paths.styles_app.dest))
            .pipe(clean()),

        gulp.src(paths.assets_root.src)
            .pipe(gulp.dest(paths.assets_root.dest)),

        gulp.src(paths.images.src)
            .pipe(gulp.dest(paths.images.dest)),

        gulp.src(paths.icons.src)
            .pipe(gulp.dest(paths.icons.dest)),

        gulp.src(paths.images_static.src)
            .pipe(gulp.dest(paths.images_static.dest)),

        gulp.src(paths.scripts_lib.src)
            .pipe(config.production ? util.noop() : sourcemaps.init())
            .pipe(config.production ? uglify() : util.noop())
            .pipe(config.production ? util.noop() : sourcemaps.write(paths.scripts_lib.sourcemaps))
            .pipe(gulp.dest(paths.scripts_lib.dest))
    );
}

function copy_html() {

    return gulp.src(paths.html_files.src)
        .pipe(htmlmin({
          collapseWhitespace: config.production,
          removeComments: config.production
        }))
        .pipe(gulp.dest(paths.html_files.dest));
}

/*
 * Define our tasks using plain functions
 */
function styles_app() {
    return gulp.src(paths.styles_app.src)
    //.pipe(less())
        .pipe(cleanCSS())
        .pipe(cleanCSS({debug: false}, (details) => {
            console.log(`${details.name}: ${details.stats.originalSize}`);
            console.log(`${details.name}: ${details.stats.minifiedSize}`);
        }))
        //pass in options to the stream
        .pipe(rename({
            basename: 'main',
            suffix: '.min'
        }))
        .pipe(gulp.dest(paths.styles_app.dest));
}

function scripts_app() {

    gulp.src(paths.scripts_app.src)
        .pipe(babel())
        .pipe(concat(paths.scripts_app.saveas))
        .pipe(config.production ? util.noop() : sourcemaps.init())
        .pipe(config.production ? uglify() : util.noop())
            .pipe(config.production ? util.noop() : sourcemaps.write(paths.scripts_app.sourcemaps))
        .pipe(gulp.dest(paths.scripts_app.dest));
}

function scripts_index() {

    gulp.src(paths.scripts_index.src)
        .pipe(babel())
        .pipe(concat(paths.scripts_index.saveas))
        .pipe(config.production ? util.noop() : sourcemaps.init())
        .pipe(config.production ? uglify() : util.noop())
            .pipe(config.production ? util.noop() : sourcemaps.write(paths.scripts_index.sourcemaps))
        .pipe(gulp.dest(paths.scripts_index.dest));
}

function scripts_restaurant() {

    return gulp.src(paths.scripts_restaurant.src)
        .pipe(babel())
        .pipe(concat(paths.scripts_restaurant.saveas))
        .pipe(config.production ? util.noop() : sourcemaps.init())
        .pipe(config.production ? uglify() : util.noop())
            .pipe(config.production ? util.noop() : sourcemaps.write(paths.scripts_restaurant.sourcemaps))
        .pipe(gulp.dest(paths.scripts_restaurant.dest));

}

function scripts_dbhelper() {

    return gulp.src(paths.scripts_dbhelper.src)
        .pipe(babel())
        .pipe(concat(paths.scripts_dbhelper.saveas))
        .pipe(config.production ? util.noop() : sourcemaps.init())
        .pipe(config.production ? uglify() : util.noop())
            .pipe(config.production ? util.noop() : sourcemaps.write(paths.scripts_dbhelper.sourcemaps))
        .pipe(gulp.dest(paths.scripts_dbhelper.dest));
}

function scripts_sw() {

    return gulp.src(paths.scripts_sw.src)
        .pipe(babel())
        .pipe(concat(paths.scripts_sw.saveas))
        .pipe(config.production ? util.noop() : sourcemaps.init())
        .pipe(config.production ? uglify() : util.noop())
            .pipe(config.production ? util.noop() : sourcemaps.write(paths.scripts_sw.sourcemaps))
        .pipe(gulp.dest(paths.scripts_sw.dest));
}

function watch() {
    gulp.watch(paths.html_files.src, copy_html);
    gulp.watch(paths.styles_app.src, styles_app);
    gulp.watch(paths.scripts_sw.src, scripts_sw);
    gulp.watch(paths.scripts_app.src, scripts_app);
    gulp.watch(paths.scripts_index.src, scripts_index);
    gulp.watch(paths.scripts_restaurant.src, scripts_restaurant);
    gulp.watch(paths.scripts_dbhelper.src, scripts_dbhelper);

    return true;
}

/*
 * You can use CommonJS `exports` module notation to declare tasks
 */
exports.clean_build = clean_build;
// exports.placeholder = placeholder;
// exports.clean_placeholder = clean_placeholder;
exports.copy_html = copy_html;
// exports.copy_manifest = copy_manifest;
exports.copy_assets = copy_assets;
// exports.copy_images = copy_images;
// exports.copy_icons = copy_icons;
// exports.copy_service_worker = copy_service_worker;
exports.styles_app = styles_app;
exports.scripts_app = scripts_app;
exports.scripts_sw = scripts_sw;
exports.scripts_index = scripts_index;
exports.scripts_restaurant = scripts_restaurant;
exports.scripts_dbhelper = scripts_dbhelper;
exports.watch = watch;


// Create multiple resolution based images
// https://stackoverflow.com/questions/35801807/gulp-image-resize-to-generate-multiple-output-sizes
let resizeImageTasks = [];
//[100, 300, 800, 1000, 2000]
[320, 640, 1024, 1600].forEach(function (size) {
    let resizeImageTask = 'resize_' + size;
    gulp.task(resizeImageTask, function () {
        return gulp.src(paths.images.src)
            .pipe(imageResize({
                width: size,
                height: size,
                upscale: false
            }))
            .pipe(imagemin([
                imageminWebp({
                    quality: 75
                })]))
            .pipe(gulp.dest(paths.images.dest + size + '/'))
        //.pipe(gulp.dest(paths.images.dest))
    });
    resizeImageTasks.push(resizeImageTask);
});
gulp.task('resize_images', resizeImageTasks);

/*
 * Specify if tasks run in series or parallel using `gulp.series` and `gulp.parallel`
 */
//let build = gulp.series(clean_build, gulp.parallel(styles, scripts));

gulp.task('clean_build', function () {
    return clean_build();
});
gulp.task('copy_html', function () {
    return copy_html();
});
gulp.task('copy_assets', function () {
    return copy_assets();
});
gulp.task('styles_app', function () {
    return styles_app();
});
gulp.task('scripts_app', function () {
    return scripts_app();
});
gulp.task('scripts_index', function () {
    return scripts_index();
});
gulp.task('scripts_sw', function () {
    return scripts_sw();
});
gulp.task('scripts_restaurant', function () {
    return scripts_restaurant();
});
gulp.task('scripts_dbhelper', function () {
    return scripts_dbhelper();
});
gulp.task('watch', ['browserSync'], function () {
    return watch();
});

/*
* Specify if tasks run in series or parallel using `gulp.series` and `gulp.parallel`
*/
gulp.task('serve', ['browserSync'], function () {
    return true;
});

// https://css-tricks.com/gulp-for-beginners/
gulp.task('browserSync', function () {
    browserSync.init({
        server: {
            baseDir: 'public'
        },
    })
});

/*
 * Define default task that can be called by just running `gulp` from cli
 */
// gulp.task('default', build);
gulp.task('default', (function () {
    runSequence(
        'clean_build',
        ['copy_assets', 'copy_html'],
        ['styles_app', 'scripts_sw', 'scripts_dbhelper', 'scripts_app', 'scripts_index', 'scripts_restaurant'],
        'resize_images',
    );
}));
