const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:strongpassword@217.217.249.153:5432/postgres' });
pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'").then(res => { console.log(res.rows.map(r=>r.table_name)); process.exit(0); });
