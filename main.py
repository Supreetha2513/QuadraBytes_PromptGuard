"""
main.py — simplified CLI wrapper

This file now delegates processing to the central `process_via_backend`
implementation in `api.py` to avoid duplicated pipeline and LLM helper code.
"""
from api import process_via_backend

USER_ID = "demo_user_01"

print("🔥 PromptGuard CLI — delegating to backend processor (api.process_via_backend)")
print("Type your messages below. Type 'exit' or 'quit' to stop.\n")

while True:
    try:
        user_input = input("USER: ").strip()
    except (EOFError, KeyboardInterrupt):
        print("\n👋 Bye")
        break

    if not user_input:
        continue
    if user_input.lower() in {"exit", "quit", "bye"}:
        print("👋 PromptGuard shutting down.")
        break

    result = process_via_backend(user_input, USER_ID)
    # Print a concise summary
    print('\n--- Response ---')
    print(result.get('final_output', 'No response'))
    print('--- End ---\n')