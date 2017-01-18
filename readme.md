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
  "type": "travis, circle" // default ci env type is 'travis, appveyor'
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
