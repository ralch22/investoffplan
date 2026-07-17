/**
 * Pins the Workers-AI tool schema shape. Cloudflare migrated the Llama
 * function-calling backend to vLLM (OpenAI-compatible) ~2026-07; each tool must
 * be { type: "function", function: { name, description, parameters } } or the
 * call fails validation ("body.tools.0.function: Field required") and the
 * advisor silently degrades to the WhatsApp fallback. This guards the wrapper.
 *
 *   npm run test:unit
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { TOOL_DEFINITIONS } from "./tool-schemas";

test("every advisor tool is wrapped in the vLLM/OpenAI function envelope", () => {
  assert.ok(TOOL_DEFINITIONS.length >= 5, "expected the full advisor toolset");
  for (const tool of TOOL_DEFINITIONS) {
    assert.equal(tool.type, "function", "tool.type must be 'function'");
    assert.ok(tool.function, "tool.function envelope is required by vLLM");
    assert.equal(typeof tool.function.name, "string");
    assert.ok(tool.function.name.length > 0);
    assert.equal(typeof tool.function.description, "string");
    // parameters must be a JSON-schema object (not the flat legacy shape)
    const params = tool.function.parameters as { type?: string };
    assert.equal(params.type, "object", `${tool.function.name} parameters must be an object schema`);
  }
});

test("the flat legacy shape is gone (no top-level name/parameters)", () => {
  for (const tool of TOOL_DEFINITIONS) {
    assert.ok(
      !("name" in tool) && !("parameters" in tool),
      "legacy flat keys at the top level are what vLLM rejects",
    );
  }
});

test("core tools the advisor loop depends on are present", () => {
  const names = new Set(TOOL_DEFINITIONS.map((t) => t.function.name));
  for (const required of [
    "search_knowledge",
    "search_projects",
    "get_project",
    "mortgage_estimate",
    "request_callback",
  ]) {
    assert.ok(names.has(required), `missing tool: ${required}`);
  }
});
