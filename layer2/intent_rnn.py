import json
from pathlib import Path
from typing import Dict, List

import torch
import torch.nn as nn
import numpy as np


ROOT = Path(__file__).resolve().parent.parent
MODELS_DIR = ROOT / "models"
MODEL_PT_PATH = MODELS_DIR / "intent_rnn.pt"
VOCAB_PATH = MODELS_DIR / "intent_vocab.json"


class IntentRNNModel(nn.Module):
    def __init__(self, vocab_size: int, embed_dim: int = 64, hidden_dim: int = 64,
                 num_layers: int = 1, num_classes: int = 2):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.lstm = nn.LSTM(embed_dim, hidden_dim, num_layers=num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_dim, num_classes)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        emb = self.embedding(x)          # [B, T, E]
        out, (h_n, c_n) = self.lstm(emb) # h_n: [L, B, H]
        h_last = h_n[-1]                 # [B, H]
        logits = self.fc(h_last)         # [B, C]
        return logits


class IntentRNNClassifier:
    """
    Layer 2: Intent-State Analyzer (RNN).

    Binary for now:
      0 -> SAFE
      1 -> ATTACK
    """

    def __init__(self):
        with VOCAB_PATH.open("r", encoding="utf-8") as f:
            vocab_data = json.load(f)

        self.token_to_id: Dict[str, int] = vocab_data["token_to_id"]
        self.max_len: int = vocab_data["max_len"]
        self.device = torch.device("cpu")

        vocab_size = len(self.token_to_id)
        self.model = IntentRNNModel(vocab_size=vocab_size).to(self.device)

        ckpt = torch.load(MODEL_PT_PATH, map_location=self.device)
        self.model.load_state_dict(ckpt["model_state_dict"])
        self.model.eval()

    def _tokenize(self, text: str) -> List[str]:
        return text.lower().strip().split()

    def _encode(self, text: str) -> torch.Tensor:
        tokens = self._tokenize(text)
        unk_id = self.token_to_id.get("<unk>", 1)
        pad_id = self.token_to_id.get("<pad>", 0)

        ids = [self.token_to_id.get(t, unk_id) for t in tokens]
        if len(ids) > self.max_len:
            ids = ids[:self.max_len]
        else:
            ids = ids + [pad_id] * (self.max_len - len(ids))

        arr = np.array([ids], dtype=np.int64)  # [1, T]
        return torch.tensor(arr, dtype=torch.long, device=self.device)

    def classify(self, text: str) -> Dict:
        if not text.strip():
            return {"label": "SAFE", "confidence": 0.0}

        x = self._encode(text)
        with torch.no_grad():
            logits = self.model(x)  # [1, 2]

        logits = logits[0].cpu().numpy()
        exps = np.exp(logits - np.max(logits))
        probs = exps / exps.sum()
        idx = int(np.argmax(probs))
        label = "SAFE" if idx == 0 else "ATTACK"
        confidence = float(probs[idx])

        return {
            "label": label,
            "confidence": confidence,
        }
