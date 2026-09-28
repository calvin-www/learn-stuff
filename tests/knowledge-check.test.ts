import assert from "node:assert/strict";
import test from "node:test";
import { isInputRequiredResult } from "@modelcontextprotocol/server";
import { knowledgeCheck } from "../src/knowledge-check.js";
import type { QuizGrade, QuizInput } from "../src/quiz-core.js";

const question = {
  question: "2 + 2?",
  options: [
    { label: "Three", value: "3" },
    { label: "Four", value: "4" },
  ],
  correctAnswer: "4",
  explanation: "Two plus two is four.",
  shuffle: false,
};

function pending(quiz: QuizInput) {
  const result = knowledgeCheck(quiz);
  assert.ok(isInputRequiredResult(result));
  const request = result.inputRequests?.answer;
  if (!request || request.method !== "elicitation/create") {
    throw new Error("Expected a form elicitation");
  }
  const schema = (request.params as {
    requestedSchema?: { properties: Record<string, unknown> };
  }).requestedSchema;
  if (!schema) {
    throw new Error("Expected a native form, not URL elicitation");
  }
  return { result, schema };
}

function answer(quiz: QuizInput, value: string | string[]): QuizGrade {
  const result = knowledgeCheck(quiz, {
    answer: { action: "accept", content: { answer: value } },
  });
  assert.ok("structuredContent" in result && result.structuredContent);
  return result.structuredContent as QuizGrade;
}

test("correct single-select answer returns a final grade", () => {
  const grade = answer(question, "4");
  assert.equal(grade?.correct, true);
  assert.equal(grade?.dontKnow, false);
  assert.deepEqual(grade?.selectedLabels, ["Four"]);
  assert.equal(grade?.explanation, question.explanation);
});

test("incorrect single-select answer is graded incorrect", () => {
  const grade = answer(question, "3");
  assert.equal(grade?.correct, false);
  assert.equal(grade?.dontKnow, false);
  assert.deepEqual(grade?.correctValues, ["4"]);
});

test("I don't know remains distinct from a guess", () => {
  const { schema } = pending(question);
  const choices = (schema.properties.answer as {
    oneOf: Array<{ const: string; title: string }>;
  }).oneOf;
  const dontKnow = choices?.find((choice) => choice.title === "I don't know");
  assert.ok(dontKnow);

  const grade = answer(question, dontKnow.const);
  assert.equal(grade?.correct, false);
  assert.equal(grade?.dontKnow, true);
  assert.deepEqual(grade?.selectedValues, []);
});

const multiQuestion = {
  question: "Select the primes",
  options: [
    { label: "Two", value: "2" },
    { label: "Three", value: "3" },
    { label: "Four", value: "4" },
  ],
  multiSelect: true,
  correctAnswer: ["2", "3"],
  explanation: "Two and three are prime.",
  shuffle: false,
};

test("correct multi-select answer ignores selection order", () => {
  const grade = answer(multiQuestion, ["3", "2"]);
  assert.equal(grade?.correct, true);
  assert.deepEqual(grade?.selectedValues, ["3", "2"]);
});

test("partial multi-select answer is incorrect", () => {
  const grade = answer(multiQuestion, ["2"]);
  assert.equal(grade?.correct, false);
});

test("shuffled options still grade by stable value", () => {
  const originalRandom = Math.random;
  Math.random = () => 0;
  try {
    const { schema } = pending({ ...multiQuestion, shuffle: true });
    const choices = (schema.properties.answer as {
      items: { anyOf: Array<{ const: string }> };
    }).items.anyOf;
    assert.notDeepEqual(
      choices?.slice(0, 3).map((choice) => choice.const),
      ["2", "3", "4"],
    );
    assert.equal(answer({ ...multiQuestion, shuffle: true }, ["2", "3"])?.correct, true);
  } finally {
    Math.random = originalRandom;
  }
});

test("invalid correctAnswer fails clearly", () => {
  assert.throws(
    () => knowledgeCheck({ ...question, correctAnswer: "5" }),
    /Correct answer.*does not match an option value/,
  );
});

test("pending elicitation reveals no grading key or explanation", () => {
  const { result } = pending(question);
  assert.equal(result.resultType, "input_required");
  const wire = JSON.stringify(result);
  assert.doesNotMatch(wire, /correctAnswer|correctValues|correctLabels/);
  assert.doesNotMatch(wire, /Two plus two is four/);
  assert.match(wire, /Three/);
  assert.match(wire, /Four/);
});

test("clients without elicitation receive a no-popup conversation prompt", () => {
  const result = knowledgeCheck(question, undefined, false);
  const wire = JSON.stringify(result);
  assert.match(wire, /needsConversationAnswer/);
  assert.match(wire, /2 \+ 2/);
  assert.doesNotMatch(wire, /Two plus two is four|correctAnswer|correctValues/);
});

test("a conversational answer is graded by the same tool", () => {
  const result = knowledgeCheck({ ...question, learnerAnswer: "4" }, undefined, false);
  assert.ok("structuredContent" in result && result.structuredContent);
  const grade = result.structuredContent as QuizGrade;
  assert.equal(grade.correct, true);
  assert.deepEqual(grade.selectedLabels, ["Four"]);
});

test("a conversational I don't know response remains distinct", () => {
  const result = knowledgeCheck({ ...question, dontKnow: true }, undefined, false);
  assert.ok("structuredContent" in result && result.structuredContent);
  const grade = result.structuredContent as QuizGrade;
  assert.equal(grade.correct, false);
  assert.equal(grade.dontKnow, true);
});
