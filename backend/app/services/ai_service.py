import logging
import httpx
import json
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

OLLAMA_HOST = "http://ai_engine:11434"
MODEL_NAME = "llama3.2:1b"

class AIService:
    """
    Orchestrator for Internal Llama 3.2 1B (Ollama).
    Handles prompt construction, inference, and consistency validation.
    """
    
    @staticmethod
    def classify_text(content: str, valid_tags: List[str], system_prompt: str = None) -> Dict[str, Any]:
        """
        Classifies content into one of the valid_tags.
        Retries up to 3 times if output is not in valid_tags.
        """
        logger.info(f"[AI] Classifying content len={len(content)} into tags={valid_tags}")
        
        # 0. Ensure Model
        if not AIService._ensure_model_loaded(MODEL_NAME):
             return {"status": "error", "message": "Model bootstrapping failed"}

        # 1. Construct Prompt
        full_prompt = f"""
        {system_prompt or "You are a helpful assistant."}
        
        Task: Classify the following text into exactly one of these categories: {json.dumps(valid_tags)}.
        Return ONLY the category name. Do not explain.
        
        Text:
        {content}
        
        Category:
        """
        
        # 2. Inference Loop
        attempts = 0
        max_retries = 3
        
        while attempts < max_retries:
            attempts += 1
            try:
                # Real Inference
                raw_output = AIService._inference_generate(full_prompt)
                predicted_tag = raw_output.strip().replace('"', '').replace("'", "")
                
                # Fuzzy match cleanup (simple)
                for t in valid_tags:
                    if t.lower() == predicted_tag.lower():
                        predicted_tag = t
                        break

                # 3. Consistency Check
                if predicted_tag in valid_tags:
                    return {
                        "status": "success",
                        "tag": predicted_tag,
                        "confidence": 0.95, 
                        "attempts": attempts
                    }
                else:
                    logger.warning(f"[AI] Attempt {attempts}: Invalid tag '{predicted_tag}' generated.")
                    
            except Exception as e:
                logger.error(f"[AI] Inference error: {e}")
                
        # Fallback
        return {
            "status": "partial",
            "tag": "Revisão Manual" if "Revisão Manual" in valid_tags else valid_tags[0],
            "reason": "Max retries exceeded"
        }

    @staticmethod
    def _ensure_model_loaded(model_name: str) -> bool:
        """
        Checks if model exists in Ollama. If not, pulls it.
        """
        try:
            # Check existing models
            with httpx.Client(timeout=5.0) as client:
                resp = client.get(f"{OLLAMA_HOST}/api/tags")
                
            if resp.status_code == 200:
                models = resp.json().get("models", [])
                for m in models:
                    if m["name"].startswith(model_name):
                        return True
            
            # Not found, Pull it
            logger.info(f"[AI] Model {model_name} not found. Starting download (Pulling)...")
            
            # Using longer timeout for PULL
            with httpx.Client(timeout=600.0) as client:
                pull_resp = client.post(f"{OLLAMA_HOST}/api/pull", json={"name": model_name, "stream": False})
                if pull_resp.status_code == 200:
                    logger.info(f"[AI] Model {model_name} pulled successfully.")
                    return True
                else:
                    logger.error(f"[AI] Failed to pull model: {pull_resp.text}")
                    return False

        except Exception as e:
            logger.error(f"[AI] Model check/pull failed: {e}")
            # If we can't reach Ollama, we can't do anything
            return False

    @staticmethod
    def _inference_generate(prompt: str) -> str:
        """
        Calls Ollama Generate API.
        """
        url = f"{OLLAMA_HOST}/api/generate"
        payload = {
            "model": MODEL_NAME,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.1 # Low temp for deterministic classification
            }
        }
        
        with httpx.Client(timeout=60.0) as client:
            resp = client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data.get("response", "")
