import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Power, Search, RefreshCw } from 'lucide-react';
import { metadataService } from '../../services/metadataService';
import type { Department } from '../../types';
import './MetadataManagement.css';

const DepartmentsManagement = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({ department_name: '' });
  const [includeInactive, setIncludeInactive] = useState(true);

  useEffect(() => {
    fetchDepartments();
  }, [includeInactive]);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const data = await metadataService.getDepartments(includeInactive);
      setDepartments(data);
    } catch (error) {
      console.error('Error fetching departments:', error);
      alert('Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.department_name.trim()) {
      alert('Department name is required');
      return;
    }

    try {
      if (editingDepartment) {
        await metadataService.updateDepartment(editingDepartment.id, formData.department_name);
        alert('Department updated successfully');
      } else {
        await metadataService.createDepartment(formData.department_name);
        alert('Department created successfully');
      }
      setShowModal(false);
      setFormData({ department_name: '' });
      setEditingDepartment(null);
      fetchDepartments();
    } catch (error) {
      console.error('Error saving department:', error);
      alert('Failed to save department');
    }
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setFormData({ department_name: department.department_name });
    setShowModal(true);
  };

  const handleToggleStatus = async (id: number) => {
    if (!confirm('Are you sure you want to toggle the status of this department?')) return;
    
    try {
      await metadataService.toggleDepartmentStatus(id);
      fetchDepartments();
    } catch (error) {
      console.error('Error toggling department status:', error);
      alert('Failed to toggle department status');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this department? This action cannot be undone.')) return;
    
    try {
      await metadataService.deleteDepartment(id);
      alert('Department deleted successfully');
      fetchDepartments();
    } catch (error) {
      console.error('Error deleting department:', error);
      alert('Failed to delete department. It may be in use.');
    }
  };

  const filteredDepartments = departments.filter(dept =>
    dept.department_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="metadata-management">
      <div className="management-header">
        <div className="status-indicator">
          <span className="status-dot"></span>
          <span>Faculty Departments Management</span>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary btn-sm" onClick={() => { setShowModal(true); setEditingDepartment(null); setFormData({ department_name: '' }); }}>
            <Plus size={20} />
            <span>Add Department</span>
          </button>
        </div>
      </div>

      <div className="management-controls">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search departments..."
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
          <button className="btn btn-ghost btn-sm" onClick={fetchDepartments} disabled={loading}>
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
              <th>Department Name</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDepartments.length === 0 ? (
              <tr>
                <td colSpan={4} className="empty-state">
                  {loading ? 'Loading...' : 'No departments found'}
                </td>
              </tr>
            ) : (
              filteredDepartments.map((dept) => (
                <tr key={dept.id} className={!dept.is_active ? 'inactive-row' : ''}>
                  <td>{dept.id}</td>
                  <td>{dept.department_name}</td>
                  <td>
                    <span className={`status-badge ${dept.is_active ? 'active' : 'inactive'}`}>
                      {dept.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => handleEdit(dept)}
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn-icon btn-toggle"
                        onClick={() => handleToggleStatus(dept.id)}
                        title={dept.is_active ? 'Deactivate' : 'Activate'}
                      >
                        <Power size={16} />
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => handleDelete(dept.id)}
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
            <h2>{editingDepartment ? 'Edit Department' : 'Add New Department'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Department Name *</label>
                <input
                  type="text"
                  value={formData.department_name}
                  onChange={(e) => setFormData({ department_name: e.target.value })}
                  placeholder="e.g., Computer Science Department"
                  required
                  autoFocus
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingDepartment ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentsManagement;
