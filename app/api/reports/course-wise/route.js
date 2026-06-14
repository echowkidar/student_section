import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:strongpassword@217.217.249.153:5432/postgres',
});

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'admission';
  const faculty = searchParams.get('faculty') || '';

  const client = await pool.connect();
  try {
    const tableName = type === 'continuation'
      ? 'continuation_course_code_fee'
      : 'admission_course_code_fee';

    // Get all courses with fee structure summary
    let conditions = [];
    let params = [];
    if (faculty) {
      conditions.push(`"FACULTY" = $1`);
      params.push(faculty);
    }
    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const coursesRes = await client.query(`
      SELECT DISTINCT "CLASSCODE", "CLASS", "FACNAME", "FACULTY", "DURATION",
        MIN(CAST("TOT_AMT" AS NUMERIC)) as min_fee,
        MAX(CAST("TOT_AMT" AS NUMERIC)) as max_fee
      FROM ${tableName}
      ${whereClause}
      GROUP BY "CLASSCODE", "CLASS", "FACNAME", "FACULTY", "DURATION"
      ORDER BY "FACNAME", "CLASS"
    `, params);

    // Faculty list for filter
    const facultyRes = await client.query(`
      SELECT DISTINCT "FACULTY", "FACNAME" 
      FROM ${tableName}
      WHERE "FACULTY" IS NOT NULL
      ORDER BY "FACNAME"
    `);
    // Deduplicate
    const seen = new Set();
    const uniqueFaculties = facultyRes.rows.filter(r => {
      if (seen.has(r.FACULTY)) return false;
      seen.add(r.FACULTY);
      return true;
    });

    // Course-wise collection from payments
    const collectionRes = await client.query(`
      SELECT 
        CASE WHEN notes IS NOT NULL AND notes LIKE '{%' 
          THEN notes::json->>'programme_code' 
          ELSE 'Unknown' 
        END as programme_code,
        split_part(description, '|', 1) as payment_type,
        COUNT(*) as student_count,
        SUM(CAST(amount AS NUMERIC)) as total_collected
      FROM payment
      WHERE notes IS NOT NULL AND notes LIKE '{%'
      GROUP BY CASE WHEN notes IS NOT NULL AND notes LIKE '{%' 
          THEN notes::json->>'programme_code' 
          ELSE 'Unknown' 
        END, split_part(description, '|', 1)
      ORDER BY total_collected DESC
      LIMIT 100
    `);

    // Faculty-wise summary
    const facultySummaryRes = await client.query(`
      SELECT 
        f."FACNAME" as faculty_name,
        f."FACULTY" as faculty_code,
        COUNT(DISTINCT f."CLASSCODE") as course_count,
        MIN(CAST(f."TOT_AMT" AS NUMERIC)) as min_fee,
        MAX(CAST(f."TOT_AMT" AS NUMERIC)) as max_fee,
        AVG(CAST(f."TOT_AMT" AS NUMERIC)) as avg_fee
      FROM ${tableName} f
      WHERE f."FACNAME" IS NOT NULL
      GROUP BY f."FACNAME", f."FACULTY"
      ORDER BY f."FACNAME"
    `);

    return NextResponse.json({
      courses: coursesRes.rows,
      faculties: uniqueFaculties,
      collection: collectionRes.rows,
      facultySummary: facultySummaryRes.rows,
      type,
    });
  } catch (error) {
    console.error('Course Report API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
