import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { FileText, Filter, Plus, Search, X } from 'lucide-react';
import { fetchAssignments, resetForm } from '../store/slices/assignmentSlice';
import { fetchGroups } from '../store/slices/groupSlice';
import AppLayout from '../components/layout/AppLayout';
import AssignmentCard from '../components/assignments/AssignmentCard';
import CreateModal from '../components/assignments/CreateModal';
import AnimatedContainer from '../components/ui/AnimatedContainer';
import styles from './AssignmentsPage.module.css';

const AssignmentsPage = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { list, loading, total } = useSelector((s) => s.assignments);
  const [showCreate, setShowCreate] = useState(false);
  const [localSearch, setLocalSearch] = useState('');

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      dispatch(resetForm());
      setShowCreate(true);
      setSearchParams({});
    }
  }, [dispatch, searchParams, setSearchParams]);

  useEffect(() => {
    dispatch(fetchGroups());
    dispatch(fetchAssignments({}));
  }, [dispatch]);

  useEffect(() => {
    const t = setTimeout(() => dispatch(fetchAssignments({ search: localSearch })), 320);
    return () => clearTimeout(t);
  }, [dispatch, localSearch]);

  const handleCreate = () => {
    dispatch(resetForm());
    setShowCreate(true);
  };

  return (
    <AppLayout title="Assignments">
      <AnimatedContainer className={styles.page}>
        <div className={styles.pageHeader}>
          <div>
            <div className={styles.titleRow}>
              <span className={styles.onlineDot} />
              <h1 className={styles.pageTitle}>Assignments</h1>
              {total > 0 && <span className={styles.countBadge}>{total}</span>}
            </div>
            <p className={styles.pageSub}>Manage and create assignments for your groups.</p>
          </div>
        </div>

        {list.length > 0 && (
          <div className={styles.controls}>
            <button className={styles.filterBtn}>
              <Filter size={14} strokeWidth={2} /> Filter By
            </button>
            <div className={styles.searchBox}>
              <span className={styles.searchIcon}><Search size={14} strokeWidth={2} /></span>
              <input
                placeholder="Search assignments"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
              />
            </div>
          </div>
        )}

        {loading ? (
          <div className={styles.grid}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`${styles.skeletonCard} skeleton`} />
            ))}
          </div>
        ) : list.length === 0 ? (
          <EmptyState onCreate={handleCreate} />
        ) : (
          <div className={styles.grid}>
            {list.map((a) => <AssignmentCard key={a._id} assignment={a} />)}
          </div>
        )}
      </AnimatedContainer>

      <button className={styles.mobileFab} onClick={handleCreate} aria-label="Create assignment">
        <Plus size={22} strokeWidth={2.4} />
      </button>

      <CreateModal open={showCreate} onClose={() => setShowCreate(false)} />
    </AppLayout>
  );
};

const EmptyState = ({ onCreate }) => (
  <div className={styles.empty}>
    <div className={styles.emptyIllo}>
      <div className={styles.emptyCircle}>
        <div className={styles.emptyDoc}>
          <FileText size={18} strokeWidth={2} />
          <div className={styles.docLine1} />
          <div className={styles.docLine} />
          <div className={styles.docLine} style={{ width: '85%' }} />
          <div className={styles.docLine} style={{ width: '60%' }} />
        </div>
      </div>

      <div className={styles.emptyCard}>
        <div className={styles.cardDot} />
        <div className={styles.cardLine} />
      </div>

      <div className={styles.emptyMagnifier}>
        <div className={styles.magnifierCircle}>
          <X size={24} strokeWidth={3} />
        </div>
        <div className={styles.magnifierHandle} />
      </div>

      <div className={styles.emptyDot} />
    </div>

    <h2 className={styles.emptyTitle}>No assignments yet</h2>
    <p className={styles.emptyText}>
      Create your first assignment to start collecting and grading student
      submissions. Set rubrics, define marking criteria, and let AI assist with grading.
    </p>
    <button className={styles.emptyBtn} onClick={onCreate}>
      <Plus size={15} strokeWidth={2.4} /> Create Your First Assignment
    </button>
  </div>
);

export default AssignmentsPage;
