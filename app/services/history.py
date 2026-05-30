import json
import os
from datetime import datetime
from typing import List, Dict

HISTORY_FILE = "analysis_history.json"

def save_analysis(code: str, language: str, result: Dict):
    """Saves an analysis result to the history file."""
    history = load_history()
    
    entry = {
        "id": datetime.now().strftime("%Y%m%d%H%M%S"),
        "timestamp": datetime.now().isoformat(),
        "code": code,
        "language": language,
        "summary": result["raw_data"].get("summary", {}),
        "quality": result["raw_data"].get("quality", {}),
        "functionality": result["raw_data"].get("functionality", ""),
        "complexity": result["raw_data"].get("complexity", {}),
        "issues_count": len(result["raw_data"].get("issues", [])),
        "formatted_output": result.get("formatted_output", "")
    }
    
    history.insert(0, entry)  # Newest first
    
    # Keep only last 50 entries
    history = history[:50]
    
    with open(HISTORY_FILE, "w") as f:
        json.dump(history, f, indent=2)

def load_history() -> List[Dict]:
    """Loads the analysis history from the file."""
    if not os.path.exists(HISTORY_FILE):
        return []
    
    try:
        with open(HISTORY_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return []

def get_analysis_by_id(analysis_id: str) -> Dict | None:
    """Retrieves a specific analysis by its ID."""
    history = load_history()
    for entry in history:
        if entry["id"] == analysis_id:
            return entry
    return None

def delete_analysis(analysis_id: str) -> bool:
    """Deletes an analysis from the history."""
    history = load_history()
    new_history = [e for e in history if e["id"] != analysis_id]
    if len(new_history) < len(history):
        with open(HISTORY_FILE, "w") as f:
            json.dump(new_history, f, indent=2)
        return True
    return False

def clear_history() -> bool:
    """Clears all analysis history."""
    try:
        with open(HISTORY_FILE, "w") as f:
            json.dump([], f, indent=2)
        return True
    except Exception:
        return False

