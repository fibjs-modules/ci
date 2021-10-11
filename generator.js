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
  // default is actions
  type: 'actions',
  // default version to 0.33.0
  version: '0.33.0',
  // default empty
  /* travis services about: start */
  travis_services: [],
  get use_travis_services () {
    return !!this.travis_services.length
  },
  get use_travis_service__mysql () {
    return ~this.travis_services.indexOf('mysql')
  }
  /* travis services about: end */
}, pkg.ci);
config.types = arrayify(config.type);
config.versions = arrayify(config.version);
config.travis_services = arrayify(config.travis_services);

let ymlName = '';

for (const type of config.types) {
  if (type === 'actions') {
    ;[
      '.github/workflows/run-ci.yml',
      '.github/workflows/set-env-vars.sh',
    ].forEach(file => {
      const srcpath = path.resolve(__dirname, 'tpl', file);
      const targetpath = path.resolve(root, file);
    
      let content = fs.readFileSync(srcpath, 'utf8');
      content = engine.renderString(content, config);
      
      fs.mkdirSync(path.dirname(targetpath), { recursive: true });
      fs.writeFileSync(targetpath, content);
      console.log(`[fibjs-ci] create ${targetpath} success`);
    })

    continue ;
  }
  
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

function is_tested_locally (env_sample_name = process.env.FIBJSCI_SAMPLE_NAME) {
  return !!env_sample_name && fs.existsSync(
    path.resolve(__dirname, './samples/.lifecyclecheck')
  )
}