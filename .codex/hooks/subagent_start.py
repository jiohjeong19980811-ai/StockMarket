from policy import add_context, load_event


def main() -> None:
    load_event()
    add_context(
        "SubagentStart",
        "You are operating inside the StockMarket project. MVP is research and paper trading only. Live trading is prohibited until future approval. All financial signals require sources, timestamps, risk, uncertainty, and explainable reasoning. Options-related logic requires risk review.",
    )


if __name__ == "__main__":
    main()
