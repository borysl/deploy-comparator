var http = require("https");

function BitBucket(bitBucketSettings) {
    var self = this;

    var options = {
        "method": "GET",
        "hostname": bitBucketSettings.url,
        "port": null,
        "path": "/projects/PV/repos/",
        "headers": {
            "content-type": "application/text",
            "authorization": "Basic " + new Buffer(bitBucketSettings.login + ':' + bitBucketSettings.password).toString('base64'),
            "cache-control": "no-cache"
        }
    };

    self.getFile = function (filePath, callback) {
        var optionsClone = JSON.parse(JSON.stringify(options)); 
        optionsClone.path += filePath + "?raw";

        var req = http.request(optionsClone, function (res) {
            var chunks = [];

            res.on("data", function (chunk) {
                chunks.push(chunk);
            });

            res.on("end", function () {
                var body = Buffer.concat(chunks);
                var response = body.toString();
                
                if (callback) {
                    if (!response.errors) {
                        callback(response); 
                    } else {
                        callback(null, response.errors); 
                    }
                } else {
                    console.log(`${response}`);
                }
            });

            res.on("error", function (err) {
                callback(null, err);
            });
        });

        req.end();
    }

    return self;
}

module.exports = BitBucket;