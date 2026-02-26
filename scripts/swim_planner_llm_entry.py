from __future__ import annotations

import json
import sys
from pathlib import Path

# Ensure project root is importable when this script is run via absolute path.
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from swim_planner_llm import generate_swim_plan


def main() -> int:
    try:
        raw = sys.stdin.read()
        payload = json.loads(raw) if raw.strip() else {}
        plan = generate_swim_plan(payload)
        # Ensure stdout is exactly one JSON object.
        sys.stdout.write(plan.model_dump_json())
        return 0
    except Exception as exc:
        # Keep stdout clean for callers; send diagnostics to stderr only.
        sys.stderr.write(f"swim_planner_llm_entry failed: {exc}\n")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
