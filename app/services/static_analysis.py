import json
import re
from typing import Dict, Any
from app.services.llm_service import call_llm

def analyze_code(source: str, language: str = "python") -> dict:
    """Multi-language LLM analysis engine for CoZer"""
    lines = source.split("\n")
    total_lines = len(lines)
    
    # Calculate comment lines estimate
    comment_lines = 0
    if language == "python":
        comment_lines = len([l for l in lines if l.strip().startswith("#")])
    else:
        comment_lines = len([l for l in lines if l.strip().startswith("//") or l.strip().startswith("/*") or l.strip().startswith("*")])

    # Detailed auditor prompt
    prompt = f"""
Act as an elite AI Code Auditor and static analyzer.
Your task is to analyze the following code snippet and return a STRICT, VALID JSON response.

LANGUAGE: {language}

CODE TO ANALYZE:
{source}

You must detect:
- Syntax errors (is the code syntactically valid?)
- Possible runtime errors
- Undefined variables
- Unused variables
- Infinite loops
- Null references
- Division by zero
- Array bounds issues
- Unreachable code

Calculate:
- Readability score (0-100) and confidence (0-100)
- Code Style score (0-100) and confidence (0-100), with sub-metrics for naming_conventions, formatting, structure, documentation, and consistency.
- Efficiency score (0-100) and confidence (0-100), with sub-metrics for time_complexity, space_complexity, resource_utilization, and io_overhead.
- Complexity Analysis (Accurately trace loops, recursion, and data structures. Provide mathematically correct Time Complexity like O(1) or O(n) etc., Space Complexity like O(1) or O(n) etc., Confidence %, and a concise explanation)
- Optimization Suggestions (Current Complexity, Suggested Complexity, Estimated Improvement %, and a list of performance_tips instead of writing optimized code)
- Functionality Summary (what the code does in 1-2 sentences)

Return EXACTLY a JSON object with this structure, no markdown wrapping, no extra keys, no text before or after:
{{
  "syntax_valid": true,
  "syntax_error": null,
  "errors": [
    {{
      "line": 5,
      "severity": "severe",
      "message": "Division by zero is possible here"
    }}
  ],
  "readability": {{
    "score": 85,
    "confidence": 90
  }},
  "style": {{
    "score": 80,
    "confidence": 85,
    "sub_metrics": {{
      "naming_conventions": 80,
      "formatting": 85,
      "structure": 75,
      "documentation": 70,
      "consistency": 90
    }}
  }},
  "efficiency": {{
    "score": 75,
    "confidence": 80,
    "sub_metrics": {{
      "time_complexity": 70,
      "space_complexity": 80,
      "resource_utilization": 75,
      "io_overhead": 75
    }}
  }},
  "complexity": {{
    "time": "O(n^2)",
    "space": "O(n)",
    "confidence": 85,
    "explanation": "Nested loops traverse the array, causing quadratic time complexity."
  }},
  "optimization": {{
    "current_complexity": "O(n^2)",
    "suggested_complexity": "O(n)",
    "improvement_percent": 60,
    "performance_tips": [
      "Use a hash map to avoid nested loops.",
      "Vectorize operations instead of iterating one by one."
    ]
  }},
  "functionality_summary": "Calculates processing times for items."
}}

If there is a syntax error:
- set "syntax_valid" to false
- set "syntax_error" to {{ "line": line_number, "message": "SyntaxError description" }}
- errors list can be empty or have syntax error

Ensure that you double-escape newlines and quotes inside the JSON string values. Do not include any triple backticks or ```json block wrapper around the output. Output raw JSON.
"""

    res = call_llm(prompt, max_tokens=8192)
    
    data = None
    if res:
        cleaned_res = res.strip()
        if cleaned_res.startswith("```"):
            cleaned_res = re.sub(r"^```(?:json)?\s*", "", cleaned_res, flags=re.MULTILINE)
            cleaned_res = re.sub(r"```\s*$", "", cleaned_res, flags=re.MULTILINE)
            cleaned_res = cleaned_res.strip()
        
        try:
            data = json.loads(cleaned_res)
        except Exception as e:
            print("Failed to parse LLM response as JSON:", e)
            print("Raw response was:", res)

    if not data:
        raise ValueError("Failed to generate or parse AI analysis. Please check your API keys or ensure your LLM provider has sufficient credits.")

    # Calculate overall weighted score and grade
    readability_score = data["readability"].get("score", 75)
    style_score = data["style"].get("score", 75)
    efficiency_score = data["efficiency"].get("score", 75)
    
    errors_count = len(data["errors"])
    errors_score = max(0, 100 - errors_count * 15)
    
    if not data["syntax_valid"]:
        overall_score = 0
        grade = "Needs Improvement"
    else:
        overall_score = round(
            readability_score * 0.30 +
            style_score * 0.20 +
            efficiency_score * 0.35 +
            errors_score * 0.15
        )
        if overall_score >= 90:
            grade = "Excellent"
        elif overall_score >= 75:
            grade = "Good"
        elif overall_score >= 60:
            grade = "Fair"
        else:
            grade = "Needs Improvement"
            
    data["quality"] = {
        "score": overall_score,
        "grade": grade,
        "readability": readability_score,
        "code_style": style_score,
        "efficiency": efficiency_score
    }
    
    error_lines = len(data["errors"]) if data["syntax_valid"] else 1
    if not data["syntax_valid"] and data["syntax_error"]:
        error_lines = data["syntax_error"].get("line", 1)
        
    return {
        "trust_score": overall_score / 10.0,
        "errors": data["errors"],
        "syntax_valid": data["syntax_valid"],
        "syntax_error": data["syntax_error"],
        "complexity": {
            "total_lines": total_lines,
            "comment_lines": comment_lines,
            "error_lines": error_lines,
            "execution_time_ms": int(total_lines * 0.15),
            "big_o": data["complexity"].get("time", "O(n)"),
            "space_o": data["complexity"].get("space", "O(1)"),
            "confidence": data["complexity"].get("confidence", 80),
            "explanation": data["complexity"].get("explanation", "")
        },
        "readability": data["readability"],
        "style": data["style"],
        "efficiency": data["efficiency"],
        "optimization": data["optimization"],
        "functionality": data["functionality_summary"],
        "quality": data["quality"],
        "suggestions": [e["message"] for e in data["errors"]] if data["errors"] else ["Maintain current implementation style."]
    }