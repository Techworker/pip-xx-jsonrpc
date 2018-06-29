const gulp = require('gulp'),
    watch = require('gulp-watch'),
    glob = require('glob'),
    fs = require('fs'),
    Ajv = require('ajv'),
    colors = require('colors'),
    markdown = require('gulp-markdown'),
    hljs = require('highlight.js'),
    rename = require('gulp-rename'),
    wrapper = require('gulp-wrapper'),
    toc = require('gulp-markdown-toc');

gulp.task('default', function () {
    check();
    pip();
    // watch the requests folder
    watch(['schema/**/*.json', 'examples/**/*.json'], { ignoreInitial: true }, function() {
        check();
        pip();
    });
    return watch(['PIP-XX.md'], { ignoreInitial: true }, pip);
});

function check()
{
    console.log('');
    console.log(' NEW BUILD');
    console.log('-------------------------------');

    const exampleRequestFiles = glob.sync('examples/requests/**/*.json');
    validateFiles(exampleRequestFiles, 'request');
    const exampleResponseFiles = glob.sync('examples/responses/**/*.json');
    validateFiles(exampleResponseFiles, 'response');
    const exampleTypesFiles = glob.sync('examples/objects/**/*.json');
    validateFiles(exampleTypesFiles, 'type');
}

function validateFiles(files, type)
{
    for (let f = 0; f < files.length; f++)
    {
        let exampleJson = JSON.parse(fs.readFileSync(files[f]));

        let schemas = [];
        schemas.push(JSON.parse(fs.readFileSync('schema/types.json')));

        const objFiles = glob.sync('schema/objects/**/*.json');
        console.log(" - " + files[f]);
        for (let n = 0; n < objFiles.length; n++) {
            console.log(" - " + objFiles[n]);
            if(files[f].replace('examples/', 'schema/') !== objFiles[n]) {
                schemas.push(JSON.parse(fs.readFileSync(objFiles[n])));
            }
        }

        if(type === 'request') {
            schemas.push(JSON.parse(fs.readFileSync('schema/requests/rpc-request.json')));
        } else if(type === 'response') {
            schemas.push(JSON.parse(fs.readFileSync('schema/responses/rpc-response.json')));
        }

        // find and load request schema
        schemas.push(JSON.parse(fs.readFileSync(files[f].replace('examples/', 'schema/'))));

        let ajv;
        try {
            ajv = new Ajv({schemas, removeAdditional: false});
            //log('Schemas'.bgCyan, 'loaded', TYPE_SUCCESS);
        } catch(e) {
            log(e.message, e.message, TYPE_ERROR);
            return;
        }

        let validate = ajv.getSchema('http://www.pascalcoin.org/schemas/' + files[f].replace('examples/', ''));
        /*let valid = validate(exampleJson);

        if (!valid) {
            log(files[f], ajv.errorsText(validate.errors, { separator: "\n"}), TYPE_ERROR);
        } else {
            log(files[f], 'valid', TYPE_SUCCESS);
        }*/
    }
}

const TYPE_SUCCESS = 's';
const TYPE_ERROR = 'e';
function log(file, message, type) {
    if(type === TYPE_SUCCESS) {
        console.log((new Date).toLocaleTimeString() + ` ✓`.green.bold + ` [${file.bold}]`.yellow + ` ${message}`);
    }
    else if(type === TYPE_ERROR) {
        console.log((new Date).toLocaleTimeString() +` ✕`.red.bold + ` [${file.bold}]`.yellow);
        console.log(message.red);
    }
}

