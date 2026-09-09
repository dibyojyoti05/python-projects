# AI Research Assistant

A modern, full-stack application that leverages Retrieval-Augmented Generation (RAG) and Google's Gemini API to act as an automated research assistant. It searches external sources, retrieves documents, processes them using embeddings, and synthesizes source-grounded research reports with accurate citations.

## Features

- **External Source Search**: Dynamically searches across multiple external sources.
- **RAG Pipeline**: Retrieves and chunks documents, creates embeddings with ChromaDB, and performs semantic search to augment AI context.
- **Source-Grounded Analysis**: Uses Gemini to analyze retrieved information and generate structured research.
- **Citation System**: Provides accurate citations linking claims directly back to their source URLs.
- **Source Comparison**: Identifies agreements, disagreements, and research gaps across sources.
- **Export Options**: Download generated reports instantly in Markdown (MD), Plain Text (TXT), or structured JSON formats.

## Architecture

1. **Frontend**: React + TypeScript + Vite + Tailwind CSS
2. **Backend**: Python + FastAPI
3. **Database**: SQLite (Research history and metadata)
4. **Vector Database**: ChromaDB (Semantic retrieval)
5. **AI**: Local Ollama (llama3.2:latest and nomic-embed-text)

### What is RAG? (Retrieval-Augmented Generation)
RAG is a technique that enhances large language models (LLMs) by providing them with relevant external information during the generation process. 
Instead of relying solely on the LLM's pre-trained memory (which can hallucinate or be out-of-date), RAG searches for factual sources, retrieves the most relevant text chunks using **semantic similarity** (via **embeddings** and a **vector database**), and feeds that context to the LLM. This ensures the output is grounded in real evidence, significantly reducing hallucinations and allowing for accurate citations.

## Folder Structure

```
ai-research-assistant/
├── backend/          # FastAPI application
├── frontend/         # React + Vite application
├── .env.example      # Environment variables template
├── .gitignore        # Git ignore rules
└── README.md         # Project documentation
```

## Setup & Installation

### Prerequisites

* Python 3.9+
* Node.js (for frontend)
* Ollama
* Git

### 1. Ollama Setup

First, ensure Ollama is installed and running:
```bash
ollama --version
```

Check your installed models:
```bash
ollama list
```

Install and run the LLM:
```bash
ollama run llama3.2:latest
```

Install the embedding model:
```bash
ollama pull nomic-embed-text
```

### 2. Environment Configuration

Copy the `.env.example` file to `.env` and configure your API keys and local Ollama settings.
- `OLLAMA_HOST`: Set to your local Ollama host (default: `http://localhost:11434`).
- `OLLAMA_LLM_MODEL`: Set to `llama3.2:latest`.
- `OLLAMA_EMBED_MODEL`: Set to `nomic-embed-text`.
- `SEARCH_API_KEY`: Key for your chosen search provider (e.g., Tavily, Serper).

### 3. Backend Setup

Open a terminal in the `backend` directory and create a virtual environment:
```bash
cd backend
python -m venv venv
```

Activate the virtual environment:

**PowerShell (Windows)**:
```bash
.\venv\Scripts\Activate.ps1
```

**CMD (Windows)**:
```bash
venv\Scripts\activate
```

**Linux/macOS**:
```bash
source venv/bin/activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

Run the backend server:
```bash
uvicorn app.main:app --reload
```
The API will be available at `http://localhost:8000`.

### 4. Frontend Setup

Open a terminal in the `frontend` directory:
```bash
cd frontend
npm install
```

Run the frontend dev server:
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.
