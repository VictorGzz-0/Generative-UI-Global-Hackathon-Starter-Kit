#!/usr/bin/env bash
# scripts/check-env.sh — pre-flight wired into `predev` (npm convention).
#
# Validates, in order, that everything `npm run dev` needs is in place:
#   1. Docker daemon up.
#   2. npx is available so `@notionhq/notion-mcp-server` can be fetched
#      on demand. We don't pull the package here (slow) — we just prove
#      the resolver works.
#   3. apps/agent/.env exists and has the right API key for the selected
#      AGENT_RUNTIME (GEMINI_API_KEY for gemini-*, DEEPSEEK_API_KEY for
#      deepseek, ANTHROPIC_API_KEY for claude-*).
#   4. Notion vars are only checked when NOTION_TOKEN is set (optional).
#
# Collects every problem into a numbered list rather than bailing on the
# first failure, so participants can fix the whole batch in one pass.
# Exit 0 silently on success.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

PROBLEMS=()

# ---------- 1. Docker daemon -------------------------------------------------
if ! command -v docker >/dev/null 2>&1; then
  PROBLEMS+=("Docker isn't installed. Install Docker Desktop and re-try.")
elif ! docker info >/dev/null 2>&1; then
  PROBLEMS+=("Docker isn't running. Start Docker Desktop and re-try.")
fi

# ---------- 2. npx (for the Notion MCP server) -------------------------------
if ! command -v npx >/dev/null 2>&1; then
  PROBLEMS+=("npx is not on PATH. Install Node.js 20+ (npm bundles npx).")
fi

# ---------- 3. agent/.env vars -----------------------------------------------
AGENT_ENV="$REPO_ROOT/apps/agent/.env"
if [[ ! -f "$AGENT_ENV" ]]; then
  PROBLEMS+=("apps/agent/.env is missing. Run: cp apps/agent/.env.example apps/agent/.env, then fill in the keys.")
else
  # Read VAR=VALUE lines. We tolerate values without quotes (the .env files
  # ship without quotes) and strip surrounding whitespace.
  read_var() {
    local key="$1"
    grep -E "^[[:space:]]*${key}=" "$AGENT_ENV" | tail -n1 | sed -E "s/^[[:space:]]*${key}=//; s/^[\"']//; s/[\"'][[:space:]]*$//; s/[[:space:]]+$//"
  }
  is_stub() {
    local v="$1"
    [[ -z "$v" ]] && return 0
    case "$v" in
      stub*|"<paste"*|"<set"*|"replace-with-"*|"tu-clave-aqui") return 0 ;;
    esac
    return 1
  }

  # Detect which runtime is selected
  AGENT_RUNTIME="$(read_var AGENT_RUNTIME || true)"
  AGENT_RUNTIME="${AGENT_RUNTIME:-gemini-flash-deep}"

  # Check the API key that matches the selected runtime
  case "$AGENT_RUNTIME" in
    deepseek)
      val="$(read_var DEEPSEEK_API_KEY || true)"
      if is_stub "$val"; then
        PROBLEMS+=("DEEPSEEK_API_KEY is unset (or a placeholder) in apps/agent/.env. Get a key at https://platform.deepseek.com -> API keys.")
      fi
      ;;
    claude-*)
      val="$(read_var ANTHROPIC_API_KEY || true)"
      if is_stub "$val"; then
        PROBLEMS+=("ANTHROPIC_API_KEY is unset (or a stub) in apps/agent/.env.")
      fi
      ;;
    gemini-*|*)
      val="$(read_var GEMINI_API_KEY || true)"
      if is_stub "$val"; then
        PROBLEMS+=("GEMINI_API_KEY is unset (or a stub) in apps/agent/.env. Get a key at https://aistudio.google.com -> Get API key.")
      fi
      ;;
  esac

  # Notion is optional — only check if NOTION_TOKEN is explicitly set
  notion_token="$(read_var NOTION_TOKEN || true)"
  if [[ -n "$notion_token" ]] && ! is_stub "$notion_token"; then
    notion_db="$(read_var NOTION_LEADS_DATABASE_ID || true)"
    if is_stub "$notion_db"; then
      PROBLEMS+=("NOTION_TOKEN is set but NOTION_LEADS_DATABASE_ID is empty in apps/agent/.env. Paste the database id from your Notion database URL, or remove NOTION_TOKEN to skip Notion.")
    fi
  fi
fi

# ---------- 4. Notion reachable + database shared ---------------------------
# Only run the live health check if Notion vars passed (skip if Notion not configured).
notion_token_val="$(read_var NOTION_TOKEN 2>/dev/null || true)"
notion_db_val="$(read_var NOTION_LEADS_DATABASE_ID 2>/dev/null || true)"
if [[ ${#PROBLEMS[@]} -eq 0 ]] && [[ -n "$notion_token_val" ]] && ! is_stub "$notion_token_val" && [[ -n "$notion_db_val" ]]; then
  HEALTH_OUT="$(cd "$REPO_ROOT/apps/agent" && uv run python -m src.notion_tools --check 2>&1 || true)"
  if ! grep -q "^OK: " <<<"$HEALTH_OUT"; then
    # Pass the FAIL output through verbatim — the --check flag already
    # formats the share-gotcha fix instructions when applicable.
    PROBLEMS+=("Notion health check failed:
$HEALTH_OUT")
  fi
fi

# ---------- Report -----------------------------------------------------------
if [[ ${#PROBLEMS[@]} -gt 0 ]]; then
  echo ""
  echo "Pre-flight check found ${#PROBLEMS[@]} problem(s):"
  echo ""
  i=1
  for p in "${PROBLEMS[@]}"; do
    # Indent multi-line problems so they read as one item.
    first_line="${p%%$'\n'*}"
    rest="${p#*$'\n'}"
    echo "  $i. $first_line"
    if [[ "$rest" != "$p" ]]; then
      while IFS= read -r line; do
        echo "     $line"
      done <<<"$rest"
    fi
    i=$((i+1))
  done
  echo ""
  echo "Fix these and re-run \`npm run dev\`."
  exit 1
fi

exit 0

