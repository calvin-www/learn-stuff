import assert from "node:assert/strict";
import test from "node:test";
import { buildQuiz, gradeQuiz } from "../src/quiz-core.js";

test("grades a correct single-select answer", () => {
  const quiz = buildQuiz({
    question: "2 + 2?",
    options: [
      { label: "3", value: "3" },
      { label: "4", value: "4" },
    ],
    correctAnswer: "4",
    explanation: "Two plus two is four.",
    shuffle: false,
  });

  const grade = gradeQuiz(quiz, {
    selectedValues: ["4"],
    dontKnow: false,
  });
  assert.equal(grade.correct, true);
  assert.deepEqual(grade.correctLabels, ["4"]);
});

test("multi-select requires the exact set", () => {
  const quiz = buildQuiz({
    question: "Select primes",
    options: [
      { label: "2", value: "2" },
      { label: "3", value: "3" },
      { label: "4", value: "4" },
    ],
    multiSelect: true,
    correctAnswer: ["2", "3"],
    explanation: "2 and 3 are prime.",
    shuffle: false,
  });

  assert.equal(gradeQuiz(quiz, { selectedValues: ["2"], dontKnow: false }).correct, false);
  assert.equal(gradeQuiz(quiz, { selectedValues: ["3", "2"], dontKnow: false }).correct, true);
});

test("I don't know is a distinct non-graded state", () => {
  const quiz = buildQuiz({
    question: "Capital of France?",
    options: [
      { label: "Paris", value: "paris" },
      { label: "Rome", value: "rome" },
    ],
    correctAnswer: "paris",
    explanation: "Paris is the capital of France.",
    shuffle: false,
  });

  const grade = gradeQuiz(quiz, { selectedValues: [], dontKnow: true });
  assert.equal(grade.correct, false);
  assert.equal(grade.dontKnow, true);
});
