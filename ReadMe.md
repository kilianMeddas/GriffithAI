# 🤖 AI Agent with RAG (Retrieval-Augmented Generation)

An AI-powered assistant that answers questions based on **your own documents**, combining retrieval-based search with large language models to deliver accurate, contextual responses.

---

## 🚀 Project Overview

Traditional chatbots often hallucinate or provide generic answers.

This system improves reliability by using **Retrieval-Augmented Generation (RAG)**:
- It first retrieves relevant information from user documents
- Then uses an AI model to generate grounded, context-aware responses

The result: **more accurate, document-based AI answers.**

---

## ⚙️ Key Features

### 👤 User System
- Authentication & user accounts
- Chat interface with AI assistant
- Conversation history
- Document upload & processing
- Text-to-speech responses (TTS)

### 🧠 AI Capabilities
- Retrieval-Augmented Generation (RAG)
- Context-aware responses based on documents
- Embedding-based document search
- Qwen LLM integration

### 🛠 Admin Tools
- User management
- Document management
- Workspace monitoring

---

## 🧰 Tech Stack

### Backend
- Python
- FastAPI
- PyTorch
- Qwen Models
- RAG pipeline
- Google Cloud Platform

### Frontend
- React
- Vite
- JavaScript

### AI Pipeline
- Embeddings (Qwen)
- LLM generation (Qwen)
- Text-to-speech (Qwen TTS)

---

## 🏗 Architecture

1. User asks a question
2. System retrieves relevant document chunks
3. Context is injected into the LLM
4. AI generates a grounded response
5. Response is returned to UI
6. Optional audio generation (TTS)

---

## ☁️ Deployment

- Backend deployed on Google Cloud
- Distributed architecture using cloud services
- Separation between compute, storage, and API layers

---

## 📦 Project Structure

### Backend
```text
core/
models/
routes/
services/
uploads/
audio_outputs/
app.py
```

### Frontend
```text
src/
components/
pages/
api/
context/
```

---

## 🎯 What I Learned

- Building end-to-end AI systems
- Implementing RAG pipelines in production-like environments
- Backend API design with FastAPI
- Cloud deployment on Google Cloud
- Full-stack integration (React + Python)

---

## 👨‍💻 Authors
* Kilian Meddas
* Anaïs Assogane
