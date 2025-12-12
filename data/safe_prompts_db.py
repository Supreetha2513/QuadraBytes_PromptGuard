import sqlite3
import csv
from pathlib import Path

DB_PATH = Path(__file__).parent / "safe_prompts.db"

def init_db():
    """Create safe prompts database with categories."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS safe_prompts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            text TEXT NOT NULL,
            category TEXT NOT NULL,
            source TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_category ON safe_prompts(category)
    """)
    
    conn.commit()
    conn.close()
    print(f"✅ Database initialized: {DB_PATH}")

def add_safe_prompts():
    """Add curated safe prompts for common benign patterns."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    safe_prompts = [
        # Educational / role-play (what was blocking)
        ("Act as a senior cyber security specialist and comment about honeytrap project and its futuristic goals", "cybersecurity", "manual"),
        ("Act as a good teacher and evaluate the answers i provide", "education", "manual"),
        ("Act as a tutor and explain Python decorators step by step", "education", "manual"),
        ("Act as my mentor and review this code snippet", "mentoring", "manual"),
        ("Pretend you're a history professor and explain World War II causes", "education", "manual"),
        
        # Technical / development
        ("Help me debug this FastAPI endpoint", "development", "manual"),
        ("Write a Docker Compose file for PostgreSQL + Redis", "devops", "manual"),
        ("Explain how Pinecone vector embeddings work", "ml", "manual"),
        ("Show me a reinforcement learning Q-learning example", "rl", "manual"),
        
        # Your personal interests (from user-info)
        ("How can I optimize my HoneyTrap Android app for threat detection", "cybersecurity", "personal"),
        ("Review my TruMuse AI music recommendation embeddings code", "ai", "personal"),
        ("Help me implement ARC-AGI game AI agent", "ai", "personal"),
        
        # Generic safe
        ("Explain HTTP/2 vs HTTP/3 differences", "technical", "manual"),
        ("Write a unit test for this function", "testing", "manual"),
        ("Compare PyTorch vs TensorFlow for vision transformers", "ml", "manual"),
    ]
    
    cursor.executemany(
        "INSERT OR IGNORE INTO safe_prompts (text, category, source) VALUES (?, ?, ?)",
        safe_prompts
    )
    
    conn.commit()
    conn.close()
    print("✅ Added safe prompts to database")

def export_to_csv_for_training():
    """Export safe prompts + existing ATTACK dataset for retraining."""
    conn = sqlite3.connect(DB_PATH)
    
    # Get safe prompts
    cursor = conn.cursor()
    cursor.execute("SELECT text, 'SAFE' as label FROM safe_prompts")
    safe_rows = cursor.fetchall()
    
    conn.close()
    
    # Append to your existing ATTACK-heavy dataset
    csv_path = Path(__file__).parent / "intent_dataset_balanced.csv"
    
    with open(csv_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["text", "label"])
        
        # Safe prompts first
        for text, label in safe_rows:
            writer.writerow([text, label])
        
        # Append ~1000 ATTACK samples from original dataset (to keep balance)
        with open(Path(__file__).parent / "intent_dataset.csv", "r") as orig:
            reader = csv.DictReader(orig)
            attack_count = 0
            for row in reader:
                if row["label"] == "ATTACK" and attack_count < 1000:
                    writer.writerow([row["text"], row["label"]])
                    attack_count += 1
    
    print(f"✅ Exported balanced dataset: {csv_path} ({len(safe_rows)} SAFE + 1000 ATTACK)")

if __name__ == "__main__":
    init_db()
    add_safe_prompts()
    export_to_csv_for_training()
