const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:strongpassword@217.217.249.153:5432/postgres' });
pool.query(`SELECT * FROM admission_course_code_fee WHERE "CLASSCODE" = 'ETBDA' LIMIT 5`).then(res => { console.log(res.rows); pool.end(); }).catch(console.error);
