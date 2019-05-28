let gulp = require('gulp'),
    browserify = require('browserify'),
    source = require('vinyl-source-stream'),
    _ = require('lodash'),
    cleanCSS = require('gulp-clean-css'),
    imagemin = require('gulp-imagemin'),
    autoprefixer = require('gulp-autoprefixer');

gulp.task('default', ['views', 'css', 'all-images', 'bundle'], function () {
    gulp.watch(['app/css/import/*.css', 'app/js/*.js', 'app/js/**/*.js'], ['bundle']);
    gulp.watch(['app/*.html', 'app/views/*.html', 'app/views/modals/*.html'], ['views']);
    gulp.watch(['app/css/created/*.css'], ['css']);
    //gulp.watch(['app/images/*.*', 'app/images/*/*.*'], ['all-images']);
    gulp.watch(['app/images/*.*'], ['all-images']);
});

gulp.task('bundle', function () {
    return browserify('app/js/main.js')
        .transform(require('browserify-css'), {
            processRelativeUrl: function(relativeUrl) {
                let stripQueryStringAndHashFromPath = function(url) {
                    return url.split('?')[0].split('#')[0];
                };
                let relativePath = stripQueryStringAndHashFromPath(relativeUrl);
                let queryStringAndHash = relativeUrl.substring(relativePath.length);
                let prefix = '..\\..\\..\\..\\node_modules\\bootstrap\\dist';
                if (_.startsWith(relativePath, prefix)) {
                    let vendorPath = relativePath.substring(prefix.length);
                    return vendorPath + queryStringAndHash;
                }
                else{
                    console.log(relativeUrl);
                }

                return relativeUrl;
            },
            minify: true
        })
        .bundle()
        .pipe(source('bundle.js'))
        .pipe(gulp.dest('dist/js'))
});
gulp.task('views', function() {
    gulp.src('app/index.html')
        .pipe(gulp.dest('dist/'));

    gulp.src('app/views/*.html')
        .pipe(gulp.dest('dist/views/'));

    gulp.src('app/views/modals/*.html')
        .pipe(gulp.dest('dist/views/modals/'));
});
gulp.task('fonts', function() {
    return gulp.src('node_modules/font-awesome/fonts/*')
        .pipe(gulp.dest('dist/fonts/'))
});
gulp.task('css', function () {
    return gulp.src('app/css/created/*.css')
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false}))
        .pipe(cleanCSS())
        .pipe(gulp.dest('dist/css/'));
});

//gulp.task('all-images', ['images', 'images-credit-cards', 'images-food', 'images-restaurant', 'images-reviews', 'images-social-media']);
gulp.task('all-images', ['images']);

gulp.task('images', function() {
    return gulp.src('app/images/*.*')
        //.pipe(imagemin())
        .pipe(gulp.dest('dist/images/'));
});
