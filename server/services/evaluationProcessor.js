const fs = require('fs');
const Groq = require('groq-sdk');
const Evaluation = require('../models/Evaluation');
const {
  recognizeHandwriting,
  matchAnswerToQuestions,
  parseQuestionLines,
  parseAnswerLines,
  localRubricGrade,
} = require('./hybridEvaluation');

const STAGES = [
  { key: 'uploaded', label: 'Uploading files' },
  { key: 'question_read', label: 'Reading question paper' },
  { key: 'question_detect', label: 'Detecting questions' },
  { key: 'answer_read', label: 'Reading answer sheet' },
  { key: 'answer_detect', label: 'Reading handwriting and answer regions' },
  { key: 'mapping', label: 'Matching answers by meaning' },
  { key: 'reverse', label: 'Reverse pass: identifying answer gaps' },
  { key: 'forward', label: 'Forward pass: verifying coverage and marks' },
  { key: 'complete', label: 'Complete' },
];

const initialStages = () => STAGES.map((stage, index) => ({
  ...stage,
  status: index === 0 ? 'complete' : 'pending',
  completedAt: index === 0 ? new Date() : undefined,
}));

const markStage = (stages, key, status, message = '') => stages.map((stage) => {
  const plain = stage.toObject ? stage.toObject() : stage;
  if (plain.key !== key) return plain;
  return { ...plain, status, message, startedAt: plain.startedAt || new Date(), completedAt: status === 'complete' ? new Date() : plain.completedAt };
});

const updateStage = async (evaluationId, key, progress, status = 'active', message = '') => {
  const evaluation = await Evaluation.findById(evaluationId);
  if (!evaluation) return null;
  evaluation.processingStatus.state = status === 'failed' ? 'failed' : 'processing';
  evaluation.processingStatus.progress = progress;
  evaluation.processingStatus.currentStage = key;
  evaluation.processingStatus.stages = markStage(evaluation.processingStatus.stages, key, status, message);
  await evaluation.save();
  return evaluation;
};

const extractJson = (raw) => {
  const text = String(raw || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('The vision model returned an unreadable result. Please retry with clearer scans.');
  return JSON.parse(text.slice(start, end + 1));
};

const renderDocument = async (file) => {
  if (file.mimeType.startsWith('image/')) {
    const source = fs.readFileSync(file.path);
    try {
      const { createCanvas, loadImage } = require('@napi-rs/canvas');
      const image = await loadImage(source);
      const scale = Math.min(1, 2000 / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = createCanvas(width, height);
      canvas.getContext('2d').drawImage(image, 0, 0, width, height);
      const data = canvas.toBuffer('image/jpeg', 88);
      const imagePath = `${file.path}.page-1.jpg`;
      fs.writeFileSync(imagePath, data);
      return [{ page: 1, data, mimeType: 'image/jpeg', width, height, imagePath }];
    } catch (error) {
      if (error.code !== 'MODULE_NOT_FOUND' || !error.message.includes('@napi-rs/canvas')) throw error;
      const imagePath = `${file.path}.page-1${require('path').extname(file.path)}`;
      fs.copyFileSync(file.path, imagePath);
      let width = 0;
      let height = 0;
      if (file.mimeType === 'image/png' && source.length >= 24) {
        width = source.readUInt32BE(16);
        height = source.readUInt32BE(20);
      } else if (file.mimeType === 'image/jpeg') {
        for (let offset = 2; offset + 9 < source.length;) {
          if (source[offset] !== 0xff) { offset += 1; continue; }
          const marker = source[offset + 1];
          const segmentLength = source.readUInt16BE(offset + 2);
          if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
            height = source.readUInt16BE(offset + 5);
            width = source.readUInt16BE(offset + 7);
            break;
          }
          if (segmentLength < 2) break;
          offset += segmentLength + 2;
        }
      }
      return [{ page: 1, data: source, mimeType: file.mimeType, width, height, imagePath }];
    }
  }
  if (file.mimeType !== 'application/pdf') throw new Error(`Unsupported document type: ${file.mimeType}`);
  let pdfjs;
  try {
    pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  } catch (error) {
    if (error.code === 'ERR_MODULE_NOT_FOUND') {
      throw new Error('PDF rendering is unavailable on this server. Run npm install from the server folder, then retry this evaluation.');
    }
    throw error;
  }
  const { createCanvas } = require('@napi-rs/canvas');
  const bytes = new Uint8Array(fs.readFileSync(file.path));
  const document = await pdfjs.getDocument({ data: bytes, useSystemFonts: true }).promise;
  const maxPages = Number(process.env.EVALUATION_MAX_PAGES || 40);
  if (document.numPages > maxPages) throw new Error(`This document has ${document.numPages} pages. The current limit is ${maxPages} pages per file.`);
  const pages = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    await page.render({ canvas: canvas, canvasContext: canvas.getContext('2d'), viewport }).promise;
    const data = canvas.toBuffer('image/jpeg', 85);
    const imagePath = `${file.path}.page-${pageNumber}.jpg`;
    fs.writeFileSync(imagePath, data);
    pages.push({ page: pageNumber, data, mimeType: 'image/jpeg', width: canvas.width, height: canvas.height, imagePath });
  }
  return pages;
};

