#!/usr/bin/env node
/*
 * Automatically grade files for the presence of specified HTML tags/attributes.
 * Uses commander.js and cheerio. Teaches command line application development
 * and basic DOM parsing.
 * 
 * References: + cheerio - https://github.com/MatthewMueller/cheerio -
 * http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/ -
 * http://maxogden.com/scraping-with-node.html + commander.js -
 * https://github.com/visionmedia/commander.js -
 * http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy +
 * JSON - http://en.wikipedia.org/wiki/JSON -
 * https://developer.mozilla.org/en-US/docs/JSON -
 * https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
 */

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var check = require('validator').check;
var Enum = require('enum');


var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var cheerioInitType = new Enum(['file', 'url']);

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var assertURL = function(url){
	if( !check(url).isUrl()){
		console.log("%s not a valid URL. Exiting.", url);
        process.exit(1);
	}
	return url;
};


var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtml = function(checksfile, initCheerio) {
    $ = initCheerio();
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var checkURL = function(checks) {
    var handler = function(result, response) {
        if (result instanceof Error) {
            console.error('Error: ' + util.format(response.message));
        } else {
           var checkJson = checkHtml(checks, function(){
                                                   return cheerio.load(result);
                                                       });
           resultToConsole(checkJson);
        }
    };
    return handler;
};

var resultToConsole = function(checkJson){
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);
};


var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <url>', 'URL to index.html', clone(assertURL))
        .parse(process.argv);
    if(program.url){
        rest.get(program.url).on('complete', checkURL(program.checks));
    }else{
        var checkJson = checkHtml(program.checks, function(){
                                                              return cheerio.load(fs.readFileSync(program.file));
                                                            });
        resultToConsole(checkJson);
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
