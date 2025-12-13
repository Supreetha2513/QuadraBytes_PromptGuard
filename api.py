# api.py - Flask Frontend Gateway
# ONLY routes HTTP requests and delegates ALL layer processing to backend
import os
import json
import logging
import subprocess
from datetime import datetime
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

# ========================
# IMPORTS FROM BACKEND LAYERS
# ========================
# Assuming your folder structure has __init__.py files in layer directories
# or they are simple python files.
try:
    from layer1.inversion_filter import InversionFilter
    from layer2 import detect_intent # Assuming detect_intent is exposed in layer2/__init__.py
    from layer3.mathematical_armor import MathematicalArmor
    from layer4 import filter_output # Assuming filter_output is exposed in layer4/__init__.py
    from layer5 import enforce_playbook, update_user_score, get_user_status # Assuming these are exposed
    from layer6 import record_transaction # Assuming this is exposed
except ImportError as e:
    print(f"CRITICAL IMPORT ERROR: {e}")
    print("Ensure all layer folders have __init__.py files or direct file imports.")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Store conversation history in memory
conversation_history = []
recent_conversations = []

# ========================
# HELPER FUNCTIONS
# ========================

def run_llama(system_prompt: str, user_prompt: str) -> str:
    """Call Ollama LLM"""
    cmd = ["ollama", "run", "llama3.2:1b"]
    full_prompt = f"{system_prompt}\n\nUser: {user_prompt}"
    
    # Pass the prompt as a single argument after the model name
    # Note: Depending on OS, prompts with newlines might need careful handling
    # Often it is safer to pipe into stdin for complex prompts
    
    try:
        # Using input=full_prompt to pass via stdin is safer for large/complex strings
        result = subprocess.run(
            cmd,
            input=full_prompt,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=60
        )

        if result.returncode != 0:
            logger.warning(f"Ollama stderr: {result.stderr}")
            return "Error: LLM failed to respond."

        return result.stdout.strip()
    except subprocess.TimeoutExpired:
        logger.error("Ollama call timed out")
        return "Error: LLM response timeout."
    except Exception as e:
        logger.error(f"Error calling Ollama: {str(e)}")
        return f"Error: {str(e)}"

