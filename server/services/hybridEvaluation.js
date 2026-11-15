const fs = require('fs');
const { createWorker } = require('tesseract.js');

const tokenize = (text) => String(text || '')
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[^a-z0-9\s]/g, ' ')
  .split(/\s+/)
  .filter((word) => word.length > 2);

const uniqueTokens = (text) => [...new Set(tokenize(text))];

const cosineSimilarity = (left, right) => {
  const leftTokens = uniqueTokens(left);
  const rightTokens = uniqueTokens(right);
  const overlap = leftTokens.filter((token) => rightTokens.includes(token));
  if (!leftTokens.length || !rightTokens.length) return 0;
  return overlap.length / Math.sqrt(leftTokens.length * rightTokens.length);
};

const conceptHints = {
  candidate: ['candidate key', 'candidate', 'primary key', 'foreign key'],
  foreign: ['foreign key', 'references', 'referential integrity'],
  primary: ['primary key', 'unique key', 'unique constraint'],
  sql: ['select', 'from', 'employees', 'sql command'],
  transaction: ['atomicity', 'consistency', 'isolation', 'durability', 'acid', 'transaction'],
  normal: ['normal form', 'normalization', 'third normal', '3nf', 'transitive dependencies'],
  indexing: ['index', 'indexing', 'query performance'],
  nosql: ['nosql', 'no sql', 'relational database', 'scalability', 'schema'],
  view: ['view', 'sql view', 'security'],
};

const conceptSimilarity = (question, answer) => {
  const questionText = String(question || '').toLowerCase();
  const answerText = String(answer || '').toLowerCase();
  const cosine = cosineSimilarity(questionText, answerText);
  let phraseScore = 0;

  for (const hints of Object.values(conceptHints)) {
    const questionMatchesConcept = hints.some((hint) => questionText.includes(hint));
    const answerMatchesConcept = hints.some((hint) => answerText.includes(hint));
    const isSharedBroadConcept = hints.includes('transaction') || hints.includes('relational database');
    if (questionMatchesConcept && answerMatchesConcept && !isSharedBroadConcept) phraseScore += 0.55;
  }

  const answerConcepts = [
    [/\b(normal form|3nf|normalization)\b/, /\b(normal form|normalization|transitive dependencies)\b/, 0.85],
    [/\b(atomicity)\b/, /\b(transaction|atomicity)\b/, 0.8],
    [/\b(acid|isolation|durability)\b/, /\bacid\b/, 0.85],
    [/\b(no\s?sql)\b/, /\bno\s?sql\b/, 0.95],
    [/\b(index|indexing)\b/, /\bindexing\b/, 0.85],
    [/\b(candidate key|primary key|foreign key)\b/, /\b(candidate key|foreign key|primary key)\b/, 0.75],
  ];
  for (const [answerPattern, questionPattern, score] of answerConcepts) {
    if (answerPattern.test(answerText) && questionPattern.test(questionText)) phraseScore = Math.max(phraseScore, score);
  }

  const qTokens = uniqueTokens(questionText);
  const shared = qTokens.filter((token) => answerText.includes(token));
  const coverage = qTokens.length ? shared.length / qTokens.length : 0;
  return Math.min(1, cosine * 0.35 + phraseScore + coverage * 0.25);
};

