// client/src/components/assignments/CreateModal.jsx
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  setForm, setFormErrors, setCreateStep, resetForm,
  createAssignment, setCurrentJobId,
} from '../../store/slices/assignmentSlice';
import { useWebSocket } from '../../hooks/useWebSocket';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { ArrowLeft, ArrowRight, BarChart3, Check, Sparkles, TriangleAlert, Upload } from 'lucide-react';
import styles from './CreateModal.module.css';
import toast from 'react-hot-toast';

const QUESTION_TYPES = ['MCQ', 'Short Answer', 'Long Answer', 'True/False', 'Fill in Blanks'];
const DIFFICULTIES   = ['easy', 'medium', 'hard'];
const DIFF_LABELS    = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

const StepsBar = ({ current }) => {
  const steps = ['Basic Info', 'Questions', 'Content'];
  return (
    <div className={styles.stepsBar}>
      {steps.map((label, i) => {
        const num  = i + 1;
        const done = num < current;
        const active = num === current;
        return (
          <div key={num} className={styles.stepItem}>
            <div className={`${styles.stepDot} ${done ? styles.done : active ? styles.active : styles.pending}`}>
              {done ? <Check size={12} strokeWidth={2.5} /> : num}
            </div>
            <span className={`${styles.stepLabel} ${active ? styles.activeLabel : ''}`}>{label}</span>
            {i < steps.length - 1 && (
              <div className={`${styles.stepLine} ${done ? styles.doneLine : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

const NumStepper = ({ value, onChange, min = 1, max = 50 }) => (
  <div className={styles.numWrap}>
    <button type="button" className={styles.numBtn} onClick={() => onChange(Math.max(min, value - 1))}>-</button>
    <span className={styles.numVal}>{value}</span>
    <button type="button" className={styles.numBtn} onClick={() => onChange(Math.min(max, value + 1))}>+</button>
  </div>
);

const CreateModal = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { subscribeToJob } = useWebSocket();
  const { form, formErrors, createStep, creating, error } = useSelector((s) => s.assignments);
  const { list: groups } = useSelector((s) => s.groups);

  const set = (key, val) => dispatch(setForm({ [key]: val }));

  const toggleType = (t) => {
    const arr = form.questionTypes.includes(t)
      ? form.questionTypes.filter((x) => x !== t)
      : [...form.questionTypes, t];
    if (arr.length > 0) set('questionTypes', arr);
  };

  const toggleDiff = (d) => {
    const arr = form.difficulty.includes(d)
      ? form.difficulty.filter((x) => x !== d)
      : [...form.difficulty, d];
    if (arr.length > 0) set('difficulty', arr);
  };

  const validate = (step) => {
    const errs = {};
    if (step === 1) {
      if (!form.title.trim())   errs.title   = 'Title is required';
      if (!form.subject.trim()) errs.subject  = 'Subject is required';
      if (!form.dueDate)        errs.dueDate  = 'Due date is required';
      else if (new Date(form.dueDate) < new Date()) errs.dueDate = 'Due date must be in the future';
    }
    if (step === 2) {
      if (form.numQuestions < 1 || form.numQuestions > 50) errs.numQuestions = '1-50 questions allowed';
      if (form.marksPerQuestion < 1)  errs.marksPerQuestion = 'Min 1 mark per question';
    }
    dispatch(setFormErrors(errs));
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => {
    if (validate(createStep)) dispatch(setCreateStep(createStep + 1));
  };
  const prevStep = () => dispatch(setCreateStep(createStep - 1));

  const handleSubmit = async () => {
    if (!validate(3)) return;
    const res = await dispatch(createAssignment({
      title:           form.title,
      subject:         form.subject,
      classGroup:      form.classGroup,
      dueDate:         form.dueDate,
      instructions:    form.instructions,
      questionTypes:   form.questionTypes,
      numQuestions:    form.numQuestions,
      marksPerQuestion: form.marksPerQuestion,
      difficulty:      form.difficulty,
      groupId:         form.groupId || undefined,
    }));

    if (createAssignment.fulfilled.match(res)) {
      const jobId = res.payload.jobId;
      const assignId = res.payload.data._id;
      dispatch(setCurrentJobId(jobId));
      subscribeToJob(jobId);
      toast.success('Generating your paper...');
      onClose();
      navigate(`/assignments/${assignId}/generating`);
    } else {
      toast.error(error || 'Failed to create assignment');
    }
  };

  const handleClose = () => {
    dispatch(resetForm());
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create Assignment"
      subtitle={`Step ${createStep} of 3 - ${['Basic Info', 'Question Setup', 'Content & Instructions'][createStep - 1]}`}
      size="md"
      footer={
        <div className={styles.footerBtns}>
          {createStep > 1 && (
            <Button variant="secondary" onClick={prevStep}><ArrowLeft size={14} strokeWidth={2} /> Back</Button>
          )}
          {createStep < 3 ? (
            <Button variant="primary" onClick={nextStep}>Continue <ArrowRight size={14} strokeWidth={2} /></Button>
          ) : (
            <Button variant="brand" loading={creating} onClick={handleSubmit}>
              <Sparkles size={15} strokeWidth={2} /> Generate with AI
            </Button>
          )}
        </div>
      }
    >
      <StepsBar current={createStep} />

      {/* ── STEP 1: Basic Info ── */}
      {createStep === 1 && (
        <div className={styles.formBody}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Assignment Title *</label>
            <input
              className={`${styles.input} ${formErrors.title ? styles.inputError : ''}`}
              placeholder="e.g. Quiz on Electricity and Magnetism"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
            />
            {formErrors.title && <span className={styles.errMsg}><TriangleAlert size={13} strokeWidth={2} /> {formErrors.title}</span>}
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Subject *</label>
              <input
                className={`${styles.input} ${formErrors.subject ? styles.inputError : ''}`}
                placeholder="e.g. Physics"
                value={form.subject}
                onChange={(e) => set('subject', e.target.value)}
              />
              {formErrors.subject && <span className={styles.errMsg}><TriangleAlert size={13} strokeWidth={2} /> {formErrors.subject}</span>}
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Class / Group</label>
              <input
                className={styles.input}
                placeholder="e.g. Class 10-A"
                value={form.classGroup}
                onChange={(e) => set('classGroup', e.target.value)}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Due Date *</label>
              <input
                type="date"
                className={`${styles.input} ${formErrors.dueDate ? styles.inputError : ''}`}
                value={form.dueDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => set('dueDate', e.target.value)}
              />
              {formErrors.dueDate && <span className={styles.errMsg}><TriangleAlert size={13} strokeWidth={2} /> {formErrors.dueDate}</span>}
            </div>
            {groups.length > 0 && (
              <div className={styles.formGroup}>
                <label className={styles.label}>Assign to Class</label>
                <select className={styles.input} value={form.groupId} onChange={(e) => set('groupId', e.target.value)}>
                  <option value="">- Select class -</option>
                  {groups.map((g) => (
                    <option key={g._id} value={g._id}>{g.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── STEP 2: Question Setup ── */}
      {createStep === 2 && (
        <div className={styles.formBody}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Question Types</label>
            <p className={styles.hint}>Select one or more</p>
            <div className={styles.chips}>
              {QUESTION_TYPES.map((t) => (
                <button
                  key={t} type="button"
                  className={`${styles.chip} ${form.questionTypes.includes(t) ? styles.chipActive : ''}`}
                  onClick={() => toggleType(t)}
                >{t}</button>
              ))}
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Number of Questions</label>
              {formErrors.numQuestions && <span className={styles.errMsg}><TriangleAlert size={13} strokeWidth={2} /> {formErrors.numQuestions}</span>}
              <NumStepper value={form.numQuestions} onChange={(v) => set('numQuestions', v)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Marks per Question</label>
              {formErrors.marksPerQuestion && <span className={styles.errMsg}><TriangleAlert size={13} strokeWidth={2} /> {formErrors.marksPerQuestion}</span>}
              <NumStepper value={form.marksPerQuestion} onChange={(v) => set('marksPerQuestion', v)} min={1} max={20} />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Difficulty Mix</label>
            <div className={styles.diffRow}>
              {DIFFICULTIES.map((d) => (
                <button
                  key={d} type="button"
                  className={`${styles.diffChip} ${styles[`diff_${d}`]} ${form.difficulty.includes(d) ? styles[`diffActive_${d}`] : ''}`}
                  onClick={() => toggleDiff(d)}
                >{DIFF_LABELS[d]}</button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className={styles.summaryBox}>
            <span className={styles.summaryIcon}><BarChart3 size={18} strokeWidth={2} /></span>
            <div>
              <div className={styles.summaryMain}>
                {form.numQuestions} questions x {form.marksPerQuestion} marks
              </div>
              <div className={styles.summarySub}>
                = <strong>{form.numQuestions * form.marksPerQuestion} total marks</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: Content ── */}
      {createStep === 3 && (
        <div className={styles.formBody}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Topic & Instructions</label>
            <p className={styles.hint}>Describe topics, specific chapters, or any guidance for the AI</p>
            <textarea
              className={styles.textarea}
              rows={4}
              placeholder="e.g. Focus on Ohm's Law, Series and Parallel circuits, and electromagnetic induction. Include numerical problems and conceptual questions..."
              value={form.instructions}
              onChange={(e) => set('instructions', e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Reference Material{' '}
              <span className={styles.optional}>(optional)</span>
            </label>
            <label className={styles.fileZone}>
              <input
                type="file"
                accept=".pdf,.txt,.doc,.docx"
                className={styles.fileInput}
                onChange={(e) => set('file', e.target.files[0])}
              />
              <Upload size={24} strokeWidth={1.9} />
              {form.file ? (
                <span className={styles.fileName}>{form.file.name}</span>
              ) : (
                <span><strong>Click to upload</strong> or drag &amp; drop<br />PDF, DOC, TXT</span>
              )}
            </label>
          </div>

          {/* AI notice */}
          <div className={styles.aiNotice}>
            <span className={styles.aiIcon}><Sparkles size={18} strokeWidth={2} /></span>
            <div>
              <div className={styles.aiTitle}>AI-Powered Generation</div>
              <div className={styles.aiBody}>
                Claude will craft {form.numQuestions} structured questions across{' '}
                {form.difficulty.length} difficulty levels, organized into sections with clear instructions.
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default CreateModal;
