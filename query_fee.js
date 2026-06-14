const {Pool} = require('pg');
const pool = new Pool({connectionString: 'postgresql://postgres:strongpassword@217.217.249.153:5432/postgres'});
pool.query('SELECT "CLASS", "RESIDENT", "BOYS", "GIRLS", "TOT_AMT" FROM admission_course_code_fee LIMIT 10;')
  .then(res => console.log(JSON.stringify(res.rows, null, 2)))
  .catch(console.error)
  .finally(() => pool.end());
