import pool from '../db.js';

// POST /students
export const createStudent = async (req, res) => {
  const s = req.body;

  const queryText = `
    INSERT INTO students (
      student_id, email, password, prefix_th, first_name_th, last_name_th,
      prefix_en, first_name_en, last_name_en, gender, birth_date, nationality, phone,
      address_city, address_street, address_country, address_province, address_postal_code,
      workplace, degree, program_id, department_id, faculty, plan,
      admit_year, admit_semester, expected_graduation_year, expected_graduation_semester,
      current_academic_year, current_semester, status, status_update_date,
      thesis_title_th, thesis_title_en, proposal_submission_date, proposal_approval_date, proposal_status,
      outline_submission_date, outline_approval_date, final_defense_request_date, final_defense_date, final_defense_status,
      thesis_completion_date, graduation_date, main_advisor_id, co_advisor1_id, co_advisor2_id,
      english_test_type, english_test_score, english_test_date, english_test_status,
      publications, profile_image_url, signature_base64,
      last_login, account_created_date
    ) VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10, $11, $12, $13,
      $14, $15, $16, $17, $18,
      $19, $20, $21, $22, $23, $24,
      $25, $26, $27, $28,
      $29, $30, $31, $32, $33,
      $34, $35, $36, $37, $38,
      $39, $40, $41, $42, $43,
      $44, $45, $46, $47,
      $48, $49, $50, $51, $52
    )
  `;

  const values = [
    s.student_id, s.email, s.password, s.prefix_th, s.first_name_th, s.last_name_th,
    s.prefix_en, s.first_name_en, s.last_name_en, s.gender, s.birth_date ? s.birth_date.split('T')[0] : null, s.nationality, s.phone,
    s.address?.city, s.address?.street, s.address?.country, s.address?.province, s.address?.postal_code,
    s.workplace, s.degree, s.program_id, s.department_id, s.faculty, s.plan,
    s.admit_year, s.admit_semester, s.expected_graduation_year, s.expected_graduation_semester,
    s.current_academic_year, s.current_semester, s.status, s.status_update_date ? s.status_update_date.split('T')[0] : null,
    s.thesis_title_th, s.thesis_title_en,
    s.proposal_submission_date ? s.proposal_submission_date.split('T')[0] : null,
    s.proposal_approval_date ? s.proposal_approval_date.split('T')[0] : null,
    s.proposal_status,
    s.outline_submission_date ? s.outline_submission_date.split('T')[0] : null,
    s.outline_approval_date ? s.outline_approval_date.split('T')[0] : null,
    s.final_defense_request_date ? s.final_defense_request_date.split('T')[0] : null,
    s.final_defense_date ? s.final_defense_date.split('T')[0] : null,
    s.final_defense_status,
    s.thesis_completion_date ? s.thesis_completion_date.split('T')[0] : null,
    s.graduation_date ? s.graduation_date.split('T')[0] : null,
    s.main_advisor_id, s.co_advisor1_id, s.co_advisor2_id,
    s.english_test_type, s.english_test_score, s.english_test_date ? s.english_test_date.split('T')[0] : null, s.english_test_status,
    JSON.stringify(s.publications || []), s.profile_image_url, s.signature_base64,
    s.last_login ? new Date(s.last_login) : null,
    s.account_created_date ? new Date(s.account_created_date) : null
  ];

  try {
    await pool.query(queryText, values);
    res.status(201).json({ message: 'Student added successfully' });
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      res.status(409).json({ message: 'student_id already exists' });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

// GET /students
export const getAllStudents = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM students');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /students/:student_id
export const getStudentById = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM students WHERE student_id = $1', [req.params.student_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// อัปโหลดรูปโปรไฟล์
export const uploadProfileImage = async (req, res) => {
  try {
    const student_id = req.params.student_id;
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const profile_image_url = `/uploads/profile_images/${req.file.filename}`;
    await pool.query('UPDATE students SET profile_image_url = $1 WHERE student_id = $2', [profile_image_url, student_id]);

    res.json({ message: 'Profile image uploaded', url: profile_image_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// อัปโหลดลายเซ็น
export const uploadSignatureFile = async (req, res) => {
  try {
    const student_id = req.params.student_id;
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const signature_url = `/uploads/signatures/${req.file.filename}`;
    await pool.query('UPDATE students SET signature_base64 = $1 WHERE student_id = $2', [signature_url, student_id]);

    res.json({ message: 'Signature uploaded', url: signature_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

