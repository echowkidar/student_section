const {Pool} = require('pg');
const pool = new Pool({connectionString:'postgresql://postgres:strongpassword@217.217.249.153:5432/postgres'});

async function test() {
  console.time('Sequential');
  const c = await pool.connect();
  await c.query('SELECT COUNT(*) FROM payment');
  await c.query('SELECT split_part(description, \'|\', 1) as payment_type, COUNT(*) FROM payment GROUP BY split_part(description, \'|\', 1)');
  await c.query('SELECT method, COUNT(*) FROM payment GROUP BY method');
  await c.query('SELECT SUBSTRING(created_at FROM 4 FOR 7), COUNT(*) FROM payment GROUP BY SUBSTRING(created_at FROM 4 FOR 7)');
  await c.query('SELECT COUNT(*) FROM payment p LEFT JOIN admission_course_code_fee acf ON acf."CLASSCODE" = (CASE WHEN p.notes IS NOT NULL AND p.notes LIKE \'{%\' THEN p.notes::json->>\'programme_code\' ELSE NULL END) WHERE split_part(p.description, \'|\', 1) IN (\'Admission Form Fee\', \'Admisson Fee\', \'Continuation Fee\') GROUP BY acf."FACNAME"');
  await c.query('SELECT CASE WHEN notes::json->>\'residential_status\' IN (\'YES\') THEN \'Resident\' ELSE \'Non\' END, COUNT(*) FROM payment WHERE notes IS NOT NULL AND notes LIKE \'{%\' GROUP BY CASE WHEN notes::json->>\'residential_status\' IN (\'YES\') THEN \'Resident\' ELSE \'Non\' END');
  c.release();
  console.timeEnd('Sequential');

  console.time('Parallel');
  await Promise.all([
    pool.query('SELECT COUNT(*) FROM payment'),
    pool.query('SELECT split_part(description, \'|\', 1) as payment_type, COUNT(*) FROM payment GROUP BY split_part(description, \'|\', 1)'),
    pool.query('SELECT method, COUNT(*) FROM payment GROUP BY method'),
    pool.query('SELECT SUBSTRING(created_at FROM 4 FOR 7), COUNT(*) FROM payment GROUP BY SUBSTRING(created_at FROM 4 FOR 7)'),
    pool.query('SELECT COUNT(*) FROM payment p LEFT JOIN admission_course_code_fee acf ON acf."CLASSCODE" = (CASE WHEN p.notes IS NOT NULL AND p.notes LIKE \'{%\' THEN p.notes::json->>\'programme_code\' ELSE NULL END) WHERE split_part(p.description, \'|\', 1) IN (\'Admission Form Fee\', \'Admisson Fee\', \'Continuation Fee\') GROUP BY acf."FACNAME"'),
    pool.query('SELECT CASE WHEN notes::json->>\'residential_status\' IN (\'YES\') THEN \'Resident\' ELSE \'Non\' END, COUNT(*) FROM payment WHERE notes IS NOT NULL AND notes LIKE \'{%\' GROUP BY CASE WHEN notes::json->>\'residential_status\' IN (\'YES\') THEN \'Resident\' ELSE \'Non\' END')
  ]);
  console.timeEnd('Parallel');
  process.exit(0);
}

test().catch(console.error);
