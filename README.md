# Assessly

AI-powered assessment creation for modern educators.

Create smarter assignments in minutes with a focused MERN workflow for teachers: assignment generation, class organization, paper review, library storage, analytics, and profile settings.

## Tech Stack

- Frontend: React 18, Redux Toolkit, React Router v6, CSS Modules, Vite, Framer Motion, Lucide React
- Backend: Node.js, Express.js
- Database: MongoDB with Mongoose
- Realtime: WebSocket
- AI: Multiple LLM API

## Quick Start

### Backend

```bash
cd server
npm install
npm run dev
```

### Frontend

```bash
cd client
npm install
npm run dev
```

## Features

- Auth: register, login, persisted sessions, profile update
- Assignments: create, view, delete, search, and generate structured papers
- Question papers: concept-aware generation from teacher-provided syllabus notes and instructions
- Handwritten evaluation: visual page reading, question segmentation, semantic answer matching, reverse error analysis, forward rubric verification, confidence, and faculty review
- Groups: organize classes and student cohorts
- Dashboard: premium overview cards and recent assignment summaries
- Library: completed question papers ready to view or download
- Toolkit: assessment workflow hub
- Analytics: assignment, subject, marks, and difficulty insights
- Landing page: polished public product introduction for Assessly

## AI Evaluation Setup

The evaluation workflow uses local image enhancement and Tesseract OCR first. Groq is only used as a bounded fallback for pages that local OCR cannot read reliably; semantic matching and rubric scoring also run locally. Set `GROQ_API_KEY` in `server/.env` to enable the fallback. Optional `GROQ_VISION_MODEL`, `GROQ_TEXT_MODEL`, and `EVALUATION_MAX_PAGES` settings override the defaults. Run `npm install` in `server` to install the PDF rendering and OCR dependencies.

Uploaded question papers and answer sheets are sent to the configured AI provider for analysis. Teachers can inspect the original files and rendered pages, correct extracted handwriting, remap answers, revise marks and feedback, and approve the final evaluation.
