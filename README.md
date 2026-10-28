# n8n-nodes-obscurify

This is an n8n community node. It lets you use [Obscurify.ai](https://obscurify.ai/?utm_source=n8n) in your n8n workflows.

Obscurify.ai is a privacy-focused AI service with an OpenAI-compatible API to 200+ models (GPT, Claude, Gemini, DeepSeek, Qwen, Llama, Mistral and more). Text requests only use zero-data-retention routes, prompts and responses aren't stored on Obscurify.ai's servers, and accounts are a random account number with no email.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation) ·
[Operations](#operations) ·
[Credentials](#credentials) ·
[Compatibility](#compatibility) ·
[Usage](#usage) ·
[Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation. The package name is `n8n-nodes-obscurify`. It has no runtime dependencies.

## Operations

**Chat**
- **Message a Model:** send a list of messages (system, user, assistant) to any Obscurify.ai model and get its reply. Options: maximum tokens, temperature, top P, reasoning effort (none to max; models that don't reason ignore it) and JSON output. With **Simplify Output** on (the default), the node returns `content`, `reasoning` (when the model reasons), `finish_reason`, `model` and `usage`.

**Model**
- **Get Many:** list the available models with their context windows, tool support and per-token prices. Decision models are left out unless you turn off **Chat Models Only**.

**Account**
- **Get Balance:** the balance of the account the API key belongs to, in USD.

The node can also be used as a tool by n8n's AI Agent.

## Credentials

1. Create an account at [obscurify.ai](https://obscurify.ai/?utm_source=n8n). You get a random account number: no email, no password.
2. Add a balance on the account page. The API works on every plan with a positive balance. Frontier models need the Casual plan or higher, and uncensored models need Pro.
3. On [obscurify.ai/account](https://obscurify.ai/account), click **Show API Key**.
4. In n8n, create an **Obscurify.ai API** credential and paste the `sk-obs1_...` key. Leave **Base URL** at `https://obscurify.ai/v1` unless you reach Obscurify.ai through a proxy.

The credential test checks the key against the account balance endpoint.

## Compatibility

Tested with n8n 2.45.5 (docker `n8nio/n8n:latest`, 2026-10-28). Built with `@n8n/node-cli` 0.54.

## Usage

A minimal workflow: **Manual Trigger → Obscurify.ai (Chat: Message a Model)**. Pick a model such as `deepseek/deepseek-v4-flash`, add a user message like `Summarize this: {{ $json.text }}`, and read the reply from `{{ $json.content }}`.

To get structured data back, turn on **Options → JSON Output** and ask for JSON in the prompt. Then parse `{{ JSON.parse($json.content) }}`.

Prices per model: [obscurify.ai/model_cards](https://obscurify.ai/model_cards?utm_source=n8n). Each request is charged to your Obscurify.ai balance at that model's price.

## Development

```sh
npm install
npm run lint
npm run build
npm run dev                                  # n8n with this node loaded
OBSCURIFY_API_KEY=sk-obs1_... e2e/run.sh     # real n8n in docker: chat, reasoning + JSON, balance, models
```

Releases are published to npm from GitHub Actions with provenance (`.github/workflows/publish.yml`, on a version tag).

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [Obscurify.ai API reference](https://obscurify.ai/api-docs)
- [Obscurify.ai](https://obscurify.ai/?utm_source=n8n)

## License

[MIT](LICENSE.md)
