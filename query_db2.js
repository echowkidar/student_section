const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:strongpassword@217.217.249.153:5432/postgres' });
Promise.all([
  pool.query('SELECT DISTINCT "R_NR" FROM admission_course_code_fee'),
  pool.query('SELECT DISTINCT "IE" FROM admission_course_code_fee'),
  pool.query('SELECT DISTINCT "SEX" FROM admission_course_code_fee'),
  pool.query('SELECT DISTINCT "FLG" FROM admission_course_code_fee'),
  pool.query('SELECT DISTINCT "FLG1" FROM admission_course_code_fee'),
  pool.query('SELECT DISTINCT "FLAG" FROM admission_course_code_fee')
]).then(res => {
  console.log('R_NR:', res[0].rows.map(r=>r.R_NR));
  console.log('IE:', res[1].rows.map(r=>r.IE));
  console.log('SEX:', res[2].rows.map(r=>r.SEX));
  console.log('FLG:', res[3].rows.map(r=>r.FLG));
  console.log('FLG1:', res[4].rows.map(r=>r.FLG1));
  console.log('FLAG:', res[5].rows.map(r=>r.FLAG));
  pool.end();
}).catch(console.error);
