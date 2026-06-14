import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://postgres:strongpassword@217.217.249.153:5432/postgres',
});

/* Head-of-Account-wise Report API
   Returns fee structure broken down by each head of account for a given course. */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const courseCode = searchParams.get('course') || '';
  const groupCourses = searchParams.get('groupCourses') || ''; // comma separated course codes
  const type = searchParams.get('type') || 'admission'; // admission or continuation
  const client = await pool.connect();

  try {
    // Get all heads of account
    const headsRes = await client.query(`
      SELECT "HEAD_NAME", "SHORT_HEAD_NAME", "HEAD_CODE", "CATEGORY"
      FROM head_of_account_name_code
      ORDER BY "HEAD_CODE"
    `);

    const tableName = type === 'continuation' 
      ? 'continuation_course_code_fee' 
      : 'admission_course_code_fee';

    // Get available courses for dropdown
    const coursesRes = await client.query(`
      SELECT DISTINCT "CLASSCODE", "CLASS", "FACNAME", "FACULTY"
      FROM ${tableName}
      WHERE "CLASSCODE" IS NOT NULL
      ORDER BY "CLASS"
    `);
    // Deduplicate by CLASSCODE
    const seen = new Set();
    const uniqueCourses = coursesRes.rows.filter(r => {
      if (seen.has(r.CLASSCODE)) return false;
      seen.add(r.CLASSCODE);
      return true;
    });

    let feeBreakdown = [];
    if (courseCode) {
      const feeRes = await client.query(`
        SELECT *
        FROM ${tableName}
        WHERE "CLASSCODE" = $1
        ORDER BY "R_NR", "IE", "SEX"
      `, [courseCode]);
      feeBreakdown = feeRes.rows;
    } else if (groupCourses) {
      const codes = groupCourses.split(',');
      if (codes.length > 0) {
        const placeholders = codes.map((_, i) => `$${i + 1}`).join(',');
        const feeRes = await client.query(`
          SELECT *
          FROM ${tableName}
          WHERE "CLASSCODE" IN (${placeholders})
          ORDER BY "CLASSCODE", "R_NR", "IE", "SEX"
        `, codes);
        feeBreakdown = feeRes.rows;
      }
    }

    // Get category-wise summary across all courses
    const categorySummary = await client.query(`
      SELECT 
        h."CATEGORY",
        h."HEAD_CODE",
        h."HEAD_NAME",
        h."SHORT_HEAD_NAME"
      FROM head_of_account_name_code h
      ORDER BY h."CATEGORY", h."HEAD_CODE"
    `);

    // Get Course Groups
    let courseGroups = [];
    try {
      const groupsRes = await client.query('SELECT * FROM course_groups');
      const mappingRes = await client.query('SELECT * FROM course_group_mapping');
      
      courseGroups = groupsRes.rows.map(g => ({
        ...g,
        courses: mappingRes.rows.filter(m => m.group_id === g.id).map(m => m.course_code)
      }));
    } catch (e) {
      console.error('Could not fetch course groups:', e.message);
    }

    return NextResponse.json({
      heads: headsRes.rows,
      courses: uniqueCourses,
      feeBreakdown,
      categorySummary: categorySummary.rows,
      courseGroups,
      type,
    });
  } catch (error) {
    console.error('Head Report API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
