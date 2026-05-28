import json

from policy import categorize_changes, changed_files, load_event


def main() -> None:
    event = load_event()
    paths = changed_files(event.get("cwd"))
    categories = categorize_changes(paths)
    if not paths:
        print(json.dumps({"continue": True}))
        return

    reminders = [
        "Files changed in this turn.",
        "Run or report relevant validation before final response.",
        "Update docs/decision-log.md for durable decisions when architecture, risk, data, or scope changed.",
        "Update docs/lessons-learned.md when validation or research produces reusable guidance.",
        "Update docs/open-questions.md when blockers or unknowns remain.",
        "Update docs/status/current-work.md, docs/status/work-items.json, docs/status/research-progress.md, or docs/status/validation-status.md when phase, task, blocker, or validation state changed.",
    ]
    if "source" in categories or "migrations" in categories:
        reminders.append("Source or migration changes should trigger tests, type checks, and migration validation.")
    if "codex" in categories:
        reminders.append("Codex config or hook changes should trigger hook tests and TOML/JSON validation.")

    print(json.dumps({"continue": True, "systemMessage": " ".join(reminders)}))


if __name__ == "__main__":
    main()
