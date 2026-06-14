const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:strongpassword@217.217.249.153:5432/postgres' });

async function init() {
  const client = await pool.connect();
  try {
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,
        reset_token VARCHAR(255),
        reset_expires TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ users table created');

    // Create app_settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT
      )
    `);
    console.log('✅ app_settings table created');

    // Seed default admin
    const existing = await client.query('SELECT id FROM users WHERE email = $1', ['admin@admin.com']);
    if (existing.rows.length === 0) {
      await client.query(
        'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
        ['Administrator', 'admin@admin.com', 'admin123', 'admin']
      );
      console.log('✅ Default admin seeded: admin@admin.com / admin123');
    } else {
      console.log('ℹ️ Admin already exists');
    }

    // Seed default settings
    await client.query(`INSERT INTO app_settings (key, value) VALUES ('smtp_enabled', 'false') ON CONFLICT (key) DO NOTHING`);
    await client.query(`INSERT INTO app_settings (key, value) VALUES ('smtp_email', '') ON CONFLICT (key) DO NOTHING`);
    await client.query(`INSERT INTO app_settings (key, value) VALUES ('smtp_password', '') ON CONFLICT (key) DO NOTHING`);
    console.log('✅ Default settings seeded');

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    client.release();
    pool.end();
  }
}

init();
