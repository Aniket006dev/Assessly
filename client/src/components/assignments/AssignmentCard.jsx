import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Calendar, CheckCircle2, Clock3, Eye, FileText, MoreVertical, Trash2 } from 'lucide-react';
import { deleteAssignment, setActiveAssignment, setGeneratedPaper } from '../../store/slices/assignmentSlice';
import styles from './AssignmentCard.module.css';
import toast from 'react-hot-toast';

const fmtDate = (d) => {
  if (!d) return '-';
  try {
    const dt = new Date(d);
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const yy = dt.getFullYear();
    return `${dd}-${mm}-${yy}`;
  } catch { return '-'; }
};

const AssignmentCard = ({ assignment }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const {
    _id,
    title,
    dueDate,
    createdAt,
    paper,
    status,
    subject,
    numQuestions,
    totalMarks,
  } = assignment;

  useEffect(() => {
    const close = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const handleView = () => {
    dispatch(setActiveAssignment(assignment));
    if (paper) dispatch(setGeneratedPaper(paper));
    navigate(`/assignments/${_id}`);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (!window.confirm(`Delete "${title}"?`)) return;
    await dispatch(deleteAssignment(_id));
    toast.success('Assignment deleted');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleView();
    }
  };

  const statusLabel = status ? status.replace(/_/g, ' ') : 'draft';
  const complete = status === 'completed';

  return (
    <article
      className={styles.card}
      onClick={handleView}
      onKeyDown={handleKeyDown}
      role="link"
      tabIndex={0}
      aria-label={`Open assignment ${title}`}
    >
      <div className={styles.top}>
        <div className={styles.titleBlock}>
          <span className={styles.subject}>{subject || 'Assessment'}</span>
          <h3 className={styles.title}>{title}</h3>
        </div>
        <div className={styles.menuWrap} ref={menuRef}>
          <button
            className={styles.menuBtn}
            onClick={(e) => { e.stopPropagation(); setMenuOpen((p) => !p); }}
            aria-label="Assignment actions"
          >
            <MoreVertical size={16} strokeWidth={2} />
          </button>
          {menuOpen && (
            <div className={styles.ctxMenu}>
              <button className={styles.ctxItem} onClick={(e) => { e.stopPropagation(); handleView(); }}>
                <Eye size={13} strokeWidth={2} /> View Assignment
              </button>
              <button className={`${styles.ctxItem} ${styles.danger}`} onClick={handleDelete}>
                <Trash2 size={13} strokeWidth={2} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.metrics}>
        <span><FileText size={14} strokeWidth={2} /> {numQuestions || 0} questions</span>
        <span><CheckCircle2 size={14} strokeWidth={2} /> {totalMarks || 0} marks</span>
      </div>

      <div className={styles.dates}>
        <div className={styles.dateRow}>
          <Calendar size={13} strokeWidth={2} />
          <span className={styles.dateLabel}>Assigned</span>
          <span className={styles.dateVal}>{fmtDate(createdAt)}</span>
        </div>
        {dueDate && (
          <div className={styles.dateRow}>
            <Clock3 size={13} strokeWidth={2} />
            <span className={styles.dateLabel}>Due</span>
            <span className={styles.dateDue}>{fmtDate(dueDate)}</span>
          </div>
        )}
      </div>

      <div className={`${styles.status} ${complete ? styles.complete : styles.pending}`}>
        {statusLabel}
      </div>
    </article>
  );
};

export default AssignmentCard;
