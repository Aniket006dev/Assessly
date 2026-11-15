import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ClipboardCheck, FileSearch, Plus, ShieldCheck, Sparkles, Trash2 } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import AnimatedContainer from '../components/ui/AnimatedContainer';
import DashboardCard from '../components/ui/DashboardCard';
import EvaluationUpload from '../components/evaluations/EvaluationUpload';
import ProcessingTimeline from '../components/evaluations/ProcessingTimeline';
import { createEvaluation, deleteEvaluation, fetchEvaluations, setUploadProgress } from '../store/slices/evaluationSlice';
import styles from './EvaluationsPage.module.css';
import toast from 'react-hot-toast';

const EvaluationsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, activeEvaluation, creating, uploadProgress, loading, error } = useSelector((s) => s.evaluations);
  const [form, setForm] = useState({ title: '', subject: '', referenceMaterial: '', gradingEnabled: true });
  const [questionPaper, setQuestionPaper] = useState(null);
  const [answerSheet, setAnswerSheet] = useState(null);

  useEffect(() => { dispatch(fetchEvaluations()); }, [dispatch]);

  const canSubmit = questionPaper && answerSheet && !creating;
  const validateUpload = (file) => {
    if (!file) return '';
    if (file.size > 25 * 1024 * 1024) return `${file.name} is larger than 25 MB. Choose a smaller scan.`;
    if (!/\.(pdf|jpe?g|png|webp)$/i.test(file.name)) return `${file.name} is not a supported format. Use PDF, JPG, PNG, or WebP.`;
    return '';
  };

  const handleSubmit = async () => {
    if (!questionPaper || !answerSheet) {
      toast.error('Upload both the question paper and answer sheet.');
      return;
    }
    const uploadError = validateUpload(questionPaper) || validateUpload(answerSheet);
    if (uploadError) {
      toast.error(uploadError);
      return;
    }
    const formData = new FormData();
    formData.append('title', form.title || 'Handwritten Answer Evaluation');
    formData.append('subject', form.subject || '');
    formData.append('referenceMaterial', form.referenceMaterial || '');
    formData.append('gradingEnabled', String(form.gradingEnabled));
    formData.append('questionPaper', questionPaper);
    formData.append('answerSheet', answerSheet);

    const result = await dispatch(createEvaluation({
      formData,
      onUploadProgress: (event) => {
        const percent = event.total ? Math.round((event.loaded * 100) / event.total) : 0;
        dispatch(setUploadProgress(percent));
      },
    }));

    if (createEvaluation.fulfilled.match(result)) {
      toast.success('Evaluation uploaded. Visual reading and dual-pass grading started.');
      navigate(`/evaluations/${result.payload._id}`);
    } else {
      toast.error(result.payload || 'Upload failed');
    }
  };

  const handleDelete = async (event, item) => {
    event.stopPropagation();
    if (!window.confirm(`Delete "${item.title}" and its uploaded papers permanently?`)) return;
    const result = await dispatch(deleteEvaluation(item._id));
    if (deleteEvaluation.fulfilled.match(result)) toast.success('Evaluation deleted');
    else toast.error(result.payload || 'Could not delete evaluation');
  };

  const summary = {
    total: list.length,
    complete: list.filter((item) => ['completed', 'partial'].includes(item.processingStatus?.state)).length,
    review: list.filter((item) => item.grading?.questionsRequiringReview > 0 || item.processingStatus?.state === 'partial').length,
  };

  return (
    <AppLayout title="Answer Evaluation">
      <AnimatedContainer className={styles.page}>
        <section className={styles.hero}>
          <div>
            <span className={styles.eyebrow}><Sparkles size={14} strokeWidth={2} /> Evaluation workspace</span>
            <h1>Review handwritten answers with mapped question context.</h1>
            <p>Upload a question paper and one student's answer sheet. Assessly stores the session, tracks backend processing, and prepares the review workspace for exact-region highlighting.</p>
          </div>
        </section>

        <div className={styles.statsRow}>
          <DashboardCard label="Evaluations" value={summary.total} icon={ClipboardCheck} tone="blue" />
          <DashboardCard label="Ready to Review" value={summary.complete} icon={FileSearch} tone="emerald" delay={0.03} />
          <DashboardCard label="Needs Review" value={summary.review} icon={ShieldCheck} tone="indigo" delay={0.06} />
        </div>

        <section className={styles.uploadPanel}>
          <div className={styles.panelHead}>
            <div>
              <h2>Start a new evaluation</h2>
              <p>PDF, JPG, JPEG, PNG, and WebP are accepted. Max file size is 25 MB each.</p>
            </div>
          </div>

          <div className={styles.metaGrid}>
            <label>
              <span>Evaluation title</span>
              <input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} placeholder="e.g. Class 10 Physics Unit Test" />
            </label>
            <label>
              <span>Subject</span>
              <input value={form.subject} onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))} placeholder="e.g. Physics" />
            </label>
            <label className={styles.toggleRow}>
              <input type="checkbox" checked={form.gradingEnabled} onChange={(event) => setForm((prev) => ({ ...prev, gradingEnabled: event.target.checked }))} />
              <span>Run two-pass grading</span>
            </label>
          </div>
          <p className={styles.analysisNote}>The reverse pass checks incorrect, missing, irrelevant, contradictory, and unsupported content against an AI model answer and rubric. A separate forward pass rechecks rubric coverage and marks. Faculty review and approve every suggested result.</p>

          <label className={styles.referenceField}>
            <span>Answer key and marking rubric <small>Optional</small></span>
            <textarea maxLength={30000} rows={4} value={form.referenceMaterial} onChange={(event) => setForm((prev) => ({ ...prev, referenceMaterial: event.target.value }))} placeholder="Paste the expected answer, key concepts, accepted alternatives, and how marks should be awarded. The reverse pass uses these criteria; the forward pass checks the scoring." />
          </label>

          <div className={styles.uploadGrid}>
            <EvaluationUpload label="Question Paper" description="Upload the printed question paper PDF or image." file={questionPaper} onChange={setQuestionPaper} onRemove={() => setQuestionPaper(null)} />
            <EvaluationUpload label="Student Answer Sheet" description="Upload one student's handwritten answer sheet." file={answerSheet} onChange={setAnswerSheet} onRemove={() => setAnswerSheet(null)} />
          </div>

          {creating && (
            <div className={styles.uploadProgress}>
              <div><span style={{ width: `${uploadProgress}%` }} /></div>
              <p>Uploading files: {uploadProgress}%</p>
            </div>
          )}
          {error && <div className={styles.error}>{error}</div>}

          <button className={styles.submitBtn} disabled={!canSubmit} onClick={handleSubmit}>
            <Plus size={16} strokeWidth={2.3} /> Upload and Process
          </button>
        </section>

        {activeEvaluation?.processingStatus && (
          <ProcessingTimeline stages={activeEvaluation.processingStatus.stages} progress={activeEvaluation.processingStatus.progress} state={activeEvaluation.processingStatus.state} />
        )}

        <section className={styles.recentSection}>
          <div className={styles.panelHead}>
            <div>
              <h2>Recent evaluations</h2>
              <p>Continue reviewing uploaded answer sheets.</p>
            </div>
          </div>
          {loading ? (
            <div className={styles.recentGrid}>{[...Array(3)].map((_, index) => <div key={index} className={`${styles.skeleton} skeleton`} />)}</div>
          ) : list.length === 0 ? (
            <div className={styles.empty}>No evaluations yet. Upload a question paper and answer sheet to begin.</div>
          ) : (
            <div className={styles.recentGrid}>
              {list.map((item) => (
                <article key={item._id} className={styles.evalCard}>
                  <button type="button" className={styles.evalCardLink} onClick={() => navigate(`/evaluations/${item._id}`)}>
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.subject || 'No subject'} - {item.questionPaper?.originalName}</span>
                    </div>
                    <small>{item.processingStatus?.state || 'uploaded'}</small>
                    <ArrowRight size={16} strokeWidth={2} />
                  </button>
                  <button type="button" className={styles.deleteCardButton} onClick={(event) => handleDelete(event, item)} aria-label={`Delete ${item.title}`} title="Delete analysis">
                    <Trash2 size={16} />
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </AnimatedContainer>
    </AppLayout>
  );
};

export default EvaluationsPage;
