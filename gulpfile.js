var gulp = require('gulp');
var sass = require('gulp-sass');
var browserSync = require('browser-sync');
var concat = require('gulp-concat');
var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');
var plumber = require('gulp-plumber');
var sourcemaps = require('gulp-sourcemaps');
var path = require('path');
var gutil = require('gulp-util');
var ftp = require('vinyl-ftp');
var uglify = require('gulp-uglify');
var svgmin = require('gulp-svgmin');
var inject = require('gulp-inject');
var svgstore = require('gulp-svgstore');
var notify = require('gulp-notify');


var gulpftp = require('./ftp-config.js');


gulp.task('svgstore', function () {
    var svgs = gulp
        .src('/src/images/svg/*.svg')
        .pipe(svgmin(function (file) {
            var prefix = path.basename(file.relative, path.extname(file.relative));
            return {
                plugins: [{
                    cleanupIDs: {
                        prefix: prefix + '-',
                        minify: true
                    }
                }]
            }
        }))
        .pipe(svgstore({ inlineSvg: true }));

    function fileContents(filePath, file) {
        return file.contents.toString();
    }

    return gulp
        .src('*.html')
        .pipe(inject(svgs, { transform: fileContents }))
        .pipe(gulp.dest('./theme'));

});


gulp.task('sass', function () {
    gulp.src('./src/sass/**/*')
        .pipe(sourcemaps.init())
        .pipe(plumber())
        .pipe(sass({ outputStyle: 'compressed' }))
        .pipe(concat('style.css'))
        .pipe(sourcemaps.write('../../../src/sass/maps'))
        .pipe(gulp.dest('./theme/'))
        .pipe(notify({ message: 'Finished minifying Styles' }));
});


var conn = ftp.create({
    host: gulpftp.config.host,
    user: gulpftp.config.user,
    password: gulpftp.config.pass,
    parallel: 8,
    log: gutil.log
});

/* list all files you wish to ftp in the glob variable */
var globs = [
    './theme/**/*',
    './theme/**',
    './theme/*'
];
var remoteLocation = 'public_html/' + gulpftp.config.subdirectory +'/wp-content/themes/' + gulpftp.config.theme_name;

// using base = '.' will transfer everything to /public_html correctly
// turn off buffering in gulp.src for best performance

gulp.task('deploy-dev', function () {
    console.log(gulpftp);
    return gulp.src(globs, { base: './theme', buffer: false })
        .pipe(conn.newer(remoteLocation)) // only upload newer files
        .pipe(conn.dest(remoteLocation))
        .pipe(notify("Dev site updated"));
});

gulp.task('deploy-watch', function () {
    console.log(gulpftp);
    gulp.watch(globs).on('change', function (event) {
        console.log('Changes detected! Uploading file "' + event.path + '", ' + event.type);
        return gulp.src([event.path], { base: './theme', buffer: false })
            .pipe(conn.newer(remoteLocation)) // only upload newer files
            .pipe(conn.dest(remoteLocation))
            .pipe(notify("Dev site updated on fly"));
    });
});



gulp.task('browser-sync', () => {
    browserSync.init({
        server: './theme/',
        port: 7777,
        open: false,
        socket: {
            domain: 'localhost:7777'
        }
    });
    gulp.watch(globs).on('change', browserSync.reload);
});



gulp.task('imagemin', function () {
    return gulp.src(['./src/images/**', '!images/{optimized,optimized/**}'])
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{ removeViewBox: false }],
            use: [pngquant(
                {
                    quality: '65-80', 
                    speed: 4
                }
            )]
        }))
        .pipe(gulp.dest('./theme/assets/images/'));
});

var jsFiles = [
    "./node_modules/jquery/dist/jquery.min.js",
    "./src/js/app.js"
];

gulp.task('minifyJs', function () {
    return gulp.src(jsFiles) //select all javascript files under js/ and any subdirectory
        .pipe(sourcemaps.init())
        .pipe(concat('app.min.js')) //the name of the resulting file
        .pipe(uglify())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./theme/assets/js/')) //the destination folder
        .pipe(notify({ message: 'Finished minifying app JavaScript' }));
});



gulp.task('default', ['browser-sync'], function () {
    gulp.watch("./src/sass/**/*", ['sass']);
    gulp.watch(["./src/js/*", "!js/production.min.js", "!js/production.min.js.map"], ['minifyJs']); // minify JS when JS changes
    gulp.watch(["./src/images/*", '!images/{optimized,optimized/**}'], ['imagemin']); // optimize images when images change
});