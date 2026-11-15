import { FileText, Image, RotateCcw, Upload, X } from 'lucide-react';
import styles from './EvaluationUpload.module.css';

const formatBytes = (bytes = 0) => {
  if (!bytes) return '0 KB';
  const units = ['B', 'KB', 'MB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const iconFor = (file) => file?.type?.includes('image') ? Image : FileText;

const EvaluationUpload = ({ label, description, file, onChange, onRemove }) => {
  const Icon = iconFor(file);
  return (
    <label className={`${styles.zone} ${file ? styles.hasFile : ''}`}>
      <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(event) => onChange(event.target.files?.[0] || null)} />
      <div className={styles.icon}><Icon size={24} strokeWidth={1.9} /></div>
      <div className={styles.copy}>
        <strong>{label}</strong>
        <span>{description}</span>
        {file && (
          <div className={styles.fileMeta}>
            <span>{file.name}</span>
            <small>{file.type || 'Unknown type'} - {formatBytes(file.size)}</small>
          </div>
        )}
      </div>
      <div className={styles.action}>{file ? <RotateCcw size={16} strokeWidth={2} /> : <Upload size={16} strokeWidth={2} />}</div>
      {file && <button type="button" className={styles.remove} onClick={(event) => { event.preventDefault(); onRemove(); }} aria-label={`Remove ${label}`}><X size={15} strokeWidth={2.2} /></button>}
    </label>
  );
};

export default EvaluationUpload;
