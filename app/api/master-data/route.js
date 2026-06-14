import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:strongpassword@217.217.249.153:5432/postgres',
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

export async function GET(request) {
  if (!(await checkAccess())) {
    return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table') || 'halls';

  const client = await pool.connect();
  try {
    if (table === 'halls') {
      const res = await client.query('SELECT * FROM hall_name_code');
      return NextResponse.json({ data: res.rows, columns: ['Abdullah Hall', 'Girls', 'ABD'] });
    }
    
    if (table === 'heads') {
      const res = await client.query('SELECT * FROM head_of_account_name_code ORDER BY "HEAD_CODE"');
      return NextResponse.json({ data: res.rows, columns: ['HEAD_NAME', 'SHORT_HEAD_NAME', 'HEAD_CODE', 'CATEGORY'] });
    }

    if (table === 'admission_courses') {
      const res = await client.query(`
        SELECT DISTINCT "CLASSCODE", "COURSE_O", "CLASS", "FACULTY", "FACNAME", "DURATION",
          MIN(CAST("TOT_AMT" AS NUMERIC)) as min_fee,
          MAX(CAST("TOT_AMT" AS NUMERIC)) as max_fee
        FROM admission_course_code_fee
        GROUP BY "CLASSCODE", "COURSE_O", "CLASS", "FACULTY", "FACNAME", "DURATION"
        ORDER BY "CLASS"
      `);
      return NextResponse.json({ data: res.rows });
    }

    if (table === 'continuation_courses') {
      const res = await client.query(`
        SELECT DISTINCT "CLASSCODE", "COURSE_O", "CLASS", "FACULTY", "FACNAME", "DURATION",
          MIN(CAST("TOT_AMT" AS NUMERIC)) as min_fee,
          MAX(CAST("TOT_AMT" AS NUMERIC)) as max_fee
        FROM continuation_course_code_fee
        GROUP BY "CLASSCODE", "COURSE_O", "CLASS", "FACULTY", "FACNAME", "DURATION"
        ORDER BY "CLASS"
      `);
      return NextResponse.json({ data: res.rows });
    }

    return NextResponse.json({ error: 'Invalid table parameter' }, { status: 400 });
  } catch (error) {
    console.error('Master Data API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function POST(request) {
  if (!(await checkAccess())) {
    return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
  }

  const client = await pool.connect();
  try {
    const body = await request.json();
    const { table, data } = body;

    if (table === 'halls') {
      const res = await client.query(
        `INSERT INTO hall_name_code ("Abdullah Hall", "Girls", "ABD") VALUES ($1, $2, $3) RETURNING *`,
        [data.name, data.gender, data.code]
      );
      return NextResponse.json({ success: true, data: res.rows[0] });
    }

    if (table === 'heads') {
      const res = await client.query(
        `INSERT INTO head_of_account_name_code ("HEAD_NAME", "SHORT_HEAD_NAME", "HEAD_CODE", "CATEGORY") VALUES ($1, $2, $3, $4) RETURNING *`,
        [data.HEAD_NAME, data.SHORT_HEAD_NAME, data.HEAD_CODE, data.CATEGORY]
      );
      return NextResponse.json({ success: true, data: res.rows[0] });
    }

    if (table === 'admission_courses' || table === 'continuation_courses') {
      const tableName = table === 'admission_courses' ? 'admission_course_code_fee' : 'continuation_course_code_fee';
      await client.query('BEGIN');
      const combos = [
        { rnr: 'N', ie: 'I', sex: 'M' }, { rnr: 'N', ie: 'I', sex: 'F' },
        { rnr: 'N', ie: 'E', sex: 'M' }, { rnr: 'N', ie: 'E', sex: 'F' },
        { rnr: 'R', ie: 'I', sex: 'M' }, { rnr: 'R', ie: 'I', sex: 'F' },
        { rnr: 'R', ie: 'E', sex: 'M' }, { rnr: 'R', ie: 'E', sex: 'F' }
      ];
      
      for (const c of combos) {
        await client.query(
          `INSERT INTO ${tableName} ("CLASSCODE", "COURSE_O", "CLASS", "FACULTY", "FACNAME", "DURATION", "R_NR", "IE", "SEX", "TOT_AMT")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, '0.00')`,
          [data.CLASSCODE, data.COURSE_O, data.CLASS, data.FACULTY, data.FACNAME, data.DURATION, c.rnr, c.ie, c.sex]
        );
      }
      await client.query('COMMIT');
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid table parameter' }, { status: 400 });
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('Master Data POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}

export async function PUT(request) {
  if (!(await checkAccess())) {
    return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
  }

  const client = await pool.connect();
  try {
    const body = await request.json();
    const { table, data, id } = body;

    if (table === 'halls') {
      const res = await client.query(
        `UPDATE hall_name_code SET "Abdullah Hall" = $1, "Girls" = $2, "ABD" = $3 WHERE id = $4 RETURNING *`,
        [data.name, data.gender, data.code, id]
      );
      return NextResponse.json({ success: true, data: res.rows[0] });
    }

    if (table === 'heads') {
      const res = await client.query(
        `UPDATE head_of_account_name_code SET "HEAD_NAME" = $1, "SHORT_HEAD_NAME" = $2, "CATEGORY" = $3, "HEAD_CODE" = $4 WHERE "HEAD_CODE" = $5 RETURNING *`,
        [data.HEAD_NAME, data.SHORT_HEAD_NAME, data.CATEGORY, data.HEAD_CODE, id]
      );
      return NextResponse.json({ success: true, data: res.rows[0] });
    }
    
    // Note: Course PUT is handled by /api/master-data/edit-fee

    return NextResponse.json({ error: 'Invalid table parameter' }, { status: 400 });
  } catch (error) {
    console.error('Master Data PUT Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(request) {
  if (!(await checkAccess())) {
    return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table');
  const id = searchParams.get('id');

  const client = await pool.connect();
  try {
    if (table === 'halls') {
      await client.query(`DELETE FROM hall_name_code WHERE id = $1`, [id]);
      return NextResponse.json({ success: true });
    }

    if (table === 'heads') {
      await client.query(`DELETE FROM head_of_account_name_code WHERE "HEAD_CODE" = $1`, [id]);
      return NextResponse.json({ success: true });
    }

    if (table === 'admission_courses' || table === 'continuation_courses') {
      const tableName = table === 'admission_courses' ? 'admission_course_code_fee' : 'continuation_course_code_fee';
      await client.query(`DELETE FROM ${tableName} WHERE "CLASSCODE" = $1`, [id]);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid table parameter' }, { status: 400 });
  } catch (error) {
    console.error('Master Data DELETE Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
