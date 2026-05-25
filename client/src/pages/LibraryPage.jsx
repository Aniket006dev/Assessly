import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Calendar, Download, Eye, FileText, HelpCircle, Target } from 'lucide-react';
import { fetchAssignments, setActiveAssignment, setGeneratedPaper } from '../store/slices/assignmentSlice';
import AppLayout from '../components/layout/AppLayout';
import Button from '../components/ui/Button';
import AnimatedContainer from '../components/ui/AnimatedContainer';
import styles from './LibraryPage.module.css';

const LibraryPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, loading } = useSelector((s) => s.assignments);
  const completed = list.filter((a) => a.status === 'completed' && a.paper);

  useEffect(() => { dispatch(fetchAssignments({ status: 'completed', limit: 50 })); }, [dispatch]);

  const handleView = (a) => {
    dispatch(setActiveAssignment(a));
    dispatch(setGeneratedPaper(a.paper));
    navigate(`/assignments/${a._id}`);
  };

  return (
    <AppLayout title="My Library">
      <AnimatedContainer className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>My Library</h1>
          <p className={styles.sub}>All your completed question papers, ready to view or download.</p>
        </div>

        {loading ? (
          <div className={styles.grid}>
            {[...Array(6)].map((_, i) => <div key={i} className={`${styles.skel} skeleton`} />)}
          </div>
        ) : completed.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}><BookOpen size={42} strokeWidth={1.8} /></div>
            <h2>No papers in library yet</h2>
            <p>Completed question papers will appear here once generated.</p>
            <Button variant="primary" onClick={() => navigate('/assignments?create=true')}>Create Assignment</Button>
          </div>
        ) : (
          <div className={styles.grid}>
            {completed.map((a) => (
              <div key={a._id} className={styles.libCard}>
                <div className={styles.libCardTop}>
                  <div className={styles.libIcon}><FileText size={24} strokeWidth={1.9} /></div>
                  <div className={styles.libMeta}>
                    <h3 className={styles.libTitle}>{a.title}</h3>
                    <span className={styles.libSub}>{a.subject}</span>
                  </div>
                </div>
                <div className={styles.libInfo}>
                  <span><Target size={13} strokeWidth={2} /> {a.totalMarks} marks</span>
                  <span><HelpCircle size={13} strokeWidth={2} /> {a.numQuestions} questions</span>
                  <span><Calendar size={13} strokeWidth={2} /> {a.dueDate ? new Date(a.dueDate).toLocaleDateString('en-IN') : '-'}</span>
                </div>
                {a.paper?.sections && (
                  <div className={styles.sections}>
                    {a.paper.sections.map((s) => (
                      <span key={s.id} className={styles.sectionTag}>{s.title} ({s.questions?.length || 0})</span>
                    ))}
                  </div>
                )}
                <div className={styles.libActions}>
                  <Button variant="secondary" size="sm" onClick={() => handleView(a)}>
                    <Eye size={14} strokeWidth={2} /> View
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => { handleView(a); setTimeout(() => window.print(), 500); }}>
                    <Download size={14} strokeWidth={2} /> Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AnimatedContainer>
    </AppLayout>
  );
};

export default LibraryPage;
