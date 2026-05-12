import { query } from '../db/index.js';

export const MetadataModel = {
  // ===================================
  // COURSES
  // ===================================
  getAllCourses: async (includeInactive = false) => {
    const sql = includeInactive 
      ? 'SELECT * FROM courses ORDER BY name'
      : 'SELECT * FROM courses WHERE is_active = true ORDER BY name';
    const { rows } = await query(sql);
    return rows;
  },

  getCourseById: async (id: number) => {
    const sql = 'SELECT * FROM courses WHERE id = $1';
    const { rows } = await query(sql, [id]);
    return rows[0] || null;
  },

  createCourse: async (name: string) => {
    const sql = 'INSERT INTO courses (name, is_active) VALUES ($1, true) RETURNING *';
    const { rows } = await query(sql, [name]);
    return rows[0];
  },

  updateCourse: async (id: number, name: string) => {
    const sql = 'UPDATE courses SET name = $1 WHERE id = $2 RETURNING *';
    const { rows } = await query(sql, [name, id]);
    return rows[0];
  },

  toggleCourseStatus: async (id: number) => {
    const sql = 'UPDATE courses SET is_active = NOT is_active WHERE id = $1 RETURNING *';
    const { rows } = await query(sql, [id]);
    return rows[0];
  },

  deleteCourse: async (id: number) => {
    const sql = 'DELETE FROM courses WHERE id = $1 RETURNING *';
    const { rows } = await query(sql, [id]);
    return rows[0];
  },

  // ===================================
  // YEARS
  // ===================================
  getAllYears: async (includeInactive = false) => {
    const sql = includeInactive
      ? 'SELECT * FROM years ORDER BY id'
      : 'SELECT * FROM years WHERE is_active = true ORDER BY id';
    const { rows } = await query(sql);
    return rows;
  },

  // ===================================
  // SHS STRANDS
  // ===================================
  getAllStrands: async (includeInactive = false) => {
    const sql = includeInactive
      ? 'SELECT * FROM shs_strands ORDER BY name'
      : 'SELECT * FROM shs_strands WHERE is_active = true ORDER BY name';
    const { rows } = await query(sql);
    return rows;
  },

  getStrandById: async (id: number) => {
    const sql = 'SELECT * FROM shs_strands WHERE id = $1';
    const { rows } = await query(sql, [id]);
    return rows[0] || null;
  },

  createStrand: async (name: string, acronym: string) => {
    const sql = 'INSERT INTO shs_strands (name, acronym, is_active) VALUES ($1, $2, true) RETURNING *';
    const { rows } = await query(sql, [name, acronym]);
    return rows[0];
  },

  updateStrand: async (id: number, name: string, acronym: string) => {
    const sql = 'UPDATE shs_strands SET name = $1, acronym = $2 WHERE id = $3 RETURNING *';
    const { rows } = await query(sql, [name, acronym, id]);
    return rows[0];
  },

  toggleStrandStatus: async (id: number) => {
    const sql = 'UPDATE shs_strands SET is_active = NOT is_active WHERE id = $1 RETURNING *';
    const { rows } = await query(sql, [id]);
    return rows[0];
  },

  deleteStrand: async (id: number) => {
    const sql = 'DELETE FROM shs_strands WHERE id = $1 RETURNING *';
    const { rows } = await query(sql, [id]);
    return rows[0];
  },

  // ===================================
  // SHS GRADES
  // ===================================
  getAllGrades: async (includeInactive = false) => {
    const sql = includeInactive
      ? 'SELECT * FROM shs_grades ORDER BY id'
      : 'SELECT * FROM shs_grades WHERE is_active = true ORDER BY id';
    const { rows } = await query(sql);
    return rows;
  },

  // ===================================
  // FACULTY DEPARTMENTS
  // ===================================
  getAllDepartments: async (includeInactive = false) => {
    const sql = includeInactive
      ? 'SELECT * FROM faculty_department ORDER BY department_name'
      : 'SELECT * FROM faculty_department WHERE is_active = true ORDER BY department_name';
    const { rows } = await query(sql);
    return rows;
  },

  getDepartmentById: async (id: number) => {
    const sql = 'SELECT * FROM faculty_department WHERE id = $1';
    const { rows } = await query(sql, [id]);
    return rows[0] || null;
  },

  createDepartment: async (department_name: string) => {
    const sql = 'INSERT INTO faculty_department (department_name, is_active) VALUES ($1, true) RETURNING *';
    const { rows } = await query(sql, [department_name]);
    return rows[0];
  },

  updateDepartment: async (id: number, department_name: string) => {
    const sql = 'UPDATE faculty_department SET department_name = $1 WHERE id = $2 RETURNING *';
    const { rows } = await query(sql, [department_name, id]);
    return rows[0];
  },

  toggleDepartmentStatus: async (id: number) => {
    const sql = 'UPDATE faculty_department SET is_active = NOT is_active WHERE id = $1 RETURNING *';
    const { rows } = await query(sql, [id]);
    return rows[0];
  },

  deleteDepartment: async (id: number) => {
    const sql = 'DELETE FROM faculty_department WHERE id = $1 RETURNING *';
    const { rows } = await query(sql, [id]);
    return rows[0];
  },
};
