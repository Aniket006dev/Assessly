// client/src/components/assignments/QuestionPaper.jsx
import { useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, RefreshCw } from 'lucide-react';
import { regenerateAssignment } from '../../store/slices/assignmentSlice';
import Button from '../ui/Button';
import styles from './QuestionPaper.module.css';
import toast from 'react-hot-toast';

const DIFF_CONFIG = {
  easy:   { label: 'Easy',   cls: styles.easy },
  medium: { label: 'Medium', cls: styles.medium },
  hard:   { label: 'Hard',   cls: styles.hard },
};

const getDiff = (d = 'medium') => DIFF_CONFIG[d.toLowerCase()] || DIFF_CONFIG.medium;

const QuestionPaper = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const printRef = useRef();
  const { activeAssignment, generatedPaper } = useSelector((s) => s.assignments);
  const { user } = useSelector((s) => s.auth);

  const paper = generatedPaper || activeAssignment?.paper;
  if (!paper) return (
    <div className={styles.noPaper}>
      <p>No paper generated yet. <button onClick={() => navigate('/assignments')}>Go back</button></p>
    </div>
  );

const handlePrint = () => {
  const printContents = printRef.current.innerHTML;

  // Copy global + module stylesheets
  const pageStyles = Array.from(
    document.querySelectorAll('style, link[rel="stylesheet"]')
  )
    .map((node) => node.outerHTML)
    .join('');

  const printWindow = window.open('', '_blank');

  printWindow.document.write(`
    <html>
      <head>
        <title>Question Paper</title>
        ${pageStyles}

        <style>
          @media print {
            html, body {
              margin: 0 !important;
              padding: 20px !important;
              background: white !important;
              overflow: visible !important;
              height: auto !important;
            }

            button,
            svg {
              display: none !important;
            }

            /* Hide difficulty + type badges */
            .${styles.diffBadge},
            .${styles.typeBadge} {
              display: none !important;
            }

            /* Keep marks */
            .${styles.marksBadge} {
              display: inline-flex !important;
            }

            .${styles.paper} {
              box-shadow: none !important;
              border: none !important;
              border-radius: 0 !important;
              overflow: visible !important;
            }

            .${styles.outputWrap},
            .${styles.paperBody} {
              overflow: visible !important;
              height: auto !important;
              max-height: none !important;
            }

            .${styles.sectionBlock},
            .${styles.questionItem} {
              page-break-inside: avoid;
              break-inside: avoid;
            }

            .${styles.questionItem}:hover {
              box-shadow: none !important;
            }

            * {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>

      <body>
        ${printContents}
      </body>
    </html>
  `);

  printWindow.document.close();

  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }, 500);
};

  const handleRegenerate = async () => {
    if (!activeAssignment?._id) return;
    const res = await dispatch(regenerateAssignment(activeAssignment._id));
    if (regenerateAssignment.fulfilled.match(res)) {
      toast.success('Regenerating paper...');
      navigate(`/assignments/${activeAssignment._id}/generating`);
    }
  };

  const totalQ = paper.sections?.reduce((a, s) => a + (s.questions?.length || 0), 0) || 0;

  const fmtDate = (d) => {
    if (!d) return '-';
    try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch { return '-'; }
  };

  return (
    <div className={styles.outputWrap}>
      {/* Action bar */}
      <div className={`${styles.actionBar} no-print`}>
        <div className={styles.actionLeft}>
          <button className={styles.backLink} onClick={() => navigate('/assignments')}><ArrowLeft size={14} strokeWidth={2} /> Assignments</button>
        </div>
        <div className={styles.actionRight}>
          <Button variant="secondary" size="sm" onClick={handleRegenerate}>
            <RefreshCw size={14} strokeWidth={2} /> Regenerate
          </Button>
          <Button variant="primary" size="sm" onClick={handlePrint}>
            <Download size={14} strokeWidth={2} /> Download PDF
          </Button>
        </div>
      </div>

      {/* Paper */}
      <div className={`${styles.paper} paper-print`} ref={printRef} id="question-paper">

        {/* Header */}
        <div className={styles.paperHeader}>
          <div className={styles.schoolBadge}>
            {user?.school?.name || 'Delhi Public School'}, {user?.school?.city || 'Bokaro Steel City'}
          </div>
          <h1 className={styles.paperTitle}>{paper.title || activeAssignment?.title}</h1>
          <p className={styles.paperSub}>
            {paper.subject || activeAssignment?.subject}
            {activeAssignment?.classGroup ? ` - ${activeAssignment.classGroup}` : ''}
          </p>
        </div>

        {/* Meta strip */}
        <div className={styles.metaStrip}>
          <div className={styles.metaCell}>
            <div className={styles.metaLabel}>Total Marks</div>
            <div className={styles.metaVal}>{paper.totalMarks || activeAssignment?.totalMarks || '-'}</div>
          </div>
          <div className={styles.metaCell}>
            <div className={styles.metaLabel}>Duration</div>
            <div className={styles.metaVal}>{paper.duration || '2 Hours'}</div>
          </div>
          <div className={styles.metaCell}>
            <div className={styles.metaLabel}>Questions</div>
            <div className={styles.metaVal}>{totalQ}</div>
          </div>
          <div className={styles.metaCell}>
            <div className={styles.metaLabel}>Due Date</div>
            <div className={styles.metaVal}>{fmtDate(activeAssignment?.dueDate)}</div>
          </div>
        </div>

        {/* Student info */}
        <div className={styles.studentSection}>
          {[
            { label: 'Student Name', wide: true },
            { label: 'Roll Number',  wide: false },
            { label: 'Section',      wide: false },
          ].map(({ label, wide }) => (
            <div key={label} className={`${styles.studentField} ${wide ? styles.wide : ''}`}>
              <span className={styles.fieldLabel}>{label}</span>
              <div className={styles.fieldLine} />
            </div>
          ))}
        </div>

        {/* General instructions */}
        <div className={styles.generalInstructions}>
          <strong>General Instructions:</strong>
          <ol>
            <li>All questions are compulsory unless otherwise stated.</li>
            <li>Read each question carefully before answering.</li>
            <li>Marks are indicated against each question.</li>
            <li>Write clearly and legibly.</li>
          </ol>
        </div>

        {/* Sections */}
        <div className={styles.paperBody}>
          {(paper.sections || []).map((section) => {
            const sectionTotal = (section.questions || []).reduce((a, q) => a + (q.marks || 0), 0);
            return (
              <div key={section.id} className={styles.sectionBlock}>
                {/* Section header */}
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitleRow}>
                    <h2 className={styles.sectionTitle}>{section.title}</h2>
                    <span className={styles.sectionMarks}>[{sectionTotal} Marks]</span>
                  </div>
                  {section.instruction && (
                    <div className={styles.sectionInstruction}>{section.instruction}</div>
                  )}
                </div>

                {/* Questions */}
                <div className={styles.questionsList}>
                  {(section.questions || []).map((q, qi) => {
                    const diff = getDiff(q.difficulty);
                    return (
                      <div key={q.id || qi} className={styles.questionItem}>
                        <div className={styles.qNum}>{q.id || qi + 1}</div>
                        <div className={styles.qBody}>
                          <p className={styles.qText}>{q.text}</p>

                          {/* MCQ options */}
                          {q.options && q.options.length > 0 && (
                            <div className={styles.options}>
                              {q.options.map((opt, oi) => (
                                <div key={oi} className={styles.option}>
                                  <div className={styles.optionCircle} />
                                  <span>{opt}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Long/short answer lines */}
                          {(q.type === 'Long Answer' || q.type === 'Short Answer') && (
                            <div className={styles.answerLines}>
                              {Array.from({ length: q.type === 'Long Answer' ? 4 : 2 }).map((_, li) => (
                                <div key={li} className={styles.answerLine} />
                              ))}
                            </div>
                          )}

                          {/* Tags */}
                          <div className={styles.qTags}>
                            <span className={`${styles.diffBadge} ${diff.cls}`}>{diff.label}</span>
                            <span className={styles.marksBadge}>{q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}</span>
                            {q.type && <span className={styles.typeBadge}>{q.type}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className={styles.paperFooter}>
          <span>End of Question Paper</span>
        </div>
      </div>
    </div>
  );
};

export default QuestionPaper;