def process_via_backend(user_message: str, user_id: str) -> dict:
    """
    Orchestrates the 6-layer defense pipeline
    """
    logs = []
    
    # Track layer results for frontend
    layers = {
        'layer1': {'passed': False, 'message': '', 'details': {}},
        'layer2': {'passed': False, 'message': '', 'details': {}},
        'layer3': {'passed': False, 'message': '', 'details': {}},
        'layer4': {'passed': False, 'message': '', 'details': {}},
        'layer5': {'passed': False, 'message': '', 'details': {}},
        'layer6': {'passed': False, 'message': '', 'details': {}}
    }
    
    def log_msg(level, message):
        """Helper to add logs for frontend display"""
        timestamp = datetime.now().strftime('%H:%M:%S.%f')[:-3]
        logs.append({
            'timestamp': timestamp,
            'level': level,
            'message': message
        })
        # Intentionally do NOT immediately emit to the global logger.
        # We buffer log entries so we can present a clean, ordered
        # Layer 1→6 summary in the terminal at the end of processing.
        return
    
    # Initialize State-full Layers
    layer1 = InversionFilter()
    layer3 = MathematicalArmor(max_input_length=2000)
    
    log_msg('SYSTEM', '=== PROCESSING STARTED ===')
    
    transaction_log = {
        "user_id": user_id,
        "raw_input": user_message,
        "timestamp": datetime.now().isoformat()
    }
    
    # --- LAYER 5: Enforce Playbook FIRST ---
    log_msg('PROCESS', 'Layer 5: Checking user playbook...')
    try:
        block_msg = enforce_playbook(user_id)
        if block_msg:
            log_msg('DANGER', f'Layer 5 BLOCKED: {block_msg}')
            status = get_user_status(user_id)
            log_msg('WARNING', f'User Status: {status["status"]} | Score: {status["score"]}')
            transaction_log["was_blocked"] = True
            record_transaction(transaction_log)
            layers['layer5']['passed'] = False
            layers['layer5']['message'] = block_msg
            return {'final_output': block_msg, 'was_blocked': True, 'severity': 'BLOCKED', 'logs': logs, 'layers': layers}
    except Exception as e:
        log_msg('ERROR', f'Layer 5 check failed: {str(e)}')

    log_msg('SUCCESS', 'Layer 5: Playbook check passed')
    layers['layer5']['passed'] = True
    layers['layer5']['message'] = 'Playbook check passed'
    
    # --- LAYER 1: Inversion Pre-Filter ---
    log_msg('PROCESS', 'Layer 1: Analyzing input structure...')
    l1_result = layer1.sanitize(user_message)
    sanitized_input = l1_result["sanitized_text"]
    l1_flags = l1_result["flags"]
    
    if l1_flags:
        log_msg('WARNING', f'Layer 1: Suspicious patterns detected → {l1_flags}')
        update_user_score(user_id, "probe")
        layers['layer1']['passed'] = True
        layers['layer1']['message'] = f'Suspicious patterns detected: {l1_flags}'
        layers['layer1']['details'] = {'flags': l1_flags}
    else:
        log_msg('SUCCESS', 'Layer 1: No structural issues detected')
        layers['layer1']['passed'] = True
        layers['layer1']['message'] = 'No structural issues detected'
    
    # --- LAYER 2: Intent-State Analyzer ---
    log_msg('PROCESS', 'Layer 2: Analyzing intent...')
    # Assuming detect_intent returns a dict with 'score' and 'is_malicious'
    l2_result = detect_intent(sanitized_input, threshold=0.95)
    
    if l2_result.get("is_malicious"):
        log_msg('DANGER', f'Layer 2 BLOCKED: Malicious intent detected! Score: {l2_result["score"]:.4f}')
        update_user_score(user_id, "breach")
        transaction_log["was_blocked"] = True
        record_transaction(transaction_log)
        layers['layer2']['passed'] = False
        layers['layer2']['message'] = f'Malicious intent detected (Score: {l2_result["score"]:.4f})'
        layers['layer2']['details'] = {'score': l2_result["score"]}
        return {'final_output': 'Request blocked: Malicious intent detected', 'was_blocked': True, 'severity': 'BLOCKED', 'logs': logs, 'layers': layers}
    
    log_msg('SUCCESS', f'Layer 2: Safe intent detected (Score: {l2_result["score"]:.4f})')
    layers['layer2']['passed'] = True
    layers['layer2']['message'] = f'Safe intent detected (Score: {l2_result["score"]:.4f})'
    layers['layer2']['details'] = {'score': l2_result["score"]}
    
    # Determine Severity
    severity = "SAFE"
    if l2_result["score"] > 0.8: severity = "ATTACK"
    elif l2_result["score"] > 0.5 or l1_flags: severity = "SUSPICIOUS"
    
    # --- LAYER 3: Mathematical Armor ---
    log_msg('PROCESS', f'Layer 3: Applying {severity} armoring...')
    armor_result = layer3.armor(sanitized_input, severity=severity)
    
    if not armor_result["is_armored"]:
        log_msg('DANGER', 'Layer 3 BLOCKED: Armoring failed')
        layers['layer3']['passed'] = False
        layers['layer3']['message'] = 'Armoring failed'
        return {'final_output': 'Request blocked: Armoring failed', 'was_blocked': True, 'severity': 'BLOCKED', 'logs': logs, 'layers': layers}
    
    system_message = armor_result["system_message"]
    armored_user_message = armor_result["user_message"]
    log_msg('SUCCESS', f'Layer 3: {severity} armoring applied')
    layers['layer3']['passed'] = True
    layers['layer3']['message'] = f'{severity} armoring applied'
    layers['layer3']['details'] = {'severity': severity, 'token': armor_result.get('token', 'N/A')}
    
    # --- LLM INFERENCE ---
    log_msg('INFO', 'Sending to LLM...')
    raw_response = run_llama(system_message, armored_user_message)
    log_msg('SUCCESS', 'LLM response received')
    
    # --- LAYER 4: Output Filtering ---
    log_msg('PROCESS', 'Layer 4: Filtering output...')
    filter_result = filter_output(raw_response)
    
    final_output = raw_response
    was_blocked = False
    
    if not filter_result["safe"]:
        log_msg('WARNING', f'Layer 4: Content issues detected → {filter_result["issues"]}')
        final_output = "I cannot fulfill that request due to safety policies." # Sanitized Output
        update_user_score(user_id, "breach")
        was_blocked = True
        layers['layer4']['passed'] = False
        layers['layer4']['message'] = f'Content issues detected: {filter_result["issues"]}'
        layers['layer4']['details'] = {'issues': filter_result["issues"]}
    else:
        log_msg('SUCCESS', 'Layer 4: Output verified safe')
        update_user_score(user_id, "normal")
        layers['layer4']['passed'] = True
        layers['layer4']['message'] = 'Output verified safe'

    # --- LAYER 6: Record Transaction ---
    transaction_log.update({
        "final_output": final_output,
        "was_blocked": was_blocked,
        "severity": severity
    })
    record_transaction(transaction_log)
    layers['layer6']['passed'] = True
    layers['layer6']['message'] = 'Transaction recorded'
    
    log_msg('SUCCESS', '=== PROCESSING COMPLETE ===')
    # Print an ordered summary to the terminal (Layer 1 → Layer 6)
    ordered_keys = ['layer1', 'layer2', 'layer3', 'layer4', 'layer5', 'layer6']
    logger.info('Layer summary (display order: 1 → 6)')
    for idx, k in enumerate(ordered_keys, start=1):
        layer_info = layers.get(k, {})
        status_text = 'PASSED' if layer_info.get('passed') else 'FAILED/NA'
        message = layer_info.get('message', '')
        summary_msg = f'Layer {idx} ({k}): {status_text}' + (f' - {message}' if message else '')
        logger.info(summary_msg)

    return {
        'final_output': final_output,
        'was_blocked': was_blocked,
        'severity': severity,
        'logs': logs,
        'layers': layers
    }

