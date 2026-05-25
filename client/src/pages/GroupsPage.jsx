// client/src/pages/GroupsPage.jsx
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGroups, createGroup, deleteGroup, setGroupForm, resetGroupForm, setShowCreateModal } from '../store/slices/groupSlice';
import AppLayout from '../components/layout/AppLayout';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { Plus, Trash2, Users } from 'lucide-react';
import styles from './GroupsPage.module.css';
import toast from 'react-hot-toast';

const COLORS = ['#E8440A','#3B82F6','#10B981','#8B5CF6','#F59E0B','#EF4444','#EC4899','#14B8A6'];

const GroupsPage = () => {
  const dispatch = useDispatch();
  const { list, loading, showCreateModal, form, formErrors } = useSelector((s) => s.groups);
  const [errors, setErrors] = useState({});

  useEffect(() => { dispatch(fetchGroups()); }, [dispatch]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Class name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    const res = await dispatch(createGroup(form));
    if (createGroup.fulfilled.match(res)) {
      toast.success('Class created!');
      dispatch(resetGroupForm());
      setErrors({});
    } else {
      toast.error('Failed to create class');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete class "${name}"?`)) return;
    await dispatch(deleteGroup(id));
    toast.success('Class deleted');
  };

  const set = (k, v) => dispatch(setGroupForm({ [k]: v }));

  return (
    <AppLayout title="My Classes">
      <div className={styles.page}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>My Classes</h1>
            <p className={styles.pageSub}>Organise your students into classes and groups.</p>
          </div>
          <Button variant="brand" onClick={() => { dispatch(setShowCreateModal(true)); dispatch(resetGroupForm()); setErrors({}); }}>
            <Plus size={15} strokeWidth={2.4} /> New Class
          </Button>
        </div>

        {/* Grid */}
        {loading ? (
          <div className={styles.grid}>
            {[...Array(6)].map((_, i) => <div key={i} className={`${styles.skelCard} skeleton`} />)}
          </div>
        ) : list.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}><Users size={40} strokeWidth={1.8} /></div>
            <h2>No classes yet</h2>
            <p>Create your first class to organise your students and assign work.</p>
            <Button variant="primary" onClick={() => dispatch(setShowCreateModal(true))}>
              <Plus size={15} strokeWidth={2.4} /> Create Class
            </Button>
          </div>
        ) : (
          <div className={styles.grid}>
            {list.map((g) => (
              <div key={g._id} className={styles.groupCard} style={{ '--c': g.color || 'var(--brand)' }}>
                <div className={styles.cardTop}>
                  <div className={styles.groupAvatar} style={{ background: g.color }}>
                    {g.name[0].toUpperCase()}
                  </div>
                  <button
                    className={styles.delBtn}
                    onClick={() => handleDelete(g._id, g.name)}
                    title="Delete class"
                  >
                    <Trash2 size={15} strokeWidth={2} />
                  </button>
                </div>
                <h3 className={styles.groupName}>{g.name}</h3>
                <div className={styles.groupMeta}>
                  {g.subject && <span className={styles.groupChip}>{g.subject}</span>}
                  {g.grade   && <span className={styles.groupChip}>Grade {g.grade}</span>}
                  {g.section && <span className={styles.groupChip}>Sec {g.section}</span>}
                </div>
                {g.description && <p className={styles.groupDesc}>{g.description}</p>}
                <div className={styles.groupFooter}>
                  <span className={styles.studentCount}><Users size={13} strokeWidth={2} /> {g.studentCount || 0} students</span>
                  <span>{new Date(g.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      <Modal
        open={showCreateModal}
        onClose={() => dispatch(setShowCreateModal(false))}
        title="Create New Class"
        subtitle="Add a class to organise your assignments"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => dispatch(setShowCreateModal(false))}>Cancel</Button>
            <Button variant="brand" onClick={handleCreate}>Create Class</Button>
          </>
        }
      >
        <div className={styles.createForm}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Class Name *</label>
            <input
              className={`${styles.input} ${errors.name ? styles.errInput : ''}`}
              placeholder="e.g. Class 10-A"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
            />
            {errors.name && <span className={styles.errText}>{errors.name}</span>}
          </div>

          <div className={styles.row}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Subject</label>
              <input className={styles.input} placeholder="e.g. Physics" value={form.subject} onChange={(e) => set('subject', e.target.value)} />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Grade</label>
              <input className={styles.input} placeholder="e.g. 10" value={form.grade} onChange={(e) => set('grade', e.target.value)} />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Section</label>
              <input className={styles.input} placeholder="e.g. A" value={form.section} onChange={(e) => set('section', e.target.value)} />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>No. of Students</label>
              <input type="number" className={styles.input} placeholder="0" value={form.studentCount} min={0}
                onChange={(e) => set('studentCount', e.target.value)} />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Description</label>
            <textarea className={`${styles.input} ${styles.textarea}`} rows={2} placeholder="Optional note about this class..."
              value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Color</label>
            <div className={styles.colorPicker}>
              {COLORS.map((c) => (
                <button
                  key={c} type="button"
                  className={`${styles.colorDot} ${form.color === c ? styles.colorActive : ''}`}
                  style={{ background: c }}
                  onClick={() => set('color', c)}
                />
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
};

export default GroupsPage;
