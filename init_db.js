const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:strongpassword@217.217.249.153:5432/postgres' });

async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS course_groups (
        id SERIAL PRIMARY KEY,
        group_name VARCHAR(255) UNIQUE NOT NULL
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS course_group_mapping (
        group_id INTEGER REFERENCES course_groups(id) ON DELETE CASCADE,
        course_code VARCHAR(255) NOT NULL,
        UNIQUE(group_id, course_code)
      );
    `);
    console.log("Tables created successfully");
  } catch (error) {
    console.error("Error creating tables:", error);
  } finally {
    pool.end();
  }
}

initDb();
