const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:strongpassword@217.217.249.153:5432/postgres'
});

async function main() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT payment.id, split_part(payment.description, '|', 1) as payment_type, COALESCE(a."CLASS", c."CLASS") as course_name 
      FROM payment 
      LEFT JOIN (SELECT "CLASSCODE", MAX("CLASS") as "CLASS" FROM admission_course_code_fee GROUP BY "CLASSCODE") a 
        ON a."CLASSCODE" = (CASE WHEN payment.notes IS NOT NULL AND payment.notes LIKE '{%' THEN payment.notes::json->>'programme_code' ELSE NULL END) 
      LEFT JOIN (SELECT "CLASSCODE", MAX("CLASS") as "CLASS" FROM continuation_course_code_fee GROUP BY "CLASSCODE") c 
        ON c."CLASSCODE" = (CASE WHEN payment.notes IS NOT NULL AND payment.notes LIKE '{%' THEN payment.notes::json->>'programme_code' ELSE NULL END) 
      ORDER BY payment.created_at DESC LIMIT 5
    `);
    console.log(res.rows);
  } catch(e) {
    console.error('ERROR:', e);
  } finally {
    client.release();
    pool.end();
  }
}

main();
