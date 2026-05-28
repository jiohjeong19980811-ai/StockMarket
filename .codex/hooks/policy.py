import json
import os
import re
import subprocess
import sys
from pathlib import Path


SECRET_PATTERNS = [
    re.compile(r"sk-[A-Za-z0-9_-]{20,}"),
    re.compile(r"AKIA[0-9A-Z]{16}"),
    re.compile(r"gh[pousr]_[A-Za-z0-9_]{20,}"),
    re.compile(r"xox[baprs]-[A-Za-z0-9-]{20,}"),
    re.compile(r"-----BEGIN (?:RSA |OPENSSH |EC |DSA )?PRIVATE KEY-----"),
    re.compile(r"(?i)(api[_-]?key|secret|access[_-]?token|broker[_-]?secret)\s*[:=]\s*['\"]?[A-Za-z0-9_\-./+=]{16,}"),
]

LIVE_TRADING_PATTERNS = [
    re.compile(r"(?i)\blive[_ -]?trading[_ -]?enabled\s*[:=]\s*true\b"),
    re.compile(r"(?i)\b(enable|turn on|activate|implement)\b.{0,60}\b(live|real[- ]?money)\b.{0,40}\b(trading|orders?)\b"),
    re.compile(r"(?i)\b(place|submit|send|execute)\b.{0,40}\b(live|real[- ]?money)?\s*(broker\s*)?(order|trade)\b"),
    re.compile(r"(?i)\b(alpaca|tradier|interactive brokers|coinbase|kraken)\b.{0,80}\b(order|trade|position)\b"),
]

BYPASS_RISK_PATTERNS = [
    re.compile(r"(?i)\b(bypass|disable|remove|skip)\b.{0,50}\b(risk|audit|paper[- ]?trading|approval|kill switch|max loss)\b"),
    re.compile(r"(?i)\bguaranteed\b.{0,40}\b(income|profit|return|win)\b"),
]

REPO_SCOPE_PATTERNS = [
    re.compile(r"(?i)\b(entire machine|whole disk|all drives|outside (the )?repo|outside (the )?repository)\b"),
]

ENV_FILE_READ_COMMAND_PATTERN = re.compile(r"(?i)\b(cat|type|gc|get-content)\b")
ENV_FILE_PATH_PATTERN = re.compile(r"(?i)(?:^|[\s'\"=])(?:\./|\.\\)?\.env(?:\.[A-Za-z0-9_-]+)?(?=$|[\s'\";])")

BLOCK_COMMAND_PATTERNS = [
    (re.compile(r"(?i)\brm\s+-rf\s+/(?:\s|$)"), "Refusing to recursively delete the filesystem root."),
    (re.compile(r"(?i)\b(git\s+config\s+--global)\b"), "Global git configuration changes require explicit human review."),
    (re.compile(r"(?i)\b(cat|type|Get-Content)\s+(['\"]?)\.env(?:\.[A-Za-z0-9_-]+)?\2(?:\s|$)"), "Reading .env files is blocked to avoid secret exposure."),
    (re.compile(r"(?i)\b(Get-ChildItem|dir|ls)\s+Env:"), "Printing environment variables is blocked to avoid secret exposure."),
    (re.compile(r"(?i)\b(printenv|env)\b(?:\s|$)"), "Printing environment variables is blocked to avoid secret exposure."),
    (re.compile(r"(?i)\becho\s+(\$env:|\$)[A-Za-z0-9_]*(KEY|TOKEN|SECRET|PASSWORD)"), "Echoing secret-like environment variables is blocked."),
    (re.compile(r"(?i)\b(curl|wget|iwr|Invoke-WebRequest)\b.*\|.*\b(bash|sh|iex|Invoke-Expression)\b"), "Running remote scripts directly is blocked."),
    (re.compile(r"(?i)\b(npm|pnpm|yarn)\b.*\s-g(\s|$)"), "Global package installation is blocked by repo policy."),
    (re.compile(r"(?i)\bpip(?:3)?\s+install\b.*\s--user(\s|$)"), "User-level package installation is blocked by repo policy."),
    (re.compile(r"(?i)\b(drop\s+database|drop\s+schema|truncate\s+table)\b"), "Destructive database commands require explicit review outside hooks."),
    (re.compile(r"(?i)\b(LIVE_TRADING_ENABLED\s*=\s*true|place_order|submit_order|create_order|/orders)\b"), "Live order or live trading paths are blocked during MVP."),
]

DELETE_REPO_PATTERNS = [
    re.compile(r"(?i)\b(rm|del|rd|rmdir|Remove-Item)\b.*(\.git|StockMarket)(?:\s|$)"),
]

WRITE_COMMAND_HINTS = [
    "set-content",
    "out-file",
    "new-item",
    "copy-item",
    "move-item",
    "remove-item",
    "rm ",
    "del ",
    "rd ",
    "rmdir ",
    ">",
]

MEANINGFUL_CHANGE_PREFIXES = (
    "apps/",
    "packages/",
    ".codex/",
    ".agents/",
    "docs/",
    ".github/",
)

MEANINGFUL_CHANGE_FILES = {
    "AGENTS.md",
    ".env.example",
    ".gitignore",
    "package.json",
    "pnpm-lock.yaml",
    "package-lock.json",
    "yarn.lock",
    "pyproject.toml",
    "requirements.txt",
}


def load_event() -> dict:
    raw = sys.stdin.read()
    if not raw.strip():
        return {}
    return json.loads(raw)


def emit(payload: dict) -> None:
    sys.stdout.write(json.dumps(payload, separators=(",", ":")))


