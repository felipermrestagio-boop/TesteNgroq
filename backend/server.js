const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");

const PORT = process.env.PORT || 3000;
// Em produção, troque "*" pela URL do seu site na Vercel (ex: https://meu-teste.vercel.app)
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";

const db = new Database("data.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS mensagens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    texto TEXT NOT NULL,
    origem TEXT,
    criado_em TEXT DEFAULT (datetime('now','localtime'))
  )
`);

const app = express();
app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json());

// Log de cada requisição, para você ver o tráfego chegando pelo túnel
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url} | origin: ${req.headers.origin || "-"}`);
  next();
});

app.get("/api/health", (_req, res) => res.json({ ok: true, hora: new Date().toISOString() }));

app.get("/api/mensagens", (_req, res) => {
  const rows = db.prepare("SELECT * FROM mensagens ORDER BY id DESC LIMIT 50").all();
  res.json(rows);
});

app.post("/api/mensagens", (req, res) => {
  const texto = (req.body?.texto || "").toString().trim();
  if (!texto) return res.status(400).json({ erro: "texto é obrigatório" });
  if (texto.length > 500) return res.status(400).json({ erro: "texto muito longo" });

  const info = db
    .prepare("INSERT INTO mensagens (texto, origem) VALUES (?, ?)")
    .run(texto, req.headers.origin || "desconhecida");
  res.status(201).json({ id: info.lastInsertRowid, texto });
});

app.listen(PORT, () => console.log(`API rodando em http://localhost:${PORT}`));
