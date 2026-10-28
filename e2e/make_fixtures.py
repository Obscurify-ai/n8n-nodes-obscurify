"""Writes the credential and workflow that e2e/run.sh imports into a throwaway n8n."""
import json
import os
import sys

out = sys.argv[1]
C = {"obscurifyApi": {"id": "obscCred0000001", "name": "Obscurify.ai account"}}
creds = [{"id": "obscCred0000001", "name": "Obscurify.ai account", "type": "obscurifyApi",
          "data": {"apiKey": os.environ["OBSCURIFY_API_KEY"], "baseUrl": "https://obscurify.ai/v1"}}]


def node(id_, name, x, params, type_="n8n-nodes-obscurify.obscurify", creds=True):
    n = {"id": id_, "name": name, "type": type_, "typeVersion": 1 if creds else 2, "position": [x, 0], "parameters": params}
    if creds:
        n["credentials"] = C
    return n


nodes = [
    {"id": "t", "name": "Start", "type": "n8n-nodes-base.manualTrigger", "typeVersion": 1, "position": [0, 0], "parameters": {}},
    node("a", "Chat", 200, {"resource": "chat", "operation": "message", "model": "meta-llama/llama-3.3-70b-instruct",
                            "messages": {"values": [{"role": "system", "content": "Answer in one word."},
                                                    {"role": "user", "content": "What is the capital of France?"}]},
                            "simplify": True, "options": {"maxTokens": 20}}),
    node("b", "Reasoning", 400, {"resource": "chat", "operation": "message", "model": "deepseek/deepseek-v4-flash",
                                 "messages": {"values": [{"role": "user", "content": "What is 17*23? Reply as JSON {\"answer\": number}."}]},
                                 "simplify": True, "options": {"maxTokens": 2000, "reasoningEffort": "low", "jsonOutput": True}}),
    node("c", "Balance", 600, {"resource": "account", "operation": "getBalance"}),
    node("d", "Models", 800, {"resource": "model", "operation": "getAll", "chatOnly": True}),
    node("e", "Summary", 1000, {"jsCode": (
        "const chat=$('Chat').first().json; const r=$('Reasoning').first().json; const bal=$('Balance').first().json;"
        "return [{json:{chat:chat.content, reasoningChars:(r.reasoning||'').length, answer:JSON.parse(r.content).answer,"
        " balanceKnown: typeof bal.balance==='number', models:$input.all().length,"
        " decisionModels:$input.all().filter(i=>i.json.decisions).length}}];")},
        type_="n8n-nodes-base.code", creds=False),
]
order = ["Start", "Chat", "Reasoning", "Balance", "Models", "Summary"]
conn = {a: {"main": [[{"node": b, "type": "main", "index": 0}]]} for a, b in zip(order, order[1:])}
json.dump(creds, open(f"{out}/creds.json", "w"))
json.dump([{"id": "obscWf000000001", "name": "Obscurify e2e", "nodes": nodes, "connections": conn,
            "active": False, "settings": {}}], open(f"{out}/wf.json", "w"))
