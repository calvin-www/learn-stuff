# Learn Stuff

An adaptive teaching Skill and Vercel-hosted MCP server for ChatGPT, inspired by [amosblomqvist/learn](https://github.com/amosblomqvist/learn). The Skill probes the learner's knowledge edge, plans a path from sound foundations, and checks each important step.

## Quiz flow

`knowledge_check` is the sole public quiz tool. It accepts a question, choices, the correct answer, and a concise explanation. The server validates and optionally shuffles the choices, then returns MCP `input_required` with a native form elicitation. When the client retries the same tool call with the learner's answer, the server grades it and returns `correct`, `dontKnow`, selected and correct values and labels, and the explanation. ChatGPT can continue from that final tool result.

The elicitation form contains only the question and answer choices. The answer key and explanation are sent to the tool by the model and are not included in the form. The tool handles single-select, multi-select, and a distinct **I don't know** answer. The flow does not use `ui/message`, an MCP App widget, Redis, or process-local state.

Native MCP elicitation support depends on the ChatGPT client and connection protocol. MCP Apps do not currently document a custom widget for the pending elicitation, so this version uses the native form. If ChatGPT does not surface `input_required` for a connection, this version cannot complete an interactive quiz on that connection; it does not send a follow-up message on the learner's behalf. Open-ended questions about goals or preferences remain normal conversation.

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
