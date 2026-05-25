import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, ClipboardList, Database, FileSearch, LoaderCircle, Lightbulb, Sparkles, WandSparkles } from 'lucide-react';
import { useWebSocket } from '../../hooks/useWebSocket';
import styles from './GeneratingScreen.module.css';

const GEN_STEPS = [
  { label: 'Parsing assignment details', icon: ClipboardList },
  { label: 'Structuring AI prompt', icon: WandSparkles },
  { label: 'Calling AI', icon: Sparkles },
  { label: 'Parsing and validating response', icon: FileSearch },
  { label: 'Saving to database', icon: Database },
];

const GeneratingScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { subscribeToJob } = useWebSocket();
  const { currentJobId, genProgress, genStep, activeAssignment } = useSelector((s) => s.assignments);

  useEffect(() => {
    if (currentJobId) subscribeToJob(currentJobId);
  }, [currentJobId, subscribeToJob]);

  useEffect(() => {
    if (genProgress >= 100 && activeAssignment?.paper) {
      const timer = setTimeout(() => navigate(`/assignments/${id}`), 600);
      return () => clearTimeout(timer);
    }
  }, [genProgress, activeAssignment, id, navigate]);

  const title = activeAssignment?.title || 'Your Assignment';
  const numQ = activeAssignment?.numQuestions || 10;

  return (
    <div className={styles.screen}>
      <div className={styles.orb}>
        <span className={styles.orbIcon}><Sparkles size={26} strokeWidth={2} /></span>
        <div className={styles.orbRing1} />
        <div className={styles.orbRing2} />
      </div>

      <h2 className={styles.title}>Generating Your Paper</h2>
      <p className={styles.subtitle}>
        Claude is crafting <strong>{numQ} thoughtful questions</strong> for<br />
        "{title}"
      </p>

      <div className={styles.steps}>
        {GEN_STEPS.map((step, i) => {
          const done = i < genStep;
          const active = i === genStep;
          const st = done ? 'done' : active ? 'active' : 'pending';
          const Icon = step.icon;
          return (
            <div key={step.label} className={`${styles.stepRow} ${styles[st]}`}>
              <div className={`${styles.stepIcon} ${styles[st]}`}>
                {done ? <Check size={13} strokeWidth={2.4} /> : active ? <LoaderCircle size={14} strokeWidth={2} /> : <Icon size={14} strokeWidth={2} />}
              </div>
              <span className={styles.stepText}>{step.label}</span>
              {done && <span className={styles.stepTag} style={{ color: 'var(--green)' }}>Done</span>}
              {active && <span className={styles.stepTag} style={{ color: 'var(--brand)' }}>Processing...</span>}
            </div>
          );
        })}
      </div>

      <div className={styles.progressWrap}>
        <div className={styles.progressBar} style={{ width: `${genProgress}%` }} />
      </div>
      <div className={styles.progressLabel}>{genProgress}% complete</div>

      <div className={styles.tip}>
        <Lightbulb size={15} strokeWidth={2} />
        Questions are being organized into sections by type and difficulty.
      </div>
    </div>
  );
};

export default GeneratingScreen;
