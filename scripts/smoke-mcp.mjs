import assert from "node:assert/strict";

const endpoint = process.env.MCP_URL ?? "http://localhost:3100/mcp";
const version = "2026-07-28";
let requestId = 0;

async function request(method, params = {}) {
  const body = {
    jsonrpc: "2.0",
    id: ++requestId,
    method,
    params: {
      ...params,
      _meta: {
        "io.modelcontextprotocol/protocolVersion": version,
        "io.modelcontextprotocol/clientCapabilities": { elicitation: {} },
      },
    },
  };
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      "MCP-Protocol-Version": version,
      "Mcp-Method": method,
      ...(method === "tools/call" ? { "Mcp-Name": params.name } : {}),
    },
    body: JSON.stringify(body),
  });
  const raw = await response.text();
  assert.equal(response.status, 200, raw);
  const parsed = raw.startsWith("data: ")
    ? JSON.parse(raw.slice(6).split("\n")[0])
    : JSON.parse(raw);
  assert.equal(parsed.error, undefined, raw);
  return parsed.result;
}

const discovery = await request("server/discover");
assert.ok(discovery);
const tools = await request("tools/list");
assert.deepEqual(tools.tools.map((tool) => tool.name), ["knowledge_check"]);

const args = {
  question: "2 + 2?",
  options: [
    { label: "Three", value: "3" },
    { label: "Four", value: "4" },
  ],
  correctAnswer: "4",
  explanation: "Two plus two is four.",
  shuffle: false,
};
const pending = await request("tools/call", { name: "knowledge_check", arguments: args });
assert.equal(pending.resultType, "input_required");
assert.equal(pending.inputRequests.answer.method, "elicitation/create");
assert.ok(!JSON.stringify(pending).includes(args.explanation));

const final = await request("tools/call", {
  name: "knowledge_check",
  arguments: args,
  inputResponses: {
    answer: { action: "accept", content: { answer: "4" } },
  },
});
assert.equal(final.structuredContent.correct, true);
console.log(`MCP smoke test passed: ${endpoint}`);
