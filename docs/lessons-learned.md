# Lessons Learned

## 2026-05-28

- The upstream repository was empty, so Phase 0 establishes the first project files.
- The active working clone is `C:\Users\jioh jeong\Desktop\codex_projects\StockMarket`.
- Official Codex project hooks require trust review before running when they are project-local and non-managed.
- Hook scripts should be deterministic, local-only, and lightweight.
- Required financial safety rules should live in checked-in project files, not only in local Codex memories.
- External quant projects are most useful as architecture and validation references during MVP; direct integration too early would add licensing, complexity, and live-trading surface area.
- Project status visibility can start as simple docs and JSON files; a UI should wait until the operator workflow exists.