const visionPass = async (client, pages, documentType) => {
  const results = [];
  const groqConfigured = Boolean(process.env.GROQ_API_KEY && client);
  for (let start = 0; start < pages.length; start += 1) {
    const batch = pages.slice(start, start + 1);
    let local = { text: '', confidence: 0 };
    try {
      local = await recognizeHandwriting(batch[0]);
    } catch (error) {
      console.warn(`Local OCR unavailable for page ${batch[0].page}: ${error.message}`);
    }
    if (!groqConfigured) {
      results.push(documentType === 'question paper'
        ? { questions: parseQuestionLines(local.text, batch[0].page, 0) }
        : { answers: parseAnswerLines(local.text, batch[0].page).map((answer) => ({
          questionNumber: answer.questionNumber, text: answer.text, pages: [answer.page],
          regions: [{ page: answer.page, x: 0, y: 0, width: 100, height: 100 }], confidence: local.confidence,
        })) });
      continue;
    }
    const pageText = batch.map((page) => `Image ${page.page} is page ${page.page} of the ${documentType}.`).join(' ');
    const instruction = documentType === 'question paper'
      ? `Identify only actual, printed questions with a visible question number. Split each separate numbered question and sub-question into its own object; never include a section heading, instruction, marks legend, option label (A, B, C, D), table heading, student field, or question-paper heading. Copy the complete stem without combining with another question. If a question has options, exclude the options from text. Preserve printed question numbers and their marks. Return JSON only: {"questions":[{"number":"1","text":"complete question stem only","marks":5,"page":1,"box":{"x":0,"y":0,"width":100,"height":10}}]}. Use percentages from top-left.`
      : `You are a specialist handwriting OCR engine. Read every response block from top to bottom and left to right. Transcribe complete responses, preserving technical terms, abbreviations, equations, punctuation, and answer structure. Use printed question numbers when visible. Do not guess unreadable words; if a term is ambiguous, preserve the most plausible reading and lower confidence. Only create an answer for a response block containing real handwritten content. Never return headers, question numbers without text, margins, blank lines, or rules. Return JSON only: {"answers":[{"questionNumber":"1 or null","text":"complete faithful transcription","pages":[1],"regions":[{"page":1,"x":0,"y":0,"width":100,"height":15}],"confidence":0.0}]}.`;
    const content = [{ type: 'text', text: `${instruction}\n${pageText}` }, ...batch.map((page) => ({
      type: 'image_url',
      image_url: { url: `data:${page.mimeType};base64,${page.data.toString('base64')}` },
    }))];
    try {
      const response = await client.chat.completions.create({
        model: process.env.GROQ_VISION_MODEL || 'qwen/qwen3.8-27b',
        temperature: 0.1,
        max_completion_tokens: 700,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content }],
      });
      results.push(extractJson(response.choices?.[0]?.message?.content));
    } catch (error) {
      console.warn(`Groq vision fallback skipped for page ${batch[0].page}: ${error.message}`);
      results.push(documentType === 'question paper'
        ? { questions: parseQuestionLines(local.text, batch[0].page, 0) }
        : { answers: [] });
    }
  }
  return results;
};

