# CoZer: AI Code Review & Analysis Platform

## Overview
CoZer is a highly advanced, multi-language AI static analysis and code review platform. Powered by Google's cutting-edge Gemini 2.5 Flash, Groq, and Hugging Face architectures, CoZer is designed to identify complex logical bugs, optimize time/space complexity, and grade code quality across Readability, Code Style, and Efficiency with absolute precision.

## Core Capabilities

### Ultimate LLM AI Engine
CoZer features a smart LLM fallback routing system that dynamically handles API requests across multiple state-of-the-art providers:
- **Google Gemini 2.5 Flash**: Utilized as the primary engine for high-accuracy, chain-of-thought analysis, executing deep semantic checks to uncover hidden algorithmic inefficiencies.
- **Groq & Hugging Face**: Lightning-fast fallback providers ensuring seamless API integration and redundancy.

### Intelligent Analysis Metrics
* **Metrics Overview**: Tracks your overall code health across Readability, Code Style, and Efficiency.
* **Algorithmic Tracing**: Mathematically strict Time Complexity and Space Complexity (Big-O) mapping.
* **Performance Tips**: Automatically generates concise, actionable bullet points to improve performance.
* **Syntax and Vulnerability Detection**: Identifies undefined variables, infinite loops, null references, and array bounds issues before runtime.

## Technology Stack
* **Backend**: FastAPI (Python), Uvicorn.
* **Frontend**: React.js, Recharts, Lucide Icons, and Vanilla CSS featuring a premium dark-mode Glassmorphism UI aesthetic.
* **AI Providers**: Google AI Studio (Gemini), Groq API, Hugging Face Inference API.

## Setup Instructions

### Environment Setup
Create a `.env` file in the root directory and add your keys:
```
GROQ_API_KEY=your_key_here
GOOGLE_API_KEY=your_key_here
HUGGINGFACE_API_KEY=your_key_here
```

### Backend
1. Navigate to the project root.
2. Install dependencies: `pip install -r requirements.txt`
3. Start the FastAPI server: `python main.py` (Runs on http://localhost:8000)

### Frontend
1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start the React development server: `npm start` (Runs on http://localhost:3000)
