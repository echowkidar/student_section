import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://postgres:strongpassword@217.217.249.153:5432/postgres',
});

export async function GET() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT "CLASSCODE" as code, "CLASS" as name FROM admission_course_code_fee
      UNION
      SELECT "CLASSCODE" as code, "CLASS" as name FROM continuation_course_code_fee
      ORDER BY name ASC
    `);
    
    // Deduplicate by code
    const uniqueCourses = [];
    const seen = new Set();
    for (const row of res.rows) {
      if (!seen.has(row.code)) {
        seen.add(row.code);
        uniqueCourses.push(row);
      }
    }

    return NextResponse.json(uniqueCourses);
  } catch (error) {
    console.error('Courses API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
