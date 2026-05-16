import os
import aiofiles
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv() 

app = FastAPI()

log_file_path = "chat_logs.txt"

# Initialize Gemini AI
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
chat_session = None

if GEMINI_API_KEY and GEMINI_API_KEY != "your_gemini_api_key_here":
    genai.configure(api_key=GEMINI_API_KEY)
    generation_config = {
        "temperature": 0.2,
    }
    
    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        generation_config=generation_config,
        system_instruction="""You are 'Swar AI', a helpful and professional customer support voice bot for a software company.
Your primary tasks are to:
1. Greet users warmly.
2. Answer basic questions about software demos.
3. Help schedule software demos.

CRITICAL RULES TO AVOID HALLUCINATION:
- NEVER invent features, prices, or technical details that are not standard.
- Respond ONLY in a natural mix of Hindi and Telugu (Romanized/English script is preferred). 
- Keep responses SHORT, exactly 1 to 2 sentences.
- Do NOT use emojis.
- Do not make up links or phone numbers.
- For example, if they say 'Namaste, naa peru Raju, demo kavali', respond with something like: 'Namaste Raju ji! Sure, meeku software demo schedule chestanu. Meeku eppudu anukulanga untundi?'"""
    )
    
    chat_session = model.start_chat(history=[])

class ChatRequest(BaseModel):
    message: str

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    user_message = request.message
    bot_reply = ""
    
    if not GEMINI_API_KEY or GEMINI_API_KEY == "your_gemini_api_key_here":
        bot_reply = "Please paste your real GEMINI_API_KEY in the .env file to enable AI responses. / AI kosam mi real API key ni .env file lo pettandi."
    else:
        try:
            response = chat_session.send_message(user_message)
            bot_reply = response.text.strip()
        except Exception as e:
            print("AI Error:", e)
            bot_reply = "Kshaminchandi, network error vachindi. / Mujhe samajh nahi aaya, please try again."
            
    # Append to log file
    log_entry = f"User: {user_message}\nBot: {bot_reply}\n\n"
    try:
        async with aiofiles.open(log_file_path, mode='a', encoding='utf-8') as f:
            await f.write(log_entry)
    except Exception as e:
        print("Failed to write log:", e)
        
    return {"reply": bot_reply}

@app.get("/api/history")
async def history_endpoint():
    if not os.path.exists(log_file_path):
        return {"history": "No conversation history found."}
        
    try:
        async with aiofiles.open(log_file_path, mode='r', encoding='utf-8') as f:
            data = await f.read()
        return {"history": data}
    except Exception as e:
        print("Error reading history:", e)
        return JSONResponse(status_code=500, content={"error": "Failed to read history"})

# Mount the 'public' directory to serve index.html, style.css, script.js at the root
app.mount("/", StaticFiles(directory="public", html=True), name="public")
