# Teste: Vercel (front) + Cloudflare Tunnel (back e banco locais)

```
Navegador ──► Vercel (index.html estático)
    │
    └──► https://xxxx.trycloudflare.com ──► cloudflared ──► FastAPI (localhost:8000) ──► SQLite (dados.db)
```

## 1. Rodar o backend local

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8000
```

Teste: abra http://localhost:8000/health e http://localhost:8000/docs

## 2. Abrir o túnel (Cloudflare)

Instale o `cloudflared` (https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) e rode:

```bash
cloudflared tunnel --url http://localhost:8000
```

Ele imprime uma URL como `https://algo-aleatorio.trycloudflare.com`. Copie.
Teste no navegador: `https://algo-aleatorio.trycloudflare.com/health`

> Quick Tunnel muda de URL a cada execução. Para URL fixa, use um túnel nomeado com domínio seu na Cloudflare.

## 3. Apontar o front para o túnel

Edite `frontend/config.js`:

```js
window.API_URL = "https://algo-aleatorio.trycloudflare.com";
```

## 4. Publicar na Vercel

```bash
npm i -g vercel
cd frontend
vercel          # primeiro deploy (preview)
vercel --prod   # produção
```

Ou suba a pasta `frontend` num repositório Git e importe na Vercel (Framework: "Other", sem build command).

## 5. Restringir o CORS (depois que funcionar)

Por padrão a API aceita qualquer origem (`*`). Depois do teste, reinicie com a URL da Vercel:

```bash
ALLOWED_ORIGINS="https://seu-app.vercel.app" uvicorn main:app --host 127.0.0.1 --port 8000
```

## Problemas comuns

| Sintoma | Causa provável |
|---|---|
| "Sem conexão com a API" | Túnel caiu/URL mudou: atualize `config.js` e faça novo deploy |
| Erro de CORS no console | `ALLOWED_ORIGINS` não inclui o domínio da Vercel |
| Mixed content bloqueado | `API_URL` com `http://` em vez de `https://` |
| 1033 / 502 da Cloudflare | `uvicorn` não está rodando na porta 8000 |

## Observações

- Os dados ficam em `backend/dados.db` (SQLite) na sua máquina.
- Esta API não tem autenticação. Para além do teste, adicione uma chave/token antes de deixar o túnel aberto.
