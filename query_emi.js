const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:strongpassword@217.217.249.153:5432/postgres' });
pool.query("SELECT * FROM payment WHERE method = 'emi'").then(res => { console.log(res.rows[0]); process.exit(0); });
