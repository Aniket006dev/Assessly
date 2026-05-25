import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { BookOpenCheck, CheckCircle2, ClipboardList, Clock3, Plus, Users } from 'lucide-react';
import { fetchAssignments, resetForm } from '../store/slices/assignmentSlice';
import { fetchGroups } from '../store/slices/groupSlice';
import { setDashboardStats, setStatsLoading } from '../store/slices/uiSlice';
import AppLayout from '../components/layout/AppLayout';
import AssignmentCard from '../components/assignments/AssignmentCard';
import AnimatedContainer from '../components/ui/AnimatedContainer';
import DashboardCard from '../components/ui/DashboardCard';
import api from '../utils/api';
import styles from './DashboardPage.module.css';

const DashboardPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const { list: assignments, loading } = useSelector((s) => s.assignments);
  const { list: groups } = useSelector((s) => s.groups);
  const { dashboardStats, statsLoading } = useSelector((s) => s.ui);

  useEffect(() => {
    dispatch(fetchAssignments({ limit: 6 }));
    dispatch(fetchGroups());
    loadStats();
  }, [dispatch]);

  const loadStats = async () => {
    dispatch(setStatsLoading(true));
    try {
      const res = await api.get('/dashboard/stats');
      dispatch(setDashboardStats(res.data.data));
    } catch (_) {}
    dispatch(setStatsLoading(false));
  };

  const stats = dashboardStats;
  const completed = stats?.completedAssignments ?? 0;
  const total = stats?.totalAssignments ?? 0;
  const totalGroups = stats?.totalGroups ?? 0;
  const pending = stats?.pendingAssignments ?? 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const recentAssignments = assignments.slice(0, 4);
  const date = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <AppLayout title="Dashboard">
      <div className={styles.page}>
        <AnimatedContainer className={styles.welcomeBanner}>
          <div className={styles.welcomeLeft}>
            <span className={styles.eyebrow}>Teacher workspace</span>
            <h1 className={styles.welcomeTitle}>
              {greeting}, {user?.name?.split(' ')[0] || 'Teacher'}
            </h1>
            <p className={styles.welcomeSub}>
              {user?.school?.name || 'Your school'} · {date}
            </p>
          </div>
          <button
            className={styles.quickCreate}
            onClick={() => { dispatch(resetForm()); navigate('/assignments?create=true'); }}
          >
            <Plus size={16} strokeWidth={2.4} /> Create Assignment
          </button>
        </AnimatedContainer>

        <div className={styles.statsRow}>
          <DashboardCard label="Total Assignments" value={statsLoading ? '...' : total} icon={ClipboardList} tone="blue" sub={`${completed} completed`} delay={0.03} />
          <DashboardCard label="Active Groups" value={statsLoading ? '...' : totalGroups} icon={Users} tone="emerald" sub="groups enrolled" delay={0.06} />
          <DashboardCard label="Pending" value={statsLoading ? '...' : pending} icon={Clock3} tone="slate" sub="awaiting generation" delay={0.09} />
          <DashboardCard label="Completion Rate" value={total > 0 ? `${Math.round((completed / total) * 100)}%` : '-'} icon={CheckCircle2} tone="indigo" sub="assignments done" delay={0.12} />
        </div>

        <AnimatedContainer as="section" className={styles.section} delay={0.08}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Recent Assignments</h2>
            <button className={styles.seeAll} onClick={() => navigate('/assignments')}>See all</button>
          </div>
          {loading ? (
            <div className={styles.grid}>
              {[...Array(4)].map((_, i) => <div key={i} className={`${styles.skeletonCard} skeleton`} />)}
            </div>
          ) : recentAssignments.length === 0 ? (
            <div className={styles.emptySection}>
              <BookOpenCheck size={34} strokeWidth={1.8} />
              <p>No assignments yet. <button onClick={() => navigate('/assignments?create=true')}>Create your first one</button></p>
            </div>
          ) : (
            <div className={styles.grid}>
              {recentAssignments.map((a) => <AssignmentCard key={a._id} assignment={a} />)}
            </div>
          )}
        </AnimatedContainer>

        {stats?.subjectDistribution?.length > 0 && (
          <AnimatedContainer as="section" className={styles.section} delay={0.12}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Assignments by Subject</h2>
            </div>
            <div className={styles.subjectGrid}>
              {stats.subjectDistribution.map(({ _id, count }) => {
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={_id} className={styles.subjectRow}>
                    <div className={styles.subjectName}>{_id || 'Uncategorized'}</div>
                    <div className={styles.subjectBarWrap}>
                      <div className={styles.subjectBar} style={{ width: `${pct}%` }} />
                    </div>
                    <div className={styles.subjectCount}>{count}</div>
                  </div>
                );
              })}
            </div>
          </AnimatedContainer>
        )}

        {groups.length > 0 && (
          <AnimatedContainer as="section" className={styles.section} delay={0.16}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>My Groups</h2>
              <button className={styles.seeAll} onClick={() => navigate('/groups')}>Manage</button>
            </div>
            <div className={styles.classesRow}>
              {groups.slice(0, 4).map((g) => (
                <button key={g._id} className={styles.classChip} style={{ '--c': g.color || 'var(--brand)' }} onClick={() => navigate('/groups')}>
                  <div className={styles.classAvatar} style={{ background: g.color || 'var(--brand)' }}>
                    {g.name[0]}
                  </div>
                  <div>
                    <div className={styles.className}>{g.name}</div>
                    <div className={styles.classSub}>{g.subject} · {g.studentCount} students</div>
                  </div>
                </button>
              ))}
            </div>
          </AnimatedContainer>
        )}
      </div>
    </AppLayout>
  );
};

export default DashboardPage;
