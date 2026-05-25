// client/src/pages/SettingsPage.jsx
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile, logout } from '../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import Button from '../components/ui/Button';
import styles from './SettingsPage.module.css';
import toast from 'react-hot-toast';

const SettingsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading } = useSelector((s) => s.auth);
  const [form, setForm] = useState({
    name:       user?.name       || '',
    schoolName: user?.school?.name || '',
    schoolCity: user?.school?.city || '',
  });

  const handleSave = async () => {
    const res = await dispatch(updateProfile(form));
    if (updateProfile.fulfilled.match(res)) toast.success('Profile updated!');
    else toast.error('Update failed');
  };

  const handleLogout = () => { dispatch(logout()); navigate('/login'); };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <AppLayout title="Settings">
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.sub}>Manage your account and preferences.</p>
        </div>

        {/* Profile */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Profile Information</h2>
          <div className={styles.avatarRow}>
            <div className={styles.bigAvatar}>{user?.name?.[0]?.toUpperCase() || '?'}</div>
            <div>
              <div className={styles.avatarName}>{user?.name}</div>
              <div className={styles.avatarEmail}>{user?.email}</div>
              <div className={styles.avatarRole}>Teacher</div>
            </div>
          </div>
          <div className={styles.form}>
            <div className={styles.formRow}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Full Name</label>
                <input className={styles.input} value={form.name} onChange={(e) => set('name', e.target.value)} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Email</label>
                <input className={styles.input} value={user?.email || ''} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>School Name</label>
                <input className={styles.input} value={form.schoolName} onChange={(e) => set('schoolName', e.target.value)} placeholder="Delhi Public School" />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>City</label>
                <input className={styles.input} value={form.schoolCity} onChange={(e) => set('schoolCity', e.target.value)} placeholder="New Delhi" />
              </div>
            </div>
            <div className={styles.formActions}>
              <Button variant="brand" loading={loading} onClick={handleSave}>Save Changes</Button>
            </div>
          </div>
        </div>

        {/* Account */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Account</h2>
          <div className={styles.accountRow}>
            <div>
              <div className={styles.accountLabel}>Member since</div>
              <div className={styles.accountVal}>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }) : '-'}</div>
            </div>
            <div>
              <div className={styles.accountLabel}>Account type</div>
              <div className={styles.accountVal}>Teacher (Free)</div>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div className={`${styles.card} ${styles.dangerCard}`}>
          <h2 className={`${styles.cardTitle} ${styles.dangerTitle}`}>Danger Zone</h2>
          <p className={styles.dangerDesc}>Once you log out, you'll need to sign in again. Your data is safely stored in the cloud.</p>
          <Button variant="danger" onClick={handleLogout}>Sign Out</Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
