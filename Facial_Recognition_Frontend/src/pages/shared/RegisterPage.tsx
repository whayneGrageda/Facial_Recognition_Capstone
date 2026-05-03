import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Mail, Camera, Video, CheckCircle } from 'lucide-react';
import { authService } from '../../services/authService';
import { faceImageService } from '../../services/faceImageService';
import { metadataService } from '../../services/metadataService';
import { Course, Year, Strand, Grade, Department } from '../../types';
import './RegisterPage.css';

type UserType = 'college' | 'shs' | 'faculty';

interface RegistrationData {
  // Step 1
  username: string;
  password: string;
  confirmPassword: string;
  // Step 2
  firstName: string;
  middleInitial: string;
  lastName: string;
  contactNumber: string;
  // Step 3
  email: string;
  verificationCode: string;
  // Step 4
  userType: UserType;
  courseOrStrandOrDept: string;
  yearOrGrade: string;
  studentId: string;
  // Step 5
  faceImages: string[]; // Array of base64 encoded images
}

const RegisterPage = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captureIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedCount, setCapturedCount] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const TARGET_FRAMES = 50; // Number of frames to capture

  const [formData, setFormData] = useState<RegistrationData>({
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    middleInitial: '',
    lastName: '',
    contactNumber: '',
    email: '',
    verificationCode: '',
    userType: 'college',
    courseOrStrandOrDept: '',
    yearOrGrade: '',
    studentId: '',
    faceImages: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Metadata state
  const [courses, setCourses] = useState<Course[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [strands, setStrands] = useState<Strand[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Fetch metadata on mount
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [coursesData, yearsData, strandsData, gradesData, departmentsData] = await Promise.all([
          metadataService.getCourses(),
          metadataService.getYears(),
          metadataService.getStrands(),
          metadataService.getGrades(),
          metadataService.getDepartments(),
        ]);
        setCourses(coursesData);
        setYears(yearsData);
        setStrands(strandsData);
        setGrades(gradesData);
        setDepartments(departmentsData);
      } catch (error) {
        console.error('Failed to fetch metadata:', error);
      }
    };
    fetchMetadata();
  }, []);

  // Cleanup video stream and capture interval on unmount
  useEffect(() => {
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [videoStream]);
  
  // Handle video stream binding to video element
  useEffect(() => {
    if (videoRef.current && videoStream) {
      videoRef.current.srcObject = videoStream;
      videoRef.current.play().catch(err => console.log("Auto-play failed:", err));
    }
  }, [videoStream]);

  // Handle automatic camera start/stop based on step
  useEffect(() => {
    if (currentStep === 5) {
      startCamera();
    } else {
      stopCamera();
      // Comprehensive cleanup when leaving Step 5
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
        captureIntervalRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      setIsCapturing(false);
      setCountdown(null);
      setCapturedCount(0);
      // Optional: don't clear faceImages if you want them to persist between steps, 
      // but the bug report suggests we should probably clear them to be safe
    }
  }, [currentStep]);

  const handleInputChange = (field: keyof RegistrationData, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-detect user type based on email domain
      if (field === 'email') {
        const email = value.toLowerCase().trim();
        if (email.endsWith('@students.nu-dasma.edu.ph')) {
          updated.userType = 'college';
        } else if (email.endsWith('@shs.nu-dasma.edu.ph')) {
          updated.userType = 'shs';
        } else if (email.endsWith('@nu-dasma.edu.ph')) {
          updated.userType = 'faculty';
        }
      }
      
      return updated;
    });

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (formData.contactNumber && !/^09\d{9}$/.test(formData.contactNumber)) {
      newErrors.contactNumber = 'Invalid contact number format (09xxxxxxxxx)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {};
    const email = formData.email.toLowerCase().trim();
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else {
      const isCollege = email.endsWith('@students.nu-dasma.edu.ph');
      const isShs = email.endsWith('@shs.nu-dasma.edu.ph');
      const isFaculty = email.endsWith('@nu-dasma.edu.ph');
      
      if (!isCollege && !isShs && !isFaculty) {
        newErrors.email = 'Please use a valid NU email address (@students.nu-dasma.edu.ph, @shs.nu-dasma.edu.ph, or @nu-dasma.edu.ph)';
      }
    }
    
    if (verificationSent && !formData.verificationCode.trim()) {
      newErrors.verificationCode = 'Verification code is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep4 = () => {
    const newErrors: Record<string, string> = {};
    
    // Only College and SHS require Student ID
    if (formData.userType !== 'faculty') {
      if (!formData.studentId.trim()) {
        newErrors.studentId = 'Student ID is required';
      }
    }
    
    // Everyone requires Course/Strand/Dept
    if (!formData.courseOrStrandOrDept) {
      const label = formData.userType === 'college' ? 'Course' : formData.userType === 'shs' ? 'Strand' : 'Department';
      newErrors.courseOrStrandOrDept = `Please select your ${label}`;
    }
    
    // Only College and SHS require Year/Grade
    if ((formData.userType === 'college' || formData.userType === 'shs') && !formData.yearOrGrade) {
      const label = formData.userType === 'college' ? 'Year' : 'Grade';
      newErrors.yearOrGrade = `Please select your ${label}`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    let isValid = false;
    
    switch (currentStep) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        if (!verificationSent) {
          isValid = validateStep3();
          if (isValid) {
            await sendVerificationCode();
            return;
          }
        } else {
          isValid = validateStep3();
          if (isValid) {
            // Verify the code before proceeding
            setLoading(true);
            try {
              const result = await authService.verifyEmailCode(formData.email, formData.verificationCode);
              if (!result.valid) {
                setErrors({ verificationCode: 'Invalid or expired verification code' });
                setLoading(false);
                return;
              }
            } catch (error) {
              setErrors({ verificationCode: 'Failed to verify code' });
              setLoading(false);
              return;
            }
            setLoading(false);
          }
        }
        break;
      case 4:
        isValid = validateStep4();
        if (isValid) {
          // Camera will be started by useEffect when step changes to 5
        }
        break;
      case 5:
        // Submit registration
        await handleSubmit();
        return;
    }
    
    if (isValid && currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      if (currentStep === 5) {
        stopCamera();
        // Thorough reset of all capture states
        if (captureIntervalRef.current) {
          clearInterval(captureIntervalRef.current);
          captureIntervalRef.current = null;
        }
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        setCapturedCount(0);
        setIsCapturing(false);
        setCountdown(null);
        setFormData(prev => ({ ...prev, faceImages: [] }));
      }
      setCurrentStep(prev => prev - 1);
    }
  };

  const sendVerificationCode = async () => {
    setLoading(true);
    try {
      await authService.sendVerificationCode(formData.email);
      setVerificationSent(true);
      alert('Verification code sent! Please check your email (including spam folder).');
    } catch (error: any) {
      console.error('Error sending verification code:', error);
      alert(error.response?.data?.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      // Stop existing stream if any and clear state
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }
      setVideoStream(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      setVideoStream(stream);
      if (videoRef.current) {
        // Wait for video to be ready
        try {
          await videoRef.current.play();
        } catch (e) {
          console.log("Video play interrupted or failed, will retry on mount");
        }
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
  };

  const startCapturing = () => {
    if (!videoStream || !videoRef.current) return;

    // Reset state immediately to prevent race conditions
    if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    
    setFormData(prev => ({ ...prev, faceImages: [] }));
    setCapturedCount(0);
    setIsCapturing(false);
    setCountdown(3);

    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev === 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          beginCapturing();
          return null;
        }
        return prev! - 1;
      });
    }, 1000);
  };

  const beginCapturing = () => {
    if (!videoStream || !videoRef.current) return;

    // Double check to clear any existing interval
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
    }

    setIsCapturing(true);
    setCapturedCount(0);
    const capturedFrames: string[] = [];
    console.log('Starting face capture...');

    // Capture frames every 100ms (10 frames per second)
    captureIntervalRef.current = setInterval(() => {
      if (capturedFrames.length >= TARGET_FRAMES) {
        stopCapturing(capturedFrames);
        return;
      }

      const frame = captureFrame();
      if (frame) {
        capturedFrames.push(frame);
        setCapturedCount(capturedFrames.length);
      }
    }, 100);
  };

  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return null;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to base64 JPEG
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const stopCapturing = (frames: string[]) => {
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
    console.log(`Face capture finished. Captured ${frames.length} frames.`);
    
    // Only update if we were actually capturing
    setIsCapturing(prev => {
      if (prev) {
        setFormData(f => ({ ...f, faceImages: frames }));
      }
      return false;
    });
  };

  const handleSubmit = async () => {
    if (!formData.faceImages || formData.faceImages.length === 0) {
      alert('Please capture your face images before submitting');
      return;
    }

    setLoading(true);
    try {
      const registrationData = {
        username: formData.username,
        password: formData.password,
        first_name: formData.firstName,
        middle_initial: formData.middleInitial || undefined,
        last_name: formData.lastName,
        email: formData.email,
        contact_number: formData.contactNumber || undefined,
      };

      // Register user in database
      if (formData.userType === 'college') {
        await authService.registerCollege({
          ...registrationData,
          student_id: formData.studentId,
          course_id: parseInt(formData.courseOrStrandOrDept),
          year_id: parseInt(formData.yearOrGrade),
        });
      } else if (formData.userType === 'shs') {
        await authService.registerShs({
          ...registrationData,
          student_id: formData.studentId,
          strand_id: parseInt(formData.courseOrStrandOrDept),
          grade_id: parseInt(formData.yearOrGrade),
        });
      } else if (formData.userType === 'faculty') {
        await authService.registerFaculty({
          ...registrationData,
          employee_id: formData.studentId.trim() || undefined,
          department_id: parseInt(formData.courseOrStrandOrDept),
        });
      }

      // Upload face images to known_faces folder using full name
      const fullName = `${formData.firstName} ${formData.middleInitial ? formData.middleInitial + ' ' : ''}${formData.lastName}`.trim();
      await faceImageService.uploadFaceImages(fullName, formData.faceImages);
      
      alert(`Registration successful! ${formData.faceImages.length} face images captured. Please login with your credentials.`);
      navigate('/login');
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="step-indicator">
      {[1, 2, 3, 4, 5].map(step => (
        <div
          key={step}
          className={`step-dot ${currentStep >= step ? 'active' : ''}`}
        />
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="form-content">
      <div className="form-group">
        <input
          type="text"
          placeholder="Username"
          value={formData.username}
          onChange={(e) => handleInputChange('username', e.target.value)}
          className={`form-input ${errors.username ? 'error' : ''}`}
        />
        {errors.username && <span className="error-message">{errors.username}</span>}
      </div>

      <div className="form-group">
        <div className="password-input-wrapper">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            className={`form-input ${errors.password ? 'error' : ''}`}
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {errors.password && <span className="error-message">{errors.password}</span>}
      </div>

      <div className="form-group">
        <div className="password-input-wrapper">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="form-content">
      <div className="form-group">
        <input
          type="text"
          placeholder="Full Name (Include 2nd name if applicable)"
          value={formData.firstName}
          onChange={(e) => handleInputChange('firstName', e.target.value)}
          className={`form-input ${errors.firstName ? 'error' : ''}`}
        />
        {errors.firstName && <span className="error-message">{errors.firstName}</span>}
      </div>

      <div className="form-group">
        <input
          type="text"
          placeholder="Middle Initial (optional)"
          value={formData.middleInitial}
          onChange={(e) => handleInputChange('middleInitial', e.target.value)}
          className="form-input"
          maxLength={1}
        />
      </div>

      <div className="form-group">
        <input
          type="text"
          placeholder="Last Name"
          value={formData.lastName}
          onChange={(e) => handleInputChange('lastName', e.target.value)}
          className={`form-input ${errors.lastName ? 'error' : ''}`}
        />
        {errors.lastName && <span className="error-message">{errors.lastName}</span>}
      </div>

      <div className="form-group">
        <input
          type="tel"
          placeholder="Contact Number (09xxxxxxxxx)"
          value={formData.contactNumber}
          onChange={(e) => handleInputChange('contactNumber', e.target.value)}
          className={`form-input ${errors.contactNumber ? 'error' : ''}`}
          maxLength={11}
        />
        {errors.contactNumber && <span className="error-message">{errors.contactNumber}</span>}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="form-content">
      <div className="verification-header">
        <Mail size={32} className="verification-icon" />
        <h3>Verify Your Email</h3>
        <p>Enter your NU email address to receive a verification code</p>
      </div>

      <div className="info-boxes-container">
        <div className="info-box">
          <h4>Accepted email domains:</h4>
          <ul>
            <li>@students.nu-dasma.edu.ph (College Students)</li>
            <li>@shs.nu-dasma.edu.ph (Senior High School)</li>
            <li>@nu-dasma.edu.ph (Staff/Faculty)</li>
          </ul>
        </div>

        <div className="warning-box">
          <h4>📧 Email Delivery Notice:</h4>
          <ul>
            <li>Check your <strong>spam/junk folder</strong> if you don't receive the code</li>
            <li>Add <strong>teamjarvis.technologies@gmail.com</strong> to your contacts</li>
            <li>The verification code expires in <strong>5 minutes</strong></li>
          </ul>
        </div>
      </div>

      <div className="form-group">
        <input
          type="email"
          placeholder="Your NU Email Address"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          className={`form-input ${errors.email ? 'error' : ''}`}
          disabled={verificationSent}
        />
        {errors.email && <span className="error-message">{errors.email}</span>}
      </div>

      {!verificationSent ? (
        <button
          type="button"
          className="btn btn-primary verification-btn"
          onClick={sendVerificationCode}
          disabled={loading}
        >
          <Mail size={18} />
          {loading ? 'Sending...' : 'Send Verification Code'}
        </button>
      ) : (
        <div className="form-group">
          <input
            type="text"
            placeholder="Enter 6-digit verification code"
            value={formData.verificationCode}
            onChange={(e) => handleInputChange('verificationCode', e.target.value)}
            className={`form-input ${errors.verificationCode ? 'error' : ''}`}
            maxLength={6}
          />
          {errors.verificationCode && <span className="error-message">{errors.verificationCode}</span>}
          <button
            type="button"
            className="resend-link"
            onClick={sendVerificationCode}
            disabled={loading}
          >
            Resend Code
          </button>
        </div>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="form-content">
      <div className="form-group">
        <label className="form-label">Account Type (Determined by email):</label>
        <div className="account-type-badge">
          {formData.userType === 'college' ? 'College Student' : 
           formData.userType === 'shs' ? 'Senior High School Student' : 
           'Faculty/Staff'}
        </div>
      </div>

      {formData.userType !== 'faculty' && (
        <div className="form-group">
          <input
            type="text"
            placeholder="Student ID"
            value={formData.studentId}
            onChange={(e) => handleInputChange('studentId', e.target.value)}
            className={`form-input ${errors.studentId ? 'error' : ''}`}
          />
          {errors.studentId && <span className="error-message">{errors.studentId}</span>}
        </div>
      )}

      <div className="form-group">
        <label className="form-label">
          {formData.userType === 'college' ? 'Course' : formData.userType === 'shs' ? 'Strand' : 'Department'}
        </label>
        <select
          value={formData.courseOrStrandOrDept}
          onChange={(e) => handleInputChange('courseOrStrandOrDept', e.target.value)}
          className={`form-select ${errors.courseOrStrandOrDept ? 'error' : ''}`}
        >
          <option value="">Select {formData.userType === 'college' ? 'Course' : formData.userType === 'shs' ? 'Strand' : 'Department'}</option>
          {formData.userType === 'college' && courses.map(course => (
            <option key={course.id} value={course.id.toString()}>{course.name}</option>
          ))}
          {formData.userType === 'shs' && strands.map(strand => (
            <option key={strand.id} value={strand.id.toString()}>{strand.name}</option>
          ))}
          {formData.userType === 'faculty' && departments.map(dept => (
            <option key={dept.id} value={dept.id.toString()}>{dept.department_name}</option>
          ))}
        </select>
        {errors.courseOrStrandOrDept && <span className="error-message">{errors.courseOrStrandOrDept}</span>}
      </div>

      {(formData.userType === 'college' || formData.userType === 'shs') && (
        <div className="form-group">
          <label className="form-label">{formData.userType === 'shs' ? 'Grade' : 'Year'}</label>
          <select
            value={formData.yearOrGrade}
            onChange={(e) => handleInputChange('yearOrGrade', e.target.value)}
            className={`form-select ${errors.yearOrGrade ? 'error' : ''}`}
          >
            <option value="">Select {formData.userType === 'shs' ? 'Grade' : 'Year'}</option>
            {formData.userType === 'college' ? 
              years.map(year => (
                <option key={year.id} value={year.id.toString()}>{year.year_name}</option>
              )) : 
              grades.map(grade => (
                <option key={grade.id} value={grade.id.toString()}>{grade.grade_name}</option>
              ))
            }
          </select>
          {errors.yearOrGrade && <span className="error-message">{errors.yearOrGrade}</span>}
        </div>
      )}
    </div>
  );

  const renderStep5 = () => (
    <div className="form-content camera-step">
      <div className="camera-header">
        <Camera size={32} className="camera-icon" />
        <h3>Capture Your Face</h3>
        <p>We'll capture {TARGET_FRAMES} images of your face for attendance recognition</p>
      </div>

      <div className="camera-container">
        {countdown !== null && (
          <div className="countdown-overlay">
            <div className="countdown-number">{countdown}</div>
          </div>
        )}
        
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="camera-video"
        />
        
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        
        {!videoStream && (
          <div className="camera-placeholder">
            <Camera size={64} />
            <p>Camera will appear here</p>
          </div>
        )}

        {isCapturing && (
          <div className="recording-indicator">
            <div className="recording-dot"></div>
            <span>Capturing... {capturedCount}/{TARGET_FRAMES}</span>
          </div>
        )}

        {capturedCount > 0 && !isCapturing && formData.faceImages.length > 0 && (
          <div className="capture-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${(capturedCount / TARGET_FRAMES) * 100}%` }}
              />
            </div>
            <span>{capturedCount} frames captured</span>
          </div>
        )}
      </div>

      <div className="camera-instructions">
        <h4>Instructions:</h4>
        <ul>
          <li>Position your face in the center of the frame</li>
          <li>Ensure good lighting</li>
          <li>Look directly at the camera</li>
          <li>Stay still while capturing ({TARGET_FRAMES} frames, ~5 seconds)</li>
          <li>Move your head slightly for better training data</li>
        </ul>
      </div>

      {formData.faceImages.length === 0 ? (
        <button
          type="button"
          className="btn btn-primary record-btn"
          onClick={startCapturing}
          disabled={!videoStream || isCapturing || countdown !== null}
        >
          <Video size={18} />
          {isCapturing ? `Capturing... ${capturedCount}/${TARGET_FRAMES}` : 'Start Capturing'}
        </button>
      ) : (
        <div className="recording-success">
          <CheckCircle size={48} className="success-icon" />
          <p>{formData.faceImages.length} face images captured successfully!</p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              // Thorough reset
              if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
              if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
              captureIntervalRef.current = null;
              countdownIntervalRef.current = null;
              
              setFormData(prev => ({ ...prev, faceImages: [] }));
              setCapturedCount(0);
              setIsCapturing(false);
              setCountdown(null);
              
              // Restart camera
              startCamera();
            }}
          >
            Capture Again
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="register-page">
      <div className={`register-container ${currentStep === 3 ? 'step-3' : ''}`}>
        <button className="back-to-login" onClick={() => navigate('/login')}>
          <ArrowLeft size={18} />
          Back to Login
        </button>

        <div className="register-card card">
          <h1>Create Account</h1>
          <p className="subtitle">Join FaceTrack today</p>

          {renderStepIndicator()}
          
          <div className="step-label">Step {currentStep} of 5</div>

          <form onSubmit={(e) => e.preventDefault()}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
            {currentStep === 5 && renderStep5()}

            <div className="form-actions">
              {currentStep > 1 && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleBack}
                  disabled={loading}
                >
                  Back
                </button>
              )}
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleNext}
                disabled={loading || (currentStep === 5 && formData.faceImages.length === 0)}
              >
                {loading ? 'Processing...' : currentStep === 5 ? 'Complete Registration' : 'Next'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
