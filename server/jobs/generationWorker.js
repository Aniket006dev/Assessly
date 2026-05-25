const Anthropic  = require('@anthropic-ai/sdk');
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
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    try {
      const steps = [
        'Parsing assignment details',
        'Structuring AI prompt',
        'Calling Claude AI',
        'Parsing response',
        'Saving to database',
      ];

      notify(jobId, { type: 'progress', step: 0, stepLabel: steps[0], progress: 10 });
      await Assignment.findByIdAndUpdate(assignmentId, { status: 'generating', jobId });

      notify(jobId, { type: 'progress', step: 1, stepLabel: steps[1], progress: 25 });
      const prompt = buildGenerationPrompt(assignmentData);

      notify(jobId, { type: 'progress', step: 2, stepLabel: steps[2], progress: 40 });
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      });
      const rawText = message.content
        .map((c) => (c.type === 'text' ? c.text : ''))
        .join('');

      notify(jobId, { type: 'progress', step: 3, stepLabel: steps[3], progress: 75 });
      const paper = parseAIResponse(rawText, assignmentData);

      notify(jobId, { type: 'progress', step: 4, stepLabel: steps[4], progress: 90 });
      const updated = await Assignment.findByIdAndUpdate(
        assignmentId,
        { status: 'completed', paper, totalMarks: paper.totalMarks },
        { new: true }
      ).populate('teacher', 'name email school');

      notify(jobId, { type: 'complete', assignment: updated, progress: 100 });

    } catch (err) {
      console.error('Generation failed:', err.message);
      await Assignment.findByIdAndUpdate(assignmentId, { status: 'failed' });
      notify(jobId, { type: 'error', message: err.message });
    }
  });

  return { jobId };
};

const startWorker = (wsServer) => {
  wss = wsServer;
  console.log('✅ Generation worker ready (direct mode)');
};

module.exports = { enqueueGeneration, startWorker };