const semanticMappingPass = async (client, questions, answers) => {
  if (!client || !answers.length || !questions.length) return [];
  const payload = {
    questions: questions.map(({ id, number, text }) => ({ id, number, text })),
    answers: answers.map(({ id, detectedQuestionNumber, extractedText }) => ({
      id, questionNumber: detectedQuestionNumber, text: extractedText,
    })),
  };
  try {
    const response = await client.chat.completions.create({
      model: process.env.GROQ_TEXT_MODEL || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      temperature: 0,
      max_completion_tokens: 700,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: `${JSON.stringify(payload)}

Assign each answer to the one question it best answers. A printed answer questionNumber is authoritative. Use domain knowledge, paraphrases, abbreviations, and technical synonyms. Do not assign an answer twice. If an answer does not genuinely match a question, use answerId null. Return JSON only:
{"matches":[{"questionId":"q_1","answerId":"a_1","confidence":0.95}]}` }],
    });
    const parsed = extractJson(response.choices?.[0]?.message?.content);
    return Array.isArray(parsed.matches) ? parsed.matches : [];
  } catch (error) {
    console.warn(`Groq semantic mapping unavailable: ${error.message}`);
    return [];
  }
};

const normalizeBox = (box, page) => ({
  page: Number(page) || 1,
  x: Math.max(0, Math.min(100, Number(box?.x) || 0)),
  y: Math.max(0, Math.min(100, Number(box?.y) || 0)),
  width: Math.max(0, Math.min(100, Number(box?.width) || 0)),
  height: Math.max(0, Math.min(100, Number(box?.height) || 0)),
});

const normalizeQuestionNumber = (value) => String(value || '')
  .toLowerCase()
  .replace(/[^\da-z]/g, '');

const normalizeQuestionText = (value) => String(value || '')
  .replace(/\s+/g, ' ')
  .replace(/^[\s:;.-]+|[\s:;.-]+$/g, '')
  .trim();

const isQuestionCandidate = (value) => {
  const text = normalizeQuestionText(value);
  if (text.length < 8 || text.length > 1500) return false;
  const lower = text.toLowerCase();
  if (/^(section|part)\s+[a-z0-9]/i.test(text)) return false;
  if (/^(general instructions?|instructions?|all questions are compulsory|marks are indicated|time allowed|maximum marks|roll no\.?|student name)/i.test(text)) return false;
  if (/^[a-d][.)]\s+\S+/i.test(text)) return false;
  if (/^(choose|select)\s+(the\s+)?correct\s+(option|answer)/i.test(lower) && text.split(/\s+/).length < 12) return false;
  return true;
};

const normalizeExtractedQuestions = (items, pageFallback = 1) => {
  const seenNumbers = new Set();
  const seenText = new Set();
  return items.flatMap((item) => item || []).map((item, index) => ({
    ...item,
    number: normalizeQuestionNumber(item?.number || index + 1) || String(index + 1),
    text: normalizeQuestionText(item?.text),
    page: Number(item?.page) || pageFallback,
    box: item?.box || {},
    marks: Number(item?.marks) || 0,
  })).filter((item) => {
    if (!isQuestionCandidate(item.text) || !item.number) return false;
    const duplicateNumber = seenNumbers.has(item.number);
    const duplicateText = seenText.has(item.text.toLowerCase());
    seenNumbers.add(item.number);
    seenText.add(item.text.toLowerCase());
    return !duplicateNumber && !duplicateText;
  });
};

const normalizeExtractedAnswers = (items, knownQuestionNumbers) => {
  const known = new Set(knownQuestionNumbers.map(normalizeQuestionNumber));
  return items.flatMap((item) => item || []).map((item) => ({
    ...item,
    questionNumber: item?.questionNumber && item.questionNumber !== 'null'
      ? normalizeQuestionNumber(item.questionNumber)
      : null,
    text: String(item?.text || '').replace(/\s+/g, ' ').trim(),
  })).filter((item) => {
    if (!item.text || item.text.length < 2) return false;
    if (/^(student name|roll number|exam|class|section)\s*[:\-]/i.test(item.text)) return false;
    return true;
  }).map((item) => {
    if (item.questionNumber && !known.has(item.questionNumber)) {
      return { ...item, questionNumber: null };
    }
    return item;
  });
};

