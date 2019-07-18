'use strict';

const path = require('path');
const fs = require('fs');
const nunjucks = require('nunjucks');

const engine = nunjucks.configure({
  autoescape: false,
  watch: false,
});

let root;
const env_sample_name = process.env.FIBJSCI_SAMPLE_NAME || 'normal';
// support npminstall path
if (__dirname.indexOf('.npminstall') >= 0) {
  root = path.join(__dirname, '../../../../../..');
} else if (is_tested_locally(env_sample_name)) {
  root = path.join(__dirname, `./samples/${env_sample_name}`);
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
  // default is travis and appveyor
  type: 'travis, appveyor',
  // default version to 0.3.1
  version: '0.3.1',
  // default empty
  /* travis services about: start */
  travis_services: [],
  get use_travis_services () {
    return !!this.travis_services.length
  },
  get use_travis_service__mysql () {
    return ~this.travis_services.indexOf('mysql')
  },
  get need_brew_for_osx () {
    return this.use_travis_service__mysql
  }
  /* travis services about: end */
}, pkg.ci);
config.types = arraify(config.type);
config.versions = arraify(config.version);
config.travis_services = arraify(config.travis_services);

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

function arraify(str) {
  if (Array.isArray(str)) return str;
  return str.split(/\s*,\s*/).filter(s => !!s);
}

function is_tested_locally (env_sample_name = process.env.FIBJSCI_SAMPLE_NAME) {
  return !!env_sample_name && fs.existsSync(
    path.resolve(__dirname, './samples/.lifecyclecheck')
  )
}