from pathlib import Path

from policy import add_context, load_event, repo_root


REQUIRED_FILES = [
    "AGENTS.md",
    "docs/status/current-work.md",
    "docs/status/work-items.json",
    "docs/open-questions.md",
]


def main() -> None:
    event = load_event()
    root = repo_root(event.get("cwd")) or Path(event.get("cwd", ".")).resolve()
    missing = [path for path in REQUIRED_FILES if not (root / path).exists()]
    if missing:
        details = "Missing project memory files: " + ", ".join(missing)
    else:
        details = "Core StockMarket project guidance files are present."
    add_context(
        "SessionStart",
        details
        + " Use minimal startup context: read AGENTS.md, status files, open questions, and only task-relevant files. MVP remains research and paper trading only; live trading is prohibited until a future approved phase.",
    )


if __name__ == "__main__":
    main()
