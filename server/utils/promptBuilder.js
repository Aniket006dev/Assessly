const buildGenerationPrompt = (d) => {
  const total = d.numQuestions * d.marksPerQuestion;
  const distrib = d.difficulty.map((x, i) => `${x}: ~${Math.floor(d.numQuestions/d.difficulty.length) + (i===0?d.numQuestions%d.difficulty.length:0)} questions`).join(', ');
  return `You are an expert educator. Create a JSON question paper for:
Title: ${d.title} | Subject: ${d.subject} | Class: ${d.classGroup||'Secondary'} | Questions: ${d.numQuestions} | Marks each: ${d.marksPerQuestion} | Total: ${total}
Types: ${d.questionTypes.join(', ')} | Difficulty: ${distrib}
Instructions: ${d.instructions||'Standard curriculum questions'}

Return ONLY valid JSON (no markdown):
{"title":"${d.title}","subject":"${d.subject}","duration":"2 Hours","totalMarks":${total},"sections":[{"id":"A","title":"Section A","instruction":"Attempt all questions","questions":[{"id":1,"text":"question","type":"MCQ","difficulty":"easy","marks":${d.marksPerQuestion},"options":["A. opt1","B. opt2","C. opt3","D. opt4"]}]}]}

Rules: exactly ${d.numQuestions} questions total across sections. MCQ must have 4 options. Use types: ${d.questionTypes.join(', ')}.`;
};

const parseAIResponse = (raw, data) => {
  let text = raw.trim().replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/\s*```$/i,'').trim();
  const parsed = JSON.parse(text);
  if (!parsed.sections || !Array.isArray(parsed.sections)) throw new Error('Missing sections');
  let n = 1;
  parsed.sections = parsed.sections.map(s => ({
    ...s,
    questions: (s.questions||[]).map(q => ({
      id: q.id||n++, text: q.text||'Question', type: q.type||'Short Answer',
      difficulty: q.difficulty||'medium', marks: q.marks||data.marksPerQuestion, options: q.options||[],
    })),
  }));
  parsed.totalMarks = parsed.totalMarks || data.numQuestions * data.marksPerQuestion;
  parsed.duration   = parsed.duration   || '2 Hours';
  return parsed;
};

module.exports = { buildGenerationPrompt, parseAIResponse };
