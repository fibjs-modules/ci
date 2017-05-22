'use strict';

const path = require('path');
const fs = require('fs');
const nunjucks = require('nunjucks');

const engine = nunjucks.configure({
  autoescape: false,
  watch: false,
});

let root;
// support npminstall path
if (__dirname.indexOf('.npminstall') >= 0) {
  root = path.join(__dirname, '../../../../../..');
} else {
  root = path.join(__dirname, '../../..');
}

let pkg;
try {
  pkg = require(path.join(root, 'package.json'));
} catch (err) {
  console.error('read package.json error: %s', err.message);
  console.error('[fibjs-ci] stop create ci yml');
  process.exit(0);
}

const config = Object.assign({
  type: 'travis, appveyor', // default is travis and appveyor
  version: '0.3.1', // default version to 0.3.1
}, pkg.ci);
config.types = arrayify(config.type);
config.versions = arrayify(config.version);

let ymlName = '';

for (const type of config.types) {
  if (type === 'travis') {
    ymlName = '.travis.yml';
  } else if (type === 'appveyor') {
    ymlName = 'appveyor.yml';
  } else {
    throw new Error(`${type} type not support`);
  }
  const tplPath = path.join(__dirname, 'tpl', ymlName);
  const ymlPath = path.join(root, ymlName);

  let ymlContent = fs.readFileSync(tplPath, 'utf8');
  ymlContent = engine.renderString(ymlContent, config);
  fs.writeFileSync(ymlPath, ymlContent);
  console.log(`[fibjs-ci] create ${ymlPath} success`);
}

function arrayify(str) {
  if (Array.isArray(str)) return str;
  return str.split(/\s*,\s*/).filter(s => !!s);
}
