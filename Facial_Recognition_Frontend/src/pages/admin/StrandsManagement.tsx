import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Power, Search, RefreshCw } from 'lucide-react';
import { metadataService } from '../../services/metadataService';
import type { Strand } from '../../types';
import './MetadataManagement.css';

const StrandsManagement = () => {
  const [strands, setStrands] = useState<Strand[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStrand, setEditingStrand] = useState<Strand | null>(null);
  const [formData, setFormData] = useState({ name: '', acronym: '' });
  const [includeInactive, setIncludeInactive] = useState(true);

  useEffect(() => {
    fetchStrands();
  }, [includeInactive]);

  const fetchStrands = async () => {
    setLoading(true);
    try {
      const data = await metadataService.getStrands(includeInactive);
      setStrands(data);
    } catch (error) {
      console.error('Error fetching strands:', error);
      alert('Failed to fetch strands');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Strand name is required');
      return;
    }

    try {
      if (editingStrand) {
        await metadataService.updateStrand(editingStrand.id, formData.name, formData.acronym);
        alert('Strand updated successfully');
      } else {
        await metadataService.createStrand(formData.name, formData.acronym);
        alert('Strand created successfully');
      }
      setShowModal(false);
      setFormData({ name: '', acronym: '' });
      setEditingStrand(null);
      fetchStrands();
    } catch (error) {
      console.error('Error saving strand:', error);
      alert('Failed to save strand');
    }
  };

  const handleEdit = (strand: Strand) => {
    setEditingStrand(strand);
    setFormData({ name: strand.name, acronym: strand.acronym || '' });
    setShowModal(true);
  };

  const handleToggleStatus = async (id: number) => {
    if (!confirm('Are you sure you want to toggle the status of this strand?')) return;
    
    try {
      await metadataService.toggleStrandStatus(id);
      fetchStrands();
    } catch (error) {
      console.error('Error toggling strand status:', error);
      alert('Failed to toggle strand status');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this strand? This action cannot be undone.')) return;
    
    try {
      await metadataService.deleteStrand(id);
      alert('Strand deleted successfully');
      fetchStrands();
    } catch (error) {
      console.error('Error deleting strand:', error);
      alert('Failed to delete strand. It may be in use.');
    }
  };

  const filteredStrands = strands.filter(strand =>
    strand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    strand.acronym?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="metadata-management">
      <div className="page-title-block">
        <h2>SHS Strands</h2>
        <p className="page-subtitle">Manage Senior High School strands and their acronyms.</p>
      </div>
      <div className="management-header">
        <div className="status-indicator">
          <span className="status-dot"></span>
          <span>SHS Strands Management</span>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary btn-sm" onClick={() => { setShowModal(true); setEditingStrand(null); setFormData({ name: '', acronym: '' }); }}>
            <Plus size={20} />
            <span>Add Strand</span>
          </button>
        </div>
      </div>

      <div className="management-controls">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search strands..."
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
          <button className="btn btn-ghost btn-sm" onClick={fetchStrands} disabled={loading}>
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
              <th>Strand Name</th>
              <th>Acronym</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStrands.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-state">
                  {loading ? 'Loading...' : 'No strands found'}
                </td>
              </tr>
            ) : (
              filteredStrands.map((strand) => (
                <tr key={strand.id} className={!strand.is_active ? 'inactive-row' : ''}>
                  <td>{strand.id}</td>
                  <td>{strand.name}</td>
                  <td>{strand.acronym || '-'}</td>
                  <td>
                    <span className={`status-badge ${strand.is_active ? 'active' : 'inactive'}`}>
                      {strand.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => handleEdit(strand)}
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn-icon btn-toggle"
                        onClick={() => handleToggleStatus(strand.id)}
                        title={strand.is_active ? 'Deactivate' : 'Activate'}
                      >
                        <Power size={16} />
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => handleDelete(strand.id)}
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
            <h2>{editingStrand ? 'Edit Strand' : 'Add New Strand'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Strand Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Science, Technology, Engineering and Mathematics"
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Acronym</label>
                <input
                  type="text"
                  value={formData.acronym}
                  onChange={(e) => setFormData({ ...formData, acronym: e.target.value })}
                  placeholder="e.g., STEM"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingStrand ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StrandsManagement;
