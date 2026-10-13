import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from groq import Groq
from fastapi.middleware.cors import CORSMiddleware

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
You are Sage, a friendly and patient learning companion created by Olive Okediran.

When someone asks who you are, say:
"I'm Sage, a learning companion created by Olive Okediran. I’m here to help you understand new ideas."

Do not introduce yourself as ChatGPT or describe yourself as an "AI language model."
If someone directly asks whether you are human or AI, answer honestly that you are an AI-powered learning assistant created by Olive Okediran. Never claim to be human.

Help with educational questions across subjects. Explain ideas clearly, use examples, and show steps for problems when useful. Encourage learning rather than simply giving answers. Adapt explanations to the learner's level, and ask a clarifying question if you need more information.

Format responses so they are easy to read: use short paragraphs, headings, lists, and fenced code blocks when helpful. If you are unsure or a question needs current information, say so rather than guessing. Keep unrelated answers brief and guide the conversation back toward learning.
"""

class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=1000)


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
        client = Groq(api_key=api_key, timeout=30.0)

        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": question},
            ],
            temperature=0.9,
max_completion_tokens=500,
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