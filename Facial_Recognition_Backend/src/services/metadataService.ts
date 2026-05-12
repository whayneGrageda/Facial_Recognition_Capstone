import { MetadataModel } from '../models/metadataModel.js';

export const MetadataService = {
  // ===================================
  // GET ALL METADATA
  // ===================================
  getAllMetadata: async () => {
    const [courses, years, strands, grades, departments] = await Promise.all([
      MetadataModel.getAllCourses(),
      MetadataModel.getAllYears(),
      MetadataModel.getAllStrands(),
      MetadataModel.getAllGrades(),
      MetadataModel.getAllDepartments(),
    ]);

    return {
      courses,
      years,
      strands,
      grades,
      departments,
    };
  },

  // ===================================
  // COURSES
  // ===================================
  getCourses: async (includeInactive = false) => await MetadataModel.getAllCourses(includeInactive),
  
  getCourseById: async (id: number) => {
    const course = await MetadataModel.getCourseById(id);
    if (!course) throw new Error('COURSE_NOT_FOUND');
    return course;
  },

  createCourse: async (name: string) => {
    if (!name || name.trim() === '') throw new Error('COURSE_NAME_REQUIRED');
    return await MetadataModel.createCourse(name.trim());
  },

  updateCourse: async (id: number, name: string) => {
    if (!name || name.trim() === '') throw new Error('COURSE_NAME_REQUIRED');
    const course = await MetadataModel.updateCourse(id, name.trim());
    if (!course) throw new Error('COURSE_NOT_FOUND');
    return course;
  },

  toggleCourseStatus: async (id: number) => {
    const course = await MetadataModel.toggleCourseStatus(id);
    if (!course) throw new Error('COURSE_NOT_FOUND');
    return course;
  },

  deleteCourse: async (id: number) => {
    const course = await MetadataModel.deleteCourse(id);
    if (!course) throw new Error('COURSE_NOT_FOUND');
    return course;
  },

  // ===================================
  // STRANDS
  // ===================================
  getStrands: async (includeInactive = false) => await MetadataModel.getAllStrands(includeInactive),
  
  getStrandById: async (id: number) => {
    const strand = await MetadataModel.getStrandById(id);
    if (!strand) throw new Error('STRAND_NOT_FOUND');
    return strand;
  },

  createStrand: async (name: string, acronym: string) => {
    if (!name || name.trim() === '') throw new Error('STRAND_NAME_REQUIRED');
    return await MetadataModel.createStrand(name.trim(), acronym?.trim() || '');
  },

  updateStrand: async (id: number, name: string, acronym: string) => {
    if (!name || name.trim() === '') throw new Error('STRAND_NAME_REQUIRED');
    const strand = await MetadataModel.updateStrand(id, name.trim(), acronym?.trim() || '');
    if (!strand) throw new Error('STRAND_NOT_FOUND');
    return strand;
  },

  toggleStrandStatus: async (id: number) => {
    const strand = await MetadataModel.toggleStrandStatus(id);
    if (!strand) throw new Error('STRAND_NOT_FOUND');
    return strand;
  },

  deleteStrand: async (id: number) => {
    const strand = await MetadataModel.deleteStrand(id);
    if (!strand) throw new Error('STRAND_NOT_FOUND');
    return strand;
  },

  // ===================================
  // DEPARTMENTS
  // ===================================
  getDepartments: async (includeInactive = false) => await MetadataModel.getAllDepartments(includeInactive),
  
  getDepartmentById: async (id: number) => {
    const department = await MetadataModel.getDepartmentById(id);
    if (!department) throw new Error('DEPARTMENT_NOT_FOUND');
    return department;
  },

  createDepartment: async (department_name: string) => {
    if (!department_name || department_name.trim() === '') throw new Error('DEPARTMENT_NAME_REQUIRED');
    return await MetadataModel.createDepartment(department_name.trim());
  },

  updateDepartment: async (id: number, department_name: string) => {
    if (!department_name || department_name.trim() === '') throw new Error('DEPARTMENT_NAME_REQUIRED');
    const department = await MetadataModel.updateDepartment(id, department_name.trim());
    if (!department) throw new Error('DEPARTMENT_NOT_FOUND');
    return department;
  },

  toggleDepartmentStatus: async (id: number) => {
    const department = await MetadataModel.toggleDepartmentStatus(id);
    if (!department) throw new Error('DEPARTMENT_NOT_FOUND');
    return department;
  },

  deleteDepartment: async (id: number) => {
    const department = await MetadataModel.deleteDepartment(id);
    if (!department) throw new Error('DEPARTMENT_NOT_FOUND');
    return department;
  },

  // ===================================
  // YEARS & GRADES (Read-only for now)
  // ===================================
  getYears: async (includeInactive = false) => await MetadataModel.getAllYears(includeInactive),
  getGrades: async (includeInactive = false) => await MetadataModel.getAllGrades(includeInactive),
};
