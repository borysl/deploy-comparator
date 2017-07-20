global.__base = __dirname + '/';

var fs = require('fs')
  , ini = require('ini')

var json2csv = require('json2csv');

var bitbucketSettings = JSON.parse(fs.readFileSync(__base + 'bitbucketSettings.json', 'utf8'));
var compareSettings = JSON.parse(fs.readFileSync(__base + 'compareSettings.json', 'utf8'));

var Bitbucket = require(__base + 'bitbucket');
var bitbucket = new Bitbucket(bitbucketSettings);

function formatDate(d) {
    var
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

function getBaseName(fileName) {
    return fileName.replace(/^.*\/([^/]*)$/, "$1");
}

function analyze(configs) {
    fields = ['section', 'field' ];

    data = [];

    function populateData(data, config, profileName) {
        for(var sectionName in config) {
            var section = config[sectionName];
            for(var propertyName in section) {
                var propertyValue = section[propertyName];

                var fields = data.filter(_ => _.section == sectionName && _.field == propertyName);
                var fieldRecord;
                if (fields.length > 0) {
                    fieldRecord = fields[0];
                    fieldRecord[profileName] = propertyValue;
                } else {
                    fieldRecord = {section: sectionName, field: propertyName};
                    fieldRecord[profileName] = propertyValue;
                    data.push(fieldRecord);
                }
            }
        }
    }

    var data = [];
    for (var configName in configs) {
        fields.push(configName);
        populateData(data, configs[configName], configName);
    }

    data.sort((a,b) => a.section == b.section ? a.field.localeCompare(b.field) : a.section.localeCompare(b.section));
    var csv = json2csv({ data: data, fields: fields });
    fs.writeFileSync(outputFile, csv, { encoding: 'utf-8' });
    console.log(`Compare results are saved to ${outputFile}`);
    return 0;
}

var today = new Date();

var outputFile = `deployments_${formatDate(today)}.csv`;

var iniFiles = compareSettings.iniFiles;

var configs = {};

var requests = iniFiles.map(iniFile => {
    return new Promise((resolve) => {
        bitbucket.getFile(iniFile, resolve);
    }).then((content, err) => {
        if (err) {
            console.log("Cannot read content!");
            process.exit(1);
        } else {
            var parsedFc = ini.parse(content);
            configs[getBaseName(iniFile)] = parsedFc;
        }
    });
});

Promise.all(requests).then(() => {
    analyze(configs);
});