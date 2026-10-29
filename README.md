# Teste: Vercel (front) + Cloudflare Tunnel + API e banco locais

```
Navegador → Vercel (index.html) → https://xxxx.trycloudflare.com → cloudflared → localhost:3000 (Express) → SQLite (data.db)
```

## 1. Subir o backend local
```bash
cd backend
npm install
npm start
```
Teste: http://localhost:3000/api/health

## 2. Abrir o túnel (Quick Tunnel, sem conta e sem domínio)
Instale o cloudflared: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/

```bash
cloudflared tunnel --url http://localhost:3000
```
Ele imprime uma URL tipo `https://palavras-aleatorias.trycloudflare.com`.
Teste no navegador: `https://SUA-URL.trycloudflare.com/api/health`

> A URL muda a cada vez que você reinicia o cloudflared (normal no Quick Tunnel).

## 3. Publicar o frontend na Vercel
Opção A (CLI):
```bash
cd frontend
npx vercel --prod
```
Opção B: suba a pasta `frontend` num repositório no GitHub, importe na Vercel
(Framework Preset: "Other", sem build command).

## 4. Testar
1. Abra o site da Vercel.
2. Cole a URL do túnel no campo e clique em **Salvar** (deve aparecer "API conectada ✔" com a latência).
3. Envie mensagens. Veja o log no terminal do backend e confira o banco:
```bash
sqlite3 backend/data.db "SELECT * FROM mensagens;"
```

## Dicas
- **CORS:** por padrão a API aceita qualquer origem (`*`) para facilitar o teste. Depois restrinja:
  `ALLOWED_ORIGIN=https://seu-site.vercel.app npm start`
- **URL fixa:** para não depender do Quick Tunnel, use um Named Tunnel com domínio seu no Cloudflare
  (`cloudflared tunnel login`, `tunnel create`, `tunnel route dns`).
- **Sem CORS (alternativa):** na Vercel, um `vercel.json` com `rewrites` de `/api/*` para a URL do túnel
  faz o navegador falar só com a Vercel.
- **Segurança:** o túnel deixa a API pública. Não exponha dados sensíveis sem autenticação.
