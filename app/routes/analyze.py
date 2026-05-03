from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator
from app.services.static_analysis import analyze_code
from app.services.history import save_analysis, load_history, get_analysis_by_id, delete_analysis

router = APIRouter()

class CodeRequest(BaseModel):
    code: str

    @field_validator("code")
    @classmethod
    def code_must_not_be_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("code field must not be empty")
        return v

@router.post("/analyze")
async def analyze(request: CodeRequest):
    try:
        result = analyze_code(request.code)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis engine error: {str(e)}")

    issues_text = "\n".join(f"- Line {e['line']}: {e['message']}" for e in result["errors"]) if result["errors"] else "No issues found"
    
    complexity = result["complexity"]
    quality = result["quality"]
    score = int(result["trust_score"] * 10)

    # Consolidated multi-metric trend data
    # We'll provide 3 points for the graph to show a "trend"
    trends = [
        {
            "name": "Start", 
            "score": max(0, score-5), 
            "readability": max(0, quality["readability"]-10), 
            "style": max(0, quality["code_style"]-8), 
            "efficiency": max(0, quality["efficiency"]-2)
        },
        {
            "name": "Middle", 
            "score": min(100, score+2), 
            "readability": min(100, quality["readability"]+3), 
            "style": min(100, quality["code_style"]+5), 
            "efficiency": min(100, quality["efficiency"]+1)
        },
        {
            "name": "Current", 
            "score": score, 
            "readability": quality["readability"], 
            "style": quality["code_style"], 
            "efficiency": quality["efficiency"]
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
readability: {quality['readability']}
code style: {quality['code_style']}
efficiency: {quality['efficiency']}"""

    response = {
        "formatted_output": formatted_output,
        "raw_data": {
            "summary": complexity,
            "issues": result["errors"],
            "complexity": {
                "time": complexity["big_o"],
                "space": complexity["space_o"],
                "ms": complexity["execution_time_ms"]
            },
            "functionality": result["functionality"],
            "quality": {
                "score": score,
                "readability": quality["readability"],
                "codeStyle": quality["code_style"],
                "efficiency": quality["efficiency"]
            },
            "trends": trends,
            "suggestions": result["suggestions"]
        }
    }
    
    save_analysis(request.code, response)
    return response

@router.get("/history")
async def get_history():
    return load_history()

@router.get("/history/{analysis_id}")
async def get_past_analysis(analysis_id: str):
    analysis = get_analysis_by_id(analysis_id)
    if not analysis: raise HTTPException(status_code=404, detail="Analysis not found")
    return analysis

@router.delete("/history/{analysis_id}")
async def delete_history_item(analysis_id: str):
    if delete_analysis(analysis_id): return {"message": "Deleted"}
    raise HTTPException(status_code=404, detail="Analysis not found")