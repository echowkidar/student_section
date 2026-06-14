const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:strongpassword@217.217.249.153:5432/postgres'
});

async function run() {
  try {
    const res = await pool.query('SELECT * FROM admission_course_code_fee LIMIT 5;');
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
