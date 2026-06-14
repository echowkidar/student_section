import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://postgres:strongpassword@217.217.249.153:5432/postgres',
});

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const search = searchParams.get('search') || '';
  const paymentType = searchParams.get('type') || '';
  const method = searchParams.get('method') || '';
  const dateFrom = searchParams.get('dateFrom') || '';
  const dateTo = searchParams.get('dateTo') || '';
  const hall = searchParams.get('hall') || '';
  const courseCode = searchParams.get('courseCode') || searchParams.get('programme') || '';
  const courseName = searchParams.get('courseName') || '';
  const residential = searchParams.get('residential') || '';
  const sortBy = searchParams.get('sortBy') || 'created_at';
  const order = searchParams.get('order') === 'asc' ? 'ASC' : 'DESC';
  const offset = (page - 1) * limit;

  const client = await pool.connect();
  try {
    let conditions = [];
    let params = [];
    let paramIndex = 1;

    // Search across multiple fields
    if (search) {
      conditions.push(`(
        id ILIKE $${paramIndex} OR 
        email ILIKE $${paramIndex} OR 
        contact ILIKE $${paramIndex} OR
        description ILIKE $${paramIndex} OR
        CASE WHEN notes IS NOT NULL AND notes LIKE '{%' THEN notes::json->>'name' ELSE '' END ILIKE $${paramIndex} OR
        CASE WHEN notes IS NOT NULL AND notes LIKE '{%' THEN notes::json->>'roll_no' ELSE '' END ILIKE $${paramIndex} OR
        CASE WHEN notes IS NOT NULL AND notes LIKE '{%' THEN notes::json->>'enrolment' ELSE '' END ILIKE $${paramIndex} OR
        CASE WHEN notes IS NOT NULL AND notes LIKE '{%' THEN CAST(notes::json->>'application_no' AS TEXT) ELSE '' END ILIKE $${paramIndex}
      )`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Filter by payment type
    if (paymentType) {
      conditions.push(`split_part(description, '|', 1) = $${paramIndex}`);
      params.push(paymentType);
      paramIndex++;
    }

    // Filter by method
    if (method) {
      conditions.push(`method = $${paramIndex}`);
      params.push(method);
      paramIndex++;
    }

    // Filter by date range
    if (dateFrom) {
      conditions.push(`created_at >= $${paramIndex}`);
      params.push(dateFrom);
      paramIndex++;
    }
    if (dateTo) {
      conditions.push(`created_at <= $${paramIndex}`);
      params.push(dateTo);
      paramIndex++;
    }

    // Filter by hall code
    if (hall) {
      conditions.push(`(
        CASE WHEN notes IS NOT NULL AND notes LIKE '{%' 
        THEN notes::json->>'hall_code' 
        ELSE '' END = $${paramIndex}
      )`);
      params.push(hall);
      paramIndex++;
    }

    // Filter by course code
    if (courseCode) {
      conditions.push(`(
        CASE WHEN notes IS NOT NULL AND notes LIKE '{%' 
        THEN notes::json->>'programme_code' 
        ELSE '' END ILIKE $${paramIndex}
      )`);
      params.push(`%${courseCode}%`);
      paramIndex++;
    }

    // Filter by course name
    if (courseName) {
      const courseCodesRes = await client.query(`
        SELECT "CLASSCODE" FROM admission_course_code_fee WHERE "CLASS" ILIKE $1
        UNION
        SELECT "CLASSCODE" FROM continuation_course_code_fee WHERE "CLASS" ILIKE $1
      `, [`%${courseName}%`]);
      
      const matchedCodes = courseCodesRes.rows.map(r => r.CLASSCODE);
      
      if (matchedCodes.length > 0) {
        const codePlaceholders = matchedCodes.map((_, i) => `$${paramIndex + i}`).join(', ');
        conditions.push(`(
          COALESCE(
            CASE WHEN payment.notes IS NOT NULL AND payment.notes LIKE '{%' 
            THEN payment.notes::json->>'programme_code' 
            ELSE NULL END,
            CASE WHEN payment.notes IS NOT NULL AND payment.notes LIKE '{%' 
            THEN payment.notes::json->>'course_code' 
            ELSE NULL END,
            NULLIF(split_part(payment.description, '|', 4), '')
          ) IN (${codePlaceholders})
        )`);
        params.push(...matchedCodes);
        paramIndex += matchedCodes.length;
      } else {
        conditions.push(`1 = 0`);
      }
    }

    // Filter by residential status
    if (residential) {
      if (residential === 'R') {
        conditions.push(`(
          CASE WHEN notes IS NOT NULL AND notes LIKE '{%' 
          THEN notes::json->>'residential_status' 
          ELSE '' END IN ('YES', 'R', 'Resident', 'RR')
        )`);
      } else if (residential === 'NR') {
        conditions.push(`(
          CASE WHEN notes IS NOT NULL AND notes LIKE '{%' 
          THEN notes::json->>'residential_status' 
          ELSE '' END IN ('NO', 'NR', 'Non-Resident')
        )`);
      }
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    // Count total matching records
    const countRes = await client.query(
      `SELECT COUNT(*) as total, SUM(CAST(amount AS NUMERIC)) as total_amount FROM payment ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0].total);
    const totalAmount = parseFloat(countRes.rows[0].total_amount) || 0;

    const validSortColumns = {
      'created_at': 'payment.created_at',
      'student_name': "COALESCE(CASE WHEN payment.notes IS NOT NULL AND payment.notes LIKE '{%' THEN payment.notes::json->>'name' ELSE NULL END, NULLIF(split_part(payment.description, '|', 7), ''))",
      'roll_no': "COALESCE(CASE WHEN payment.notes IS NOT NULL AND payment.notes LIKE '{%' THEN payment.notes::json->>'roll_no' ELSE NULL END, NULLIF(split_part(payment.description, '|', 2), ''))",
      'enrolment': "COALESCE(CASE WHEN payment.notes IS NOT NULL AND payment.notes LIKE '{%' THEN payment.notes::json->>'enrolment' ELSE NULL END, NULLIF(split_part(payment.description, '|', 8), ''))",
      'programme_code': "COALESCE(CASE WHEN payment.notes IS NOT NULL AND payment.notes LIKE '{%' THEN payment.notes::json->>'programme_code' ELSE NULL END, CASE WHEN payment.notes IS NOT NULL AND payment.notes LIKE '{%' THEN payment.notes::json->>'course_code' ELSE NULL END, NULLIF(split_part(payment.description, '|', 4), ''))",
      'course_name': `COALESCE(a."CLASS", c."CLASS", CASE WHEN split_part(payment.description, '|', 1) = 'Admisson Fee' THEN NULLIF(split_part(payment.description, '|', 9), '') ELSE NULL END)`,
      'amount': 'payment.amount',
      'method': 'payment.method',
      'payment_type': "split_part(payment.description, '|', 1)"
    };
    const sortExpression = validSortColumns[sortBy] || 'payment.created_at';

    // Fetch paginated results
    const dataRes = await client.query(
      `SELECT 
        payment.id, payment.amount, payment.fee, payment."Gtot", payment.currency, payment.status, payment.order_id, payment.method,
        payment.amount_refunded, payment.refund_status, payment.captured, payment.description,
        payment.email, payment.contact, payment.created_at, payment.card_type, payment.card_network, payment.bank, payment.wallet, payment.vpa,
        CASE WHEN payment.notes IS NOT NULL AND payment.notes LIKE '{%' THEN payment.notes::json->>'name' ELSE NULL END as notes_name,
        COALESCE(CASE WHEN payment.notes IS NOT NULL AND payment.notes LIKE '{%' THEN payment.notes::json->>'name' ELSE NULL END, NULLIF(split_part(payment.description, '|', 7), '')) as student_name,
        COALESCE(CASE WHEN payment.notes IS NOT NULL AND payment.notes LIKE '{%' THEN payment.notes::json->>'roll_no' ELSE NULL END, NULLIF(split_part(payment.description, '|', 2), '')) as roll_no,
        COALESCE(CASE WHEN payment.notes IS NOT NULL AND payment.notes LIKE '{%' THEN payment.notes::json->>'enrolment' ELSE NULL END, NULLIF(split_part(payment.description, '|', 8), '')) as enrolment,
        COALESCE(
          CASE WHEN payment.notes IS NOT NULL AND payment.notes LIKE '{%' THEN payment.notes::json->>'programme_code' ELSE NULL END, 
          CASE WHEN payment.notes IS NOT NULL AND payment.notes LIKE '{%' THEN payment.notes::json->>'course_code' ELSE NULL END, 
          NULLIF(split_part(payment.description, '|', 4), '')
        ) as programme_code,
        CASE WHEN payment.notes IS NOT NULL AND payment.notes LIKE '{%' THEN payment.notes::json->>'hall_code' ELSE NULL END as hall_code,
        CASE WHEN payment.notes IS NOT NULL AND payment.notes LIKE '{%' THEN payment.notes::json->>'residential_status' ELSE NULL END as residential_status,
        CASE WHEN payment.notes IS NOT NULL AND payment.notes LIKE '{%' THEN CAST(payment.notes::json->>'application_no' AS TEXT) ELSE NULL END as application_no,
        CASE WHEN payment.notes IS NOT NULL AND payment.notes LIKE '{%' THEN payment.notes::json->>'mobile' ELSE NULL END as mobile,
        split_part(payment.description, '|', 1) as payment_type,
        COALESCE(a."CLASS", c."CLASS", CASE WHEN split_part(payment.description, '|', 1) = 'Admisson Fee' THEN NULLIF(split_part(payment.description, '|', 9), '') ELSE NULL END) as course_name
      FROM payment 
      LEFT JOIN (SELECT "CLASSCODE", MAX("CLASS") as "CLASS" FROM admission_course_code_fee GROUP BY "CLASSCODE") a 
        ON a."CLASSCODE" = COALESCE(CASE WHEN payment.notes IS NOT NULL AND payment.notes LIKE '{%' THEN payment.notes::json->>'programme_code' ELSE NULL END, CASE WHEN payment.notes IS NOT NULL AND payment.notes LIKE '{%' THEN payment.notes::json->>'course_code' ELSE NULL END, NULLIF(split_part(payment.description, '|', 4), ''))
      LEFT JOIN (SELECT "CLASSCODE", MAX("CLASS") as "CLASS" FROM continuation_course_code_fee GROUP BY "CLASSCODE") c 
        ON c."CLASSCODE" = COALESCE(CASE WHEN payment.notes IS NOT NULL AND payment.notes LIKE '{%' THEN payment.notes::json->>'programme_code' ELSE NULL END, CASE WHEN payment.notes IS NOT NULL AND payment.notes LIKE '{%' THEN payment.notes::json->>'course_code' ELSE NULL END, NULLIF(split_part(payment.description, '|', 4), ''))
      ${whereClause}
      ORDER BY ${sortExpression} ${order}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      data: dataRes.rows,
      pagination: {
        page,
        limit,
        total,
        totalAmount,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Payments API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
