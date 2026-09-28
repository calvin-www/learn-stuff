export type QuizOption = {
  label: string;
  value: string;
  description?: string;
};

export type QuizDefinition = {
  question: string;
  details?: string;
  options: QuizOption[];
  multiSelect: boolean;
  correctValues: string[];
  explanation: string;
};

export type QuizSubmission = {
  selectedValues: string[];
  dontKnow: boolean;
};

export type QuizGrade = {
  correct: boolean;
  dontKnow: boolean;
  selectedValues: string[];
  selectedLabels: string[];
  correctValues: string[];
  correctLabels: string[];
  explanation: string;
};

export type QuizInput = {
  question: string;
  details?: string;
  options: Array<{ label: string; value?: string; description?: string }>;
  multiSelect?: boolean;
  correctAnswer: string | string[];
  explanation: string;
  shuffle?: boolean;
};

export function normalizeOptions(
  raw: Array<{ label: string; value?: string; description?: string }>,
): QuizOption[] {
  const seen = new Set<string>();
  const options: QuizOption[] = [];

  for (const item of raw) {
    const label = item.label.trim();
    const value = (item.value?.trim() || label);
    const description = item.description?.trim() || undefined;
    if (!label) continue;
    if (!value) throw new Error("Quiz option values cannot be empty.");
    if (seen.has(value)) throw new Error(`Duplicate quiz option value: ${value}`);
    seen.add(value);
    options.push({ label, value, description });
  }

  if (options.length < 2) {
    throw new Error("A quiz needs at least two non-empty options.");
  }
  return options;
}

export function normalizeCorrectAnswer(correctAnswer: string | string[]): string[] {
  const values = (Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer])
    .map((value) => value.trim())
    .filter(Boolean);
  return [...new Set(values)];
}

export function validateCorrectAnswers(
  options: QuizOption[],
  correctValues: string[],
  multiSelect: boolean,
): void {
  if (correctValues.length === 0) throw new Error("correctAnswer is required.");
  if (!multiSelect && correctValues.length !== 1) {
    throw new Error("Single-select quizzes must have exactly one correct answer.");
  }
  const valid = new Set(options.map((option) => option.value));
  for (const value of correctValues) {
    if (!valid.has(value)) {
      throw new Error(`Correct answer \"${value}\" does not match an option value.`);
    }
  }
}

export function shuffleOptions(options: QuizOption[]): QuizOption[] {
  const copy = [...options];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function buildQuiz(params: QuizInput): QuizDefinition {
  const question = params.question.trim();
  const explanation = params.explanation.trim();
  if (!question) throw new Error("Quiz question cannot be empty.");
  if (!explanation) throw new Error("Quiz explanation cannot be empty.");

  const multiSelect = params.multiSelect === true;
  const normalizedOptions = normalizeOptions(params.options);
  const correctValues = normalizeCorrectAnswer(params.correctAnswer);
  validateCorrectAnswers(normalizedOptions, correctValues, multiSelect);

  const displayOptions = params.shuffle === false
    ? normalizedOptions
    : shuffleOptions(normalizedOptions);

  return {
    question,
    details: params.details?.trim() || undefined,
    options: displayOptions,
    multiSelect,
    correctValues,
    explanation,
  };
}

function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const left = [...new Set(a)].sort();
  const right = [...new Set(b)].sort();
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

export function gradeQuiz(quiz: QuizDefinition, submission: QuizSubmission): QuizGrade {
  const valid = new Set(quiz.options.map((option) => option.value));
  const selectedValues = [...new Set(submission.selectedValues)];
  if (selectedValues.some((value) => !valid.has(value))) {
    throw new Error("Quiz answer contains an unknown option value.");
  }

  if (!quiz.multiSelect && selectedValues.length > 1) {
    throw new Error("Single-select quiz received multiple answers.");
  }

  const byValue = new Map(quiz.options.map((option) => [option.value, option.label]));
  const dontKnow = submission.dontKnow === true;
  const correct = !dontKnow && sameSet(selectedValues, quiz.correctValues);

  return {
    correct,
    dontKnow,
    selectedValues: dontKnow ? [] : selectedValues,
    selectedLabels: dontKnow ? [] : selectedValues.map((value) => byValue.get(value) ?? value),
    correctValues: quiz.correctValues,
    correctLabels: quiz.correctValues.map((value) => byValue.get(value) ?? value),
    explanation: quiz.explanation,
  };
}
