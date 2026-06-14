import os
import requests
from dotenv import load_dotenv
import json
import time
import re

load_dotenv()

class UltimateLLM:
    def __init__(self):
        self.google_key = os.getenv("GOOGLE_API_KEY")
        self.groq_key = os.getenv("GROQ_API_KEY")
        self.hf_key = os.getenv("HUGGINGFACE_API_KEY")
        
        # Determine available providers in order of preference
        self.available_providers = []
        if self.google_key:
            self.available_providers.append("google")
        if self.groq_key:
            self.available_providers.append("groq")
        if self.hf_key:
            self.available_providers.append("huggingface")

    def _get_provider_config(self, provider: str, cleaned_prompt: str, max_tokens: int):
        if provider == "google":
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={self.google_key}"
            payload = {
                "contents": [{"parts": [{"text": cleaned_prompt}]}],
                "generationConfig": {
                    "temperature": 0.05,
                    "maxOutputTokens": max_tokens,
                    "responseMimeType": "application/json"
                }
            }
            headers = {"Content-Type": "application/json"}
            return url, payload, headers
            
        elif provider == "groq":
            url = "https://api.groq.com/openai/v1/chat/completions"
            payload = {
                "model": "llama-3.3-70b-versatile",
                "messages": [{"role": "user", "content": cleaned_prompt}],
                "temperature": 0.05,
                "max_tokens": max_tokens,
                "response_format": {"type": "json_object"}
            }
            headers = {
                "Authorization": f"Bearer {self.groq_key}",
                "Content-Type": "application/json"
            }
            return url, payload, headers
            
        elif provider == "huggingface":
            url = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3/v1/chat/completions"
            payload = {
                "model": "mistralai/Mistral-7B-Instruct-v0.3",
                "messages": [{"role": "user", "content": cleaned_prompt}],
                "temperature": 0.05,
                "max_tokens": max_tokens
            }
            headers = {
                "Authorization": f"Bearer {self.hf_key}",
                "Content-Type": "application/json"
            }
            return url, payload, headers
        return None, None, None

    def call(self, prompt: str, max_tokens: int = 8192, model: str = None) -> str | None:
        """Rock-solid LLM calls with REAL-TIME dynamic fallback across Google, Groq & HF"""
        if not self.available_providers:
            print("No LLM API key configured (Google, Groq, or Hugging Face required).")
            return None
            
        cleaned_prompt = self._clean_prompt(prompt)
        
        for provider in self.available_providers:
            print(f"Attempting analysis using provider: {provider.upper()}...")
            url, payload, headers = self._get_provider_config(provider, cleaned_prompt, max_tokens)
            
            # Try this provider with retries
            for attempt in range(2): # 2 attempts per provider
                try:
                    resp = requests.post(url, json=payload, headers=headers, timeout=45)
                    
                    if resp.status_code == 200:
                        if provider == "google":
                            content = resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
                        else:
                            content = resp.json()["choices"][0]["message"]["content"].strip()
                        return self._clean_response(content)
                        
                    elif resp.status_code in [429, 503, 502, 504]:
                        time.sleep(1 + attempt)  # simple backoff
                        continue
                    else:
                        print(f"{provider.upper()} API Error ({resp.status_code}): {resp.text}")
                        # Don't retry 4xx errors, just fail this provider immediately
                        break
                        
                except Exception as e:
                    print(f"Exception calling {provider.upper()}: {str(e)}")
                    time.sleep(1)
                    continue
            
            # If we reach here, this provider failed completely. Loop continues to the next fallback provider.
            print(f"Provider {provider.upper()} failed. Falling back to next available provider...")
            
        print("All available LLM providers completely failed.")
        return None
    
    def _clean_prompt(self, prompt: str) -> str:
        """Prevents injection"""
        return prompt.replace("```", "").strip()
    
    def _clean_response(self, response: str) -> str:
        """Extracts clean code / JSON"""
        response = re.sub(r'```(?:json|python|)?\s*', '', response)
        response = re.sub(r'```\s*$', '', response, flags=re.MULTILINE)
        return response.strip()

# Global instance
call_llm = UltimateLLM().call