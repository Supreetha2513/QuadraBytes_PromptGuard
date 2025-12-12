# layer2/intent_detector.py
import os
from optimum.onnxruntime import ORTModelForSequenceClassification
from transformers import AutoTokenizer
from typing import Dict, Any
import logging
import numpy as np

# Prevent tokenizer parallelism warnings/deadlocks
os.environ["TOKENIZERS_PARALLELISM"] = "false"

class IntentStateAnalyzer:
    """
    Layer 2: Semantic Intent Analyzer using ProtectAI's quantized ONNX DeBERTa-v3
    No training, no hardcoded rules — pure model inference.
    """
    MODEL_NAME = "ProtectAI/deberta-v3-base-prompt-injection-v2"  # Best accuracy
    # For faster/smaller model, use: "ProtectAI/deberta-v3-small-prompt-injection-v2"
    ONNX_SUBFOLDER = "onnx"
    CACHE_DIR = "./models/onnx_cache"  # Keeps downloads inside your project

    def __init__(self):
        logging.info("Loading Layer 2: ONNX DeBERTa-v3 prompt injection detector...")
        
        self.tokenizer = AutoTokenizer.from_pretrained(
            self.MODEL_NAME,
            subfolder=self.ONNX_SUBFOLDER,
            cache_dir=self.CACHE_DIR,
            use_fast=True
        )

        self.model = ORTModelForSequenceClassification.from_pretrained(
            self.MODEL_NAME,
            subfolder=self.ONNX_SUBFOLDER,
            cache_dir=self.CACHE_DIR,
            provider="CPUExecutionProvider"  # Optimized for CPU (very fast with INT8)
        )

        self.session = self.model.model  # Raw ONNX session
        logging.info("Layer 2 ONNX model loaded successfully")

    def analyze(self, prompt: str, threshold: float = 0.7) -> Dict[str, Any]:
        """
        Analyze prompt for malicious intent.
        Recommended thresholds:
            0.6 → balanced
            0.7 → strict but reasonable (good for demo)
            0.8+ → very strict
        """
        inputs = self.tokenizer(
            prompt,
            truncation=True,
            max_length=512,
            padding="max_length",
            return_tensors="np"  # numpy arrays for ONNX
        )

        ort_inputs = {
            "input_ids": inputs["input_ids"],
            "attention_mask": inputs["attention_mask"]
        }

        # Run inference
        ort_outputs = self.session.run(None, ort_inputs)
        logits = ort_outputs[0]

        # Softmax to get probabilities
        exp_logits = np.exp(logits - np.max(logits, axis=1, keepdims=True))
        probs = exp_logits / np.sum(exp_logits, axis=1, keepdims=True)
        malicious_score = float(probs[0][1])  # Index 1 = malicious/injection class

        is_malicious = malicious_score > threshold

        return {
            "is_malicious": bool(is_malicious),
            "score": float(malicious_score),
            "threshold": threshold,
            "label": "injection-detected" if is_malicious else "benign"
        }


# Global singleton — loads once at import time
analyzer = IntentStateAnalyzer()


# Convenience function for other parts of the code
def detect_intent(prompt: str, threshold: float = 0.7) -> Dict[str, Any]:
    """
    Main function to call from main.py or other layers
    """
    return analyzer.analyze(prompt, threshold)