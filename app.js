const Pool = require('@fibjs/pool');

const p =  Pool(() => 1);
const apps = ConnPool(a => a);
console.log('for test !!!:', apps);