const preprocessImage = async (page) => {
  try {
    const { createCanvas, loadImage } = require('@napi-rs/canvas');
    const image = await loadImage(page.data);
    const scale = Math.min(2, 2200 / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');
    context.filter = 'contrast(1.25) brightness(1.05)';
    context.drawImage(image, 0, 0, width, height);

    const pixels = context.getImageData(0, 0, width, height);
    for (let index = 0; index < pixels.data.length; index += 4) {
      const gray = 0.299 * pixels.data[index] + 0.587 * pixels.data[index + 1] + 0.114 * pixels.data[index + 2];
      const adjusted = gray < 100 ? gray * 0.72 : gray > 205 ? 255 : 185 + (gray - 100) * 0.56;
      pixels.data[index] = adjusted;
      pixels.data[index + 1] = adjusted;
      pixels.data[index + 2] = adjusted;
    }
    context.putImageData(pixels, 0, 0);
    const processedPath = `${page.imagePath}.enhanced.jpg`;
    fs.writeFileSync(processedPath, canvas.toBuffer('image/jpeg', 92));
    return { ...page, ocrPath: processedPath };
  } catch (error) {
    return { ...page, ocrPath: page.imagePath };
  }
};

const recognizeHandwriting = async (page) => {
  const processed = await preprocessImage(page);
  const worker = await createWorker('eng');
  try {
    const result = await worker.recognize(processed.ocrPath);
    const confidence = Math.max(0, Math.min(1, Number(result.data?.confidence || 0) / 100));
    return {
      text: String(result.data?.text || '').trim(),
      confidence,
      source: 'local-ocr',
      processedPath: processed.ocrPath,
    };
  } finally {
    await worker.terminate();
    if (processed.ocrPath !== page.imagePath && fs.existsSync(processed.ocrPath)) {
      fs.unlinkSync(processed.ocrPath);
    }
  }
};

const matchAnswerToQuestions = (question, answers) => {
  let best = { answerId: null, confidence: 0 };
  for (const answer of answers) {
    if (answer.detectedQuestionNumber) continue;
    let confidence = conceptSimilarity(question.text, answer.extractedText);
    if (answer.confidence < 0.45) confidence *= 0.5;
    if (confidence > best.confidence) best = { answerId: answer.id, confidence };
  }
  return best;
};

const parseQuestionLines = (text, page, marksHint) => {
  const lines = String(text || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const questions = [];
  let current = null;

  for (const line of lines) {
    const match = line.match(/^(\d{1,3}(?:\.\d+)?)[\)\.\-\s]+(.+)/);
    if (match) {
      if (current) questions.push(current);
      const marksMatch = match[2].match(/\[\s*(\d+(?:\.\d+)?)\s*(?:marks?|m)?\s*\]|\(\s*(\d+(?:\.\d+)?)\s*(?:marks?|m)?\s*\)$/i);
      const textWithoutMarks = match[2].replace(/\s*[\[(]\s*\d+(?:\.\d+)?\s*(?:marks?|m)?\s*[\])]\s*$/i, '').trim();
      current = {
        number: match[1],
        text: textWithoutMarks,
        marks: marksMatch ? Number(marksMatch[1] || marksMatch[2]) : marksHint,
        page,
        box: { x: 0, y: 0, width: 100, height: 10 },
      };
    } else if (current && line.length > 2) {
      current.text += ` ${line}`;
    }
  }
  if (current) questions.push(current);
  return questions;
};

const parseAnswerLines = (text, page) => {
  const lines = String(text || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const answers = [];
  let current = null;
  for (const line of lines) {
    const match = line.match(/^(?:q(?:uestion)?[\s:_#-]*)?(\d{1,3}(?:\.\d+)?)[\)\.\-\s]+(.+)/i)
      || line.match(/^ans(?:wer)?[\s:_#-]*(\d{1,3}(?:\.\d+)?)[\)\.\-\s]+(.+)/i);
    if (match) {
      if (current) answers.push(current);
      current = { questionNumber: match[1], text: match[2], page };
    } else if (current) {
      current.text += ` ${line}`;
    } else {
      if (!answers.length || line.length > 60) answers.push({ questionNumber: null, text: line, page });
      else answers[answers.length - 1].text += ` ${line}`;
    }
  }
  if (current) answers.push(current);
  return answers;
};

const localRubricGrade = (question, answer, referenceMaterial = '') => {
  const reference = `${referenceMaterial}\n${question.text}`;
  const response = answer?.extractedText || '';
  const referenceTokens = uniqueTokens(reference).filter((token) => !['what', 'which', 'explain', 'describe', 'following', 'answer'].includes(token));
  const responseTokens = new Set(uniqueTokens(response));
  const demonstrated = referenceTokens.filter((token) => responseTokens.has(token));
  const coverage = referenceTokens.length ? demonstrated.length / referenceTokens.length : 0;
  const maxMarks = Math.max(0, Number(question.marks) || 0);
  const isEmpty = response.trim().length === 0;
  const hasConfidentCoverage = coverage >= 0.12;
  const coverageScore = hasConfidentCoverage ? coverage : 0;
  const transcriptionPenalty = answer && answer.confidence < 0.45 ? 0.15 : 0;
  const marksObtained = isEmpty ? 0 : Math.min(maxMarks, Math.max(0, Math.round(maxMarks * Math.max(0, coverageScore - transcriptionPenalty))));
  const correctness = isEmpty ? 'unanswered' : coverage >= 0.75 ? 'correct' : coverage >= 0.25 ? 'partial' : 'review';
  const missingConcepts = referenceTokens.filter((token) => !responseTokens.has(token)).slice(0, 8);
  const confidence = isEmpty ? 0.95 : Math.max(0.1, Math.min(0.9, coverage > 0 ? coverage * (answer?.confidence || 0.5) : 0.3));

  return {
    marksObtained,
    correctness,
    feedback: isEmpty ? 'No answer was detected for this question.'
      : coverage >= 0.75 ? 'The response appears to cover the key concepts.'
      : 'The response is incomplete or needs teacher verification.',
    modelAnswer: '',
    rubric: demonstrated.length ? demonstrated.map((criterion) => ({ criterion, marks: 1 })) : [],
    incorrectStatements: [],
    missingConcepts,
    irrelevantContent: [],
    contradictions: [],
    unsupportedClaims: [],
    confidence,
    needsReview: isEmpty || confidence < 0.72 || coverage < 0.25 || (answer && answer.confidence < 0.55),
  };
};

module.exports = {
  recognizeHandwriting,
  matchAnswerToQuestions,
  parseQuestionLines,
  parseAnswerLines,
  cosineSimilarity,
  localRubricGrade,
};
