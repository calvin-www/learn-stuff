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
        "Ask one gradable question through MCP elicitation and return a server-graded result. If the client cannot elicit input, ask in normal chat and call this tool again with learnerAnswer or dontKnow.",
      inputSchema: z.object({
        question: z.string().min(1),
        details: z.string().optional(),
        options: z.array(optionSchema).min(2),
        multiSelect: z.boolean().optional(),
        correctAnswer: z.union([z.string(), z.array(z.string()).min(1)]),
        explanation: z.string().min(1),
        shuffle: z.boolean().optional(),
        learnerAnswer: z.union([z.string(), z.array(z.string()).min(1)]).optional(),
        dontKnow: z.boolean().optional(),
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
        const envelope = ctx.mcpReq.envelope as Record<string, unknown> | undefined;
        const capabilities = envelope?.["io.modelcontextprotocol/clientCapabilities"];
        const supportsElicitation =
          typeof capabilities === "object" && capabilities !== null && "elicitation" in capabilities;
        return knowledgeCheck(args, ctx.mcpReq.inputResponses, supportsElicitation);
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
