# Teste: Vercel (front) + ngrok (back e banco locais)

```
Navegador ──► Vercel (index.html estático)
    │
    └──► https://seu-nome.ngrok-free.app ──► agente ngrok ──► FastAPI (localhost:8000) ──► SQLite (dados.db)
```

## 1. Rodar o backend local

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8000
```

Teste: http://localhost:8000/health e http://localhost:8000/docs

## 2. Configurar e abrir o ngrok

1. Crie uma conta em https://ngrok.com e instale o agente.
2. No painel, copie seu authtoken e registre-o uma única vez:
   ```bash
   ngrok config add-authtoken SEU_TOKEN
   ```
3. Abra o túnel:
   ```bash
   ngrok http 8000
   ```
4. Copie a URL `Forwarding` (https://....ngrok-free.app).
   Teste no navegador: `<url>/health`
   (na primeira vez pode aparecer uma página de aviso do ngrok: clique em "Visit Site").

## 3. Apontar o front para o ngrok

Edite `frontend/config.js`:

```js
window.API_URL = "https://seu-nome.ngrok-free.app";
```

## 4. Publicar na Vercel

Suba a pasta `frontend` num repositório Git e importe na Vercel
(Framework: Other, sem build/install/output). Ou: `cd frontend && vercel --prod`.

## 5. Restringir o CORS (depois que funcionar)

```bash
ALLOWED_ORIGINS="https://seu-app.vercel.app" uvicorn main:app --host 127.0.0.1 --port 8000
```

## Problemas comuns

| Sintoma | Causa provável |
|---|---|
| Bolinha vermelha | Túnel caiu, URL errada no `config.js` ou falta novo deploy |
| Erro de CORS no console | `ALLOWED_ORIGINS` não inclui o domínio da Vercel |
| Resposta em HTML / "Unexpected token <" | Página de aviso do ngrok; o header `ngrok-skip-browser-warning` não está sendo enviado (limpe o cache) |
| ERR_NGROK_8012 / 502 | uvicorn não está rodando na porta 8000 |
| Erro 429 | Limite do plano gratuito do ngrok atingido |

## Observações

- Dados em `backend/dados.db` (SQLite), na sua máquina.
- A API não tem autenticação. Não deixe o túnel aberto sem necessidade.
