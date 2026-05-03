import { MetadataModel } from '../models/metadataModel.js';

export const MetadataService = {
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

  getCourses: async () => await MetadataModel.getAllCourses(),
  getYears: async () => await MetadataModel.getAllYears(),
  getStrands: async () => await MetadataModel.getAllStrands(),
  getGrades: async () => await MetadataModel.getAllGrades(),
  getDepartments: async () => await MetadataModel.getAllDepartments(),
};
