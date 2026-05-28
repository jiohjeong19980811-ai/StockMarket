from policy import block, classify_prompt, load_event


def main() -> None:
    event = load_event()
    prompt = event.get("prompt", "")
    status, reason = classify_prompt(prompt)
    if status == "block":
        block("UserPromptSubmit", reason or "Blocked by StockMarket prompt policy.")


if __name__ == "__main__":
    main()
