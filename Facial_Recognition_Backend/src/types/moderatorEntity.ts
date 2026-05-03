export interface ModeratorEntity {
  id: number;
  username: string;
  email?: string;
  password?: string;
  role: string;
  created_at: Date;
  archived_at?: Date;
  status: string;
  archived_by?: number;
}

export interface CreateModeratorRequest {
  username: string;
  email?: string;
  password: string;
  role?: string;
}

export interface UpdateModeratorRequest {
  username?: string;
  email?: string;
  password?: string;
}
