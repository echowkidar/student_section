const {Pool}=require('pg'); 
const pool=new Pool({connectionString:'postgresql://postgres:strongpassword@217.217.249.153:5432/postgres'}); 

async function run() {
  try {
    const categoryCHeadsRes = await pool.query(`
      SELECT "HEAD_CODE", "SHORT_HEAD_NAME" 
      FROM head_of_account_name_code 
      WHERE "CATEGORY" = 'C' 
      ORDER BY "HEAD_CODE"
    `);
    const categoryCHeads = categoryCHeadsRes.rows;
    const catCHeadCodes = categoryCHeads.map(h => h.HEAD_CODE);

    const columnsRes = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name IN ('admission_course_code_fee', 'continuation_course_code_fee')
    `);
    const validColumns = new Set(columnsRes.rows.map(r => r.column_name));
    
    const validCatCHeads = catCHeadCodes.filter(code => validColumns.has(code));

    let selectCatC_A = validCatCHeads.map(code => `SUM(CAST(COALESCE(NULLIF(a."${code}", ''), '0') AS NUMERIC)) as "${code}"`).join(', ');
    let selectCatC_C = validCatCHeads.map(code => `SUM(CAST(COALESCE(NULLIF(c."${code}", ''), '0') AS NUMERIC)) as "${code}"`).join(', ');
    let selectCatC_MB = validCatCHeads.map(code => `SUM("${code}") as "${code}"`).join(', ');
    let selectCatC_Final = validCatCHeads.map(code => `mb."${code}"`).join(', ');

    if (!selectCatC_A) {
      selectCatC_A = '0 as dummy';
      selectCatC_C = '0 as dummy';
      selectCatC_MB = '0 as dummy';
      selectCatC_Final = '0 as dummy';
    }

    const collectionsRes = await pool.query(`
      WITH PaymentDemographics AS (
        SELECT 
          CASE WHEN notes IS NOT NULL AND notes LIKE '{%' THEN notes::json->>'hall_code' ELSE NULL END as hall_code,
          CASE WHEN notes IS NOT NULL AND notes LIKE '{%' THEN notes::json->>'programme_code' ELSE NULL END as class_code,
          CASE WHEN notes IS NOT NULL AND notes LIKE '{%' THEN notes::json->>'residential_status' ELSE NULL END as r_nr,
          CASE WHEN h."Girls" = 'Girls' THEN 'F' ELSE 'M' END as sex,
          CASE WHEN notes IS NOT NULL AND notes LIKE '{%' THEN notes::json->>'type' ELSE NULL END as payment_type,
          CAST(amount AS NUMERIC) as amount
        FROM payment p
        LEFT JOIN hall_name_code h ON h."ABD" = (CASE WHEN p.notes IS NOT NULL AND p.notes LIKE '{%' THEN p.notes::json->>'hall_code' ELSE NULL END)
        WHERE p.status IN ('captured', 'Success')
      ),
      HallCollections AS (
        SELECT 
          hall_code,
          COUNT(*) as student_count,
          SUM(amount) as total_collected
        FROM PaymentDemographics
        GROUP BY 1
      ),
      CategoryC_Breakup AS (
        SELECT 
          pd.hall_code,
          ${selectCatC_A}
        FROM PaymentDemographics pd
        LEFT JOIN admission_course_code_fee a 
          ON pd.payment_type = 'Admission Form Fee' 
          AND a."CLASSCODE" = pd.class_code 
          AND a."R_NR" = LEFT(pd.r_nr, 1) 
          AND a."SEX" = pd.sex
        WHERE pd.payment_type IN ('Admission Form Fee', 'Admission Fee')
        GROUP BY 1

        UNION ALL

        SELECT 
          pd.hall_code,
          ${selectCatC_C}
        FROM PaymentDemographics pd
        LEFT JOIN continuation_course_code_fee c 
          ON pd.payment_type = 'Continuation Fee'
          AND c."CLASSCODE" = pd.class_code 
          AND c."R_NR" = LEFT(pd.r_nr, 1) 
          AND c."SEX" = pd.sex
        WHERE pd.payment_type = 'Continuation Fee'
        GROUP BY 1
      ),
      MergedBreakup AS (
        SELECT 
          hall_code,
          ${selectCatC_MB}
        FROM CategoryC_Breakup
        GROUP BY 1
      )
      SELECT 
        hc.hall_code as code,
        hc.student_count as "studentCount",
        hc.total_collected as "totalCollected",
        COALESCE(h."Abdullah Hall", 'Unknown Hall') as name,
        COALESCE(h."Girls", 'Unknown') as gender,
        ${selectCatC_Final}
      FROM HallCollections hc
      LEFT JOIN hall_name_code h ON h."ABD" = hc.hall_code
      LEFT JOIN MergedBreakup mb ON mb.hall_code = hc.hall_code
      ORDER BY hc.total_collected DESC
    `);
    console.log(collectionsRes.rows);
  } catch(e) {
    console.error(e.message);
  }
  process.exit(0);
}
run();
