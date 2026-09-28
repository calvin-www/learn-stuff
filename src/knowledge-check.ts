import {
  acceptedContent,
  inputRequired,
  inputResponse,
  type CallToolResult,
  type InputRequiredResult,
} from "@modelcontextprotocol/server";
import { z } from "zod";
import { buildQuiz, gradeQuiz, type QuizDefinition, type QuizInput } from "./quiz-core";

const DONT_KNOW = "__dont_know__";

export type KnowledgeCheckInput = QuizInput & {
  learnerAnswer?: string | string[];
  dontKnow?: boolean;
};

function finalGrade(quiz: QuizDefinition, selectedValues: string[], dontKnow: boolean): CallToolResult {
  try {
    const grade = gradeQuiz(quiz, { selectedValues, dontKnow });
    const outcome = dontKnow
      ? "The learner chose 'I don't know'."
      : grade.correct
        ? "The learner answered correctly."
        : "The learner answered incorrectly.";
    return {
      structuredContent: grade,
      content: [{ type: "text", text: `${outcome} ${grade.explanation}` }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{
        type: "text",
        text: error instanceof Error ? error.message : "The quiz response was invalid.",
      }],
    };
  }
}

export function knowledgeCheck(
  args: KnowledgeCheckInput,
  responses?: Record<string, unknown>,
  supportsElicitation = true,
): CallToolResult | InputRequiredResult {
  const quiz = buildQuiz(args);
  if (quiz.options.some((option) => option.value === DONT_KNOW)) {
    throw new Error(`The option value ${DONT_KNOW} is reserved.`);
  }
  if (args.dontKnow && args.learnerAnswer !== undefined) {
    throw new Error("Use dontKnow or learnerAnswer, not both.");
  }
  if (args.dontKnow) {
    return finalGrade(quiz, [], true);
  }
  if (args.learnerAnswer !== undefined) {
    const selected = Array.isArray(args.learnerAnswer)
      ? args.learnerAnswer
      : [args.learnerAnswer];
    return finalGrade(quiz, selected, false);
  }

  const response = inputResponse(responses, "answer");
  if (response.kind === "missing") {
    if (!supportsElicitation) {
      const options = quiz.options.map(({ label, value, description }) => ({
        label, value, ...(description ? { description } : {}),
      }));
      return {
        structuredContent: {
          needsConversationAnswer: true,
          question: quiz.question,
          ...(quiz.details ? { details: quiz.details } : {}),
          options,
          multiSelect: quiz.multiSelect,
        },
        content: [{
          type: "text",
          text: "This client does not support MCP elicitation. Ask the learner this question and choices in normal conversation. Wait for their reply, then call knowledge_check again with the same quiz and learnerAnswer (option value or values), or dontKnow: true. Do not reveal the correct answer or explanation before their reply. Do not call ui/message.",
        }],
      };
    }
    const choices = [
      ...quiz.options.map((option) => ({ const: option.value, title: option.label })),
      { const: DONT_KNOW, title: "I don't know" },
    ];
    const answer = quiz.multiSelect
      ? {
          type: "array" as const,
          title: "Select all that apply",
          minItems: 1,
          items: { anyOf: choices },
        }
      : {
          type: "string" as const,
          title: "Choose one",
          oneOf: choices,
        };
    const optionDetails = quiz.options
      .filter((option) => option.description)
      .map((option) => `${option.label}: ${option.description}`);
    const message = [quiz.question, quiz.details, ...optionDetails].filter(Boolean).join("\n\n");

    return inputRequired({
      inputRequests: {
        answer: inputRequired.elicit({
          message,
          requestedSchema: {
            type: "object",
            properties: { answer },
            required: ["answer"],
          },
        }),
      },
    });
  }

  if (response.kind === "elicit" && response.action !== "accept") {
    const action = response.action === "cancel" ? "cancelled" : "declined";
    return {
      isError: true,
      content: [{ type: "text", text: `The learner ${action} the knowledge check.` }],
    };
  }

  const schema = z.object({
    answer: quiz.multiSelect ? z.array(z.string()).min(1) : z.string(),
  });
  const submitted = acceptedContent(responses, "answer", schema);
  if (!submitted) {
    return {
      isError: true,
      content: [{ type: "text", text: "The quiz response was invalid." }],
    };
  }

  const selected = Array.isArray(submitted.answer) ? submitted.answer : [submitted.answer];
  const dontKnow = selected.includes(DONT_KNOW);
  if (dontKnow && selected.length > 1) {
    return {
      isError: true,
      content: [{ type: "text", text: "Choose 'I don't know' by itself." }],
    };
  }

  return finalGrade(quiz, dontKnow ? [] : selected, dontKnow);
}
