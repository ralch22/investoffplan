## codebase-memory (MCP)

`.mcp.json` registers the `codebase-memory` MCP server (binary at `~/.local/bin/codebase-memory-mcp`; teammates: download from github.com/DeusData/codebase-memory-mcp releases, verify checksums). Complements graphify:
- **Semantic/structural search**: `search_graph` (BM25+semantic over symbols), `search_code` (pattern with signatures).
- **Call-graph tracing**: `trace_path` (callers/callees/data_flow) — use for blast-radius before changing a function.
- **Architecture**: `get_architecture`, dead-code detection, `detect_changes`.
- Re-index after large changes: `codebase-memory-mcp cli index_repository --repo-path . --mode full --persistence true` (~seconds; graph in `.codebase-memory/`, gitignored).
- No CLI session? Every tool also runs headless: `codebase-memory-mcp cli <tool> --flag value`.

Rule of thumb: graphify for quick concept/community lookups and the committed GRAPH_REPORT; codebase-memory for call-graph tracing, semantic search, and per-function blast radius.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
