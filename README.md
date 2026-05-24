# Simple Kiro Gateway (Node.js)

Proxy gateway Node.js untuk Kiro (Amazon Q Developer / AWS CodeWhisperer).

## Fitur

- Endpoint OpenAI-compatible:
  - `POST /v1/chat/completions`
- Endpoint Anthropic-compatible:
  - `POST /v1/messages`
- Daftar model lokal:
  - `GET /v1/models`
- Health check:
  - `GET /` dan `GET /health`
- Admin panel web:
  - `GET /admin` – cek model & kirim prompt langsung dari browser