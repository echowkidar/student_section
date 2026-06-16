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

// GET all groups and their mapped courses
export async function GET() {
  // We allow GET for all users so they can use it in reports dropdown
  const client = await pool.connect();
  try {
    const groupsRes = await client.query('SELECT * FROM course_groups ORDER BY group_name');
    const mappingRes = await client.query('SELECT * FROM course_group_mapping');

    const groups = groupsRes.rows.map(g => ({
      ...g,
      courses: mappingRes.rows.filter(m => m.group_id === g.id).map(m => m.course_code)
    }));

    return NextResponse.json(groups);
  } catch (error) {
    console.error('Error fetching course groups:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

// POST create a new group or update courses in a group
export async function POST(request) {
  if (!(await checkAccess())) {
    return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
  }

  const data = await request.json();
  const { action, group_name, group_id, course_codes } = data;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    if (action === 'create') {
      const res = await client.query(
        'INSERT INTO course_groups (group_name) VALUES ($1) RETURNING *',
        [group_name]
      );
      await client.query('COMMIT');
      return NextResponse.json(res.rows[0]);
    } 
    
    if (action === 'update_mappings' && group_id) {
      if (course_codes && course_codes.length > 1) {
        // Enforce Strict Grouping: All courses must have identical fee structures
        const getFeeStructure = async (code) => {
          let res = await client.query('SELECT * FROM admission_course_code_fee WHERE "CLASSCODE" = $1', [code]);
          if (res.rows.length === 0) {
            res = await client.query('SELECT * FROM continuation_course_code_fee WHERE "CLASSCODE" = $1', [code]);
          }
          const ignored = ['CLASSCODE', 'COURSE_O', 'CLASS', 'FACULTY', 'FACNAME', 'DURATION', 'FLG', 'FLG1', 'FLAG', 'C_C', 'C_NO'];
          return res.rows.map(row => {
            const cleaned = { ...row };
            ignored.forEach(k => delete cleaned[k]);
            return cleaned;
          }).sort((a, b) => {
            const keyA = `${a.R_NR}-${a.IE}-${a.SEX}`;
            const keyB = `${b.R_NR}-${b.IE}-${b.SEX}`;
            return keyA.localeCompare(keyB);
          });
        };

        const baseStructure = JSON.stringify(await getFeeStructure(course_codes[0]));
        for (let i = 1; i < course_codes.length; i++) {
          const compareStructure = JSON.stringify(await getFeeStructure(course_codes[i]));
          if (baseStructure !== compareStructure) {
            throw new Error(`Fee structure of ${course_codes[i]} does not match the group. Cannot add to group.`);
          }
        }
      }

      // Delete old mappings
      await client.query('DELETE FROM course_group_mapping WHERE group_id = $1', [group_id]);
      
      // Insert new mappings
      if (course_codes && course_codes.length > 0) {
        for (const code of course_codes) {
          await client.query(
            'INSERT INTO course_group_mapping (group_id, course_code) VALUES ($1, $2)',
            [group_id, code]
          );
        }
      }
      await client.query('COMMIT');
      return NextResponse.json({ success: true });
    }

    throw new Error('Invalid action');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in course-groups POST:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

// DELETE a group
export async function DELETE(request) {
  if (!(await checkAccess())) {
    return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const client = await pool.connect();
  try {
    await client.query('DELETE FROM course_groups WHERE id = $1', [id]);
    // Note: mappings are deleted automatically due to ON DELETE CASCADE
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting course group:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