def block(event_name: str, reason: str) -> None:
    if event_name == "PreToolUse":
        emit(
            {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "deny",
                    "permissionDecisionReason": reason,
                }
            }
        )
    elif event_name == "PermissionRequest":
        emit(
            {
                "hookSpecificOutput": {
                    "hookEventName": "PermissionRequest",
                    "decision": {"behavior": "deny", "message": reason},
                }
            }
        )
    else:
        emit({"decision": "block", "reason": reason})


def add_context(event_name: str, message: str) -> None:
    emit(
        {
            "hookSpecificOutput": {
                "hookEventName": event_name,
                "additionalContext": message,
            }
        }
    )


def command_from_event(event: dict) -> str:
    tool_input = event.get("tool_input") or {}
    if isinstance(tool_input, dict):
        command = tool_input.get("command")
        if isinstance(command, str):
            return command
        return json.dumps(tool_input, sort_keys=True)
    if isinstance(tool_input, str):
        return tool_input
    return ""


def find_secret_like(text: str) -> str | None:
    for pattern in SECRET_PATTERNS:
        if pattern.search(text or ""):
            return "Secret-like value detected. Do not paste or print credentials."
    return None


def find_financial_guardrail_issue(text: str) -> str | None:
    for pattern in LIVE_TRADING_PATTERNS:
        if pattern.search(text or ""):
            return "Live trading and real-money order execution are blocked during MVP."
    for pattern in BYPASS_RISK_PATTERNS:
        if pattern.search(text or ""):
            return "Requests to bypass risk, audit, approval, or paper-trading controls are blocked."
    return None


def find_repo_scope_issue(text: str) -> str | None:
    for pattern in REPO_SCOPE_PATTERNS:
        if pattern.search(text or ""):
            return "Work must stay inside the StockMarket repository unless the operator grants explicit approval."
    return None


def classify_prompt(prompt: str) -> tuple[str, str | None]:
    for checker in (find_secret_like, find_financial_guardrail_issue, find_repo_scope_issue):
        reason = checker(prompt)
        if reason:
            return "block", reason
    return "allow", None


def classify_command(command: str, cwd: str | None = None) -> tuple[str, str | None]:
    text = command or ""
    for pattern in DELETE_REPO_PATTERNS:
        if pattern.search(text):
            return "block", "Deleting the repository or .git metadata is blocked."
    if ENV_FILE_READ_COMMAND_PATTERN.search(text) and ENV_FILE_PATH_PATTERN.search(text):
        return "block", "Reading .env files is blocked to avoid secret exposure."
    for pattern, reason in BLOCK_COMMAND_PATTERNS:
        if pattern.search(text):
            return "block", reason
    secret_reason = find_secret_like(text)
    if secret_reason:
        return "block", secret_reason
    finance_reason = find_financial_guardrail_issue(text)
    if finance_reason:
        return "block", finance_reason
    outside_reason = classify_outside_repo_write(text, cwd)
    if outside_reason:
        return "block", outside_reason
    return "allow", None


def classify_permission_request(command: str, description: str = "", cwd: str | None = None) -> tuple[str, str | None]:
    status, reason = classify_command(command + "\n" + (description or ""), cwd)
    if status == "block":
        return status, reason
    return "defer", None


def classify_outside_repo_write(command: str, cwd: str | None) -> str | None:
    lowered = (command or "").lower()
    if not any(hint in lowered for hint in WRITE_COMMAND_HINTS):
        return None
    root = repo_root(cwd)
    if root is None:
        return None
    for raw_path in find_absolute_windows_paths(command):
        try:
            candidate = Path(raw_path).resolve()
        except OSError:
            continue
        if candidate == root or root in candidate.parents:
            continue
        return f"Writing outside the repository is blocked: {raw_path}"
    return None


def find_absolute_windows_paths(text: str) -> list[str]:
    return re.findall(r"[A-Za-z]:\\[^\s'\"|<>]+", text or "")


def repo_root(cwd: str | None = None) -> Path | None:
    start = Path(cwd or os.getcwd())
    try:
        result = subprocess.run(
            ["git", "rev-parse", "--show-toplevel"],
            cwd=start,
            text=True,
            capture_output=True,
            check=True,
            timeout=5,
        )
        return Path(result.stdout.strip()).resolve()
    except Exception:
        current = start.resolve()
        for path in [current, *current.parents]:
            if (path / "AGENTS.md").exists() and (path / "docs").exists():
                return path
    return None


def changed_files(cwd: str | None = None) -> list[str]:
    root = repo_root(cwd)
    if root is None:
        return []
    try:
        result = subprocess.run(
            ["git", "-c", f"safe.directory={root.as_posix()}", "status", "--porcelain"],
            cwd=root,
            text=True,
            capture_output=True,
            check=True,
            timeout=5,
        )
    except Exception:
        return []
    files = []
    for line in result.stdout.splitlines():
        path = line[3:].strip()
        if " -> " in path:
            path = path.split(" -> ", 1)[1]
        path = path.replace("\\", "/")
        if path:
            files.append(path)
    return files


def categorize_changes(paths: list[str]) -> set[str]:
    categories: set[str] = set()
    for path in paths:
        if path in MEANINGFUL_CHANGE_FILES:
            categories.add("config")
        if path.startswith(MEANINGFUL_CHANGE_PREFIXES):
            categories.add(path.split("/", 1)[0])
        if path.startswith("packages/") or path.startswith("apps/"):
            categories.add("source")
        if "migration" in path.lower():
            categories.add("migrations")
        if path.startswith(".codex/"):
            categories.add("codex")
        if path.startswith("docs/") or path == "AGENTS.md":
            categories.add("docs")
    return categories
