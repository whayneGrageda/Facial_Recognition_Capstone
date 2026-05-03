export interface UserEntity {
  id: number;
  name?: string;
  first_name?: string;
  middle_initial?: string;
  last_name?: string;
  email: string;
  contact_number?: string;
  student_id?: string;
  password?: string;
  course_id?: number;
  year_id?: number;
  role: string;
  registered_at: Date;
  created_at: Date;
  updated_at: Date;
  face_image_1?: Buffer;
  face_image_2?: Buffer;
  face_image_3?: Buffer;
  archived_at?: Date;
  status: string;
  archived_by?: number;
  // Joined fields
  course_name?: string;
  year_name?: string;
}

export interface CreateUserRequest {
  name?: string;
  first_name: string;
  middle_initial?: string;
  last_name: string;
  email: string;
  contact_number?: string;
  student_id?: string;
  password: string;
  course_id?: number;
  year_id?: number;
  role?: string;
}

export interface UpdateUserRequest {
  name?: string;
  first_name?: string;
  middle_initial?: string;
  last_name?: string;
  email?: string;
  contact_number?: string;
  course_id?: number;
  year_id?: number;
  password?: string;
}
