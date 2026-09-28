import { knowledgeCheck } from "@/src/knowledge-check";
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

export const runtime = "nodejs";

const optionSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  description: z.string().optional(),
});

const handler = createMcpHandler((server) => {
  server.registerTool(
    "knowledge_check",
    {
      title: "Knowledge check",
      description:
        "Ask the learner one gradable question through native MCP elicitation, then return the server-graded result. Wait for the final tool result before continuing the lesson.",
      inputSchema: z.object({
        question: z.string().min(1),
        details: z.string().optional(),
        options: z.array(optionSchema).min(2),
        multiSelect: z.boolean().optional(),
        correctAnswer: z.union([z.string(), z.array(z.string()).min(1)]),
        explanation: z.string().min(1),
        shuffle: z.boolean().optional(),
      }),
      outputSchema: z.object({
        correct: z.boolean(),
        dontKnow: z.boolean(),
        selectedValues: z.array(z.string()),
        selectedLabels: z.array(z.string()),
        correctValues: z.array(z.string()),
        correctLabels: z.array(z.string()),
        explanation: z.string(),
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      _meta: {
        "openai/toolInvocation/invoking": "Checking understanding…",
        "openai/toolInvocation/invoked": "Knowledge check complete.",
      },
    },
    (args, ctx) => {
      try {
        return knowledgeCheck(args, ctx.mcpReq.inputResponses);
      } catch (error) {
        return {
          isError: true,
          content: [{
            type: "text" as const,
            text: error instanceof Error ? error.message : "Invalid knowledge check.",
          }],
        };
      }
    },
  );
}, { serverInfo: { name: "learn-stuff", version: "0.3.0" } });

export { handler as GET, handler as POST };
