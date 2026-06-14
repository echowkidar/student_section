import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:strongpassword@217.217.249.153:5432/postgres',
});

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'admission'; // admission or continuation
  const course = searchParams.get('course') || '';
  const faculty = searchParams.get('faculty') || '';
  const groupCourses = searchParams.get('groupCourses') || '';

  const client = await pool.connect();
  try {
    const tableName = type === 'continuation'
      ? 'continuation_course_code_fee'
      : 'admission_course_code_fee';

    let conditions = [];
    let params = [];
    let paramIndex = 1;

    if (groupCourses) {
      const coursesArr = groupCourses.split(',');
      const paramsList = coursesArr.map((_, i) => `$${paramIndex + i}`).join(',');
      conditions.push(`"CLASSCODE" IN (${paramsList})`);
      params.push(...coursesArr);
      paramIndex += coursesArr.length;
    } else if (course) {
      conditions.push(`"CLASSCODE" = $${paramIndex}`);
      params.push(course);
      paramIndex++;
    }
    if (faculty) {
      conditions.push(`"FACULTY" = $${paramIndex}`);
      params.push(faculty);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    // Get fee structure data
    const feeRes = await client.query(`
      SELECT * FROM ${tableName}
      ${whereClause}
      ORDER BY "CLASS", "R_NR", "IE", "SEX"
      LIMIT 200
    `, params);

    // Get courses for filter
    const coursesRes = await client.query(`
      SELECT DISTINCT "CLASSCODE", "CLASS", "FACNAME", "FACULTY"
      FROM ${tableName}
      ORDER BY "CLASS"
    `);
    const seen = new Set();
    const uniqueCourses = coursesRes.rows.filter(r => {
      if (seen.has(r.CLASSCODE)) return false;
      seen.add(r.CLASSCODE);
      return true;
    });

    // Get faculties for filter
    const facultyRes = await client.query(`
      SELECT DISTINCT "FACULTY", "FACNAME" 
      FROM ${tableName}
      WHERE "FACULTY" IS NOT NULL
      ORDER BY "FACNAME"
    `);
    const seenF = new Set();
    const uniqueFaculties = facultyRes.rows.filter(r => {
      if (seenF.has(r.FACULTY)) return false;
      seenF.add(r.FACULTY);
      return true;
    });

    // Get head of accounts for column mapping
    const headsRes = await client.query(`
      SELECT "HEAD_NAME", "SHORT_HEAD_NAME", "HEAD_CODE", "CATEGORY"
      FROM head_of_account_name_code
      ORDER BY "HEAD_CODE"
    `);

    // Get course groups for filter
    const groupsRes = await client.query(`
      SELECT g.id, g.group_name, array_agg(m.course_code) as courses
      FROM course_groups g
      LEFT JOIN course_group_mapping m ON g.id = m.group_id
      GROUP BY g.id, g.group_name
      ORDER BY g.group_name
    `);

    return NextResponse.json({
      feeStructure: feeRes.rows,
      courses: uniqueCourses,
      faculties: uniqueFaculties,
      courseGroups: groupsRes.rows,
      heads: headsRes.rows,
      type,
    });
  } catch (error) {
    console.error('Fee Structure API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
