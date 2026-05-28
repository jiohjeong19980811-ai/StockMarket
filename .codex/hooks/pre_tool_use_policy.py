from policy import block, classify_command, command_from_event, load_event


def main() -> None:
    event = load_event()
    command = command_from_event(event)
    status, reason = classify_command(command, event.get("cwd"))
    if status == "block":
        block("PreToolUse", reason or "Blocked by StockMarket tool policy.")


if __name__ == "__main__":
    main()