# ========================
# FRONTEND ROUTES
# ========================

@app.route('/')
def serve_index():
    return send_file('frontend/index.html')

@app.route('/chat.html')
def serve_chat():
    return send_file('frontend/chat.html')

@app.route('/<path:filename>')
def serve_static(filename):
    filepath = os.path.join('frontend', filename)
    if os.path.isfile(filepath):
        return send_file(filepath)
    # Check if it's in a subdirectory like frontend/css/style.css
    return jsonify({'error': f'File not found: {filename}'}), 404

# ========================
# API ENDPOINTS
# ========================

@app.route('/api/process', methods=['POST'])
def process_endpoint():
    try:
        data = request.get_json()
        user_message = data.get('message', '').strip()
        user_id = data.get('user_id', 'demo_user_01')
        
        if not user_message:
            return jsonify({'success': False, 'error': 'Empty message'}), 400
        
        result = process_via_backend(user_message, user_id)
        
        # Update history
        conversation_entry = {
            'preview': user_message[:50],
            'timestamp': datetime.now().isoformat(),
            'user_id': user_id
        }
        recent_conversations.insert(0, conversation_entry)
        if len(recent_conversations) > 5: recent_conversations.pop()
        
        return jsonify({
            'success': not result.get('was_blocked', False),
            'message': result.get('final_output', 'Error generating response'),
            'severity': result.get('severity', 'UNKNOWN'),
            'logs': result.get('logs', []),
            'layers': result.get('layers', {})
        })
    
    except Exception as e:
        logger.error(f"Endpoint Error: {str(e)}", exc_info=True)
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/conversations', methods=['GET'])
def get_conversations():
    return jsonify({'success': True, 'conversations': recent_conversations})

@app.route('/api/status', methods=['GET'])
def get_server_status():
    return jsonify({
        'success': True,
        'status': 'Server is running',
        'layers': 'Active'
    })

if __name__ == '__main__':
    logger.info("🔥 PromptGuard API Gateway Starting...")
    # Ensure frontend folder exists
    if not os.path.exists('frontend'):
        logger.warning("Warning: 'frontend' folder not found. Static files may fail.")
        
    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)