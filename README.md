# PYZER: High-Performance Python Static Analysis

## Overview
PYZER is a specialized static analysis platform for Python, engineered to detect critical runtime risks, logical vulnerabilities, and syntax errors with 92% precision. It utilizes a hybrid analysis model combining Abstract Syntax Tree (AST) structures with deep semantic verification.

## Core Capabilities

### Hybrid Analysis Model
PYZER employs a triple-pass verification system:
1. **Static Pass**: Uses AST modules to identify structural syntax errors, undefined names, and infinite loops.
2. **Semantic Pass**: Leverages LLM-driven deep scanning for complex logical bugs and non-contiguous syntax issues.
3. **Operational Pass**: Calculates deterministic Time and Space complexity (Big-O) based on algorithmic patterns.

### Key Metrics
* **Real Issues Only**: Filters out stylistic noise and print statements to focus on execution stability.
* **Unified Quality Graph**: Tracks Overall Score, Readability, Code Style, and Efficiency in a single multi-metric visualization.
* **Operational Insights**: Provides precise functionality summaries and elite technical refactoring suggestions.

## Technology Stack
* **Backend**: FastAPI, Python AST, LLM Integration.
* **Frontend**: React.js, Recharts, Lucide Icons.
* **Data**: JSON-based local history persistence.

## Setup

### Backend
1. Install dependencies: `pip install -r requirements.txt`
2. Start server: `python main.py`

### Frontend
1. Navigate to `/frontend`
2. Install dependencies: `npm install`
3. Start UI: `npm start` (Runs on http://localhost:3000)

![Dashboard Preview](pyzer_dashboard_preview.png)
