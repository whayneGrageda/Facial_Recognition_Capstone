"""Database Logger for Attendance System"""

import psycopg2
from psycopg2 import pool
import requests
from datetime import datetime
from typing import Optional

class DatabaseLogger:
    """Logs attendance records to PostgreSQL database via Backend API"""
    
    def __init__(self, config):
        """Initialize database connection and API settings"""
        self.config = config
        self.connection_pool = None
        self._initialize_pool()
        
        # Backend API configuration
        self.api_base_url = getattr(config, 'API_BASE_URL', 'http://localhost:3002/api')
        self.use_api = getattr(config, 'USE_API_FOR_ATTENDANCE', True)  # Toggle to use API or direct DB
    
    def _initialize_pool(self):
        """Initialize connection pool"""
        try:
            self.connection_pool = psycopg2.pool.SimpleConnectionPool(
                1, 10,
                host=self.config.DB_HOST,
                port=self.config.DB_PORT,
                database=self.config.DB_NAME,
                user=self.config.DB_USER,
                password=self.config.DB_PASSWORD
            )
            print(f"✓ Database connected: {self.config.DB_NAME}@{self.config.DB_HOST}")
        except Exception as e:
            print(f"✗ Database connection failed: {e}")
            self.connection_pool = None
    
    def get_last_attendance_status(self, user_identifier: str) -> Optional[str]:
        """
        Get the most recent attendance status for the user today.
        """
        if self.connection_pool is None:
            return None
            
        conn = None
        try:
            conn = self.connection_pool.getconn()
            cursor = conn.cursor()
            
            user_info = self._find_user(cursor, user_identifier)
            if user_info is None:
                return None
                
            user_id, user_type, _ = user_info
            
            cursor.execute("""
                SELECT attendance_type 
                FROM attendance 
                WHERE user_id = %s AND user_type = %s AND DATE(timestamp) = CURRENT_DATE
                ORDER BY timestamp DESC
                LIMIT 1
            """, (user_id, user_type))
            
            result = cursor.fetchone()
            if result:
                return result[0]
            return None
            
        except Exception as e:
            print(f"ERROR getting last attendance status: {e}")
            return None
        finally:
            if conn:
                self.connection_pool.putconn(conn)

    def log_attendance(self, user_identifier: str, confidence: float, attendance_type: str = 'time-in') -> tuple[bool, str]:
        """
        Log attendance for a recognized user
        
        Args:
            user_identifier: Student ID, employee ID, or username
            confidence: Recognition confidence score
            attendance_type: 'time-in' or 'time-out'
            
        Returns:
            (success_bool, status_message)
        """
        # Validate state logic (prevent double time-in or double time-out)
        last_status = self.get_last_attendance_status(user_identifier)
        
        if last_status == attendance_type:
            # User is already in the requested state today
            return False, f"ALREADY_{attendance_type.upper()}"
            
        # Try API first if enabled
        if self.use_api:
            success = self._log_via_api(user_identifier, confidence, attendance_type)
            if success:
                return True, "LOGGED_API"
            print("WARNING: API logging failed, falling back to direct database")
        
        # Fallback to direct database insertion
        success = self._log_via_database(user_identifier, confidence, attendance_type)
        if success:
            return True, "LOGGED_DB"
        return False, "ERROR"
    
    def _log_via_api(self, user_identifier: str, confidence: float, attendance_type: str) -> bool:
        """Log attendance via Backend API (creates notifications automatically)"""
        if self.connection_pool is None:
            return False
        
        conn = None
        try:
            # First, find the user to get their ID and type
            conn = self.connection_pool.getconn()
            cursor = conn.cursor()
            user_info = self._find_user(cursor, user_identifier)
            
            if user_info is None:
                print(f"WARNING: User not found in database: {user_identifier}")
                return False
            
            user_id, user_type, full_name = user_info
            
            # Call backend API (using public endpoint for camera system)
            url = f"{self.api_base_url}/attendance/record-from-camera"
            payload = {
                'user_id': user_id,
                'user_type': user_type,
                'name': full_name,
                'attendance_type': attendance_type
            }
            
            response = requests.post(url, json=payload, timeout=5)
            
            if response.status_code == 200 or response.status_code == 201:
                return True
            else:
                print(f"API Error: {response.status_code} - {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"API Request failed: {e}")
            return False
        except Exception as e:
            print(f"ERROR in API logging: {e}")
            return False
        finally:
            if conn:
                self.connection_pool.putconn(conn)
    
    def _log_via_database(self, user_identifier: str, confidence: float, attendance_type: str) -> bool:
        """Direct database insertion (fallback, does NOT create notifications)"""
        if self.connection_pool is None:
            print("ERROR: Database not connected")
            return False
        
        conn = None
        try:
            conn = self.connection_pool.getconn()
            cursor = conn.cursor()
            
            # First, find the user and determine their type
            user_info = self._find_user(cursor, user_identifier)
            
            if user_info is None:
                print(f"WARNING: User not found in database: {user_identifier}")
                return False
            
            user_id, user_type, full_name = user_info
            
            # Insert attendance record with attendance_type
            cursor.execute("""
                INSERT INTO attendance (user_id, user_type, name, timestamp, attendance_type)
                VALUES (%s, %s, %s, NOW(), %s)
                RETURNING id
            """, (user_id, user_type, full_name, attendance_type))
            
            attendance_id = cursor.fetchone()[0]
            conn.commit()
            
            return True
            
        except Exception as e:
            if conn:
                conn.rollback()
            print(f"ERROR logging attendance: {e}")
            return False
        
        finally:
            if conn:
                self.connection_pool.putconn(conn)
    
    def _find_user(self, cursor, identifier: str) -> Optional[tuple]:
        """
        Find user by name (folder name from known_faces)
        
        Returns:
            (user_id, user_type, full_name) or None
        """
        # Try college users (by name)
        cursor.execute("""
            SELECT id, 'college' as user_type, name
            FROM users
            WHERE LOWER(TRIM(name)) = LOWER(TRIM(%s)) AND status = 'active'
            LIMIT 1
        """, (identifier,))
        
        result = cursor.fetchone()
        if result:
            return result
        
        # Try SHS users (by name)
        cursor.execute("""
            SELECT id, 'shs' as user_type, name
            FROM shs_users
            WHERE LOWER(TRIM(name)) = LOWER(TRIM(%s)) AND status = 'active'
            LIMIT 1
        """, (identifier,))
        
        result = cursor.fetchone()
        if result:
            return result
        
        # Try faculty users (by name)
        cursor.execute("""
            SELECT id, 'faculty' as user_type, name
            FROM faculty_users
            WHERE LOWER(TRIM(name)) = LOWER(TRIM(%s)) AND status = 'active'
            LIMIT 1
        """, (identifier,))
        
        result = cursor.fetchone()
        if result:
            return result
        
        # Try guests (by name)
        cursor.execute("""
            SELECT id, 'guest' as user_type, name
            FROM guests
            WHERE LOWER(TRIM(name)) = LOWER(TRIM(%s))
            LIMIT 1
        """, (identifier,))
        
        result = cursor.fetchone()
        if result:
            return result
        
        return None
    
    def get_today_attendance_count(self) -> int:
        """Get count of attendance records for today"""
        if self.connection_pool is None:
            return 0
        
        conn = None
        try:
            conn = self.connection_pool.getconn()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT COUNT(*)
                FROM attendance
                WHERE DATE(timestamp) = CURRENT_DATE
            """)
            
            count = cursor.fetchone()[0]
            return count
            
        except Exception as e:
            print(f"ERROR getting attendance count: {e}")
            return 0
        
        finally:
            if conn:
                self.connection_pool.putconn(conn)
    
    def close(self):
        """Close database connection pool"""
        if self.connection_pool:
            self.connection_pool.closeall()
            print("Database connections closed")
