const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:strongpassword@217.217.249.153:5432/postgres'
});

async function run() {
  try {
    await pool.query(`ALTER TABLE hall_name_code ADD COLUMN id SERIAL PRIMARY KEY;`);
    console.log("Successfully added primary key 'id' to hall_name_code");
    const res = await pool.query('SELECT * FROM hall_name_code LIMIT 1;');
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
