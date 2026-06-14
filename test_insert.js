const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:strongpassword@217.217.249.153:5432/postgres' });
async function test() {
  try {
    await pool.query('INSERT INTO app_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2', ['smtp_enabled', 'false']);
    console.log("Success");
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
test();
