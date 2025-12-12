from layer1.inversion_filter import InversionFilter
from layer2.intent_detector import IntentDetector
from layer3.mathematical_armor import MathematicalArmor
import subprocess

# -------------------------
# Initialize Layers
# -------------------------
layer1 = InversionFilter()
layer2 = IntentDetector(threshold=0.6)  # You can tune this later
layer3 = MathematicalArmor(max_input_length=2000)  # Prevents context window attacks


def run_llama(system_prompt: str, user_prompt: str) -> str:
    """
    Sends prompt to local Llama running via Ollama.
    Now accepts dual prompts from Layer 3 (system + user).
    """
    # Run Ollama inside WSL unconditionally (you said Ollama runs in WSL).
    # Use UTF-8 decoding and replace invalid characters to avoid UnicodeDecodeError.
    cmd = ["ollama", "run", "llama3.2:1b"]
    
    # Construct the full prompt: system mandate + user input
    full_prompt = f"{system_prompt}\n\nUser: {user_prompt}"
    cmd.append(full_prompt)
    
    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace"
    )

    if result.returncode != 0:
        print(f"⚠️ Ollama (WSL) exited with code {result.returncode}.")
        if result.stderr:
            print("--- Ollama stderr ---")
            print(result.stderr)
            print("--- end stderr ---")
        return result.stdout

    return result.stdout


print("🔥 PromptGuard Layer 1 + Layer 2 Active – Type messages below")

# -------------------------
# Main Loop
# -------------------------
while True:
    print("\n" + "-" * 60)
    user_input = input("\nUSER: ")

    # -------------------------
    # LAYER 1: Structural Jailbreak Detection
    # -------------------------
    l1_result = layer1.sanitize(user_input)
    sanitized_input = l1_result["sanitized_text"]
    l1_flags = l1_result["flags"]

    if l1_flags:
        print(f"⚠️ LAYER 1: Suspicious patterns detected -> {l1_flags}")
        if sanitized_input != user_input:
            print(f"   Sanitized input: {sanitized_input!r}")
    else:
        print("✓ LAYER 1: No structural issues detected.")
    # -------------------------
    # LAYER 2: Intent-State Analyzer (RNN)
    # -------------------------
    intent = layer2.score(sanitized_input)
    if intent["is_suspicious"]:
        print(f"🛑 LAYER 2 BLOCKED: Suspicious intent (score={intent['max_similarity']:.2f})")
        continue
    print("✓ LAYER 2: SAFE")


    # -------------------------
    # LAYER 3: Mathematical Armoring (Context Isolation)
    # -------------------------
    severity = "SAFE"
    if l1_flags:  # Layer 1 saw something suspicious
        severity = "SUSPICIOUS"
    # Note: Layer 2 embedding doesn't give rich labels yet, so no ATTACK here

    # LAYER 3: Severity-aware Mathematical Armoring
    severity = "SAFE"
    if l1_flags:  # Layer 1 detected structural issues
        severity = "SUSPICIOUS"

    armor_result = layer3.armor(sanitized_input, severity=severity)

    if not armor_result["is_armored"]:
        print(f"🛑 LAYER 3 BLOCKED: {armor_result.get('error', 'Unknown error')}")
        continue

    system_message = armor_result["system_message"]
    armored_user_message = armor_result["user_message"]
    token_used = armor_result["token"]

    print(f"✓ Layer 3 {severity} armoring applied (token: {token_used})")


    # -------------------------
    # Send to LLM with Armored Prompt
    # -------------------------
    response = run_llama(system_message, armored_user_message)
    print("\nMODEL:", response)