const { Pool } = require('pg');

const pool = new Pool({ 
  connectionString: 'postgresql://postgres:strongpassword@217.217.249.153:5432/postgres' 
});

async function setup() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS registration_otps (
        email VARCHAR(255) PRIMARY KEY,
        otp VARCHAR(10) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        name VARCHAR(255),
        password VARCHAR(255)
      )
    `);
    console.log('✅ registration_otps table created');
  } catch (e) {
    console.error('Error:', e);
  } finally {
    pool.end();
  }
}
setup();
