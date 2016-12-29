# @fibjs/ci

Auto gen ci config file.

## Installation

```bash
$ npm i @fibjs/egg-ci --save-dev
```

## Usage

Add `ci` property to your `package.json`:

```js
"ci": {
  "type": "travis, circle" // default ci env type is 'travis, appveyor'
}
```

## How

Use `npm postinstall` hoook to create the `*.yml` after each `npm install` run.

## License

[MIT](LICENSE)
