from policy import add_context, categorize_changes, changed_files, load_event


def main() -> None:
    event = load_event()
    paths = changed_files(event.get("cwd"))
    categories = categorize_changes(paths)
    if not categories:
        return
    add_context(
        "PostToolUse",
        "Repository changes detected in "
        + ", ".join(sorted(categories))
        + ". Keep docs, tests, audit, and risk controls aligned before stopping.",
    )


if __name__ == "__main__":
    main()
