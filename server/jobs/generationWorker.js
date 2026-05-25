const Groq = require('groq-sdk');
const Assignment = require('../models/Assignment');
const { buildGenerationPrompt, parseAIResponse } = require('../utils/promptBuilder');

let wss;

const notify = (jobId, data) => {
  if (!wss) return;

  wss.clients.forEach((client) => {
    if (client.readyState === 1 && client.jobId === jobId) {
      client.send(JSON.stringify(data));
    }
  });
};

const enqueueGeneration = (assignmentId, assignmentData) => {
  const jobId = `job_${Date.now()}`;

  setImmediate(async () => {
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    try {
      const steps = [
        'Parsing assignment details',
        'Structuring AI prompt',
        'Generating question paper',
        'Parsing response',
        'Saving to database',
      ];

      // Step 1
      notify(jobId, {
        type: 'progress',
        step: 0,
        stepLabel: steps[0],
        progress: 10,
      });

      await Assignment.findByIdAndUpdate(assignmentId, {
        status: 'generating',
        jobId,
      });

      // Step 2
      notify(jobId, {
        type: 'progress',
        step: 1,
        stepLabel: steps[1],
        progress: 25,
      });

      const prompt = buildGenerationPrompt(assignmentData);

      // Step 3
      notify(jobId, {
        type: 'progress',
        step: 2,
        stepLabel: steps[2],
        progress: 45,
      });

      const completion = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const rawText = completion.choices[0].message.content;

      // Step 4
      notify(jobId, {
        type: 'progress',
        step: 3,
        stepLabel: steps[3],
        progress: 75,
      });

      const paper = parseAIResponse(rawText, assignmentData);

      // Step 5
      notify(jobId, {
        type: 'progress',
        step: 4,
        stepLabel: steps[4],
        progress: 90,
      });

      const updated = await Assignment.findByIdAndUpdate(
        assignmentId,
        {
          status: 'completed',
          paper,
          totalMarks: paper.totalMarks,
        },
        { new: true }
      ).populate('teacher', 'name email school');

      notify(jobId, {
        type: 'complete',
        assignment: updated,
        progress: 100,
      });

    } catch (err) {
      console.error('Generation failed:', err.message);

      await Assignment.findByIdAndUpdate(assignmentId, {
        status: 'failed',
      });

      notify(jobId, {
        type: 'error',
        message: err.message,
      });
    }
  });

  return { jobId };
};

const startWorker = (wsServer) => {
  wss = wsServer;
  console.log('✅ Generation worker ready (Groq mode)');
};

module.exports = { enqueueGeneration, startWorker };