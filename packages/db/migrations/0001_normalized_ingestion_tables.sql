CREATE TABLE price_bars (
  id TEXT PRIMARY KEY,
  provider_record_id TEXT NOT NULL REFERENCES provider_records(id),
  instrument_id TEXT REFERENCES instruments(id),
  symbol TEXT NOT NULL CHECK (length(symbol) > 0),
  bar_interval TEXT NOT NULL CHECK (bar_interval IN ('1d', '1h', '15m', '5m', '1m')),
  timestamp TEXT NOT NULL CHECK (length(timestamp) > 0),
  open REAL NOT NULL CHECK (open > 0),
  high REAL NOT NULL CHECK (high > 0),
  low REAL NOT NULL CHECK (low > 0),
  close REAL NOT NULL CHECK (close > 0),
  adjusted_close REAL CHECK (adjusted_close IS NULL OR adjusted_close > 0),
  volume INTEGER NOT NULL CHECK (volume >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  CHECK (high >= low),
  CHECK (high >= open AND high >= close),
  CHECK (low <= open AND low <= close),
  UNIQUE (symbol, bar_interval, timestamp, provider_record_id)
);

CREATE INDEX price_bars_symbol_timestamp_idx ON price_bars(symbol, timestamp);
CREATE INDEX price_bars_provider_record_idx ON price_bars(provider_record_id);

CREATE TABLE news_articles (
  id TEXT PRIMARY KEY,
  provider_record_id TEXT NOT NULL REFERENCES provider_records(id),
  symbol TEXT NOT NULL CHECK (length(symbol) > 0),
  title TEXT NOT NULL CHECK (length(title) > 0),
  url TEXT NOT NULL CHECK (length(url) > 0),
  source TEXT NOT NULL CHECK (length(source) > 0),
  published_at TEXT NOT NULL CHECK (length(published_at) > 0),
  retrieved_at TEXT NOT NULL CHECK (length(retrieved_at) > 0),
  summary TEXT NOT NULL DEFAULT '',
  sentiment_score REAL CHECK (sentiment_score IS NULL OR (sentiment_score >= -1 AND sentiment_score <= 1)),
  duplicate_key TEXT NOT NULL CHECK (length(duplicate_key) > 0),
  UNIQUE (duplicate_key)
);

CREATE INDEX news_articles_symbol_published_idx ON news_articles(symbol, published_at);
CREATE INDEX news_articles_provider_record_idx ON news_articles(provider_record_id);

CREATE TABLE earnings_events (
  id TEXT PRIMARY KEY,
  provider_record_id TEXT NOT NULL REFERENCES provider_records(id),
  symbol TEXT NOT NULL CHECK (length(symbol) > 0),
  fiscal_period TEXT NOT NULL CHECK (length(fiscal_period) > 0),
  announcement_date TEXT NOT NULL CHECK (length(announcement_date) > 0),
  announcement_timing TEXT NOT NULL CHECK (announcement_timing IN ('pre_market', 'after_market', 'during_market', 'unknown')),
  eps_estimate REAL,
  eps_actual REAL,
  eps_surprise REAL,
  revenue_estimate REAL,
  revenue_actual REAL,
  guidance_text TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL CHECK (length(source_url) > 0),
  UNIQUE (symbol, fiscal_period, provider_record_id)
);

CREATE INDEX earnings_events_symbol_date_idx ON earnings_events(symbol, announcement_date);
CREATE INDEX earnings_events_provider_record_idx ON earnings_events(provider_record_id);

CREATE TABLE option_quotes (
  id TEXT PRIMARY KEY,
  provider_record_id TEXT NOT NULL REFERENCES provider_records(id),
  underlying_symbol TEXT NOT NULL CHECK (length(underlying_symbol) > 0),
  contract_symbol TEXT NOT NULL CHECK (length(contract_symbol) > 0),
  expiration TEXT NOT NULL CHECK (length(expiration) > 0),
  strike REAL NOT NULL CHECK (strike > 0),
  option_type TEXT NOT NULL CHECK (option_type IN ('call', 'put')),
  quote_timestamp TEXT NOT NULL CHECK (length(quote_timestamp) > 0),
  bid REAL NOT NULL CHECK (bid >= 0),
  ask REAL NOT NULL CHECK (ask > 0),
  mid REAL NOT NULL CHECK (mid > 0),
  last REAL CHECK (last IS NULL OR last >= 0),
  volume INTEGER NOT NULL CHECK (volume >= 0),
  open_interest INTEGER NOT NULL CHECK (open_interest >= 0),
  implied_volatility REAL NOT NULL CHECK (implied_volatility > 0),
  underlying_price REAL NOT NULL CHECK (underlying_price > 0),
  delta REAL CHECK (delta IS NULL OR (delta >= -1 AND delta <= 1)),
  gamma REAL CHECK (gamma IS NULL OR gamma >= 0),
  theta REAL,
  vega REAL CHECK (vega IS NULL OR vega >= 0),
  liquidity_flags_json TEXT NOT NULL DEFAULT '[]' CHECK (
    json_valid(liquidity_flags_json)
    AND json_type(liquidity_flags_json) = 'array'
  ),
  CHECK (ask >= bid),
  CHECK (mid >= bid AND mid <= ask),
  UNIQUE (contract_symbol, quote_timestamp, provider_record_id)
);

CREATE INDEX option_quotes_underlying_expiration_idx ON option_quotes(underlying_symbol, expiration);
CREATE INDEX option_quotes_provider_record_idx ON option_quotes(provider_record_id);
