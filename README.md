# Learn Stuff

An adaptive teaching Skill and Vercel-hosted MCP server for ChatGPT, inspired by [amosblomqvist/learn](https://github.com/amosblomqvist/learn). The Skill probes the learner's knowledge edge, plans a path from sound foundations, and checks each important step.

## Quiz flow

`knowledge_check` is the sole public quiz tool. It accepts a question, choices, the correct answer, and a concise explanation. The server validates and optionally shuffles the choices. When the client advertises elicitation support, it returns MCP `input_required` with a native form. On retry with the learner's answer, the server grades it and returns `correct`, `dontKnow`, selected and correct values and labels, and the explanation. The model can continue from that final tool result.

The elicitation form contains only the question and answer choices. The answer key and explanation are sent to the tool by the model and are not included in the form. The tool handles single-select, multi-select, and a distinct **I don't know** answer. The flow does not use `ui/message`, an MCP App widget, Redis, or process-local state.

### ChatGPT compatibility

In a live ChatGPT connection test on September 27, 2026, the client did not declare the `elicitation` capability. Before the fallback was added, its tool error was: `Cannot request input 'answer' (elicitation/create): the request's client capabilities do not declare the required capability`. The native form therefore did not appear, so same-call lesson continuation is unavailable in this ChatGPT client. A custom app-rendered elicitation widget is also not documented for ChatGPT.

For clients without elicitation, the tool returns `needsConversationAnswer` with only the public question and options. ChatGPT asks the learner in normal conversation, then calls the same tool with `learnerAnswer` or `dontKnow` on the next turn for server-side grading. This path needs a normal learner reply but never invokes `ui/message` or the “Send follow-up?” popup. In a live ChatGPT test, the learner replied `4`, the tool graded it, and ChatGPT continued teaching. Open-ended questions about goals or preferences remain normal conversation.

## Deploy and connect

The app requires Node.js 20 or newer and no database or environment variables.

```bash
npm ci
npm test
npm run typecheck
npm run build
npx vercel --prod
```

Connect ChatGPT to the production `/mcp` endpoint and install `skills/teach/SKILL.md` with that connection. `mcp.json` contains the endpoint for this repository's Vercel deployment.

For local development, run `npm run dev` and expose `/mcp` through an HTTPS tunnel if testing with ChatGPT.
Run `npm run start -- --port 3100`, then `npm run smoke:mcp` to verify the MCP request and retry flow. Set `MCP_URL` to check a deployed endpoint.

## Files

```text
app/mcp/route.ts        MCP endpoint and knowledge_check tool registration
src/knowledge-check.ts  Native elicitation and resumed grading
src/quiz-core.ts        Quiz validation, shuffling, and grading
skills/teach/SKILL.md  Adaptive teaching instructions
tests/                 Quiz behavior tests
scripts/smoke-mcp.mjs  MCP protocol smoke test
```
