'use strict';

const path = require('path');
const fs = require('fs');
const nunjucks = require('nunjucks');
const chalk = require('chalk');

const engine = nunjucks.configure({
  autoescape: false,
  watch: false,
});

let root;
const env_sample_name = process.env.FIBJSCI_SAMPLE_NAME;
// support npminstall path
if (__dirname.indexOf('.npminstall') >= 0) {
  root = path.join(__dirname, '../../../../../..');
} else if (is_tested_locally(env_sample_name)) {
  root = path.join(__dirname, `./samples/${env_sample_name}`);
} else {
  root = process.env.TEST_CI_PATH ? path.resolve(process.env.TEST_CI_PATH) : path.resolve(__dirname, '../../..');
}

let pkg;
try {
  pkg = require(path.join(root, 'package.json'));
} catch (err) {
  console.error(`read package.json error: %s`, err.message);
  console.error('[fibjs-ci] stop create ci yml');
  process.exit(0);
}

// @see https://github.com/actions/runner-images
const actions_os_arch_presets = [
  { os: 'windows-2019', arch: 'x64' },
  { os: 'windows-2019', arch: 'x86' },
  { os: 'windows-2022', arch: 'x64' },
  { os: 'windows-2022', arch: 'x86' },
  { os: 'windows-2022', arch: 'arm64' },

  // { os: 'ubuntu-18.04', arch: 'arm' },
  { os: 'ubuntu-20.04', arch: 'x64' },
  { os: 'ubuntu-20.04', arch: 'x86' },
  // { os: 'ubuntu-20.04', arch: 'arm64' },
  { os: 'ubuntu-22.04', arch: 'x64' },
  { os: 'ubuntu-22.04', arch: 'x86' },
  // { os: 'ubuntu-22.04', arch: 'arm64' },

  { os: 'macos-10.15', arch: 'x64' },
  
  { os: 'macos-11', arch: 'x64' },
  // { os: 'macos-11', arch: 'arm64' },

  { os: 'macos-12', arch: 'x64' },
  // { os: 'macos-12', arch: 'arm64' },

  { os: 'macos-13', arch: 'x64' },
  { os: 'macos-13-large', arch: 'x64' },
  { os: 'macos-13-xlarge', arch: 'arm64' },

  { os: 'macos-14', arch: 'x64' },
  { os: 'macos-14-large', arch: 'x64' },
  { os: 'macos-14', arch: 'arm64' },
  { os: 'macos-14-xlarge', arch: 'arm64' },

  { os: 'macos-15-large', arch: 'x64' },
  { os: 'macos-15', arch: 'arm64' },
  { os: 'macos-15-xlarge', arch: 'arm64' },

  { os: 'macos-latest-large', arch: 'x64' },
  { os: 'macos-latest', arch: 'arm64' },
  { os: 'macos-latest-xlarge', arch: 'arm64' },
];

const node_versions_preset = ['16', '18', '20'];

function is_allowed_os_arch (os, arch) {
  return actions_os_arch_presets.some(preset => preset.os === os && preset.arch === arch);
}

function is_lt_0_37_0 (version) {
  const [major, minor, patch] = version.split('.').map(Number)
  return major < 0 || (major === 0 && minor < 37);
}

const config = Object.assign({
  // default is actions
  type: 'actions',
  // default version to 0.36.0, 0.37.0
  version: [
    '0.36.0',
    '0.37.0'
  ],
  os: [
    "windows-2019",
    "ubuntu-20.04",
    "macos-13",
  ],
  node_version: '16',
  arch: [
    // "x86",
    "x64",
    "arm64"
  ],
  // default empty
  /* travis services about: start */
  /** @deprecated */
  travis_services: [],
  get use_travis_services () {
    return !!this.travis_services.length
  },
  get use_travis_service__mysql () {
    return ~this.travis_services.indexOf('mysql')
  }
  /* travis services about: end */
}, pkg.ci, pkg.fibjs_ci);

clean_config: {
  config.types = arrayify(config.type);
  config.versions = arrayify(config.version);
  config.node_version = node_versions_preset.includes(config.node_version + '') ? config.node_version : node_versions_preset[0];
  config.travis_services = arrayify(config.travis_services);

  const actions_os = arrayify(config.os)
  const actions_arch = arrayify(config.arch)
  config.$actions_os_arch_version = [];
  actions_os.forEach(os => {
    actions_arch.forEach((arch) => {
      if (!is_allowed_os_arch(os, arch)) {
        console.warn(chalk.yellow(`[fibjs-ci] [os: ${chalk.red(os)}, arch: ${chalk.red(arch)}] is not supported in actions, ignored.`))
        return ;
      }
      config.versions.forEach(fibjs => {
        if (is_lt_0_37_0(fibjs) && arch === 'arm64') {
          console.warn(chalk.yellow(`[fibjs-ci] [fibjs ${chalk.red(fibjs)}, arch: ${chalk.red('arm64')}] is not supported in actions, ignored.`))
        } else {
          config.$actions_os_arch_version.push({ os, arch, fibjs })
        }
      })
    });
  });

  // config.versions_lt_0_37_0 = [];
  // config.versions_ge_0_37_0 = [];
  // config.versions.forEach(v => {
  //   if (is_lt_0_37_0(v)) {
  //     config.versions_lt_0_37_0.push(v);
  //   } else {
  //     config.versions_ge_0_37_0.push(v);
  //   }
  // })
  
  // config.has_lt_0_37_0 = !!config.versions_lt_0_37_0.length;
  // config.has_ge_0_37_0 = !!config.versions_ge_0_37_0.length;
}

let ymlName = '';

for (const type of config.types) {
  if (type === 'actions') {
    ;[
      '.github/workflows/run-ci.yml',
      '.github/workflows/fns.sh',
      '.github/workflows/set-env-vars.sh',
    ].forEach(file => {
      const srcpath = path.resolve(__dirname, 'tpl', file);
      const targetpath = path.resolve(root, file);
    
      let content = fs.readFileSync(srcpath, 'utf8');
      content = engine.renderString(content, config);
      
      fs.mkdirSync(path.dirname(targetpath), { recursive: true });
      fs.writeFileSync(targetpath, content);
      console.log((`[fibjs-ci] create ${chalk.green(targetpath)} success`));
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