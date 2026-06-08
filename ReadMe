# AI Agent with RAG

An intelligent AI assistant built using **Retrieval-Augmented Generation (RAG)**, designed to provide more accurate and context-aware responses by combining document retrieval with large language models.

Created by **Kilian Meddas** and **Anaïs Assogane**.

---

## Overview

This project was developed as part of a Bachelor of Science in Computing group project at Griffith College Dublin.

The system allows users to interact with an AI assistant through a modern web interface. User questions are processed by a backend service that retrieves relevant information from uploaded documents before generating a response, improving accuracy compared to traditional AI chatbots.

The application combines:

- Document retrieval (RAG)
- AI-powered response generation
- Text-to-speech capabilities
- User authentication
- Administrative tools
- Cloud deployment

---

## Features

### User Features

- User registration and authentication
- Chat with an AI assistant
- Retrieval-Augmented Generation (RAG)
- Upload and process documents
- Conversation history
- User profile management
- Audio response generation (TTS)

### Admin Features

- User management
- Document management
- Workspace monitoring

---

## Technologies Used

### Backend

- Python
- FastAPI
- PyTorch
- Qwen Models
- Retrieval-Augmented Generation (RAG)
- Google Cloud Platform

### Frontend

- React
- Vite
- JavaScript
- HTML5
- CSS3

### AI Components

- Qwen Embedding Model
- Qwen Text Generation Model
- Qwen Text-to-Speech Model

---

## Project Structure

### Backend

```text
backend/
├── core/
├── models/
├── routes/
├── services/
├── uploads/
├── audio_outputs/
├── app.py
├── requirements.txt
└── .env
```

### Frontend

```text
frontend/
├── public/
├── src/
│   ├── api/
│   ├── components/
│   ├── context/
│   └── pages/
├── package.json
└── vite.config.js
```

---

## Important Note About the Architecture

The repository contains the **final source code used for the project**, but the directory structure shown here does **not exactly match the production architecture**.

During deployment, the backend was hosted on **Google Cloud**, where services were distributed across cloud resources and virtual machines. As a result:

- The production infrastructure was separated into multiple cloud components.
- Some services were deployed independently.
- Storage and processing resources were hosted remotely.
- The local repository structure was adapted for development and submission purposes.

Therefore, the folder organization in this repository should be considered the **development version of the architecture**, while the deployed cloud architecture was more distributed.

---

## Installation

### Backend

Create a virtual environment:

```bash
python -m venv .venv
```

Activate the environment:

Linux/macOS:

```bash
source .venv/bin/activate
```

Windows:

```powershell
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

**Warning: if you don't have nvidia module, it could be failed**

Start the API:

```bash
python app.py
```

---

### Frontend

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

---

## System Workflow

1. User submits a question through the web interface.
2. The backend processes the request.
3. Relevant information is retrieved from indexed documents.
4. The retrieved context is provided to the AI model.
5. The AI generates a context-aware response.
6. The response is returned to the frontend.
7. Optionally, an audio version of the response is generated.

## Authors

- Kilian Meddas
- Anaïs Assogane

---

## License

This project was developed for educational purposes as part of the Bachelor of Science in Computing programme at Griffith College Dublin.
