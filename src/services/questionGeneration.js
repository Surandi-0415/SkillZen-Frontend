// src/services/questionGeneration.js
//
// A tiny module-level store that holds the *in-flight* AI question-generation
// job so it can survive React Router navigation.
//
// Why this exists:
//   Generating the real, job-specific interview questions (Gemini) is slow.
//   We start it the moment the user submits the job description (Setup page),
//   then let the user do the equipment check and answer instant "meet & greet"
//   warm-up questions while it runs in the background. A React component's
//   state would be lost on navigation, but a module-level variable persists
//   for the lifetime of the tab, so the Interview page can simply await the
//   same promise that Setup kicked off.

import { generateQuestions } from "../api/interviewApi";

let currentJob = null; // { jd, duration, promise, startedAt }

/**
 * Start (or restart) a background AI question-generation job.
 * Returns a promise that resolves to an array of question strings.
 */
export function startQuestionGeneration(jd, duration = 30) {
  const promise = generateQuestions(jd, duration).then((res) => {
    const qs = res?.data?.questions;
    if (Array.isArray(qs) && qs.length > 0) {
      return qs;
    }
    throw new Error("AI question generation returned no questions.");
  });

  // Prevent unhandled-rejection warnings if nobody awaits immediately.
  promise.catch(() => {});

  currentJob = { jd, duration, promise, startedAt: Date.now() };
  return promise;
}

/**
 * Get the promise for the current in-flight job if it matches the given JD,
 * otherwise start a fresh job. This makes the Interview page resilient even if
 * the user reached it without the job having been pre-started.
 */
export function getQuestionGenerationPromise(jd, duration = 30) {
  if (currentJob && currentJob.jd === jd) {
    return currentJob.promise;
  }
  return startQuestionGeneration(jd, duration);
}

/** Clear any stored job (e.g. when starting a brand-new interview). */
export function resetQuestionGeneration() {
  currentJob = null;
}
