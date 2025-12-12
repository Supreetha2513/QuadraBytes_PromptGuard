# main.py
from layer1.inversion_filter import InversionFilter
from layer2 import detect_intent
from layer3.mathematical_armor import MathematicalArmor
from layer4 import filter_output
from layer5 import enforce_playbook, update_user_score, get_user_status
from layer6 import record_transaction  # ← Layer 6 logging
import subprocess

# -------------------------
# User ID (for demo)
# -------------------------
USER_ID = "demo_user_01"  # Change per session if needed

# -------------------------
# Initialize Layers
# -------------------------
layer1 = InversionFilter()
layer3 = MathematicalArmor(max_input_length=2000)

def run_llama(system_prompt: str, user_prompt: str) -> str:
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
print("🔥 PromptGuard Kinetic Shield Active (Layer 1–6: Full Zero-Trust + Forensics)")
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

    # Transaction log to be filled during processing
    transaction_log = {
        "user_id": USER_ID,
        "raw_input": user_input,
    }

    # -------------------------
    # LAYER 5: Enforce Playbook FIRST
    # -------------------------
    block_msg = enforce_playbook(USER_ID)
    if block_msg:
        print(f"\n🛑 {block_msg}")
        status = get_user_status(USER_ID)
        print(f"   Risk Level: {status['status']} | Sinner's Score: {status['score']}")
        if status.get("banned"):
            print("   This user is permanently banned.")
        transaction_log.update({
            "was_blocked": True,
            "block_reason": block_msg
        })
        record_transaction(transaction_log)
        continue

    # -------------------------
    # LAYER 1: Inversion Pre-Filter
    # -------------------------
    l1_result = layer1.sanitize(user_input)
    sanitized_input = l1_result["sanitized_text"]
    l1_flags = l1_result["flags"]

    transaction_log.update({
        "layer1_sanitized": sanitized_input,
        "layer1_flags": l1_flags
    })

    if l1_flags:
        print(f"⚠️ LAYER 1: Suspicious patterns detected → {l1_flags}")
        update_user_score(USER_ID, "probe")
    else:
        print("✓ LAYER 1: No structural issues detected.")

    # -------------------------
    # LAYER 2: Intent-State Analyzer
    # -------------------------
    l2_result = detect_intent(sanitized_input, threshold=0.95)

    transaction_log.update({
        "layer2_score": l2_result["score"],
        "layer2_is_suspicious": l2_result["is_malicious"]
    })

    if l2_result["is_malicious"]:
        print(f"🛑 LAYER 2 BLOCKED: Malicious intent detected!")
        print(f"   Score: {l2_result['score']:.4f}")
        update_user_score(USER_ID, "breach")
        status = get_user_status(USER_ID)
        print(f"   → Sinner's Score updated: {status['score']} ({status['status']})")
        transaction_log["was_blocked"] = True
        record_transaction(transaction_log)
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
    transaction_log["severity"] = severity

    # -------------------------
    # LAYER 3: Mathematical Armoring
    # -------------------------
    armor_result = layer3.armor(sanitized_input, severity=severity)
    if not armor_result["is_armored"]:
        print(f"🛑 LAYER 3 BLOCKED: Armoring failed")
        update_user_score(USER_ID, "probe")
        transaction_log["was_blocked"] = True
        record_transaction(transaction_log)
        continue

    system_message = armor_result["system_message"]
    armored_user_message = armor_result["user_message"]
    token_used = armor_result["token"]
    print(f"✓ LAYER 3: {severity} armoring applied (token: {token_used})")

    transaction_log.update({
        "system_message": system_message,
        "user_message": armored_user_message
    })

    # -------------------------
    # Send to LLM
    # -------------------------
    print("\n🧠 Sending to LLM (armored prompt)...\n")
    raw_response = run_llama(system_message, armored_user_message)
    transaction_log["raw_output"] = raw_response

    # -------------------------
    # LAYER 4: Output Filtering
    # -------------------------
    filter_result = filter_output(raw_response)
    transaction_log["layer4_issues"] = filter_result["issues"]

    if not filter_result["safe"]:
        print("🛑 LAYER 4 BLOCKED OUTPUT:")
        for issue in filter_result["issues"]:
            print(f"   ⚠️ {issue}")
        print("   Sensitive content redacted.")
        final_output = filter_result["sanitized"][:500] + "\n\n[RESPONSE BLOCKED BY LAYER 4]"
        update_user_score(USER_ID, "breach")
        transaction_log["was_blocked"] = True
    else:
        print("✓ LAYER 4: Output verified safe.")
        final_output = raw_response
        update_user_score(USER_ID, "normal")
        transaction_log["was_blocked"] = False

    transaction_log["filtered_output"] = final_output

    # -------------------------
    # LAYER 6: Record Full Transaction
    # -------------------------
    record_transaction(transaction_log)

    # -------------------------
    # Display Final Output
    # -------------------------
    print("\nMODEL:", final_output)
    print("\n" + "-" * 60)