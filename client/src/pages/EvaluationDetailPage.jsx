import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Download, FileText, Image as ImageIcon, LoaderCircle, Save, ShieldAlert, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AppLayout from '../components/layout/AppLayout';
import { approveEvaluation, deleteEvaluation, fetchEvaluation, retryEvaluation, updateEvaluationAnswer, updateEvaluationGrade, updateEvaluationMapping } from '../store/slices/evaluationSlice';
import api from '../utils/api';
import styles from './EvaluationDetailPage.module.css';

const EvaluationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const evaluation = useSelector((state) => state.evaluations.activeEvaluation?._id === id ? state.evaluations.activeEvaluation : null);
  const loading = useSelector((state) => state.evaluations.loading);
  const [documents, setDocuments] = useState({ questionPaper: '', answerSheet: '' });
  const [pageImages, setPageImages] = useState({ questionPaper: '' , answerSheet: '' });
  const [previewErrors, setPreviewErrors] = useState({});
  const [pageNumbers, setPageNumbers] = useState({ questionPaper: 1, answerSheet: 1 });
  const [saving, setSaving] = useState('');
  const [downloading, setDownloading] = useState('');
  const [drafts, setDrafts] = useState({});
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);

  const refresh = useCallback(() => dispatch(fetchEvaluation(id)), [dispatch, id]);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    if (!selectedQuestionId && evaluation?.questions?.length) {
      setSelectedQuestionId(evaluation.questions[0].id);
    }
  }, [evaluation?.questions, selectedQuestionId]);
  useEffect(() => {
    if (!evaluation || !['processing', 'uploaded'].includes(evaluation.processingStatus?.state)) return undefined;
    const timer = window.setInterval(refresh, 3500);
    return () => window.clearInterval(timer);
  }, [evaluation?.processingStatus?.state, refresh]);
  useEffect(() => {
    let alive = true;
    const urls = [];
    setDocuments({ questionPaper: '', answerSheet: '' });
    setPageImages({ questionPaper: '', answerSheet: '' });
    setPreviewErrors({});
    Promise.all(['questionPaper', 'answerSheet'].map(async (key) => {
      try {
        const blob = await api.get(`/evaluations/${id}/files/${key === 'questionPaper' ? 'question-paper' : 'answer-sheet'}`, { responseType: 'blob' });
        const url = URL.createObjectURL(blob.data);
        urls.push(url);
        if (alive) {
          setDocuments((current) => ({ ...current, [key]: url }));
          setPreviewErrors((current) => ({ ...current, [key]: '' }));
        } else URL.revokeObjectURL(url);
      } catch {
        if (alive) setPreviewErrors((current) => ({ ...current, [key]: 'The original file could not be loaded. You can still download it below.' }));
      }
    }));
    return () => { alive = false; urls.forEach(URL.revokeObjectURL); };
  }, [id]);
  useEffect(() => {
    if (!evaluation) return undefined;
    let alive = true;
    const sources = { questionPaper: evaluation.questionPaper, answerSheet: evaluation.answerSheet };
    const urls = [];
    Promise.all(Object.keys(sources).map(async (key) => {
      const file = sources[key];
      if (!file?.pages?.some((page) => page.page === pageNumbers[key])) return;
      setPageImages((current) => ({ ...current, [key]: '' }));
      setPreviewErrors((current) => ({ ...current, [key]: '' }));
      try {
        const response = await api.get(`/evaluations/${id}/files/${key === 'questionPaper' ? 'question-paper' : 'answer-sheet'}/pages/${pageNumbers[key]}`, { responseType: 'blob' });
        const url = URL.createObjectURL(response.data);
        urls.push(url);
        if (alive) setPageImages((current) => ({ ...current, [key]: url }));
        else URL.revokeObjectURL(url);
      } catch {
        if (alive) setPreviewErrors((current) => ({ ...current, [key]: 'This page preview could not be loaded. Download the original file to view it.' }));
      }
    }));
    return () => { alive = false; urls.forEach(URL.revokeObjectURL); };
  }, [id, evaluation?.questionPaper?.pages?.length, evaluation?.answerSheet?.pages?.length, pageNumbers]);

  const downloadSource = async (kind) => {
    const file = evaluation?.[kind];
    if (!file) return;
    setDownloading(kind);
    try {
      const path = kind === 'questionPaper' ? 'question-paper' : 'answer-sheet';
      const response = await api.get(`/evaluations/${id}/files/${path}`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.originalName || `${path}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      toast.error(error.response?.data?.message || `Could not download the ${kind === 'questionPaper' ? 'question paper' : 'answer sheet'}.`);
    } finally {
      setDownloading('');
    }
  };

  const mappedAnswers = useMemo(() => new Map((evaluation?.mappings || []).map((item) => [item.questionId, item.answerId || ''])), [evaluation]);
  const selectQuestion = (question) => {
    setSelectedQuestionId(question.id);
    const answerId = mappedAnswers.get(question.id);
    const answer = evaluation?.answers?.find((item) => item.id === answerId);
    const page = answer?.regions?.[0]?.page || answer?.pages?.[0];
    if (page) setPageNumbers((current) => ({ ...current, answerSheet: page }));
    if (question.page) setPageNumbers((current) => ({ ...current, questionPaper: question.page }));
    window.setTimeout(() => document.getElementById('answer-sheet-viewer')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
  };
  const saveMapping = async (questionId, answerId) => {
    setSaving(questionId);
    const result = await dispatch(updateEvaluationMapping({ id, questionId, answerId, status: 'manual' }));
    setSaving('');
    if (updateEvaluationMapping.fulfilled.match(result)) {
      toast.success('Answer match saved');
      if (selectedQuestionId === questionId && answerId) {
        const selectedAnswer = result.payload.answers.find((item) => item.id === answerId);
        const page = selectedAnswer?.regions?.[0]?.page || selectedAnswer?.pages?.[0];
        if (page) setPageNumbers((current) => ({ ...current, answerSheet: page }));
      }
    }
    else toast.error(result.payload || 'Could not save answer match');
  };
  const saveGrade = async (questionId, maxMarks) => {
    const draft = drafts[questionId] || {};
    setSaving(questionId);
    const result = await dispatch(updateEvaluationGrade({ id, questionId, marksObtained: Number(draft.marks ?? evaluation.grading.items.find((item) => item.questionId === questionId)?.marksObtained ?? 0), feedback: draft.feedback ?? evaluation.grading.items.find((item) => item.questionId === questionId)?.feedback ?? '' }));
    setSaving('');
    if (updateEvaluationGrade.fulfilled.match(result)) toast.success('Teacher grade saved');
    else toast.error(result.payload || `Enter a score between 0 and ${maxMarks}`);
  };
  const saveAnswer = async (answerId) => {
    const text = drafts[answerId]?.text ?? evaluation.answers.find((item) => item.id === answerId)?.extractedText ?? '';
    setSaving(answerId);
    const result = await dispatch(updateEvaluationAnswer({ id, answerId, extractedText: text }));
    setSaving('');
    if (updateEvaluationAnswer.fulfilled.match(result)) toast.success('Transcription corrected');
    else toast.error(result.payload || 'Could not save transcription');
  };
  const retry = async () => {
    const result = await dispatch(retryEvaluation(id));
    if (retryEvaluation.fulfilled.match(result)) toast.success('Analysis restarted');
    else toast.error(result.payload || 'Could not restart analysis');
  };
  const approve = async () => {
    const result = await dispatch(approveEvaluation(id));
    if (approveEvaluation.fulfilled.match(result)) toast.success('Final evaluation approved');
    else toast.error(result.payload || 'Could not approve evaluation');
  };

  const removeAnalysis = async () => {
    if (!window.confirm(`Delete "${evaluation.title}" and both uploaded papers permanently?`)) return;
    const result = await dispatch(deleteEvaluation(id));
    if (deleteEvaluation.fulfilled.match(result)) {
      toast.success('Evaluation deleted');
      navigate('/evaluations');
    } else {
      toast.error(result.payload || 'Could not delete evaluation');
    }
  };

  const state = evaluation?.processingStatus?.state;
  return (
    <AppLayout title={evaluation?.title || 'Evaluation review'}>
      <main className={styles.page}>
        <Link className={styles.back} to="/evaluations"><ArrowLeft size={16} /> All evaluations</Link>
        {loading && !evaluation ? <div className={styles.loading}><LoaderCircle className={styles.spin} /> Loading evaluation…</div> : !evaluation ? <div className={styles.notice}>This evaluation could not be loaded.</div> : <>
          <header className={styles.header}>
            <div><span className={styles.eyebrow}>AI assisted review · {evaluation.subject || 'Subject not set'}</span><h1>{evaluation.title}</h1><p>{evaluation.questionPaper?.originalName} <span>·</span> {evaluation.answerSheet?.originalName}</p></div>
            {evaluation.approvedAt ? <span className={`${styles.status} ${styles.approved}`}><Check size={14} /> Teacher approved</span> : state === 'completed' ? <button className={styles.approveButton} onClick={approve}><Check size={15} /> Approve final evaluation</button> : <span className={`${styles.status} ${styles[state] || ''}`}>{state === 'processing' ? <LoaderCircle className={styles.spin} size={14} /> : null}{state}</span>}
            <button type="button" className={styles.deleteButton} onClick={removeAnalysis}><Trash2 size={15} /> Delete analysis</button>
          </header>
          <div className={styles.documentDownloads} aria-label="Download source documents">
            <button type="button" onClick={() => downloadSource('questionPaper')} disabled={Boolean(downloading)}>
              <Download size={15} /> {downloading === 'questionPaper' ? 'Preparing download…' : 'Download question paper'}
            </button>
            <button type="button" onClick={() => downloadSource('answerSheet')} disabled={Boolean(downloading)}>
              <Download size={15} /> {downloading === 'answerSheet' ? 'Preparing download…' : 'Download answer sheet'}
            </button>
          </div>
          {state === 'processing' || state === 'uploaded' ? <section className={styles.progress}>
            <div className={styles.progressHead}><div><strong>{evaluation.processingStatus.stages?.find((stage) => stage.status === 'active')?.label || 'Preparing analysis'}</strong><p>{evaluation.processingStatus.stages?.find((stage) => stage.status === 'active')?.message}</p></div><b>{evaluation.processingStatus.progress}%</b></div>
            <div className={styles.track}><span style={{ width: `${evaluation.processingStatus.progress}%` }} /></div>
          </section> : null}
          {state === 'failed' ? <div className={styles.failure}><ShieldAlert size={18} /><div><strong>AI analysis could not finish</strong><p>{evaluation.processingStatus.error || 'Check server AI configuration and retry.'}</p></div><button onClick={retry}>Retry analysis</button></div> : null}
          {evaluation.questions?.length > 0 && <>
            <section className={styles.summary}>
              <div><small>Questions found</small><strong>{evaluation.questions.length}</strong></div><div><small>Responses matched</small><strong>{evaluation.grading.questionsAnswered}</strong></div><div><small>Needs review</small><strong>{evaluation.grading.questionsRequiringReview}</strong></div><div><small>AI marks</small><strong>{evaluation.grading.obtainedMarks} <em>/ {evaluation.grading.totalMarks}</em></strong></div>
            </section>
            <section className={styles.documents}>
              {[
                ['questionPaper', 'Question paper', evaluation.questionPaper],
                ['answerSheet', 'Handwritten answer sheet', evaluation.answerSheet],
              ].map(([key, label, file]) => <article key={key} id={key === 'answerSheet' ? 'answer-sheet-viewer' : undefined} className={styles.document}>
                <div className={styles.documentHead}>{file?.mimeType?.startsWith('image/') ? <ImageIcon size={16} /> : <FileText size={16} />}<strong>{label}</strong><span>{file?.pages?.length || 0} pages</span></div>
                {pageImages[key] ? <><div className={styles.scanViewport}><div className={styles.scanWrap}>
                  <img className={styles.image} src={pageImages[key]} alt={`${label}, page ${pageNumbers[key]}`} />
                  {(key === 'answerSheet'
                    ? selectedQuestionId
                      ? evaluation.answers.find((answer) => answer.id === mappedAnswers.get(selectedQuestionId))?.regions || []
                      : evaluation.answers.flatMap((answer) => answer.regions || [])
                    : evaluation.questions.map((question) => question.boundingBox).filter(Boolean))
                    .filter((box) => box.page === pageNumbers[key])
                    .map((box, index) => <span key={`${box.page}-${box.x}-${index}`} className={`${styles.region} ${key === 'questionPaper' ? styles.questionRegion : ''} ${key === 'answerSheet' && selectedQuestionId ? styles.selectedRegion : ''}`} style={{ left: `${box.x}%`, top: `${box.y}%`, width: `${box.width}%`, height: `${box.height}%` }} />)}
                </div></div><div className={styles.pageControls}><button disabled={pageNumbers[key] <= 1} onClick={() => setPageNumbers((current) => ({ ...current, [key]: current[key] - 1 }))}><ChevronLeft size={15} /> Previous</button><span>Page {pageNumbers[key]} of {file?.pages?.length || 1}</span><button disabled={pageNumbers[key] >= (file?.pages?.length || 1)} onClick={() => setPageNumbers((current) => ({ ...current, [key]: current[key] + 1 }))}>Next <ChevronRight size={15} /></button></div><div className={styles.legend}><i className={key === 'answerSheet' ? styles.answerSwatch : ''} />{key === 'answerSheet' ? selectedQuestionId ? mappedAnswers.get(selectedQuestionId) ? `Highlighted answer for question ${evaluation.questions.find((question) => question.id === selectedQuestionId)?.number}` : 'No answer mapped to this question yet' : 'Detected handwritten responses' : 'Detected questions'}</div></> : documents[key] ? file?.mimeType === 'application/pdf' ? <iframe className={styles.pdf} src={documents[key]} title={label} /> : <img className={styles.image} src={documents[key]} alt={label} /> : previewErrors[key] ? <div className={styles.previewError}>{previewErrors[key]}</div> : <div className={styles.previewLoading}>Preparing page preview…</div>}
              </article>)}
            </section>
            <section className={styles.questionList}>
              <div className={styles.sectionTitle}>
                <div><span>Evaluation</span><h2>Question-by-question review</h2></div>
                <p>Select a question number to locate its answer in the scanned sheet.</p>
              </div>
              <nav className={styles.questionNav} aria-label="Question numbers">
                {evaluation.questions.map((question) => (
                  <button key={question.id} type="button" className={selectedQuestionId === question.id ? styles.activeQuestionNumber : ''} aria-pressed={selectedQuestionId === question.id} onClick={() => selectQuestion(question)}>
                    {question.number}
                  </button>
                ))}
              </nav>
              {(() => {
                const question = evaluation.questions.find((item) => item.id === selectedQuestionId) || evaluation.questions[0];
                if (!question) return null;
                const answer = evaluation.answers.find((item) => item.id === mappedAnswers.get(question.id));
                const grade = evaluation.grading.items.find((item) => item.questionId === question.id) || {};
                const draft = drafts[question.id] || {};
                const suggestedMarks = grade.marksObtained ?? 0;
                return (
                  <article className={styles.focusedQuestion}>
                    <div className={styles.focusedHeading}>
                      <span>Question {question.number}</span>
                      <small>{question.marks || 0} marks</small>
                    </div>
                    <h3>{question.text || 'Question text could not be read clearly'}</h3>
                    <div className={styles.answerBlock}>
                      <span>Student answer</span>
                      <p>{answer?.extractedText || 'No answer could be mapped to this question.'}</p>
                    </div>
                    {evaluation.grading.enabled && (
                      <div className={styles.marksPanel}>
                        <div><small>AI estimated marks</small><strong>{suggestedMarks} / {question.marks || 0}</strong></div>
                        <label>Teacher marks
                          <input type="number" min="0" max={question.marks || undefined} step="0.5" value={draft.marks ?? suggestedMarks} onChange={(event) => setDrafts((current) => ({ ...current, [question.id]: { ...current[question.id], marks: event.target.value } }))} />
                        </label>
                        <button type="button" onClick={() => saveGrade(question.id, question.marks || 0)} disabled={saving === question.id}><Save size={15} /> Save marks</button>
                      </div>
                    )}
                  </article>
                );
              })()}
            </section>
          </>}
          {state === 'completed' && evaluation.questions?.length === 0 ? <div className={styles.notice}>No questions were extracted. Check the uploaded question paper and retry with a clearer scan.</div> : null}
        </>}
      </main>
    </AppLayout>
  );
};

export default EvaluationDetailPage;
