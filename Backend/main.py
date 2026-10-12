import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from groq import Groq
from fastapi.middleware.cors
import CORSMiddleware

load_dotenv()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "null",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)
SYSTEM_PROMPT = """
You are a friendly educational tutor.
Explain ideas clearly and step by step when useful.
If you are unsure, say so.
Keep your answers focused on learning.
"""


class ChatRequest(BaseModel):
    question: str


@app.post("/api/chat")
def chat(request: ChatRequest):
    question = request.question.strip()

    if not question:
        raise HTTPException(status_code=400, detail="Please enter a question.")

    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="The Groq API key is not configured.",
        )

    try:
        client = Groq(api_key=api_key)

        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": question},
            ],
        )

        answer = response.choices[0].message.content
        return {"answer": answer}

    except Exception:
        raise HTTPException(
            status_code=502,
            detail="The AI service could not answer right now.",
        )


@app.get("/")
def home():
    return {"message": "StudyBuddy API is running"}