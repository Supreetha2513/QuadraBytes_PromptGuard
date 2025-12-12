# main.py
from layer1.inversion_filter import InversionFilter
from layer2 import detect_intent  # ONNX DeBERTa-v3 Layer 2
from layer3.mathematical_armor import MathematicalArmor
from layer4 import filter_output    # Modular Layer 4
import subprocess

# -------------------------
# Initialize Layers
# -------------------------
layer1 = InversionFilter()
layer3 = MathematicalArmor(max_input_length=2000)

# Layer 2 & 4 are functions (singletons), no init needed


def run_llama(system_prompt: str, user_prompt: str) -> str:
    """
    Sends prompt to local Llama via Ollama (runs in WSL).
    """
    cmd = ["ollama", "run", "llama3.2:1b"]
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
        print(f"⚠️ Ollama exited with code {result.returncode}.")
        if result.stderr:
            print("--- Ollama stderr ---")
            print(result.stderr)
            print("--- end stderr ---")
        return "Error: LLM failed to respond."

    return result.stdout.strip()


# -------------------------
# Startup Message
# -------------------------
print("🔥 PromptGuard Kinetic Shield Active (Layer 1 + ONNX Layer 2 + Layer 3 + Layer 4)")
print("Type your messages below. Type 'exit' or 'quit' to stop.\n")

# -------------------------
# Main Interactive Loop
# -------------------------
while True:
    print("\n" + "-" * 60)
    user_input = input("\nUSER: ").strip()
    
    if user_input.lower() in {"exit", "quit", "bye"}:
        print("👋 PromptGuard shutting down.")
        break
    
    if not user_input:
        continue

    # -------------------------
    # LAYER 1: Inversion Pre-Filter (Structural Sanitization)
    # -------------------------
    l1_result = layer1.sanitize(user_input)
    sanitized_input = l1_result["sanitized_text"]
    l1_flags = l1_result["flags"]

    if l1_flags:
        print(f"⚠️ LAYER 1: Suspicious patterns detected → {l1_flags}")
        if sanitized_input != user_input:
            print(f"   Sanitized: {sanitized_input!r}")
    else:
        print("✓ LAYER 1: No structural issues detected.")

    # -------------------------
    # LAYER 2: Intent-State Analyzer (ONNX DeBERTa-v3)
    # -------------------------
    l2_result = detect_intent(sanitized_input, threshold=0.55)

    if l2_result["is_malicious"]:
        print(f"🛑 LAYER 2 BLOCKED: Malicious intent detected!")
        print(f"   Confidence score: {l2_result['score']:.4f} | Label: {l2_result['label']}")
        continue
    else:
        print(f"✓ LAYER 2: Safe intent (score: {l2_result['score']:.4f})")

    # -------------------------
    # Determine Severity for Layer 3
    # -------------------------
    severity = "SAFE"
    if l2_result["score"] > 0.8:
        severity = "ATTACK"
    elif l2_result["score"] > 0.5 or l1_flags:
        severity = "SUSPICIOUS"

    print(f"→ Risk Level: {severity}")

    # -------------------------
    # LAYER 3: Mathematical Armoring
    # -------------------------
    armor_result = layer3.armor(sanitized_input, severity=severity)

    if not armor_result["is_armored"]:
        print(f"🛑 LAYER 3 BLOCKED: {armor_result.get('error', 'Armoring failed')}")
        continue

    system_message = armor_result["system_message"]
    armored_user_message = armor_result["user_message"]
    token_used = armor_result["token"]

    print(f"✓ LAYER 3: {severity} armoring applied (defensive token: {token_used})")

    # -------------------------
    # Send to Ollama LLM (ONE TIME ONLY)
    # -------------------------
    print("\n🧠 Sending to LLM (armored prompt)...\n")
    raw_response = run_llama(system_message, armored_user_message)

    # -------------------------
    # LAYER 4: Output Filtering (Egress Security)
    # -------------------------
    filter_result = filter_output(raw_response)

    if not filter_result["safe"]:
        print("🛑 LAYER 4 BLOCKED OUTPUT:")
        for issue in filter_result["issues"]:
            print(f"   ⚠️ {issue}")
        print("   Sensitive content redacted or blocked.")
        final_output = filter_result["sanitized"][:500] + "\n\n[RESPONSE BLOCKED BY LAYER 4]"
    else:
        print("✓ LAYER 4: Output verified safe.")
        final_output = raw_response

    print("\nMODEL:", final_output)
    print("\n" + "-" * 60)