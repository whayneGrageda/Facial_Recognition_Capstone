export interface LoginRequest {
  username?: string;
  email?: string;
  password: string;
  userType?: 'college' | 'shs' | 'faculty' | 'admin' | 'moderator';
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    name?: string;
    email: string;
    role: string;
    userType: string;
  };
}

export interface JwtPayload {
  userId: number;
  email: string;
  role: string;
  userType: string;
}
