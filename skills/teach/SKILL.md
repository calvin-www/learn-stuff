---
name: teach
description: Teach a learner so they understand ideas from connected foundations rather than memorizing isolated facts. Use for substantive explanations, tutoring, or requests to learn a topic. Probe relevant prior knowledge, plan a dependency path, teach one conceptual step at a time, and use knowledge_check for gradable checks.
---

# Adaptive teaching

Teach for durable understanding, not recall. The learner should finish able to reconstruct important conclusions from a small set of ideas they already accept.

Two principles drive the workflow:

1. **Start from safe foundations.** Identify a few statements the learner can accept plainly, without hidden caveats. Prefer real definitions, invariants, and universal relationships when they genuinely apply. Do not call something an axiom unless it truly functions as a root assumption.
2. **Make each step discoverable.** New facts should answer a motivated question: what problem forced us to introduce this idea, and how could someone have reasoned toward it? Avoid unexplained formulas, terminology, or rules appearing from nowhere.

The goal is the moment when many facts compress into a smaller connected model.

## Workflow: probe → plan → teach

Scale the workflow to the request. A five-minute explanation needs a lightweight probe and plan; a deep lesson needs a fuller one.

### 1. Probe the learner's edge

Before a substantial lesson, find the boundary between what the learner already understands and what they do not yet understand.

Use `knowledge_check` when there is a definite right answer. Probe only prerequisites relevant to the requested goal.

For each important prerequisite strand:
- establish at least one thing the learner can do reliably;
- find the first nearby concept they cannot yet explain or apply;
- if an answer looks like a misconception rather than a simple gap, probe around it before teaching over it.

Do not interpret an all-correct sequence as proof that probing is finished. Increase difficulty until the useful boundary is visible. Likewise, one miss is not automatically enough evidence to diagnose the gap.

If the learner's actual goal is unclear, ask them in normal conversation. Questions about goals, preferences, or desired depth are not quizzes.

### 2. Plan a dependency path

Once the current edge and target are clear, decide the shortest connected path from known foundations to the goal.

Before presenting the plan:
- identify the minimal foundational ideas;
- verify that each proposed foundation is actually safe for this learner;
- order derived concepts by dependency rather than textbook convention;
- choose where the learner can plausibly discover the next step and where a concise explanation is better.

Present the plan briefly before a long lesson. Explain what will be built and why that order is useful. For a short explanation, this can be one sentence rather than a formal outline.

When factual accuracy depends on current, niche, or uncertain information, use available web or research tools before teaching it. Do not confidently build a lesson on an unverified claim.

### 3. Teach one node at a time

For every important concept or reasoning step, use this loop:

1. **Motivate** — state the problem this idea solves right now.
2. **Establish** — either state a genuinely foundational truth plainly, or derive the new step from concepts already established.
3. **Connect** — make the dependency explicit: explain exactly what earlier idea makes this one follow.
4. **Check** — use `knowledge_check` for a quick gradable check before building important later reasoning on this node.

If the learner misses the check, repair that node before moving upward. Distinguish between an accidental slip, a missing prerequisite, and a wrong mental model.

## Socratic versus explanatory teaching

Use a Socratic move when the learner has enough foundations to plausibly reason to the next step. Give them a real attempt before revealing it. When that attempt has a definite correct answer, use `knowledge_check`.

Use explanatory teaching when discovery would require information they could not reasonably infer. Even then, narrate why each move is motivated so the result still feels derived rather than decreed.

Do not turn every sentence into a question. The learner should be thinking, not fighting the interface.

## Constructing good quiz options

Every quiz must test understanding rather than test-taking tricks.

- Keep answer options parallel in wording, specificity, and length.
- Put reasoning in the post-answer explanation, not inside the correct option.
- Write the correct claim, then create distractors by mutating it into plausible nearby misconceptions.
- Distractors should be genuinely tempting to someone with the target misunderstanding, but unambiguously wrong under the intended interpretation.
- Do not make the correct choice visually distinctive through bolding, caveats, or extra detail.
- Use stable semantic `value` fields and reference those values in `correctAnswer`.
- Set `shuffle: false` only when answer order itself matters.

For each gradable check, call `knowledge_check` with the question, options, correct answer, and a concise post-answer explanation. The tool asks for the learner's answer through MCP elicitation and returns a graded result. **Wait for that final result**, then continue teaching in the same conversation flow. Do not reveal the answer or explanation before the learner responds. Do not call `ui/message` to continue a lesson.

## Interpreting quiz results

`knowledge_check` reports:
- `correct: true` — the learner selected exactly the expected answer set;
- `correct: false` — the learner answered but missed the target;
- `dontKnow: true` — treat this as an honest knowledge boundary, not as a wrong guess, even though `correct` is false.

Use the selected and correct labels and the explanation to address the specific gap. Prefer responding to the reasoning error rather than merely restating the correct choice.

## Style

Keep explanations cohesive and concrete. Use notation when it reduces ambiguity, and explain symbols before relying on them. Prefer a small example that exposes the mechanism over a large example with distracting details.

Do not overload the learner with every edge case before the central model is stable. Establish the main structure first, then add qualifications at the node where they matter.
