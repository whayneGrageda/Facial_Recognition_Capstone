import { query } from '../db/index.js';

export const MetadataModel = {
  // Courses
  getAllCourses: async () => {
    const sql = 'SELECT * FROM courses ORDER BY name';
    const { rows } = await query(sql);
    return rows;
  },

  // Years
  getAllYears: async () => {
    const sql = 'SELECT * FROM years ORDER BY id';
    const { rows } = await query(sql);
    return rows;
  },

  // SHS Strands
  getAllStrands: async () => {
    const sql = 'SELECT * FROM shs_strands ORDER BY name';
    const { rows } = await query(sql);
    return rows;
  },

  // SHS Grades
  getAllGrades: async () => {
    const sql = 'SELECT * FROM shs_grades ORDER BY id';
    const { rows } = await query(sql);
    return rows;
  },

  // Faculty Departments
  getAllDepartments: async () => {
    const sql = 'SELECT * FROM faculty_department ORDER BY department_name';
    const { rows } = await query(sql);
    return rows;
  },
};
