from layer1.inversion_filter import InversionFilter
from layer2.intent_detector import IntentDetector
import subprocess

# -------------------------
# Initialize Layers
# -------------------------
layer1 = InversionFilter()
layer2 = IntentDetector(threshold=0.55)  # You can tune this later


def run_llama(prompt: str) -> str:
    """
    Sends prompt to local Llama running via Ollama.
    """
    result = subprocess.run(
        ["ollama", "run", "llama3", prompt],
        capture_output=True,
        text=True
    )
    return result.stdout


print("🔥 PromptGuard Layer 1 + Layer 2 Active – Type messages below")

# -------------------------
# Main Loop
# -------------------------
while True:
    user_input = input("\nUSER: ")

    # -------------------------
    # LAYER 1: Structural Jailbreak Detection
    # -------------------------
    if layer1.check(user_input):
        print("🛑 LAYER 1 BLOCKED: Structural jailbreak attempt detected!")
        continue

    # -------------------------
    # LAYER 2: Semantic Intent / Persona Shift Detection
    # -------------------------
    intent = layer2.score(user_input)

    if intent["is_suspicious"]:
        print(
            f"🛑 LAYER 2 BLOCKED: Suspicious intent detected "
            f"(semantic similarity score = {intent['max_similarity']:.2f})"
        )
        continue

    # -------------------------
    # SAFE → Send to Llama
    # -------------------------
    response = run_llama(user_input)
    print("\nMODEL:", response)