import json
import csv
from pathlib import Path

DATA_DIR = Path(__file__).parent
INPUT_JSONL = DATA_DIR / "fine_tuning_dataset_prepared_train.jsonl"
OUTPUT_CSV = DATA_DIR / "intent_dataset.csv"

def main():
    if not INPUT_JSONL.exists():
        raise FileNotFoundError(f"Missing {INPUT_JSONL}")

    rows = []
    with INPUT_JSONL.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            obj = json.loads(line)
            prompt = obj.get("prompt", "")
            completion = obj.get("completion", "").strip()

            # Strip the formatting around the prompt if needed
            # e.g. "\"How do I reset my account password?\"\n\n###\n\n"
            text = prompt.strip()
            # Remove wrapping quotes if present
            if text.startswith('"') and text.endswith('"'):
                text = text[1:-1]

            if not text:
                continue

            if completion == "benign":
                label = "SAFE"
            elif completion == "jailbreakable":
                label = "ATTACK"
            else:
                # Skip unknown labels just in case
                continue

            rows.append({"text": text, "label": label})

    print(f"Collected {len(rows)} samples. Writing to {OUTPUT_CSV} ...")

    with OUTPUT_CSV.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["text", "label"])
        writer.writeheader()
        for r in rows:
            writer.writerow(r)

    print("Done.")

if __name__ == "__main__":
    main()
