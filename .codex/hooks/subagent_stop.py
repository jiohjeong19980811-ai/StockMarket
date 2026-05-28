import json

from policy import load_event


def main() -> None:
    event = load_event()
    message = (
        "Subagent handoff should include what was reviewed or changed, files touched, key findings, risks, "
        "tests run, tests not run, recommendations, open questions, and follow-up tasks."
    )
    last = event.get("last_assistant_message") or ""
    if "tests" not in last.lower() or "risk" not in last.lower():
        print(json.dumps({"continue": True, "systemMessage": message}))
    else:
        print(json.dumps({"continue": True}))


if __name__ == "__main__":
    main()
