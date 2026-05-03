export interface GuestEntity {
  id: number;
  name: string;
  purpose: string;
  visit_date: Date;
  time_in?: Date;
  time_out?: Date;
  created_at: Date;
  archived_at?: Date;
  status: string;
  archived_by?: number;
  face_image_1?: Buffer;
  face_image_2?: Buffer;
  face_image_3?: Buffer;
  address?: string;
}

export interface CreateGuestRequest {
  name: string;
  purpose: string;
  visit_date: string;
  address?: string;
}

export interface UpdateGuestRequest {
  name?: string;
  purpose?: string;
  visit_date?: string;
  time_in?: string;
  time_out?: string;
  address?: string;
}
