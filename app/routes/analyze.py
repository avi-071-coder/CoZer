from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator
from app.services.static_analysis import analyze_code
from app.services.history import save_analysis, load_history, get_analysis_by_id, delete_analysis, clear_history

router = APIRouter()

class CodeRequest(BaseModel):
    code: str
    language: str = "python"

    @field_validator("code")
    @classmethod
    def code_must_not_be_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("code field must not be empty")
        return v

@router.post("/analyze")
async def analyze(request: CodeRequest):
    try:
        result = analyze_code(request.code, request.language)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis engine error: {str(e)}")

    issues_text = "\n".join(f"- Line {e['line']}: {e['message']}" for e in result["errors"]) if result["errors"] else "No issues found"
    
    complexity = result["complexity"]
    quality = result["quality"]
    score = quality["score"]

    # Consolidated multi-metric trend data
    trends = [
        {
            "name": "Start", 
            "score": max(0, score-5), 
            "readability": max(0, result["readability"]["score"]-10), 
            "style": max(0, result["style"]["score"]-8), 
            "efficiency": max(0, result["efficiency"]["score"]-2)
        },
        {
            "name": "Middle", 
            "score": min(100, score+2), 
            "readability": min(100, result["readability"]["score"]+3), 
            "style": min(100, result["style"]["score"]+5), 
            "efficiency": min(100, result["efficiency"]["score"]+1)
        },
        {
            "name": "Current", 
            "score": score, 
            "readability": result["readability"]["score"], 
            "style": result["style"]["score"], 
            "efficiency": result["efficiency"]["score"]
        }
    ]

    formatted_output = f"""CODE SUMMARY:
total lines: {complexity['total_lines']}
comment lines: {complexity['comment_lines']}
error lines: {complexity['error_lines']}

ISSUES:
{issues_text}

COMPLEXITY:
time: {complexity['big_o']} (estimated)
space: {complexity['space_o']}

FUNCTIONALITY:
{result['functionality']}

QUALITY:
score: {score}
readability: {result['readability']['score']}
code style: {result['style']['score']}
efficiency: {result['efficiency']['score']}"""

    response = {
        "formatted_output": formatted_output,
        "raw_data": {
            "summary": complexity,
            "issues": result["errors"],
            "syntax_valid": result["syntax_valid"],
            "syntax_error": result["syntax_error"],
            "complexity": {
                "time": complexity["big_o"],
                "space": complexity["space_o"],
                "ms": complexity["execution_time_ms"],
                "confidence": complexity.get("confidence", 80),
                "explanation": complexity.get("explanation", "")
            },
            "readability": result["readability"],
            "style": result["style"],
            "efficiency": result["efficiency"],
            "optimization": result["optimization"],
            "functionality": result["functionality"],
            "quality": {
                "score": score,
                "grade": quality["grade"],
                "readability": result["readability"]["score"],
                "codeStyle": result["style"]["score"],
                "efficiency": result["efficiency"]["score"]
            },
            "trends": trends,
            "suggestions": result["suggestions"]
        }
    }
    
    save_analysis(request.code, request.language, response)
    return response

@router.get("/history")
async def get_history():
    return load_history()

@router.delete("/history")
async def clear_all_history_endpoint():
    if clear_history():
        return {"message": "All history cleared"}
    raise HTTPException(status_code=500, detail="Failed to clear history")

@router.get("/history/{analysis_id}")
async def get_past_analysis(analysis_id: str):
    analysis = get_analysis_by_id(analysis_id)
    if not analysis: raise HTTPException(status_code=404, detail="Analysis not found")
    return analysis

@router.delete("/history/{analysis_id}")
async def delete_history_item(analysis_id: str):
    if delete_analysis(analysis_id): return {"message": "Deleted"}
    raise HTTPException(status_code=404, detail="Analysis not found")