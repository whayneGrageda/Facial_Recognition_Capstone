export interface FacultyUserEntity {
  id: number;
  name?: string;
  first_name?: string;
  middle_initial?: string;
  last_name?: string;
  email?: string;
  contact_number?: string;
  password?: string;
  face_encoding?: any;
  role: string;
  registered_at: Date;
  department_id?: number;
  face_image_1?: Buffer;
  face_image_2?: Buffer;
  face_image_3?: Buffer;
  archived_at?: Date;
  status: string;
  archived_by?: number;
  // Joined fields
  department_name?: string;
}

export interface CreateFacultyUserRequest {
  first_name: string;
  middle_initial?: string;
  last_name: string;
  email?: string;
  contact_number?: string;
  password: string;
  department_id?: number;
  role?: string;
}

export interface UpdateFacultyUserRequest {
  first_name?: string;
  middle_initial?: string;
  last_name?: string;
  email?: string;
  contact_number?: string;
  department_id?: number;
  password?: string;
}