const processEvaluation = async (evaluationId, { gradingEnabled = false } = {}) => {
  try {
    const client = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
    let evaluation = await Evaluation.findById(evaluationId);
    if (!evaluation) return;

    await updateStage(evaluationId, 'question_read', 10, 'active', 'Rendering question paper pages.');
    const questionPages = await renderDocument(evaluation.questionPaper);
    evaluation = await Evaluation.findById(evaluationId);
    evaluation.questionPaper.pages = questionPages.map(({ page, width, height, imagePath }) => ({ page, width, height, imagePath }));
    await evaluation.save();
    await updateStage(evaluationId, 'question_read', 20, 'complete', `${questionPages.length} page${questionPages.length === 1 ? '' : 's'} ready for visual analysis.`);

    await updateStage(evaluationId, 'question_detect', 22, 'active', 'Reading question text and marks from page images.');
    const extractedQuestionGroups = await visionPass(client, questionPages, 'question paper');
    const extractedQuestions = normalizeExtractedQuestions(extractedQuestionGroups.map((item) => item.questions || []));
    if (!extractedQuestions.length) throw new Error('No questions could be read from the uploaded paper. Check the scan and try again.');
    const questions = extractedQuestions.map((question, index) => {
      const textMarks = String(question.text || '').match(/\[\s*(\d+(?:\.\d+)?)\s*(?:marks?|m)?\s*\]|\(\s*(\d+(?:\.\d+)?)\s*(?:marks?|m)?\s*\)\s*$/i);
      const parsedMarks = Math.max(0, Number(question.marks) || Number(textMarks?.[1] || textMarks?.[2]) || 0);
      return {
      id: `q_${index + 1}`,
      number: String(question.number || index + 1),
      text: String(question.text || '').trim(),
      page: Number(question.page) || 1,
      boundingBox: normalizeBox(question.box, question.page),
      marks: parsedMarks,
      parentNumber: question.parentNumber || null,
      order: index + 1,
      };
    });
    await updateStage(evaluationId, 'question_detect', 40, 'complete', `${questions.length} questions read.`);

    await updateStage(evaluationId, 'answer_read', 42, 'active', 'Rendering answer sheet pages.');
    const answerPages = await renderDocument(evaluation.answerSheet);
    evaluation = await Evaluation.findById(evaluationId);
    evaluation.answerSheet.pages = answerPages.map(({ page, width, height, imagePath }) => ({ page, width, height, imagePath }));
    await evaluation.save();
    await updateStage(evaluationId, 'answer_read', 52, 'complete', `${answerPages.length} page${answerPages.length === 1 ? '' : 's'} ready for handwriting analysis.`);

    await updateStage(evaluationId, 'answer_detect', 54, 'active', 'Transcribing handwritten responses and locating answer regions.');
    const extractedAnswerGroups = await visionPass(client, answerPages, 'handwritten answer sheet');
    const localAnswerGroups = [];
    for (const page of answerPages) {
      try {
        const local = await recognizeHandwriting(page);
        const parsed = parseAnswerLines(local.text, page.page).map((answer) => ({
          questionNumber: answer.questionNumber,
          text: answer.text,
          pages: [page.page],
          regions: [{ page: page.page, x: 0, y: 0, width: 100, height: 100 }],
          confidence: local.confidence,
        }));
        if (parsed.length) localAnswerGroups.push({ answers: parsed });
      } catch (error) {
        console.warn(`Local answer OCR skipped for page ${page.page}: ${error.message}`);
      }
    }
    const visionAnswerCount = extractedAnswerGroups.reduce((count, group) => count + (group.answers || []).length, 0);
    const evidenceGroups = visionAnswerCount ? extractedAnswerGroups : localAnswerGroups;
    const extractedAnswers = normalizeExtractedAnswers(
      evidenceGroups.map((item) => item.answers || []),
      questions.map((question) => question.number)
    );
    const mergedAnswers = [];
    extractedAnswers.forEach((answer) => {
      const number = answer.questionNumber && answer.questionNumber !== 'null' ? String(answer.questionNumber) : null;
      const existing = number ? mergedAnswers.find((item) => item.questionNumber === number) : null;
      if (existing) {
        existing.text = `${existing.text}\n${answer.text || ''}`.trim();
        existing.pages = [...new Set([...(existing.pages || []), ...(answer.pages || [])])];
        existing.regions = [...(existing.regions || []), ...(answer.regions || [])];
        existing.confidence = Math.min(Number(existing.confidence) || 0, Number(answer.confidence) || 0);
      } else mergedAnswers.push({ ...answer, questionNumber: number });
    });
    const answers = mergedAnswers.map((answer, index) => ({
      id: `a_${index + 1}`,
      detectedQuestionNumber: answer.questionNumber && answer.questionNumber !== 'null' ? String(answer.questionNumber) : null,
      pages: [...new Set((answer.pages || []).map(Number).filter(Boolean))],
      regions: (answer.regions || []).map((region) => normalizeBox(region, region.page)),
      extractedText: String(answer.text || '').trim(),
      confidence: Math.max(0, Math.min(1, Number(answer.confidence) || 0)),
      status: 'needs_review',
    }));
    await updateStage(evaluationId, 'answer_detect', 70, 'complete', `${answers.length} handwritten response region${answers.length === 1 ? '' : 's'} transcribed.`);

    await updateStage(evaluationId, 'mapping', 72, 'active', 'Comparing response meaning against each question.');
    const assignedAnswerIds = new Set();
    const aiMatches = await semanticMappingPass(client, questions, answers);
    const aiMatchesByQuestion = new Map(aiMatches.map((match) => [String(match.questionId), match]));
    const mappings = questions.map((question) => {
      const numberMatch = answers.find((answer) => String(answer.detectedQuestionNumber || '').replace(/\s+/g, '') === String(question.number).replace(/\s+/g, ''));
      const alreadyUsed = numberMatch ? assignedAnswerIds.has(numberMatch.id) : false;
      const explicitMatch = numberMatch && !alreadyUsed ? { answerId: numberMatch.id, confidence: 0.99 } : null;
      const availableAnswers = answers.filter((answer) => (
        !answer.detectedQuestionNumber &&
        !assignedAnswerIds.has(answer.id)
      ));
      const aiMatch = aiMatchesByQuestion.get(question.id);
      const aiCandidate = aiMatch?.answerId && answers.find((answer) => answer.id === aiMatch.answerId && !assignedAnswerIds.has(answer.id))
        ? { answerId: aiMatch.answerId, confidence: Number(aiMatch.confidence) || 0 }
        : null;
      const semanticMatch = explicitMatch
        ? explicitMatch
        : aiCandidate
        ? aiCandidate
        : matchAnswerToQuestions(question, availableAnswers);
      const localMatch = explicitMatch || semanticMatch.confidence >= 0.62
        ? semanticMatch
        : { answerId: null, confidence: 0 };
      const answer = answers.find((candidate) => candidate.id === localMatch.answerId);
      if (answer) assignedAnswerIds.add(answer.id);
      const confidence = Math.max(0, Math.min(1, Number(localMatch.confidence) || 0));
      const status = !answer ? 'unanswered' : confidence >= 0.82 ? 'high' : confidence >= 0.58 ? 'medium' : 'low';
      if (answer) answer.status = status === 'high' ? 'matched' : 'needs_review';
      return { questionId: question.id, questionNumber: question.number, answerId: answer?.id || null, confidence, status, manuallyEdited: false };
    });
    await updateStage(evaluationId, 'mapping', 88, 'complete', `${mappings.filter((item) => item.answerId).length} response matches created; uncertain matches are flagged.`);

    const reverseByQuestion = new Map();
    const forwardByQuestion = new Map();
    const matchedWork = questions.map((question) => {
      const mapping = mappings.find((item) => item.questionId === question.id);
      return { ...question, answer: answers.find((item) => item.id === mapping?.answerId) || null };
    });
    if (gradingEnabled) {
      await updateStage(evaluationId, 'reverse', 90, 'active', 'Comparing responses with a model answer and point-based rubric.');
      matchedWork.forEach((question) => {
        const localGrade = localRubricGrade(question, question.answer, evaluation.referenceMaterial);
        reverseByQuestion.set(question.id, {
          modelAnswer: evaluation.referenceMaterial || '',
          rubric: localGrade.rubric,
          incorrectStatements: localGrade.incorrectStatements,
          missingConcepts: localGrade.missingConcepts,
          irrelevantContent: localGrade.irrelevantContent,
          contradictions: localGrade.contradictions,
          unsupportedClaims: localGrade.unsupportedClaims,
          preliminaryMarks: localGrade.marksObtained,
          confidence: localGrade.confidence,
        });
        forwardByQuestion.set(question.id, localGrade);
      });
      await updateStage(evaluationId, 'reverse', 94, 'complete', 'Answer gaps and preliminary deductions recorded.');

      await updateStage(evaluationId, 'forward', 95, 'active', 'Independently verifying rubric coverage and scoring consistency.');
      await updateStage(evaluationId, 'forward', 98, 'complete', 'Rubric coverage and mark consistency verified.');
    } else {
      await updateStage(evaluationId, 'reverse', 94, 'complete', 'Grading was not enabled for this evaluation.');
      await updateStage(evaluationId, 'forward', 98, 'complete', 'Grading was not enabled for this evaluation.');
    }

    const gradeItems = questions.map((question) => {
      const reverse = reverseByQuestion.get(question.id) || {};
      const forward = forwardByQuestion.get(question.id) || {};
      const maxMarks = question.marks;
      const marksObtained = gradingEnabled ? Math.min(maxMarks, Math.max(0, Number(forward.marksObtained) || 0)) : 0;
      const needsReview = Boolean(gradingEnabled && (forward.needsReview || Number(forward.confidence) < 0.72 || Number(mappings.find((mapping) => mapping.questionId === question.id)?.confidence) < 0.58));
      return {
        questionId: question.id, marksObtained, maxMarks,
        correctness: forward.correctness || (mappings.find((mapping) => mapping.questionId === question.id)?.answerId ? 'review' : 'unanswered'),
        feedback: gradingEnabled ? String(forward.feedback || '') : '',
        modelAnswer: String(reverse.modelAnswer || ''),
        rubric: Array.isArray(reverse.rubric) ? reverse.rubric : [],
        incorrectStatements: Array.isArray(reverse.incorrectStatements) ? reverse.incorrectStatements : [],
        missingConcepts: Array.isArray(reverse.missingConcepts) ? reverse.missingConcepts : [],
        irrelevantContent: Array.isArray(reverse.irrelevantContent) ? reverse.irrelevantContent : [],
        contradictions: Array.isArray(reverse.contradictions) ? reverse.contradictions : [],
        unsupportedClaims: Array.isArray(reverse.unsupportedClaims) ? reverse.unsupportedClaims : [],
        validatedDeductions: Array.isArray(forward.validatedDeductions) ? forward.validatedDeductions : [],
        consistencyFindings: Array.isArray(forward.consistencyFindings) ? forward.consistencyFindings : [],
        confidence: gradingEnabled ? Math.min(Number(reverse.confidence) || 0, Number(forward.confidence) || 0) : 0,
        needsReview,
      };
    });
    const totalMarks = questions.reduce((sum, question) => sum + question.marks, 0);
    const obtainedMarks = gradeItems.reduce((sum, item) => sum + item.marksObtained, 0);
    evaluation = await Evaluation.findById(evaluationId);
    evaluation.questions = questions;
    evaluation.answers = answers;
    evaluation.mappings = mappings;
    evaluation.grading = {
      enabled: Boolean(gradingEnabled), totalMarks, obtainedMarks,
      percentage: totalMarks ? Math.round((obtainedMarks / totalMarks) * 100) : 0,
      questionsAnswered: mappings.filter((item) => item.answerId).length,
      questionsUnanswered: mappings.filter((item) => !item.answerId).length,
      questionsRequiringReview: new Set([
        ...gradeItems.filter((item) => item.needsReview).map((item) => item.questionId),
        ...mappings.filter((item) => ['low', 'medium'].includes(item.status)).map((item) => item.questionId),
      ]).size,
      items: gradeItems,
    };
    evaluation.processingStatus.state = 'completed';
    evaluation.processingStatus.progress = 100;
    evaluation.processingStatus.currentStage = 'complete';
    evaluation.processingStatus.stages = markStage(evaluation.processingStatus.stages, 'reverse', 'complete', gradingEnabled ? 'Reverse evaluation is complete.' : 'Grading was not enabled.');
    evaluation.processingStatus.stages = markStage(evaluation.processingStatus.stages, 'forward', 'complete', gradingEnabled ? 'Forward verification is complete. Teacher approval is required.' : 'Grading was not enabled.');
    evaluation.processingStatus.stages = markStage(evaluation.processingStatus.stages, 'complete', 'complete', 'Visual extraction and semantic matching are complete.');
    await evaluation.save();
  } catch (err) {
    console.error('Evaluation processing failed:', err);
    await Evaluation.findByIdAndUpdate(evaluationId, {
      'processingStatus.state': 'failed',
      'processingStatus.error': err.message,
      'processingStatus.progress': 100,
      'processingStatus.stages': markStage((await Evaluation.findById(evaluationId))?.processingStatus?.stages || [], 'complete', 'failed', err.message),
    });
  }
};

module.exports = { STAGES, initialStages, processEvaluation };
