export interface AttendanceEntity {
  id: number;
  user_id: number;
  user_type: 'college' | 'shs' | 'faculty' | 'guest';
  name: string;
  timestamp: Date;
  attendance_type: 'time-in' | 'time-out';
  // Joined fields
  user_name?: string;
  user_email?: string;
  course_strand_dept?: string;
}

export interface CreateAttendanceRequest {
  user_id: number;
  user_type: 'college' | 'shs' | 'faculty' | 'guest';
  name: string;
  attendance_type: 'time-in' | 'time-out';
}