function pip()
{
    let contents = fs.readFileSync('PIP-XX.md').toString();
    console.log("building PIP");
    const regex = /\[signature=(.*)\]/gm;
    let m;

    while ((m = regex.exec(contents)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }

        // The result can be accessed through the `m`-variable.
        let md = '';

        m.forEach((match, groupIndex) => {

            if(groupIndex === 1) {

                //console.log('Sig: ' + match);
                let request = JSON.parse(fs.readFileSync('schema/requests/' + match + '.json'));
                let response = JSON.parse(fs.readFileSync('schema/responses/' + match + '.json'));
                let exRequest = JSON.parse(fs.readFileSync('examples/requests/' + match + '.json'));
                let exResponse = JSON.parse(fs.readFileSync('examples/responses/' + match + '.json'));

                md = '###### ' + request.allOf[1].properties.method.enum[0] + "\n\n";
                md += '*' + request.description + "*\n\n";
                md += "```\n" + response.allOf[1].properties.result.type;
                md += " " + request.allOf[1].properties.method.enum[0];

                let keys = undefined;
                let props = undefined;
                if(request.allOf[1].properties.params !== undefined) {
                    md += "(\n";
                    props = request.allOf[1].properties.params.properties;
                    keys = Object.keys(props);
                    keys.forEach(function (key, idx) {
                        let param = props[key];
                        if (param.type === 'array') {
                            md += "  Array<" + param.items.type + ">";
                        } else if (param.$ref !== undefined) {
                            md += "  " + require('path').basename(param.$ref);
                        } else {
                            md += "  " + param.type;
                        }

                        md += " $" + key;
                        if (idx < keys.length - 1) {
                            md += ",";
                        }
                        md += "\n";
                    });
                } else {
                    md += "(";
                }

                md += ")\n```";

                md += "\n\n**Parameters**\n\n";

                if(keys !== undefined) {
                    keys.forEach(function (key, idx) {
                        let param = props[key];
                        if (param.type === 'array') {
                            md += " - `Array<" + param.items.type + ">";
                        } else if (param.$ref !== undefined) {
                            md += " - `" + require('path').basename(param.$ref);
                        } else {
                            md += " - `" + param.type;
                        }

                        md += " $" + key + "` " + param.description;
                        md += "\n";
                    });
                } else {
                    md += " - No parameters.\n\n";
                }

                md += "\n**Result**\n\n";

                md += response.allOf[1].properties.result.description;

                md += "\n\n**Example Request**\n\n";
                md += "```json\n" + JSON.stringify(exRequest, null, 2) + "\n```\n";
                md += "\n**Example Response**\n\n";
                md += "```json\n" + JSON.stringify(exResponse, null, 2) + "\n```\n";
                md += "\n**Example curl request**\n\n";
                md += "\n```bash\n";
                md += "curl -X POST http://localhost:4003 \\\n     -H \"PascalCoin-Api-Version: v2\" \\\n     -d @- << EOF\n" + JSON.stringify(exRequest, null, 2) + " \nEOF\n```\n";
            } else {
                md = '';
            }
            contents = contents.replace('[signature=' + match + ']', md);
        });
    }

    objRegex = /\[type=(.*)\]/gm;
    m = undefined;

    while ((m = objRegex.exec(contents)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === objRegex.lastIndex) {
            objRegex.lastIndex++;
        }

        // The result can be accessed through the `m`-variable.
        let md = '';

        m.forEach((match, groupIndex) => {

            if(groupIndex === 1) {

                console.log("MATCH = " + match);
                //console.log('Sig: ' + match);
                let type = JSON.parse(fs.readFileSync('schema/objects/' + match + '.json'));

                //console.log(types);
                //console.log(types.definitions[match]);

                md = type.description + "\n\n";
                md += "**Properties**\n\n";
                let fields = Object.keys(type.properties);
                fields.forEach(function(field) {
                    let prop = type.properties[field];
                    md += " - `" + field + "` - ";
                    md += prop.type + " " + prop.description + "\n\n";

                });

                let example = JSON.parse(fs.readFileSync('examples/objects/' + match + '.json'));

                md += "**Example**\n\n";
                md += "```json\n" + JSON.stringify(example, null, 2) + "\n```\n";

                /*
                md = '###### ' + request.allOf[1].properties.method.enum[0] + "\n\n";
                md += '*' + request.description + "*\n\n";
                md += "```\n" + response.allOf[1].properties.result.type;
                md += " " + request.allOf[1].properties.method.enum[0];

                let keys = undefined;
                let props = undefined;
                if(request.allOf[1].properties.params !== undefined) {
                    md += "(\n";
                    props = request.allOf[1].properties.params.properties;
                    keys = Object.keys(props);
                    keys.forEach(function (key, idx) {
                        let param = props[key];
                        if (param.type === 'array') {
                            md += "  Array<" + param.items.type + ">";
                        } else if (param.$ref !== undefined) {
                            md += "  " + require('path').basename(param.$ref);
                        } else {
                            md += "  " + param.type;
                        }

                        md += " $" + key;
                        if (idx < keys.length - 1) {
                            md += ",";
                        }
                        md += "\n";
                    });
                } else {
                    md += "(";
                }

                md += ")\n```";

                md += "\n\n**Parameters**\n\n";

                if(keys !== undefined) {
                    keys.forEach(function (key, idx) {
                        let param = props[key];
                        if (param.type === 'array') {
                            md += " - `Array<" + param.items.type + ">";
                        } else if (param.$ref !== undefined) {
                            md += " - `" + require('path').basename(param.$ref);
                        } else {
                            md += " - `" + param.type;
                        }

                        md += " $" + key + "` " + param.description;
                        md += "\n";
                    });
                } else {
                    md += " - No parameters.\n\n";
                }

                md += "\n**Result**\n\n";

                md += response.allOf[1].properties.result.description;

                md += "\n\n**Example Request**\n\n";
                md += "```json\n" + JSON.stringify(exRequest, null, 2) + "\n```\n";
                md += "\n**Example Response**\n\n";
                md += "```json\n" + JSON.stringify(exResponse, null, 2) + "\n```\n";
                md += "\n**Example curl request**\n\n";
                md += "\n```bash\n";
                md += "curl -X POST http://localhost:4003 \\\n     -H \"PascalCoin-Api-Version: v2\" \\\n     -d @- << EOF\n" + JSON.stringify(exRequest, null, 2) + " \nEOF\n```\n";
                */
            } else {
                md = '';
            }
            //console.log(md);
            contents = contents.replace('[type=' + match + ']', md);
        });
    }

    fs.writeFileSync('PIP.md', contents);
    fs.writeFileSync('PIP-GEN.md', contents);

    gulp.src('PIP.md')
        .pipe(toc())
        .pipe(
            markdown({
                highlight: function(code, lang) {
                    if (!lang) {
                        return code;
                    }
                    return hljs.highlight(lang, code).value;
                }
            })
        )
        .pipe(rename(function(path) {
            path.extname = '.html';
        }))
        .pipe(gulp.dest('./'));

    gulp.src('PIP.html')
        .pipe(wrapper({
            header: '<meta name="viewport" content="width=device-width, initial-scale=1">' +
            '<link rel="stylesheet" href="https://sindresorhus.com/github-markdown-css/github-markdown.css">' +
            '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/styles/default.min.css">' +
            '<style>' +
                '.markdown-body {' +
            'box-sizing: border-box;' +
                'min-width: 200px;' +
                'max-width: 980px;' +
                'margin: 0 auto;' +
                'padding: 45px;' +
                '}' +
                '@media (max-width: 767px) {' +
                    '.markdown-body {' +
                    'padding: 15px;' +
                '}' +
                '}' +
                    '</style>' +
            '<article class="markdown-body">',
            footer: '</article>'
        }))
        .pipe(gulp.dest('out'));
}