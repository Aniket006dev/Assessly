import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CheckCircle2, ClipboardList, HelpCircle, Target } from 'lucide-react';
import { fetchAssignments } from '../store/slices/assignmentSlice';
import { setDashboardStats } from '../store/slices/uiSlice';
import AppLayout from '../components/layout/AppLayout';
import DashboardCard from '../components/ui/DashboardCard';
import AnimatedContainer from '../components/ui/AnimatedContainer';
import api from '../utils/api';
import styles from './AnalyticsPage.module.css';

const AnalyticsPage = () => {
  const dispatch = useDispatch();
  const { list } = useSelector((s) => s.assignments);
  const { dashboardStats: stats } = useSelector((s) => s.ui);

  useEffect(() => {
    dispatch(fetchAssignments({ limit: 50 }));
    api.get('/dashboard/stats').then((r) => dispatch(setDashboardStats(r.data.data))).catch(() => {});
  }, [dispatch]);

  const totalMarks = list.reduce((a, x) => a + (x.totalMarks || 0), 0);
  const byDiff = { easy: 0, medium: 0, hard: 0 };
  list.forEach((a) => a.paper?.sections?.forEach((s) => s.questions?.forEach((q) => { if (byDiff[q.difficulty] !== undefined) byDiff[q.difficulty]++; })));
  const totalQs = byDiff.easy + byDiff.medium + byDiff.hard;

  return (
    <AppLayout title="Analytics">
      <AnimatedContainer className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Analytics</h1>
          <p className={styles.sub}>Insights into your assessment activity</p>
        </div>

        <div className={styles.statsRow}>
          <DashboardCard label="Total Assignments" value={stats?.totalAssignments ?? list.length} icon={ClipboardList} tone="blue" />
          <DashboardCard label="Completed Papers" value={stats?.completedAssignments ?? 0} icon={CheckCircle2} tone="emerald" delay={0.03} />
          <DashboardCard label="Total Questions" value={totalQs} icon={HelpCircle} tone="indigo" delay={0.06} />
          <DashboardCard label="Total Marks" value={totalMarks} icon={Target} tone="slate" delay={0.09} />
        </div>

        {stats?.subjectDistribution?.length > 0 && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Assignments by Subject</h2>
            <div className={styles.barList}>
              {stats.subjectDistribution.map(({ _id, count }) => {
                const pct = Math.round((count / (stats.totalAssignments || 1)) * 100);
                return (
                  <div key={_id} className={styles.barRow}>
                    <div className={styles.barLabel}>{_id || 'Uncategorized'}</div>
                    <div className={styles.barTrack}>
                      <div className={styles.barFill} style={{ width: `${pct}%` }} />
                    </div>
                    <div className={styles.barVal}>{count} ({pct}%)</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {totalQs > 0 && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Question Difficulty Distribution</h2>
            <div className={styles.diffRow}>
              {[
                { key: 'easy', label: 'Easy', color: '#10B981' },
                { key: 'medium', label: 'Medium', color: '#F59E0B' },
                { key: 'hard', label: 'Hard', color: '#EF4444' },
              ].map(({ key, label, color }) => {
                const pct = totalQs > 0 ? Math.round((byDiff[key] / totalQs) * 100) : 0;
                return (
                  <div key={key} className={styles.diffCard} style={{ '--dc': color }}>
                    <div className={styles.diffCircle} style={{ background: `${color}20`, border: `3px solid ${color}` }}>
                      <span className={styles.diffPct}>{pct}%</span>
                    </div>
                    <div className={styles.diffLabel}>{label}</div>
                    <div className={styles.diffCount}>{byDiff[key]} questions</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Recent Activity</h2>
          {list.length === 0 ? (
            <p className={styles.noData}>No assignments yet. Create one to see analytics.</p>
          ) : (
            <div className={styles.activityList}>
              {list.slice(0, 8).map((a) => (
                <div key={a._id} className={styles.activityRow}>
                  <div className={styles.activityDot} style={{ background: a.status === 'completed' ? '#10B981' : a.status === 'failed' ? '#EF4444' : '#F59E0B' }} />
                  <div className={styles.activityInfo}>
                    <span className={styles.activityTitle}>{a.title}</span>
                    <span className={styles.activitySub}>{a.subject} · {a.numQuestions} questions</span>
                  </div>
                  <span className={styles.activityDate}>{new Date(a.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </AnimatedContainer>
    </AppLayout>
  );
};

export default AnalyticsPage;
