const buildGenerationPrompt = (d) => {
  const total = d.numQuestions * d.marksPerQuestion;

  const distrib = d.difficulty
    .map(
      (x, i) =>
        `${x}: ~${Math.floor(
          d.numQuestions / d.difficulty.length
        ) + (i === 0 ? d.numQuestions % d.difficulty.length : 0)} questions`
    )
    .join(', ');

  return `
You are an expert educator.

Generate a structured question paper in STRICT JSON format.
First interpret the requested topics and reference instructions semantically. Identify the distinct concepts and their relationships, then distribute questions across those concepts. Keep every question aligned with the stated subject and class level. Avoid repeated questions that test the same concept in the same way. Use the requested question types and difficulty levels to test recall, understanding, application, and reasoning where appropriate. Do not invent syllabus topics beyond the provided scope.
Design the result like a real examination question paper. Organize it into alphabetically labelled sections, give each section a concise instruction, use one continuous question number sequence, and place the section title before its questions. Keep MCQ options separate from the stem.

Assignment details:
Title: ${d.title}
Subject: ${d.subject}
Class: ${d.classGroup || 'Secondary'}
Number of Questions: ${d.numQuestions}
Marks Per Question: ${d.marksPerQuestion}
Total Marks: ${total}
Question Types: ${d.questionTypes.join(', ')}
Difficulty Distribution: ${distrib}
Additional Instructions: ${
    d.instructions || 'Cover the core concepts from the named subject and topic at the stated class level.'
  }

IMPORTANT RULES:
1. Return ONLY raw valid JSON
2. Do NOT use markdown
3. Do NOT wrap in \`\`\`
4. Do NOT add explanations
5. Must contain exactly ${d.numQuestions} questions
6. Every MCQ must have exactly 4 options
7. Use only valid JSON syntax

Required JSON format:

{
  "title": "${d.title}",
  "subject": "${d.subject}",
  "duration": "2 Hours",
  "totalMarks": ${total},
  "sections": [
    {
      "id": "A",
      "title": "Section A",
      "instruction": "Attempt all questions",
      "questions": [
        {
          "id": 1,
          "text": "Question text here",
          "type": "MCQ",
          "difficulty": "easy",
          "marks": ${d.marksPerQuestion},
          "options": [
            "A. Option 1",
            "B. Option 2",
            "C. Option 3",
            "D. Option 4"
          ]
        }
      ]
    }
  ]
}
`;
};

const parseAIResponse = (raw, data) => {
  let text = raw
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const parsed = JSON.parse(text);

  if (!parsed.sections || !Array.isArray(parsed.sections)) {
    throw new Error('Missing sections in AI response');
  }

  let qNum = 1;

  parsed.sections = parsed.sections.map((section) => ({
    ...section,
    questions: (section.questions || []).map((q) => ({
    id: qNum++,
      text: q.text || 'Question',
      type: q.type || 'Short Answer',
      difficulty: q.difficulty || 'medium',
      marks: q.marks || data.marksPerQuestion,
      options: q.options || [],
    })),
  }));

  parsed.totalMarks =
    parsed.totalMarks ||
    data.numQuestions * data.marksPerQuestion;

  parsed.duration = parsed.duration || '2 Hours';

  return parsed;
};

module.exports = {
  buildGenerationPrompt,
  parseAIResponse,
};
