"""
Hugging Face Spaces - Gradio UI + REST API for Physical AI RAG Chatbot
Deploy this file to Hugging Face Spaces
"""

import os
import sys
from pathlib import Path

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set environment variables for HF Spaces
# Add your API keys in HF Spaces Secrets
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
QDRANT_URL = os.getenv("QDRANT_URL", "https://6bf73022-8fbf-464b-9953-2ffb94b29914.us-east4-0.gcp.cloud.qdrant.io:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.oNpoYrz7EmE4iOShl-ImZlV_fhpL5CYsv8XYbiQmlBI")
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION", "physical_ai_book_v2")

# Set env vars for the RAG pipeline
os.environ["GROQ_API_KEY"] = GROQ_API_KEY
os.environ["QDRANT_URL"] = QDRANT_URL
os.environ["QDRANT_API_KEY"] = QDRANT_API_KEY
os.environ["QDRANT_COLLECTION"] = QDRANT_COLLECTION

import gradio as gr
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import uvicorn

# Import RAG pipeline
try:
    from rag import RAGPipeline
    RAG_AVAILABLE = True
except Exception as e:
    RAG_AVAILABLE = False
    print(f"Warning: RAG pipeline not available: {e}")


# ============== REST API Models ==============

class ChatRequest(BaseModel):
    message: str
    selected_text: Optional[str] = None
    conversation_id: Optional[str] = None


class Source(BaseModel):
    chapter: str
    section: str
    url: str
    content: str
    score: float


class ChatResponse(BaseModel):
    response: str
    conversation_id: str
    sources: Optional[List[Source]] = None


# ============== RAG Functions ==============

def create_rag_pipeline():
    """Create RAG pipeline instance"""
    if not RAG_AVAILABLE:
        return None
    try:
        return RAGPipeline()
    except Exception as e:
        print(f"Error creating RAG pipeline: {e}")
        return None


def chat_with_rag(message, history, selected_text):
    """
    Chat function for Gradio interface
    
    Args:
        message: User's message
        history: Conversation history (Gradio format)
        selected_text: Optional selected text from document
    
    Returns:
        Response string
    """
    if not message.strip():
        return "Please enter a question."
    
    # Initialize RAG pipeline
    rag = create_rag_pipeline()
    
    if rag is None:
        return "⚠️ RAG pipeline not available. Please check API keys in Spaces Secrets."
    
    try:
        # Query RAG pipeline
        result = rag.query(
            message=message,
            selected_text=selected_text if selected_text else None
        )
        
        # Format response with sources
        response = result["answer"]
        
        # Add sources if available
        if result.get("sources"):
            response += "\n\n**📚 Sources:**\n"
            for i, source in enumerate(result["sources"][:3], 1):
                chapter = source.get("chapter", "Unknown")
                section = source.get("section", "")
                score = source.get("score", 0)
                response += f"\n{i}. **{chapter}** - {section} (Relevance: {score:.2f})"
        
        return response
        
    except Exception as e:
        return f"⚠️ Error: {str(e)}"


def get_status():
    """Get system status"""
    status_info = []
    
    # Check Groq
    if os.getenv("GROQ_API_KEY"):
        status_info.append("✅ Groq API: Connected")
    else:
        status_info.append("⚠️ Groq API: Missing key")
    
    # Check Qdrant
    if os.getenv("QDRANT_URL"):
        status_info.append("✅ Qdrant: Connected")
    else:
        status_info.append("⚠️ Qdrant: Missing URL")
    
    # Check RAG
    if RAG_AVAILABLE:
        try:
            rag = create_rag_pipeline()
            if rag:
                count = rag.get_embeddings_count()
                status_info.append(f"✅ Embeddings: {count} chunks indexed")
        except Exception as e:
            status_info.append(f"⚠️ RAG: {str(e)}")
    else:
        status_info.append("⚠️ RAG: Not available")
    
    return "\n".join(status_info)


# ============== FastAPI App ==============

app = FastAPI(title="Physical AI RAG Chatbot API")

