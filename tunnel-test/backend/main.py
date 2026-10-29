import os
import sqlite3
from contextlib import closing
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from fastapi import APIRouter

DB_PATH = os.getenv("DB_PATH", "dados.db")

# Origens permitidas (CORS). Separe por vírgula.
# Ex.: ALLOWED_ORIGINS="https://meu-app.vercel.app,http://localhost:3000"
# Para o primeiro teste, "*" libera tudo (restrinja depois!).
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app = FastAPI(title="Teste Tunnel + Vercel")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with closing(get_conn()) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS mensagens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                texto TEXT NOT NULL,
                criado_em TEXT NOT NULL
            )
            """
        )
        conn.commit()


init_db()


class MensagemIn(BaseModel):
    texto: str = Field(min_length=1, max_length=500)


@app.get("/health")
def health():
    return {"status": "ok", "hora_servidor": datetime.now(timezone.utc).isoformat()}


@app.post("/mensagens", status_code=201)
def criar_mensagem(msg: MensagemIn):
    agora = datetime.now(timezone.utc).isoformat()
    with closing(get_conn()) as conn:
        cur = conn.execute(
            "INSERT INTO mensagens (texto, criado_em) VALUES (?, ?)",
            (msg.texto.strip(), agora),
        )
        conn.commit()
        return {"id": cur.lastrowid, "texto": msg.texto.strip(), "criado_em": agora}


@app.get("/mensagens")
def listar_mensagens(limite: int = 20):
    if not 1 <= limite <= 100:
        raise HTTPException(400, "limite deve estar entre 1 e 100")
    with closing(get_conn()) as conn:
        rows = conn.execute(
            "SELECT id, texto, criado_em FROM mensagens ORDER BY id DESC LIMIT ?",
            (limite,),
        ).fetchall()
        return [dict(r) for r in rows]
