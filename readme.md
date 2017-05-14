# @fibjs/ci

Auto gen ci config file.

## Installation

```bash
$ npm i @fibjs/ci --save-dev
```

## Usage

Add `ci` property to your `package.json`:

```json
"ci": {
  "type": "travis, appveyor", // default ci env type is 'travis, appveyor'
  "version": "0.3.0" // default version is 0.3.0. Only support version >= 0.3.0
}
```

and ci system will automatically exec `npm run ci` command, so please add this to your `package.json`:

```json
"scritps": {
  "ci": "fibjs test/test.js"
}
```

## How

Use `npm postinstall` hoook to create the `*.yml` after each `npm install` run.

## License

[MIT](LICENSE)
