import csv
import json
from pathlib import Path
from typing import List, Tuple

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader, random_split

# ---------- Paths ----------
ROOT = Path(__file__).resolve().parent.parent
DATA_CSV = ROOT / "data" / "intent_dataset_balanced.csv"
MODELS_DIR = ROOT / "models"
MODEL_PT_PATH = MODELS_DIR / "intent_rnn.pt"
MODELS_DIR.mkdir(exist_ok=True)

VOCAB_PATH = MODELS_DIR / "intent_vocab.json"
ONNX_PATH = MODELS_DIR / "intent_rnn.onnx"

# ---------- Hyperparameters ----------
MAX_LEN = 64
MIN_FREQ = 2
EMBED_DIM = 64
HIDDEN_DIM = 64
NUM_LAYERS = 1
BATCH_SIZE = 64
EPOCHS = 5
LR = 1e-3
VAL_SPLIT = 0.1
SEED = 42


# ---------- Data & Vocab ----------
def load_csv(path: Path) -> List[Tuple[str, int]]:
    text_label = []
    with path.open("r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            text = (row["text"] or "").strip()
            label_str = row["label"].strip().upper()
            if not text:
                continue
            if label_str == "SAFE":
                label = 0
            elif label_str == "ATTACK":
                label = 1
            else:
                continue
            text_label.append((text, label))
    return text_label


def tokenize(text: str) -> List[str]:
    # simple whitespace + lowercase
    return text.lower().strip().split()


def build_vocab(texts: List[str], min_freq: int):
    from collections import Counter

    counter = Counter()
    for t in texts:
        counter.update(tokenize(t))

    # special tokens
    token_to_id = {
        "<pad>": 0,
        "<unk>": 1,
    }
    for tok, freq in counter.items():
        if freq >= min_freq and tok not in token_to_id:
            token_to_id[tok] = len(token_to_id)

    return token_to_id


def encode_text(text: str, token_to_id, max_len: int) -> List[int]:
    tokens = tokenize(text)
    ids = [token_to_id.get(t, token_to_id["<unk>"]) for t in tokens]
    if len(ids) > max_len:
        ids = ids[:max_len]
    else:
        ids = ids + [token_to_id["<pad>"]] * (max_len - len(ids))
    return ids


class IntentDataset(Dataset):
    def __init__(self, data, token_to_id, max_len: int):
        self.data = data
        self.token_to_id = token_to_id
        self.max_len = max_len

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        text, label = self.data[idx]
        ids = encode_text(text, self.token_to_id, self.max_len)
        return torch.tensor(ids, dtype=torch.long), torch.tensor(label, dtype=torch.long)


# ---------- Model ----------
class IntentRNN(nn.Module):
    def __init__(self, vocab_size, embed_dim, hidden_dim, num_layers, num_classes=2):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.lstm = nn.LSTM(embed_dim, hidden_dim, num_layers=num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_dim, num_classes)

    def forward(self, x):
        emb = self.embedding(x)              # [B, T, E]
        out, (h_n, c_n) = self.lstm(emb)     # h_n: [L, B, H]
        h_last = h_n[-1]                     # [B, H]
        logits = self.fc(h_last)             # [B, C]
        return logits


def main():
    torch.manual_seed(SEED)

    # 1) Load data
    pairs = load_csv(DATA_CSV)
    print(f"Loaded {len(pairs)} samples from {DATA_CSV}")

    texts = [t for t, _ in pairs]

    # 2) Build vocab
    token_to_id = build_vocab(texts, MIN_FREQ)
    vocab_size = len(token_to_id)
    print(f"Vocab size: {vocab_size}")

    # save vocab
    with VOCAB_PATH.open("w", encoding="utf-8") as f:
        json.dump({"token_to_id": token_to_id, "max_len": MAX_LEN}, f, ensure_ascii=False, indent=2)
    print(f"Saved vocab to {VOCAB_PATH}")

    # 3) Dataset + split
    dataset = IntentDataset(pairs, token_to_id, MAX_LEN)
    val_size = int(len(dataset) * VAL_SPLIT)
    train_size = len(dataset) - val_size
    train_ds, val_ds = random_split(dataset, [train_size, val_size])

    train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=BATCH_SIZE)

    # 4) Model / loss / optimizer
    device = torch.device("cpu")
    model = IntentRNN(vocab_size, EMBED_DIM, HIDDEN_DIM, NUM_LAYERS, num_classes=2).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=LR)

    # 5) Training loop
    for epoch in range(1, EPOCHS + 1):
        model.train()
        total_loss = 0.0
        correct = 0
        total = 0
        for x, y in train_loader:
            x = x.to(device)
            y = y.to(device)

            optimizer.zero_grad()
            logits = model(x)
            loss = criterion(logits, y)
            loss.backward()
            optimizer.step()

            total_loss += loss.item() * x.size(0)
            preds = logits.argmax(dim=1)
            correct += (preds == y).sum().item()
            total += x.size(0)

        train_loss = total_loss / total
        train_acc = correct / total

        # validation
        model.eval()
        v_loss = 0.0
        v_correct = 0
        v_total = 0
        with torch.no_grad():
            for x, y in val_loader:
                x = x.to(device)
                y = y.to(device)
                logits = model(x)
                loss = criterion(logits, y)
                v_loss += loss.item() * x.size(0)
                preds = logits.argmax(dim=1)
                v_correct += (preds == y).sum().item()
                v_total += x.size(0)
        val_loss = v_loss / v_total
        val_acc = v_correct / v_total

        print(
            f"Epoch {epoch}/{EPOCHS} "
            f"- train_loss={train_loss:.4f}, train_acc={train_acc:.3f} "
            f"- val_loss={val_loss:.4f}, val_acc={val_acc:.3f}"
        )

    # 6) Export to ONNX
    model.eval()
    dummy = torch.randint(0, vocab_size, (1, MAX_LEN), dtype=torch.long).to(device)
    torch.save(
        {
            "model_state_dict": model.state_dict(),
            "token_to_id": token_to_id,
            "max_len": MAX_LEN,
        },
        MODEL_PT_PATH,
    )
print(f"Saved PyTorch model to {MODEL_PT_PATH}")
print(f"Exported ONNX model to {ONNX_PATH}")


if __name__ == "__main__":
    main()
