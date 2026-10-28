#!/usr/bin/env bash
# End-to-end test in a real n8n (docker): installs the packed node, runs a workflow that
# chats (plain and with reasoning + JSON output), reads the balance and lists models.
# Makes a few cheap billable requests. Usage: OBSCURIFY_API_KEY=sk-obs1_... e2e/run.sh
set -euo pipefail
cd "$(dirname "$0")/.."
: "${OBSCURIFY_API_KEY:?set OBSCURIFY_API_KEY}"
IMAGE=${N8N_IMAGE:-n8nio/n8n:latest}
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
npm run build >/dev/null
tarball=$(npm pack --silent | tail -1)
mkdir -p "$tmp/home/nodes" "$tmp/io"
echo '{"name":"installed-nodes","private":true}' > "$tmp/home/nodes/package.json"
(cd "$tmp/home/nodes" && npm install --silent --legacy-peer-deps --ignore-scripts "$OLDPWD/$tarball")
rm -f "$tarball"
python3 e2e/make_fixtures.py "$tmp/io"
chmod -R a+rwX "$tmp"
n8n() { docker run --rm -v "$tmp/home:/home/node/.n8n" -v "$tmp/io:/io" "$IMAGE" "$@"; }
n8n import:credentials --input=/io/creds.json >/dev/null 2>&1
n8n import:workflow --input=/io/wf.json >/dev/null 2>&1
n8n execute --id=obscWf000000001 --rawOutput 2>/dev/null | python3 -c '
import json, sys
text = sys.stdin.read(); run = json.loads(text[text.find("{"):])
assert run["status"] == "success", run["status"]
s = run["data"]["resultData"]["runData"]["Summary"][0]["data"]["main"][0][0]["json"]
print(json.dumps(s))
assert "paris" in s["chat"].lower() and s["answer"] == 391 and s["reasoningChars"] > 0
assert s["balanceKnown"] and s["models"] >= 200 and s["decisionModels"] == 0
print("PASS n8n e2e")'
