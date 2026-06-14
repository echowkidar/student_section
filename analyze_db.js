const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:strongpassword@217.217.249.153:5432/postgres'
});

async function main() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      WITH Ranked AS (
        SELECT 
          split_part(description, '|', 1) as type, 
          description, 
          notes,
          ROW_NUMBER() OVER(PARTITION BY split_part(description, '|', 1)) as rn
        FROM payment
      )
      SELECT * FROM Ranked WHERE rn <= 5 AND type IN ('Examination Fee', 'Employment Form Fee')
    `);
    
    console.log(JSON.stringify(res.rows, null, 2));
  } catch(e) {
    console.error('ERROR:', e);
  } finally {
    client.release();
    pool.end();
  }
}

main();
