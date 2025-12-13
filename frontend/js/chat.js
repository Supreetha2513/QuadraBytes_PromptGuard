// Chat Page Functionality
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements (safe-getters)
    const messageInput = document.getElementById('messageInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const chatMessages = document.getElementById('chatMessages');
    const securityLogs = document.getElementById('securityLogs');
    const newChatBtn = document.getElementById('newChatBtn');
    const backToModelsBtn = document.getElementById('backToModelsBtn');
    const attachImageBtn = document.getElementById('attachImageBtn');
    const uploadImageBtn = document.getElementById('uploadImageBtn');
    const removeImageBtn = document.getElementById('removeImageBtn');
    const imageInput = document.getElementById('imageInput');
    const uploadPreview = document.getElementById('uploadPreview');
    const imageUploadContainer = document.getElementById('imageUploadContainer');
    const clearLogsBtn = document.getElementById('clearLogsBtn');
    const pauseLogsBtn = document.getElementById('pauseLogsBtn');
    const modelTypeBadge = document.getElementById('modelTypeBadge');
    const checkAnalysisBtn = document.getElementById('checkAnalysisBtn');

    // Phase elements (may not exist in current markup)
    const phase1 = document.getElementById('phase1');
    const phase2 = document.getElementById('phase2');
    const phase3 = document.getElementById('phase3');

    // Sidebar toggle elements
    const chatSidebar = document.getElementById('chatSidebar');
    const chatSidebarToggle = document.getElementById('chatSidebarToggle');
    const chatHamburger = document.getElementById('chatHamburger');

    // State variables
    let isImageModel = false;
    let selectedImage = null;
    let isProcessing = false;
    let logsPaused = false;
    let conversationHistory = [];

    // Enhanced Real-time Flowchart State
    let currentStage = 0;
    let processingStages = [];
    let processingTimer = null;
    let flowchartMessages = {};

    // defensive helper: safe addEventListener
    function safeListen(el, event, fn) {
        if (!el) return;
        el.addEventListener(event, fn);
    }

    // Initialize from localStorage
    const selectedModel = localStorage.getItem('selectedModel') || 'text';
    initializeModel(selectedModel);

    // Initialize model type
    function initializeModel(modelType) {
        isImageModel = modelType === 'image';

        if (!modelTypeBadge) return;
        if (isImageModel) {
            modelTypeBadge.innerHTML = '<i class="fas fa-image"></i><span>Image Model</span>';
            if (imageUploadContainer) imageUploadContainer.style.display = 'block';
            if (attachImageBtn) attachImageBtn.style.display = 'flex';
        } else {
            modelTypeBadge.innerHTML = '<i class="fas fa-keyboard"></i><span>Text Model</span>';
            if (imageUploadContainer) imageUploadContainer.style.display = 'none';
            if (attachImageBtn) attachImageBtn.style.display = 'none';
        }
    }

    // Load recent conversations from backend
    function loadRecentConversations() {
        const conversationsList = document.getElementById('recentConversationsList');
        if (!conversationsList) return;

        fetch('http://localhost:5000/api/conversations')
            .then(response => response.json())
            .then(data => {
                if (data.success && data.conversations && data.conversations.length > 0) {
                    conversationsList.innerHTML = '';
                    data.conversations.forEach(conv => {
                        const convEl = document.createElement('div');
                        convEl.className = 'conversation-item';
                        const timestamp = new Date(conv.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        });
                        convEl.innerHTML = `
                            <div class="conversation-preview">${conv.preview}</div>
                            <div class="conversation-meta">${timestamp}</div>
                        `;
                        conversationsList.appendChild(convEl);
                    });
                } else {
                    conversationsList.innerHTML = '<div class="placeholder-message">No recent conversations</div>';
                }
            })
            .catch(error => {
                console.error('Error loading conversations:', error);
                conversationsList.innerHTML = '<div class="placeholder-message">Error loading conversations</div>';
            });
    }

    // Auto-resize textarea
    if (messageInput) {
        messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 200) + 'px';
        });
    }

    // Load recent conversations on page load
    loadRecentConversations();

    // Send message
    safeListen(sendMessageBtn, 'click', sendMessage);
    safeListen(messageInput, 'keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Image handling
    safeListen(attachImageBtn, 'click', function() {
        if (imageInput) imageInput.click();
    });

    safeListen(uploadImageBtn, 'click', function() {
        if (imageInput) imageInput.click();
    });

    if (imageInput) {
        imageInput.addEventListener('change', function(e) {
            const file = e.target.files && e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    selectedImage = event.target.result;
                    if (uploadPreview) uploadPreview.innerHTML = `<img src="${selectedImage}" alt="Uploaded image">`;
                    if (removeImageBtn) removeImageBtn.style.display = 'block';
                    if (uploadImageBtn) uploadImageBtn.style.display = 'none';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    safeListen(removeImageBtn, 'click', function() {
        selectedImage = null;
        if (imageInput) imageInput.value = '';
        if (uploadPreview) uploadPreview.innerHTML = '<i class="fas fa-image"></i><span>No image selected</span>';
        if (removeImageBtn) removeImageBtn.style.display = 'none';
        if (uploadImageBtn) uploadImageBtn.style.display = 'block';
    });

    // Navigation: new chat (safe)
    safeListen(newChatBtn, 'click', function() {
        if (confirm('Start a new conversation? Current chat will be saved.')) {
            resetConversation();
        }
    });

    safeListen(backToModelsBtn, 'click', function() {
        window.location.href = 'index.html';
    });

    // Log controls
    safeListen(clearLogsBtn, 'click', function() {
        if (!securityLogs) return;
        securityLogs.innerHTML = `
            <div class="log-section">
                <div class="log-header">
                    <span class="log-title">LOGS CLEARED</span>
                    <span class="log-status safe">ACTIVE</span>
                </div>
                <div class="log-content">
                    <p>Security log cleared. New logs will appear here.</p>
                </div>
            </div>
        `;
    });

    safeListen(pauseLogsBtn, 'click', function() {
        logsPaused = !logsPaused;
        const icon = this.querySelector('i');
        if (icon) icon.className = logsPaused ? 'fas fa-play' : 'fas fa-pause';
        this.title = logsPaused ? 'Resume updates' : 'Pause updates';
    });

    // Load recent conversations from backend
    function loadRecentConversations() {
        // Render local conversation history (starts empty on reload)
        renderLocalHistory();
    }

    function renderLocalHistory() {
        const conversationsList = document.getElementById('recentConversationsList');
        if (!conversationsList) return;
        conversationsList.innerHTML = '';
        if (!conversationHistory || conversationHistory.length === 0) {
            conversationsList.innerHTML = '<div class="placeholder-message">No recent conversations</div>';
            return;
        }

        // Show last 8 messages grouped by session (simple UX: show recent messages)
        const last = conversationHistory.slice(-8).reverse();
        last.forEach(msg => {
            const convItem = document.createElement('div');
            convItem.className = 'conversation-item';
            const timestamp = msg.timestamp || new Date().toLocaleTimeString();
            convItem.innerHTML = `
                <div class="conversation-preview">${msg.text}</div>
                <div class="conversation-meta">${timestamp}</div>
            `;
            convItem.addEventListener('click', () => {
                // Scroll chat to the first matching message
                const allMsgs = Array.from(document.querySelectorAll('.message'));
                const found = allMsgs.find(el => el.textContent.includes(msg.text));
                if (found) found.scrollIntoView({behavior: 'smooth', block: 'center'});
            });
            conversationsList.appendChild(convItem);
        });
    }

    // Send message function
    function sendMessage() {
        const message = messageInput ? messageInput.value.trim() : '';
        if ((!message && !selectedImage) || isProcessing) return;

        isProcessing = true;

        // Add user message to chat
        addMessageToChat('user', message, selectedImage);

        // Clear input
        if (messageInput) {
            messageInput.value = '';
            messageInput.style.height = 'auto';
        }

        // Reset image selection
        if (selectedImage) {
            selectedImage = null;
            if (imageInput) imageInput.value = '';
            if (uploadPreview) uploadPreview.innerHTML = '<i class="fas fa-image"></i><span>No image selected</span>';
            if (removeImageBtn) removeImageBtn.style.display = 'none';
            if (uploadImageBtn) uploadImageBtn.style.display = 'block';
        }

        // Start security visualization
        visualizeSecurityProcess(message);

        // Send message to backend
        processMessageWithBackend(message);
    }

    // Add message to chat
    function addMessageToChat(sender, text, image = null) {
        if (!chatMessages) return;
        const messageId = Date.now();
        const message = {
            id: messageId,
            sender,
            text,
            image,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        conversationHistory.push(message);

        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}`;

        let avatarIcon = 'fas fa-user';
        let senderName = 'You';

        if (sender === 'model') {
            avatarIcon = 'fas fa-robot';
            senderName = 'PromptGuard AI';
        } else if (sender === 'system') {
            avatarIcon = 'fas fa-shield-alt';
            senderName = 'System';
        }

        let imageHtml = '';
        if (image) {
            imageHtml = `<div class="message-image"><img src="${image}" alt="Uploaded image"></div>`;
        }

        messageElement.innerHTML = `
            <div class="message-avatar">
                <i class="${avatarIcon}"></i>
            </div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-sender">${senderName}</span>
                    <span class="message-time">${message.timestamp}</span>
                </div>
                <div class="message-text">${text}</div>
                ${imageHtml}
            </div>
        `;

        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Helper function to reset phase-based elements (kept for backward compatibility)
    function resetPhases() {
        if (phase1 && phase2 && phase3) {
            [phase1, phase2, phase3].forEach(phase => {
                const status = phase.querySelector('.phase-status');
                const checks = phase.querySelectorAll('.check-status');

                if (status) {
                    status.textContent = 'IDLE';
                    status.className = 'phase-status idle';
                }

                checks.forEach(check => {
                    check.textContent = '-';
                    check.className = 'check-status idle';
                });
            });

            updateFinalVerdict('IDLE', 'Awaiting analysis...');
        }
    }

    // ===== FLOWCHART CONTROL FUNCTIONS =====
    // (the following functions are safe and guard missing nodes)
    function updateStage(stageNumber, status) {
        const stage = document.querySelector(`.stage-${stageNumber}`);
        const stageStatus = document.getElementById(`stage${stageNumber}Status`);

        if (stage && stageStatus) {
            stage.setAttribute('data-status', status);
            stageStatus.textContent = status.toUpperCase();

            const timelineSegment = document.querySelector(`.timeline-segment[data-stage="${stageNumber}"]`);
            if (timelineSegment) {
                timelineSegment.setAttribute('data-status', status === 'running' ? 'running' :
                    status === 'success' ? 'complete' : 'idle');
            }
        }
    }

    function updateCheck(stageNumber, checkName, status) {
        const check = document.querySelector(`.stage-${stageNumber} [data-check="${checkName}"]`);
        if (check) {
            check.setAttribute('data-status', status);
            const checkStatus = check.querySelector('.check-status');
            if (checkStatus) {
                checkStatus.textContent = status.toUpperCase();

                if (status === 'success') {
                    check.classList.add('check-success');
                    setTimeout(() => check.classList.remove('check-success'), 500);
                } else if (status === 'warning') {
                    check.classList.add('check-warning');
                    setTimeout(() => check.classList.remove('check-warning'), 500);
                } else if (status === 'danger') {
                    check.classList.add('check-danger');
                    setTimeout(() => check.classList.remove('check-danger'), 500);
                }
            }
        }
    }

    function updateArrow(arrowNumber, status) {
        const arrows = document.querySelectorAll('.flow-arrow');
        if (arrows[arrowNumber - 1]) {
            arrows[arrowNumber - 1].setAttribute('data-status', status);
        }
    }

    function updateFlowchartStatus(status) {
        const flowchartStatus = document.getElementById('flowchartStatus');
        if (flowchartStatus) {
            flowchartStatus.textContent = status.toUpperCase();
            flowchartStatus.className = `flowchart-status ${status}`;
        }
    }

    function updateFlowProgressText(text) {
        const progressEl = document.getElementById('flowProgress');
        if (!progressEl) return;
        progressEl.textContent = text;
        progressEl.classList.add('pulse');
        setTimeout(() => progressEl.classList.remove('pulse'), 600);
    }

    function resetFlowchart() {
        // Reset all layer status indicators
        document.querySelectorAll('.layer-status').forEach(status => {
            status.textContent = 'waiting...';
            status.className = 'layer-status waiting';
        });

        // Reset all layer boxes
        document.querySelectorAll('.layer-box').forEach(box => {
            box.classList.remove('active', 'completed');
        });

        // Reset all arrows
        document.querySelectorAll('.layer-arrow').forEach(arrow => {
            arrow.classList.remove('active');
        });

        updateFlowchartStatus('idle');
        resetTimer();
    }

    function initializeFlowchart() {
        resetFlowchart();
        setupFlowchartEvents();
        createFlowchartMessages();
    }

    function setupFlowchartEvents() {
        document.querySelectorAll('.layer-box').forEach(box => {
            box.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-5px)';
                const layerName = this.querySelector('.layer-name').textContent;
                addFlowchartLog('INFO', `Hovering over ${layerName}`);
            });

            box.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
            });
        });
    }

    function createFlowchartMessages() {
        // Messages will be populated from real backend logs
        flowchartMessages = {
            stage1: [],
            stage2: [],
            stage3: [],
            stage4: [],
            stage5: [],
            stage6: []
        };
    }

    function animateStageTransition(fromStage, toStage) {
        const oldStage = document.querySelector(`.stage-${fromStage}`);
        if (oldStage) {
            oldStage.style.opacity = '0.7';
            oldStage.style.transform = 'translateX(-20px)';
        }

        const newStage = document.querySelector(`.stage-${toStage}`);
        if (newStage) {
            newStage.style.opacity = '1';
            newStage.style.transform = 'translateX(0)';
            newStage.classList.add('layer-transition');
            setTimeout(() => newStage.classList.remove('layer-transition'), 500);
        }
    }

    function startBackendProcessing() {
        resetFlowchart();
        startTimer();
        currentStage = 1;
        processingStages = [];

        updateFlowProgressText("Starting backend processing...");
        addFlowchartLog('SYSTEM', '=== BACKEND PROCESSING STARTED ===');

        // Reset all layer statuses
        document.querySelectorAll('.layer-status').forEach(el => {
            el.textContent = 'waiting...';
            el.className = 'layer-status waiting';
        });

        setTimeout(() => processStage(1), 500);
    }

    function processStage(stageNumber) {
        currentStage = stageNumber;
        processingStages.push(stageNumber);

        const layerStatus = document.getElementById(`stage${stageNumber}Status`);
        if (!layerStatus) return;

        // Update status to processing
        layerStatus.textContent = 'processing...';
        layerStatus.className = 'layer-status processing';

        const stageKey = `stage${stageNumber}`;
        if (flowchartMessages[stageKey]) {
            flowchartMessages[stageKey].forEach((msg, msgIndex) => {
                setTimeout(() => {
                    addFlowchartLog('PROCESS', msg);
                }, msgIndex * 300);
            });
        }

        updateFlowProgressText(`Processing Layer ${stageNumber}...`);

        // Simulate processing for 1-2 seconds
        setTimeout(() => {
            // Update status to done
            layerStatus.textContent = 'done!';
            layerStatus.className = 'layer-status done';

            // Update layer box styling
            const layerBox = document.querySelector(`.layer-box[data-layer="${stageNumber}"]`);
            if (layerBox) {
                layerBox.classList.add('completed');
            }

            // Update arrow between layers
            const arrows = document.querySelectorAll('.layer-arrow');
            if (stageNumber < 3 && arrows[stageNumber - 1]) {
                arrows[stageNumber - 1].classList.add('active');
            }

            addFlowchartLog('SUCCESS', `Layer ${stageNumber} processing completed`);
            updateFlowProgressText(`Layer ${stageNumber} → done!`);

            if (stageNumber < 3) {
                setTimeout(() => {
                    processStage(stageNumber + 1);
                }, 800);
            } else {
                completeBackendProcessing();
            }
        }, 1000 + Math.random() * 1000);
    }

    function completeBackendProcessing() {
        let finalResult = 'SAFE';
        finalResult = 'SAFE';
        updateFinalVerdict('SAFE', 'All security checks passed');
        addFlowchartLog('SUCCESS', '=== PROCESSING COMPLETE: SAFE ===');

        updateFlowchartStatus('complete');
        updateFlowProgressText(`Processing complete: ${finalResult}`);
        stopTimer();
        triggerCompletionEffects();
    }

    function triggerCompletionEffects() {
        createParticleBurst();

        document.querySelectorAll('.layer-box.completed').forEach(box => {
            box.classList.add('status-change');
            setTimeout(() => box.classList.remove('status-change'), 1000);
        });

        const verdictCard = document.querySelector('.verdict-card');
        if (verdictCard) {
            verdictCard.classList.add('check-complete');
        }
    }

    function createParticleBurst() {
        const container = document.querySelector('.backend-flowchart');
        if (!container) return;

        const burst = document.createElement('div');
        burst.className = 'particle-burst';

        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            particle.className = 'burst-particle';
            particle.style.left = '50%';
            particle.style.top = '50%';
            particle.style.animationDelay = `${i * 0.1}s`;
            burst.appendChild(particle);
        }

        container.appendChild(burst);
        setTimeout(() => burst.remove(), 1000);
    }

    function addFlowchartLog(level, message) {
        if (logsPaused) return;
        if (!securityLogs) return;

        const time = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        const logsContainer = securityLogs;
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${level.toLowerCase()}`;
        logEntry.innerHTML = `
            <span class="log-time">${time}</span>
            <div class="log-content">
                <span class="log-level">${level}</span>
                <span class="log-message">${message}</span>
            </div>
        `;

        logsContainer.appendChild(logEntry);
        logsContainer.scrollTop = logsContainer.scrollHeight;

        const logs = logsContainer.querySelectorAll('.log-entry');
        if (logs.length > 30) {
            logs[0].remove();
        }
    }

    function visualizeSecurityProcess(message) {
        initializeFlowchart();
        startBackendProcessing();
    }

    // Helper functions for detection
    function detectStructuralAttack(message) {
        const structuralPatterns = [
            /ignore.*previous.*instruction/i,
            /system.*prompt.*leak/i,
            /delimiter.*abuse/i,
            /nested.*instruction/i,
            /JSON.*override/i
        ];
        return structuralPatterns.some(pattern => pattern.test(message));
    }

    function detectLeakage() {
        return Math.random() < 0.1;
    }

    function detectHighEntropy() {
        return Math.random() < 0.1;
    }

    function detectJailbreak() {
        return Math.random() < 0.1;
    }

    // Timer functions
    let timerInterval;
    let startTime;

    function startTimer() {
        startTime = Date.now();
        const timerElement = document.getElementById('verdictTimer');
        const durationElement = document.getElementById('timelineDuration');

        timerInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const seconds = (elapsed / 1000).toFixed(2);
            if (timerElement) timerElement.textContent = `${seconds}s`;
            if (durationElement) durationElement.textContent = `${seconds}s`;
        }, 10);
    }

    function stopTimer() {
        clearInterval(timerInterval);
    }

    function resetTimer() {
        clearInterval(timerInterval);
        const timerEl = document.getElementById('verdictTimer');
        const durationEl = document.getElementById('timelineDuration');
        if (timerEl) timerEl.textContent = '00.00s';
        if (durationEl) durationEl.textContent = '00.00s';
    }

    // Enhanced log function
    function addSecurityLog(level, message) {
        if (logsPaused) return;
        if (!securityLogs) return;

        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const logsContainer = securityLogs;

        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${level}`;
        logEntry.innerHTML = `
            <span class="log-time">${time}</span>
            <div class="log-content">
                <span class="log-level">${level.toUpperCase()}</span>
                <span class="log-message">${message}</span>
            </div>
        `;

        logsContainer.appendChild(logEntry);
        logsContainer.scrollTop = logsContainer.scrollHeight;

        const logs = logsContainer.querySelectorAll('.log-entry');
        if (logs.length > 50) {
            logs[0].remove();
        }
    }

    function updateFinalVerdict(status, message) {
        const verdictElement = document.getElementById('finalVerdict');
        if (!verdictElement) return;

        let icon = 'fas fa-clock';
        let statusClass = 'idle';

        switch(status) {
            case 'SAFE':
                icon = 'fas fa-check-circle';
                statusClass = 'safe';
                break;
            case 'SANITIZED':
                icon = 'fas fa-exclamation-triangle';
                statusClass = 'warning';
                break;
            case 'BLOCKED':
                icon = 'fas fa-ban';
                statusClass = 'danger';
                break;
        }

        verdictElement.innerHTML = `
            <div class="verdict ${statusClass}">
                <i class="${icon}"></i>
                <span>${status} - ${message}</span>
            </div>
        `;
    }

    // Detection for malicious intent
    function detectMaliciousIntent(message) {
        const maliciousPatterns = [
            /ignore.*previous.*instruction/i,
            /system.*prompt.*leak/i,
            /act.*as.*hacker/i,
            /bypass.*security/i,
            /jailbreak/i,
            /override.*rules/i,
            /disregard.*safety/i,
            /dangerous.*content/i,
            /illegal.*activity/i,
            /how.*to.*hack/i
        ];

        return maliciousPatterns.some(pattern => pattern.test(message));
    }

    function generateAIResponse(userMessage) {
        const responses = [
            "I understand you're asking about that topic. As an AI assistant focused on safety, I can provide general information but need to ensure my response is appropriate and secure.",
            "That's an interesting question! Let me provide you with a helpful response while maintaining safety guidelines.",
            "I've processed your request through our security layers. Here's my safe and appropriate response to your query.",
            "Based on your input, I can provide the following information while ensuring compliance with security protocols.",
            "I've analyzed your question through our multi-phase security system. Here's a secure response that addresses your query appropriately."
        ];

        const wasMalicious = detectMaliciousIntent(userMessage);

        let response;
        if (wasMalicious) {
            response = "I cannot comply with this request as it appears to attempt to bypass safety protocols. My responses are designed to be helpful, harmless, and honest while maintaining security standards.";
        } else {
            response = responses[Math.floor(Math.random() * responses.length)];
        }

        addMessageToChat('model', response);
    }

    function resetConversation() {
        if (!chatMessages) return;
        chatMessages.innerHTML = `
            <div class="message system">
                <div class="message-avatar">
                    <i class="fas fa-shield-alt"></i>
                </div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-sender">PromptGuard System</span>
                        <span class="message-time">Just now</span>
                    </div>
                    <div class="message-text">
                        New conversation started. All interactions are monitored by our 3-phase security system.
                    </div>
                </div>
            </div>
        `;

        conversationHistory = [];
        resetPhases();

        if (securityLogs) {
            securityLogs.innerHTML = `
                <div class="log-section">
                    <div class="log-header">
                        <span class="log-title">NEW CONVERSATION</span>
                        <span class="log-status safe">ACTIVE</span>
                    </div>
                    <div class="log-content">
                        <p>New conversation started. Security layers ready.</p>
                    </div>
                </div>
            `;
        }
    }

    // ===== BACKEND PROCESSING FUNCTION =====
    function processMessageWithBackend(userMessage) {
        // Send to backend API
        fetch('http://localhost:5000/api/process', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: userMessage,
                user_id: 'demo_user_01'
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // --- START OF FIX ---
                
                // 1. Get the raw message
                let cleanMessage = data.message;

                // 2. Use Regex to strip <SEC_...> tags
                // This regex looks for tags starting with SEC_ inside angle brackets and removes them
                cleanMessage = cleanMessage.replace(/<SEC_[^>]+>/g, '');
                
                // 3. Clean up any leftover "MODEL:" prefix if it exists in the string
                cleanMessage = cleanMessage.replace(/^MODEL:\s*/i, '');

                // 4. Trim whitespace
                cleanMessage = cleanMessage.trim();

                // Add CLEANED AI response to chat
                addMessageToChat('model', cleanMessage);

                // --- END OF FIX ---
                
                // Render ordered summary and update flowchart from backend `layers`
                if (data.layers) {
                    renderLayerSummary(data.layers);
                    renderFlowchart(data.layers);
                }
                
                // Reload recent conversations to show the new message
                loadRecentConversations();
            } else {
                // Handle blocked request
                addMessageToChat('system', `⚠️ Request blocked: ${data.message}`);
                addFlowchartLog('DANGER', data.message);
                
                // If blocked, still render summary/flowchart if available
                if (data.layers) {
                    renderLayerSummary(data.layers);
                    renderFlowchart(data.layers);
                }
            }
            
            // Reload recent conversations
            loadRecentConversations();
            
            isProcessing = false;
            completeBackendProcessing();
        })
        .catch(error => {
            console.error('Error processing message:', error);
            addMessageToChat('system', `Error: ${error.message}`);
            addFlowchartLog('ERROR', `Backend error: ${error.message}`);
            isProcessing = false;
        });
    }

    function processBackendLogs(logs) {
        // Process each log entry and update the UI
        logs.forEach((log, index) => {
            setTimeout(() => {
                addFlowchartLog(log.level, log.message);
            }, index * 100);
        });
    }

    // Render an ordered 1→6 summary in the security logs pane (only these entries)
    function renderLayerSummary(layers) {
        if (!securityLogs) return;
        securityLogs.innerHTML = '';

        const ordered = ['layer1','layer2','layer3','layer4','layer5','layer6'];
        ordered.forEach((key, idx) => {
            const layer = layers[key] || {};
            const passed = !!layer.passed;
            const level = passed ? 'info' : 'danger';
            const time = new Date().toLocaleTimeString();
            const message = layer.message || (passed ? 'Passed' : 'Blocked');

            const entry = document.createElement('div');
            entry.className = `log-entry ${level}`;
            entry.innerHTML = `
                <div class="log-time">${time}</div>
                <div class="log-content">
                    <span class="log-level">L${idx+1}</span>
                    <span class="log-message">Layer ${idx+1} (${key}): ${message}</span>
                </div>`;
            securityLogs.appendChild(entry);
        });
        securityLogs.scrollTop = securityLogs.scrollHeight;
    }

    // Update the flowchart DOM to reflect backend `layers` status
    function renderFlowchart(layers) {
        const ordered = ['layer1','layer2','layer3','layer4','layer5','layer6'];
        let blockedAt = null;
        ordered.forEach((key, idx) => {
            const layerNum = idx + 1;
            const passed = layers[key] && layers[key].passed;
            const statusEl = document.getElementById(`stage${layerNum}Status`);
            const box = document.querySelector(`.layer-box[data-layer="${layerNum}"]`);

            if (statusEl) {
                statusEl.textContent = passed ? 'done!' : 'error!';
                statusEl.className = `layer-status ${passed ? 'done' : 'error'}`;
            }
            if (box) {
                box.classList.remove('completed','error');
                if (passed) box.classList.add('completed');
                else box.classList.add('error');
            }

            if (!passed && blockedAt === null) blockedAt = layerNum;
        });

        // Update arrows active state
        document.querySelectorAll('.layer-arrow').forEach((arrow, i) => {
            const idx = i + 1;
            if (!blockedAt || idx < blockedAt) arrow.classList.add('active');
            else arrow.classList.remove('active');
        });

        // Update flow status and progress text
        if (blockedAt) {
            updateFlowchartStatus('blocked');
            updateFlowProgressText(`Blocked at Layer ${blockedAt}`);
            updateFinalVerdict('BLOCKED', `Stopped at layer ${blockedAt}`);
        } else {
            updateFlowchartStatus('complete');
            updateFlowProgressText('All layers passed');
            updateFinalVerdict('SAFE', 'All security checks passed');
        }
    }

    function updateLayerInfo(layers) {
        // Update layer status based on backend response
        if (layers.layer1) {
            const status = layers.layer1.passed ? 'done' : 'error';
            updateLayerStatus('layer1', status, layers.layer1);
        }
        if (layers.layer2) {
            const status = layers.layer2.passed ? 'done' : 'error';
            updateLayerStatus('layer2', status, layers.layer2);
        }
        if (layers.layer3) {
            const status = layers.layer3.passed ? 'done' : 'error';
            updateLayerStatus('layer3', status, layers.layer3);
        }
        if (layers.layer4) {
            const status = layers.layer4.passed ? 'done' : 'error';
            updateLayerStatus('layer4', status, layers.layer4);
        }
        if (layers.layer5) {
            const status = layers.layer5.passed ? 'done' : 'error';
            updateLayerStatus('layer5', status, layers.layer5);
        }
        if (layers.layer6) {
            const status = layers.layer6.passed ? 'done' : 'error';
            updateLayerStatus('layer6', status, layers.layer6);
        }
    }

    function updateLayerStatus(layerName, status, details) {
        const statusElementId = `${layerName}Status`;
        const layerElement = document.querySelector(`[data-layer="${layerName}"]`);
        
        const statusElement = document.getElementById(statusElementId);
        if (statusElement) {
            statusElement.textContent = status === 'done' ? 'done!' : 'error!';
            statusElement.className = `layer-status ${status}`;
        }
        
        if (layerElement) {
            if (status === 'done') {
                layerElement.classList.add('completed');
            } else if (status === 'error') {
                layerElement.classList.add('error');
            }
        }
    }

    // History items click handlers (safe)
    document.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', function() {
            document.querySelectorAll('.history-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            const title = this.querySelector('.history-title') ? this.querySelector('.history-title').textContent : '';
            addMessageToChat('system', `Loaded conversation: "${title}"`);
        });
    });

    /* -------------------------
       Sidebar toggling
       ------------------------- */

    function updateChatSidebarOpener() {
        if (!chatSidebar) return;
        let opener = document.getElementById('chatSidebarOpener');

        if (chatSidebar.classList.contains('minimized')) {
            // add button if missing
            if (!opener) {
                opener = document.createElement('button');
                opener.id = 'chatSidebarOpener';
                opener.className = 'sidebar-opener';
                opener.title = 'Open Conversations';
                opener.innerHTML = '<i class="fas fa-chevron-right"></i>';
                document.body.appendChild(opener);

                opener.addEventListener('click', function () {
                    chatSidebar.classList.remove('minimized');
                    chatSidebarToggle.title = 'Minimize Sidebar';
                    updateChatSidebarOpener();
                });
            }
        } else {
            // remove button if present
            if (opener) opener.remove();
        }
    }

    // wire collapse button on chat sidebar (if present)
    if (chatSidebarToggle && chatSidebar) {
        chatSidebarToggle.addEventListener('click', function() {
            chatSidebar.classList.toggle('minimized');
            const isMinimized = chatSidebar.classList.contains('minimized');
            chatSidebarToggle.title = isMinimized ? 'Expand Sidebar' : 'Minimize Sidebar';
            updateChatSidebarOpener();
        });
    }

    // hamburger should also open when minimized
    if (chatHamburger && chatSidebar) {
        chatHamburger.addEventListener('click', function() {
            if (chatSidebar.classList.contains('minimized')) {
                chatSidebar.classList.remove('minimized');
                chatSidebarToggle.title = 'Minimize Sidebar';
                updateChatSidebarOpener();
            }
        });
    }

    // --- Analysis panel toggle (top-right button) ---
    const securityPanel = document.querySelector('.security-panel');
    const securityLogsContainer = document.querySelector('.security-logs-container');
    const flowchartContainer = document.querySelector('.flowchart-container');
    let analysisPanel = null;
    let analysisShown = false;

    function createAnalysisPanel() {
        if (!securityPanel || analysisPanel) return;
        analysisPanel = document.createElement('div');
        analysisPanel.id = 'analysisPanel';
        analysisPanel.className = 'analysis-panel';
        analysisPanel.innerHTML = `
            <div class="analysis-header"><h4>Live Analysis</h4></div>
            <div class="analysis-body">
                <div class="analysis-row"><strong>Risk Score:</strong> <span id="riskScore">-</span></div>
                <div class="analysis-row"><strong>Behavioral Patterns:</strong>
                    <ul id="behaviorList"><li>No data</li></ul>
                </div>
                <div class="analysis-row"><strong>Likely Intent:</strong>
                    <p id="likelyIntent">N/A</p>
                </div>
                <div class="analysis-row"><strong>Recommended Actions:</strong>
                    <ul id="recommendations"><li>None</li></ul>
                </div>
                <div class="analysis-row"><strong>Recent Prompts:</strong>
                    <ul id="recentPrompts"><li>—</li></ul>
                </div>
                <div class="analysis-row"><strong>PromptGuard Summary:</strong>
                    <p id="pgSummary">No summary available</p>
                </div>
            </div>
        `;
        analysisPanel.style.display = 'none';
        securityPanel.appendChild(analysisPanel);
    }

    function updateAnalysisContent() {
        if (!analysisPanel) return;
        const riskEl = analysisPanel.querySelector('#riskScore');
        const behaviorList = analysisPanel.querySelector('#behaviorList');
        const intentEl = analysisPanel.querySelector('#likelyIntent');
        const recEl = analysisPanel.querySelector('#recommendations');
        const recentEl = analysisPanel.querySelector('#recentPrompts');
        const summaryEl = analysisPanel.querySelector('#pgSummary');

        // Simple heuristic for risk score based on completed/done layers
        const doneCount = document.querySelectorAll('.layer-status.done').length || 0;
        const errorCount = document.querySelectorAll('.layer-status.error').length || 0;
        let riskPercent = Math.min(100, Math.round((errorCount * 70) + ((3 - doneCount) * 12)));
        if (riskPercent < 5) riskPercent = 5;
        if (riskEl) riskEl.textContent = riskPercent + '%';

        // Behavioral patterns: scan recent logs for keywords
        const patterns = new Set();
        if (securityLogsContainer) {
            const logs = securityLogsContainer.querySelectorAll('.log-entry');
            logs.forEach(le => {
                const txt = (le.textContent || '').toLowerCase();
                if (txt.includes('jailbreak')) patterns.add('Possible jailbreak patterns');
                if (txt.includes('leak')) patterns.add('Potential data leakage');
                if (txt.includes('entropy')) patterns.add('High entropy content');
                if (txt.includes('sanitiz') || txt.includes('rewrite')) patterns.add('Sanitization applied');
            });
        }
        if (patterns.size === 0) patterns.add('No anomalies detected');
        if (behaviorList) behaviorList.innerHTML = Array.from(patterns).map(p => `<li>${p}</li>`).join('');

        // PromptGuard summary: simple sentence
        if (summaryEl) summaryEl.textContent = `PromptGuard processed the input and applied ${patterns.size} automated protections.`;

        // Likely intent heuristics (simple client-side approximations)
        let likely = 'General inquiry';
        const lastPrompt = (conversationHistory.length && conversationHistory[conversationHistory.length-1].text) || '';
        const lp = lastPrompt.toLowerCase();
        if (/how to|tutorial|steps|guide/.test(lp)) likely = 'Instructional / How-to';
        else if (/password|secret|key|token|credential/.test(lp)) likely = 'Secrets / Sensitive access attempt';
        else if (/ignore previous|jailbreak|bypass|override/.test(lp)) likely = 'Prompt injection / override attempt';
        else if (/write code|create script|implement/.test(lp)) likely = 'Code generation';
        else if (/translate|summarize|explain/.test(lp)) likely = 'Transformation / summarization';
        if (intentEl) intentEl.textContent = likely;

        // Recommendations based on patterns and intent
        const recs = [];
        if (likely.includes('Secrets')) recs.push('Redact high-entropy strings and halt.');
        if (likely.includes('Prompt injection')) recs.push('Block and escalate to human review.');
        if (patterns.has('Sanitization applied') || patterns.has('Sanitization applied'.toLowerCase())) recs.push('Sanitization applied automatically.');
        if (recs.length === 0) recs.push('No immediate action required. Monitor and log.');
        if (recEl) recEl.innerHTML = recs.map(r=>`<li>${r}</li>`).join('');

        // Recent prompts list (up to 5)
        const recentPrompts = conversationHistory.slice(-5).reverse().map(m => `<li>${m.sender === 'user' ? m.text : '[model] ' + m.text}</li>`);
        if (recentEl) recentEl.innerHTML = recentPrompts.join('') || '<li>—</li>';
    }

    safeListen(checkAnalysisBtn, 'click', function() {
        createAnalysisPanel();
        analysisShown = !analysisShown;
        if (analysisShown) {
            if (securityLogsContainer) securityLogsContainer.style.display = 'none';
            if (flowchartContainer) flowchartContainer.style.display = 'none';
            if (analysisPanel) {
                analysisPanel.style.display = 'block';
                updateAnalysisContent();
            }
            if (checkAnalysisBtn) checkAnalysisBtn.classList.add('active');
        } else {
            if (securityLogsContainer) securityLogsContainer.style.display = '';
            if (flowchartContainer) flowchartContainer.style.display = '';
            if (analysisPanel) analysisPanel.style.display = 'none';
            if (checkAnalysisBtn) checkAnalysisBtn.classList.remove('active');
        }
    });

    // Initialize opener on page load
    updateChatSidebarOpener();
});
