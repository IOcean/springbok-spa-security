'use-strict';

const gulp = require('gulp'),
    del = require('del'),
    vinylPaths = require('vinyl-paths'),
    gutil = require('gulp-util'),
    plumber = require('gulp-plumber'),
    babel = require('gulp-babel'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    eslint = require('gulp-eslint'),
    Server = require('karma').Server;
    
function handleError(err) {
    gutil.log(err.toString());
    this.emit('end');
}

gulp.task('clean', function() {
    return gulp.src('dist')
        .pipe(vinylPaths(del));
});

gulp.task('process', function() {
    return gulp.src('app/**/*.js')
        .pipe(plumber())
        .pipe(babel())
        .pipe(concat('springbok-spa-security.js'))
        .pipe(gulp.dest('dist'));
});

gulp.task('process-min', function() {
    return gulp.src('app/**/*.js')
        .pipe(plumber())
        .pipe(babel())
        .pipe(concat('springbok-spa-security.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist'));
});

gulp.task('lint', function(done) {
    return gulp.src('app/**/*.js')
        .pipe(eslint({envs: ['browser', 'es6']}))
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('unit', function(done) {
    new Server({
            configFile: __dirname + '/karma.conf.js',
            singleRun: true
        }, done).start();
});

gulp.task('default', ['test', 'build']);

gulp.task('build', ['clean', 'process', 'process-min']);

gulp.task('test', ['lint', 'unit']);