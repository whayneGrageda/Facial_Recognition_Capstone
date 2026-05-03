export interface ShsUserEntity {
  id: number;
  name?: string;
  first_name?: string;
  middle_initial?: string;
  last_name?: string;
  email?: string;
  contact_number?: string;
  student_id?: string;
  password?: string;
  strand_id?: number;
  grade_id?: number;
  role: string;
  registered_at: Date;
  face_image_1?: Buffer;
  face_image_2?: Buffer;
  face_image_3?: Buffer;
  archived_at?: Date;
  status: string;
  archived_by?: number;
  // Joined fields
  strand_name?: string;
  grade_name?: string;
}

export interface CreateShsUserRequest {
  first_name: string;
  middle_initial?: string;
  last_name: string;
  email?: string;
  contact_number?: string;
  student_id?: string;
  password: string;
  strand_id?: number;
  grade_id?: number;
  role?: string;
}

export interface UpdateShsUserRequest {
  first_name?: string;
  middle_initial?: string;
  last_name?: string;
  email?: string;
  contact_number?: string;
  strand_id?: number;
  grade_id?: number;
  password?: string;
}
