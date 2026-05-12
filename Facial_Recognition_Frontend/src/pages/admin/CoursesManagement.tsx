import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Power, Search, RefreshCw } from 'lucide-react';
import { metadataService } from '../../services/metadataService';
import type { Course } from '../../types';
import './MetadataManagement.css';

const CoursesManagement = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({ name: '' });
  const [includeInactive, setIncludeInactive] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, [includeInactive]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const data = await metadataService.getCourses(includeInactive);
      setCourses(data);
    } catch (error) {
      console.error('Error fetching courses:', error);
      alert('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Course name is required');
      return;
    }

    try {
      if (editingCourse) {
        await metadataService.updateCourse(editingCourse.id, formData.name);
        alert('Course updated successfully');
      } else {
        await metadataService.createCourse(formData.name);
        alert('Course created successfully');
      }
      setShowModal(false);
      setFormData({ name: '' });
      setEditingCourse(null);
      fetchCourses();
    } catch (error) {
      console.error('Error saving course:', error);
      alert('Failed to save course');
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({ name: course.name });
    setShowModal(true);
  };

  const handleToggleStatus = async (id: number) => {
    if (!confirm('Are you sure you want to toggle the status of this course?')) return;
    
    try {
      await metadataService.toggleCourseStatus(id);
      fetchCourses();
    } catch (error) {
      console.error('Error toggling course status:', error);
      alert('Failed to toggle course status');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) return;
    
    try {
      await metadataService.deleteCourse(id);
      alert('Course deleted successfully');
      fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Failed to delete course. It may be in use.');
    }
  };

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="metadata-management">
      <div className="management-header">
        <div className="status-indicator">
          <span className="status-dot"></span>
          <span>Courses Management</span>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary btn-sm" onClick={() => { setShowModal(true); setEditingCourse(null); setFormData({ name: '' }); }}>
            <Plus size={20} />
            <span>Add Course</span>
          </button>
        </div>
      </div>

      <div className="management-controls">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="control-buttons">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
            />
            Show inactive
          </label>
          <button className="btn btn-ghost btn-sm" onClick={fetchCourses} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            Refresh
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Course Name</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCourses.length === 0 ? (
              <tr>
                <td colSpan={4} className="empty-state">
                  {loading ? 'Loading...' : 'No courses found'}
                </td>
              </tr>
            ) : (
              filteredCourses.map((course) => (
                <tr key={course.id} className={!course.is_active ? 'inactive-row' : ''}>
                  <td>{course.id}</td>
                  <td>{course.name}</td>
                  <td>
                    <span className={`status-badge ${course.is_active ? 'active' : 'inactive'}`}>
                      {course.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => handleEdit(course)}
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn-icon btn-toggle"
                        onClick={() => handleToggleStatus(course.id)}
                        title={course.is_active ? 'Deactivate' : 'Activate'}
                      >
                        <Power size={16} />
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => handleDelete(course.id)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingCourse ? 'Edit Course' : 'Add New Course'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Course Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  placeholder="e.g., Bachelor of Science in Computer Science"
                  required
                  autoFocus
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCourse ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursesManagement;
