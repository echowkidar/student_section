import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://postgres:strongpassword@217.217.249.153:5432/postgres',
});

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'admission'; // 'admission' or 'continuation'
  const client = await pool.connect();

  try {
    const tableName = type === 'continuation' ? 'continuation_course_code_fee' : 'admission_course_code_fee';
    const paymentTypeFilter = type === 'admission' ? 'Admission Form Fee' : 'Continuation Fee'; 
    // Usually the user might just want all, we can filter or not. Let's just get everything and filter in frontend or just return all payments.
    
    // 1. Get Heads
    const headsRes = await client.query(`
      SELECT "HEAD_NAME", "SHORT_HEAD_NAME", "HEAD_CODE", "CATEGORY"
      FROM head_of_account_name_code
      ORDER BY "HEAD_CODE"
    `);

    // 2. Get Master Fee Structure (all courses)
    const feesRes = await client.query(`
      SELECT *
      FROM ${tableName}
      WHERE "CLASSCODE" IS NOT NULL
    `);

    // 3. Get Student Counts from Payment table
    // We group by programme_code and try to extract residential status.
    const countsRes = await client.query(`
      SELECT 
        CASE WHEN notes IS NOT NULL AND notes LIKE '{%' 
          THEN notes::json->>'programme_code' 
          ELSE 'Unknown' 
        END as programme_code,
        
        -- Simplified logic: If description has 'NR' or notes->>'hall_code' is 'NR', it's Non-Resident.
        -- Given user's earlier note: "R for Resident of hall and NR Non-Resident"
        CASE 
          WHEN notes IS NOT NULL AND notes LIKE '{%' AND (notes::json->>'residential_status' IN ('R', 'Resident') OR notes::json->>'hall_code' IN ('R', 'Resident')) THEN 'R'
          WHEN description LIKE '%|R|%' THEN 'R'
          ELSE 'N' -- default to NR (N in database)
        END as r_nr,
        
        COUNT(*) as student_count,
        SUM(CAST(amount AS NUMERIC)) as total_collected
      FROM payment
      WHERE notes IS NOT NULL AND notes LIKE '{%'
      GROUP BY 
        CASE WHEN notes IS NOT NULL AND notes LIKE '{%' THEN notes::json->>'programme_code' ELSE 'Unknown' END,
        CASE 
          WHEN notes IS NOT NULL AND notes LIKE '{%' AND (notes::json->>'residential_status' IN ('R', 'Resident') OR notes::json->>'hall_code' IN ('R', 'Resident')) THEN 'R'
          WHEN description LIKE '%|R|%' THEN 'R'
          ELSE 'N'
        END
    `);

    // 4. Get Course Groups
    let courseGroups = [];
    try {
      const groupsRes = await client.query('SELECT * FROM course_groups');
      const mappingRes = await client.query('SELECT * FROM course_group_mapping');
      
      courseGroups = groupsRes.rows.map(g => ({
        ...g,
        courses: mappingRes.rows.filter(m => m.group_id === g.id).map(m => m.course_code)
      }));
    } catch (e) {
      console.error('Could not fetch course groups (table might not exist):', e.message);
    }

    return NextResponse.json({
      heads: headsRes.rows,
      feeMaster: feesRes.rows,
      studentCounts: countsRes.rows,
      courseGroups
    });
  } catch (error) {
    console.error('Distributed API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
