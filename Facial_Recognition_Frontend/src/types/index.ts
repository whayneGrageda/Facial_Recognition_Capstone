// ===================================
// USER TYPES
// ===================================

export interface User {
  id: number;
  name?: string;
  first_name?: string;
  middle_initial?: string;
  last_name?: string;
  email?: string;
  contact_number?: string;
  student_id?: string;
  role?: string;
  status?: string;
  registered_at?: Date;
  created_at?: Date;
  updated_at?: Date;
  // User type specific fields
  course_name?: string;
  year_name?: string;
  strand_name?: string;
  grade_name?: string;
  department_name?: string;
}

export interface CollegeUser extends User {
  course_id?: number;
  year_id?: number;
  course_name?: string;
  year_name?: string;
}

export interface ShsUser extends User {
  strand_id?: number;
  grade_id?: number;
  strand_name?: string;
  grade_name?: string;
}

export interface FacultyUser extends User {
  department_id?: number;
  department_name?: string;
}

export interface Moderator {
  id: number;
  username: string;
  email?: string;
  role: string;
  status: string;
  created_at: Date;
  updated_at?: Date;
}

export interface Guest {
  id: number;
  name: string;
  purpose: string;
  contact_number?: string;
  company?: string;
  status: string;
  created_at: Date;
}

// ===================================
// ATTENDANCE TYPES
// ===================================

export interface Attendance {
  id: number;
  user_id: number;
  user_type: 'college' | 'shs' | 'faculty' | 'guest';
  timestamp: Date;
  attendance_type: 'time-in' | 'time-out';
  // Joined fields
  user_name?: string;
  user_email?: string;
  course_strand_dept?: string;
}

export interface AttendanceStats {
  totalPresent: number;
  totalLate: number;
  totalAbsent: number;
  attendanceRate: number;
}

// ===================================
// METADATA TYPES
// ===================================

export interface Course {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface Year {
  id: number;
  year_name: string;
  is_active: boolean;
}

export interface Strand {
  id: number;
  name: string;
  acronym?: string;
  description?: string;
  is_active: boolean;
}

export interface Grade {
  id: number;
  grade_name: string;
  is_active: boolean;
}

export interface Department {
  id: number;
  department_name: string;
  description?: string;
  is_active: boolean;
}

// ===================================
// AUTH TYPES
// ===================================

export interface LoginCredentials {
  email?: string;
  username?: string;
  password: string;
  userType?: 'college' | 'shs' | 'faculty' | 'admin' | 'moderator';
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    name?: string;
    email?: string;
    role: string;
    userType: string;
    student_id?: string;
    course_name?: string;
    year_name?: string;
    strand_name?: string;
    grade_name?: string;
    department_name?: string;
  };
}

export interface AuthContextType {
  user: AuthResponse['user'] | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ===================================
// API RESPONSE TYPES
// ===================================

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  users?: T[];
  guests?: T[];
  moderators?: T[];
  attendance?: T[];
  items?: T[];
  totalCount: number;
  page: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}

// ===================================
// FORM TYPES
// ===================================

export interface CreateUserForm {
  first_name: string;
  middle_initial?: string;
  last_name: string;
  email?: string;
  contact_number?: string;
  student_id?: string;
  password: string;
  course_id?: number;
  year_id?: number;
  strand_id?: number;
  grade_id?: number;
  department_id?: number;
  role?: string;
}

export interface UpdateUserForm {
  first_name?: string;
  middle_initial?: string;
  last_name?: string;
  email?: string;
  contact_number?: string;
  course_id?: number;
  year_id?: number;
  strand_id?: number;
  grade_id?: number;
  department_id?: number;
  password?: string;
}

export interface CreateGuestForm {
  name: string;
  purpose: string;
  contact_number?: string;
  company?: string;
}

// ===================================
// FILTER TYPES
// ===================================

export interface UserFilters {
  search?: string;
  course_id?: number;
  year_id?: number;
  strand_id?: number;
  grade_id?: number;
  department_id?: number;
  status?: string;
}

export interface AttendanceFilters {
  user_id?: number;
  user_type?: string;
  start_date?: string;
  end_date?: string;
  attendance_type?: string;
}
