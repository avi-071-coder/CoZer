import os
import requests
from dotenv import load_dotenv
import json
import time
import re

load_dotenv()

class UltimateLLM:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        self.url = "https://api.groq.com/openai/v1/chat/completions"
        self.models = ["llama3-70b-8192", "mixtral-8x7b-32768"]
    
    def call(self, prompt: str, max_tokens: int = 3000, model: str = None) -> str | None:
        """Rock-solid LLM calls"""
        if not self.api_key:
            return None
        
        model = model or self.models[0]
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": self._clean_prompt(prompt)}],
            "temperature": 0.05,  # Deterministic
            "max_tokens": max_tokens,
            "top_p": 0.9
        }
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        for attempt in range(3):
            try:
                resp = requests.post(self.url, json=payload, headers=headers, timeout=45)
                
                if resp.status_code == 200:
                    content = resp.json()["choices"][0]["message"]["content"].strip()
                    return self._clean_response(content)
                elif resp.status_code == 429:
                    time.sleep(2 ** attempt)  # Exponential backoff
                    continue
                
            except Exception as e:
                if attempt == 2:
                    print(f"LLM failed after 3 tries: {e}")
        
        return None
    
    def _clean_prompt(self, prompt: str) -> str:
        """Prevents injection"""
        return prompt.replace("```", "").strip()
    
    def _clean_response(self, response: str) -> str:
        """Extracts clean code"""
        # Remove markdown
        response = re.sub(r'```(?:python|)?\s*', '', response)
        response = re.sub(r'```\s*$', '', response, flags=re.MULTILINE)
        return response.strip()

# Global instance
call_llm = UltimateLLM().call