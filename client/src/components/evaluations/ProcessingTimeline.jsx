import { CheckCircle2, Circle, LoaderCircle, XCircle } from 'lucide-react';
import styles from './ProcessingTimeline.module.css';

const iconFor = (status) => {
  if (status === 'complete') return CheckCircle2;
  if (status === 'active') return LoaderCircle;
  if (status === 'failed') return XCircle;
  return Circle;
};

const ProcessingTimeline = ({ stages = [], progress = 0, state = 'uploaded' }) => (
  <div className={styles.card}>
    <div className={styles.topline}>
      <div>
        <h3>Processing pipeline</h3>
        <p>{state === 'partial' ? 'Ready for review. OCR integration is pending.' : 'Tracking backend processing state.'}</p>
      </div>
      <span>{Math.round(progress)}%</span>
    </div>
    <div className={styles.track}><div style={{ width: `${progress}%` }} /></div>
    <div className={styles.steps}>
      {stages.map((stage) => {
        const Icon = iconFor(stage.status);
        return (
          <div key={stage.key} className={`${styles.step} ${styles[stage.status] || ''}`}>
            <Icon size={16} strokeWidth={2} />
            <div>
              <strong>{stage.label}</strong>
              {stage.message && <span>{stage.message}</span>}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export default ProcessingTimeline;
