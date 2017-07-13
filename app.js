var path = require('path');

var multiparty = require('multiparty');
var AWS = require('aws-sdk');
var envIs = require('101/env-is');
var defaults = require('101/defaults');
var pick = require('101/pick');
var express = require('express');
var uuid = require('uuid');
var basePath = envIs('production') ? 'sgtp' : 'sgtp-test';
function requireEnv (key) {
  if (!process.env[key]) {
    throw new Error('process.env.'+key+' is required!');
  }
}

// env
// defaults(process.env, require('./config.json'));
requireEnv('S3_BUCKET');
requireEnv('S3_KEY');
requireEnv('S3_SECRET');

var app = express();
// config
app.use(require('morgan')('tiny'));
app.use(require('cookies').express({ maxAge: 365*24*60*60 }));
app.use(function (req, res, next) {
  req.cookies.set(
    'uuid', req.cookies.get('uuid') || uuid()
  );
  next();
});
app.use(express.static('public'));

// routes
var bucket = process.env.S3_BUCKET;
var s3Client = new AWS.S3({
  accessKeyId: process.env.S3_KEY,
  secretAccessKey: process.env.S3_SECRET,
  // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property
});
app.post('/upload', function (req, res, next) {
  var form = new multiparty.Form();

  form.on('part', function(part) {
    if (!part.filename || part.filename.toLowerCase() === 'image.jpg') {
      // iphone uploads are always named image.jpg...
      part.filename = 'image'+uuid()+path.extname(part.filename);
    }
    var destPath = path.join(basePath, req.cookies.get('uuid') || Date.now().toString(), part.filename);
    s3Client.putObject({
      Bucket: bucket,
      Key: destPath,
      ACL: 'public-read',
      Body: part,
      ContentLength: part.byteCount,
    }, function(err, data) {
      if (err) {
        console.error(err.stack);
        return res.send(500, err.message);
      }
      res.end("OK");
      console.log("https://s3.amazonaws.com/" + bucket + '/' + destPath);
    });
  });
  form.parse(req);
});

app.get('/session', function (req, res, next) {
  res.send(req.cookies.get('uuid'));
});

module.exports = app;
