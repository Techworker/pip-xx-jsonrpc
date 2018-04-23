const gulp = require('gulp'),
    watch = require('gulp-watch'),
    glob = require('glob'),
    fs = require('fs'),
    ajv = new (require('ajv'))(),
    colors = require('colors');


gulp.task('default', function () {

    // watch the requests folder
    return watch('requests/**/*.json', { ignoreInitial: false }, function (path) {
        console.log('');
        console.log(' NEW BUILD');
        console.log('-------------------------------');
        let schema, validate;
        try {
            schema = JSON.parse(fs.readFileSync('requests/requests.json'));
            validate = ajv.compile(schema);
            log('schema://requests/requests.json'.bgCyan, 'valid', TYPE_SUCCESS);
        } catch(e) {
            log('schema://requests/requests.json', e.message, TYPE_ERROR);
            return;
        }

        // fetch all files
        const files = glob.sync('requests/**/*.json');
        for (let f = 0; f < files.length; f++) {
            try {
                if (files[f] !== 'requests/requests.json') {
                    let contents = JSON.parse(fs.readFileSync(files[f]));
                    let valid = validate(contents);
                    if (!valid) {
                        log(files[f], ajv.errorsText(validate.errors, { separator: "\n"}), TYPE_ERROR);
                    } else {
                        log(files[f], 'valid', TYPE_SUCCESS);

                    }
                }
            }
            catch (e) {
                log(files[f], e.message, TYPE_ERROR);
            }
        }
    });
});

const TYPE_SUCCESS = 's';
const TYPE_ERROR = 'e';
function log(file, message, type) {
    if(type === TYPE_SUCCESS) {
        console.log(`✓`.green.bold + ` [${file.bold}]`.yellow + ` ${message}`);
    }
    else if(type === TYPE_ERROR) {
        console.log(`✕`.red.bold + ` [${file.bold}]`.yellow);
        console.log(message.red);
    }
}