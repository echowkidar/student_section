import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const pool = new Pool({
  connectionString: 'postgresql://postgres:strongpassword@217.217.249.153:5432/postgres',
});

const JWT_SECRET = process.env.JWT_SECRET || 'sfm-secret-key-2024';

async function checkAccess() {
  let client;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sfm_session')?.value;
    if (!token) return false;
    const decoded = jwt.verify(token, JWT_SECRET);
    
    client = await pool.connect();
    const res = await client.query('SELECT role FROM users WHERE id = $1', [decoded.id]);
    if (res.rows.length > 0) {
      const role = res.rows[0].role;
      if (role === 'admin' || role === 'sub admin' || role === 'sub_admin') {
        return true;
      }
    }
  } catch (e) {
  } finally {
    if (client) client.release();
  }
  return false;
}

export async function POST(request) {
  if (!(await checkAccess())) {
    return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
  }

  const data = await request.json();
  const { classcode, type, feeBreakdown, isBulk, groupCourses } = data;

  if (!classcode || !feeBreakdown) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const tableName = type === 'admission' ? 'admission_course_code_fee' : 'continuation_course_code_fee';
  
  // Determine which courses to update
  const coursesToUpdate = isBulk && groupCourses && groupCourses.length > 0 
    ? groupCourses 
    : [classcode];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const code of coursesToUpdate) {
      // For each course, update the rows based on R_NR, IE, SEX combinations
      for (const row of feeBreakdown) {
        // Construct SET clause dynamically based on available heads
        const setClauses = [];
        const values = [];
        let paramIndex = 1;

        // Base fields to update
        const fieldsToUpdate = ['TOT_AMT', 'CATA', 'CATB', 'CATC', 'CATD'];
        // Add dynamic head columns
        for (const key of Object.keys(row)) {
          if (key.match(/^[A-D]\d{5}$/)) { // matches A50001, B50201, etc.
            fieldsToUpdate.push(key);
          }
        }

        for (const field of fieldsToUpdate) {
          if (row[field] !== undefined) {
            setClauses.push(`"${field}" = $${paramIndex}`);
            // if empty string, set null, else value
            values.push(row[field] === '' ? null : row[field]);
            paramIndex++;
          }
        }

        if (setClauses.length > 0) {
          // Add WHERE conditions
          values.push(code); // CLASSCODE
          values.push(row.R_NR);
          values.push(row.IE);
          values.push(row.SEX);

          const query = `
            UPDATE ${tableName}
            SET ${setClauses.join(', ')}
            WHERE "CLASSCODE" = $${paramIndex}
              AND "R_NR" = $${paramIndex + 1}
              AND "IE" = $${paramIndex + 2}
              AND "SEX" = $${paramIndex + 3}
          `;

          await client.query(query, values);
        }
      }
    }

    await client.query('COMMIT');
    return NextResponse.json({ success: true, updatedCourses: coursesToUpdate });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating fee structure:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
