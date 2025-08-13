import pool from '../db.js';

// POST /advisors
export const createAdvisor = async (req, res) => {
  const a = req.body;

  const queryText = `
    INSERT INTO advisors (
      advisor_id, email, password, prefix_th, first_name_th, last_name_th,
      prefix_en, first_name_en, last_name_en, academic_position, department_id, faculty,
      expertise, contact_email, office_phone, office_location,
      max_advisees_master, current_advisees_master,
      max_advisees_phd, current_advisees_phd,
      supervising_levels, profile_image_url, research_interests, publications_link
    ) VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10, $11, $12,
      $13, $14, $15, $16,
      $17, $18,
      $19, $20,
      $21, $22, $23, $24
    )
  `;

  const values = [
    a.advisor_id, a.email, a.password, a.prefix_th, a.first_name_th, a.last_name_th,
    a.prefix_en, a.first_name_en, a.last_name_en, a.academic_position, a.department_id, a.faculty,
    JSON.stringify(a.expertise || []), a.contact_email, a.office_phone, a.office_location,
    a.max_advisees_master, a.current_advisees_master,
    a.max_advisees_phd, a.current_advisees_phd,
    JSON.stringify(a.supervising_levels || []), a.profile_image_url, JSON.stringify(a.research_interests || []), a.publications_link
  ];

  try {
    await pool.query(queryText, values);
    res.status(201).json({ message: 'Advisor added successfully' });
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      res.status(409).json({ message: 'advisor_id already exists' });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

// GET /advisors
export const getAllAdvisors = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM advisors');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /advisors/:advisor_id
export const getAdvisorById = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM advisors WHERE advisor_id = $1', [req.params.advisor_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Advisor not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
