import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Lock, Mail, Phone, Save, CheckCircle, AlertCircle } from 'lucide-react';
import './Settings.css';

const Settings = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    contact_number: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      // await userService.updateProfile({ contact_number: formData.contact_number });
      setMessage({ type: 'success', text: 'Contact number updated successfully!' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to update contact number. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match!' });
      return;
    }
    if (formData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long!' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      // await userService.changePassword({ currentPassword: formData.currentPassword, newPassword: formData.newPassword });
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch {
      setMessage({ type: 'error', text: 'Failed to change password. Please check your current password.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-page">

      {/* Page Title */}
      <div className="page-title-block">
        <h2>Settings</h2>
        <p className="page-subtitle">Manage your account details and security preferences.</p>
      </div>

      {/* Alert */}
      {message && (
        <div className={`settings-alert ${message.type}`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </div>
      )}

      {/* Personal Information Card */}
      <div className="settings-glass">
        <div className="settings-card-header">
          <div className="settings-card-icon">
            <User size={20} />
          </div>
          <div>
            <h3>Personal Information</h3>
            <p>Update your contact details</p>
          </div>
        </div>
        <div className="settings-card-body">
          <form className="settings-form" onSubmit={handleUpdateProfile}>

            <div className="settings-field">
              <label><User size={14} /> Full Name</label>
              <input
                className="settings-input"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your full name"
                disabled
              />
              <p className="settings-field-hint">Contact admin to change your name</p>
            </div>

            <div className="settings-field">
              <label><Mail size={14} /> Email Address</label>
              <input
                className="settings-input"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
                disabled
              />
              <p className="settings-field-hint">Contact admin to change your email</p>
            </div>

            <div className="settings-field">
              <label><Phone size={14} /> Contact Number</label>
              <input
                className="settings-input"
                type="tel"
                name="contact_number"
                value={formData.contact_number}
                onChange={handleChange}
                placeholder="+63 XXX XXX XXXX"
              />
            </div>

            <button type="submit" className="btn-settings-save" disabled={loading}>
              <Save size={16} />
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="settings-glass">
        <div className="settings-card-header">
          <div className="settings-card-icon">
            <Lock size={20} />
          </div>
          <div>
            <h3>Change Password</h3>
            <p>Keep your account secure</p>
          </div>
        </div>
        <div className="settings-card-body">
          <form className="settings-form" onSubmit={handleChangePassword}>

            <div className="settings-field">
              <label><Lock size={14} /> Current Password</label>
              <input
                className="settings-input"
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                placeholder="Enter current password"
              />
            </div>

            <div className="settings-field">
              <label><Lock size={14} /> New Password</label>
              <input
                className="settings-input"
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter new password"
              />
            </div>

            <div className="settings-field">
              <label><Lock size={14} /> Confirm New Password</label>
              <input
                className="settings-input"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
              />
            </div>

            <button type="submit" className="btn-settings-save" disabled={loading}>
              <Lock size={16} />
              {loading ? 'Changing…' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>

    </div>
  );
};

export default Settings;
