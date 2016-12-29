const Pool = require('@fibjs/pool');

const p =  Pool(() => 1);
const apps = p(a => a);
console.log('for test !!!:', apps);
12