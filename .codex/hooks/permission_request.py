from policy import allow_permission_request, block, classify_permission_request, command_from_event, load_event


def main() -> None:
    event = load_event()
    tool_input = event.get("tool_input") or {}
    description = tool_input.get("description", "") if isinstance(tool_input, dict) else ""
    command = command_from_event(event)
    status, reason = classify_permission_request(command, description, event.get("cwd"))
    if status == "block":
        block("PermissionRequest", reason or "Permission request blocked by StockMarket policy.")
    elif status == "allow":
        allow_permission_request()


if __name__ == "__main__":
    main()
