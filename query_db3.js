const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:strongpassword@217.217.249.153:5432/postgres' });
pool.query('SELECT DISTINCT "CLASSCODE", "CLASS" FROM admission_course_code_fee WHERE "CLASS" LIKE \'%SF%\' OR "CLASS" LIKE \'%Self%\' LIMIT 10').then(res => { console.log(res.rows); pool.end(); }).catch(console.error);
