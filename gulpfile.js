const gulp = require('gulp'),
    watch = require('gulp-watch'),
    glob = require('glob'),
    fs = require('fs'),
    Ajv = require('ajv'),
    colors = require('colors');

gulp.task('default', function () {
    check();
    pip();
    // watch the requests folder
    watch(['schema/**/*.json', 'examples/**/*.json'], { ignoreInitial: true }, check);
    return watch(['test.md'], { ignoreInitial: true }, pip);
});

function check()
{
    console.log('');
    console.log(' NEW BUILD');
    console.log('-------------------------------');

    const exampleRequestFiles = glob.sync('examples/requests/**/*.json');
    validateFiles(exampleRequestFiles);
    const exampleResponseFiles = glob.sync('examples/responses/**/*.json');
    validateFiles(exampleResponseFiles);
}

function validateFiles(files)
{
    for (let f = 0; f < files.length; f++)
    {
        let exampleJson = JSON.parse(fs.readFileSync(files[f]));

        let schemas = [];
        schemas.push(JSON.parse(fs.readFileSync('schema/types.json')));
        schemas.push(JSON.parse(fs.readFileSync('schema/objects.json')));
        schemas.push(JSON.parse(fs.readFileSync('schema/requests/rpc-request.json')));
        schemas.push(JSON.parse(fs.readFileSync('schema/responses/rpc-response.json')));

        // find and load request schema
        schemas.push(JSON.parse(fs.readFileSync(files[f].replace('examples/', 'schema/'))));

        let ajv;
        try {
            ajv = new Ajv({schemas});
            //log('Schemas'.bgCyan, 'loaded', TYPE_SUCCESS);
        } catch(e) {
            log(e.message, e.message, TYPE_ERROR);
            return;
        }

        let requestValidate = ajv.getSchema('http://www.pascalcoin.org/schemas/' + files[f].replace('examples/', ''));
        let valid = requestValidate(exampleJson);
        if (!valid) {
            log(files[f], ajv.errorsText(requestValidate.errors, { separator: "\n"}), TYPE_ERROR);
        } else {
            log(files[f], 'valid', TYPE_SUCCESS);
        }
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
    let contents = fs.readFileSync('test.md').toString();
    console.log(contents);
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

                console.log('Sig: ' + match);
                let request = JSON.parse(fs.readFileSync('schema/requests/' + match + '.json'));
                let response = JSON.parse(fs.readFileSync('schema/responses/' + match + '.json'));
                let exRequest = JSON.parse(fs.readFileSync('examples/requests/' + match + '.json'));
                let exResponse = JSON.parse(fs.readFileSync('examples/responses/' + match + '.json'));

                md = '*' + request.description + "*\n\n";
                md += "```\n" + response.allOf[1].properties.result.type;
                md += " " + request.allOf[1].properties.method.enum[0];
                md += "(\n";

                const props = request.allOf[1].properties.params.properties;
                const keys = Object.keys(props);
                keys.forEach(function(key, idx) {
                    let param = props[key];
                    if(param.type === 'array') {
                        md += "  Array<" + param.items.type + ">";
                    } else if(param.$ref !== undefined) {
                        md += "  " + require('path').basename(param.$ref);
                    } else {
                        md += "  " + param.type;
                    }

                    md += " $" + key;
                    if(idx < keys.length - 1) {
                        md += ",";
                    }
                    md += "\n";
                });

                md += ")\n```";

                md += "\n\n**Parameters**\n\n";

                keys.forEach(function(key, idx) {
                    let param = props[key];
                    if(param.type === 'array') {
                        md += " - `Array<" + param.items.type + ">";
                    } else if(param.$ref !== undefined) {
                        md += " - `" + require('path').basename(param.$ref);
                    } else {
                        md += " - `" + param.type;
                    }

                    md += " $" + key + "` " + param.description;
                    md += "\n";
                });

                md += "\n**Result**\n\n";

                md += response.allOf[1].properties.result.description;

                md += "\n\n**Example Request**\n\n";
                md += "```\n" + JSON.stringify(exRequest, null, 2) + "\n```\n";
                md += "\n**Example Response**\n\n";
                md += "```\n" + JSON.stringify(exResponse, null, 2) + "\n```\n";

            } else {
                md = '';
            }
            contents = contents.replace('[signature=' + match + ']', md);
        });
    }
    fs.writeFileSync('test-generated.md', contents);
}