# Enable CORS for all origins (required for Vercel frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your Vercel domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint - API info"""
    return {
        "message": "Physical AI RAG Chatbot API",
        "status": "running",
        "endpoints": {
            "chat": "/api/chat",
            "health": "/health"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "rag_available": RAG_AVAILABLE,
        "groq_configured": bool(GROQ_API_KEY),
        "qdrant_configured": bool(QDRANT_URL)
    }


@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Chat endpoint for frontend integration
    
    Args:
        request: ChatRequest with message, selected_text, conversation_id
    
    Returns:
        ChatResponse with answer and sources
    """
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    # Initialize RAG pipeline
    rag = create_rag_pipeline()
    
    if rag is None:
        raise HTTPException(
            status_code=503,
            detail="RAG pipeline not available. Please check API keys."
        )
    
    try:
        # Query RAG pipeline
        result = rag.query(
            message=request.message,
            selected_text=request.selected_text if request.selected_text else None
        )
        
        # Format sources
        sources = []
        if result.get("sources"):
            for source in result["sources"][:3]:
                sources.append(Source(
                    chapter=source.get("chapter", "Unknown"),
                    section=source.get("section", ""),
                    url=source.get("url", ""),
                    content=source.get("content", "")[:500],  # Limit content length
                    score=source.get("score", 0)
                ))
        
        # Generate conversation ID if not provided
        conversation_id = request.conversation_id or f"conv_{os.urandom(8).hex()}"
        
        return ChatResponse(
            response=result["answer"],
            conversation_id=conversation_id,
            sources=sources if sources else None
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============== Gradio Interface ==============

with gr.Blocks(
    title="Physical AI RAG Chatbot",
    theme=gr.themes.Soft(),
    css="""
    .gradio-container {
        max-width: 900px !important;
    }
    #status-box {
        background: #f0f0f0;
        padding: 10px;
        border-radius: 8px;
        font-size: 0.9em;
    }
    """
) as demo:
    
    gr.Markdown("""
    # 🤖 Physical AI & Humanoid Robotics Chatbot
    
    Ask questions about Physical AI, ROS 2, NVIDIA Isaac, VLA systems, and more!
    Powered by **Groq LLM** + **Qdrant Vector DB** + **RAG**
    """)
    
    # Status box
    with gr.Accordion("📊 System Status", open=False):
        status_output = gr.Textbox(
            label="System Status",
            value=get_status(),
            lines=5,
            elem_id="status-box"
        )
        status_btn = gr.Button("🔄 Refresh Status", size="sm")
        status_btn.click(fn=get_status, outputs=status_output)
    
    # Chat interface
    with gr.Row():
        with gr.Column(scale=3):
            chatbot = gr.Chatbot(
                label="Chat",
                height=450,
                placeholder="Ask me anything about Physical AI & Humanoid Robotics..."
            )
            
            with gr.Row():
                msg_input = gr.Textbox(
                    placeholder="Type your question here...",
                    show_label=False,
                    scale=4,
                    container=False
                )
                send_btn = gr.Button("🚀 Send", scale=1)
            
            clear_btn = gr.Button("🗑️ Clear Chat", size="sm")
        
        with gr.Column(scale=1):
            gr.Markdown("""
            ### 📖 How to Use
            
            1. Type your question in the chat box
            2. Press **Send** or hit Enter
            3. Get answers with textbook references
            
            ### 💡 Tips
            
            - Ask specific questions about chapters
            - Mention topics like "ROS 2", "Isaac Sim", "VLA"
            - Check **System Status** if you get errors
            """)
    
    # ============== Event Handlers ==============
    
    def respond(message, chat_history):
        """Process user message and update chat history"""
        bot_message = chat_with_rag(message, chat_history, None)
        chat_history.append((message, bot_message))
        return "", chat_history
    
    msg_input.submit(respond, [msg_input, chatbot], [msg_input, chatbot])
    send_btn.click(respond, [msg_input, chatbot], [msg_input, chatbot])
    clear_btn.click(lambda: None, None, chatbot, queue=False)


# ============== Launch ==============

if __name__ == "__main__":
    # Create FastAPI app that includes both Gradio and REST API
    from fastapi.responses import RedirectResponse
    
    # Mount Gradio app to FastAPI
    app = gr.mount_gradio_app(app, demo, path="/")
    
    # Launch with uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=7860
    )
