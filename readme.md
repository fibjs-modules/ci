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
  // default ci env type is 'actions'
  "type": "actions",
  // default version is 0.33.0.
  "version": "0.33.0"
}
```

you can check available versions here: [fibjs.org/downloads/](fibjs.org/downloads/)

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
