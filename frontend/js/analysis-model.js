// Analysis Modal Functionality
class AnalysisModal {
    constructor() {
        this.modal = null;
        this.isOpen = false;
        this.currentData = null;
        this.init();
    }

    init() {
        // Create modal HTML
        this.createModal();
        this.bindEvents();
    }

    createModal() {
        const modalHTML = `
            <div class="modal-overlay" id="analysisModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-chart-line"></i> Security Analysis Dashboard</h3>
                        <button class="modal-close" id="modalCloseBtn">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="analysis-sections">
                            <!-- Sinner Score Section -->
                            <section class="analysis-section">
                                <div class="section-header">
                                    <h4><i class="fas fa-user-shield"></i> Sinner Score Analysis</h4>
                                    <div class="score-display">
                                        <div class="score-circle">
                                            <svg width="120" height="120" viewBox="0 0 120 120">
                                                <circle cx="60" cy="60" r="54" fill="none" stroke="#2A3247" stroke-width="8"/>
                                                <circle cx="60" cy="60" r="54" fill="none" stroke="#10b981" stroke-width="8" 
                                                        stroke-dasharray="339.292" stroke-dashoffset="0" stroke-linecap="round"
                                                        id="scoreCircle"/>
                                            </svg>
                                            <div class="score-value">
                                                <span id="currentScore">45</span>
                                                <small>/100</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="section-content">
                                    <div class="algorithm-info">
                                        <h5><i class="fas fa-cogs"></i> Algorithm Details</h5>
                                        <div class="info-grid">
                                            <div class="info-item">
                                                <span class="info-label">Leaky Bucket Rate Limiter</span>
                                                <div class="info-value">
                                                    <div class="progress-bar">
                                                        <div class="progress-fill" style="width: 65%;"></div>
                                                    </div>
                                                    <span class="progress-text">65% capacity</span>
                                                </div>
                                            </div>
                                            <div class="info-item">
                                                <span class="info-label">Weighted Scoring</span>
                                                <div class="score-breakdown">
                                                    <div class="breakdown-item">
                                                        <span>Structural Attempts:</span>
                                                        <span class="score-value">+12</span>
                                                    </div>
                                                    <div class="breakdown-item">
                                                        <span>Semantic Attempts:</span>
                                                        <span class="score-value">+8</span>
                                                    </div>
                                                    <div class="breakdown-item">
                                                        <span>Leakage Attempts:</span>
                                                        <span class="score-value">+25</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="info-item">
                                                <span class="info-label">Decay-Based Normalization</span>
                                                <div class="decay-visual">
                                                    <div class="decay-bar">
                                                        <div class="decay-fill" style="width: 30%;"></div>
                                                    </div>
                                                    <span class="decay-text">30% score decay applied</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="threshold-triggers">
                                        <h5><i class="fas fa-exclamation-triangle"></i> Threshold Triggers</h5>
                                        <div class="triggers-grid">
                                            <div class="trigger-level">
                                                <div class="trigger-header">
                                                    <span class="trigger-name">WARN</span>
                                                    <span class="trigger-threshold">Score ≥ 25</span>
                                                </div>
                                                <div class="trigger-status active">
                                                    <i class="fas fa-check-circle"></i>
                                                    <span>Active</span>
                                                </div>
                                            </div>
                                            <div class="trigger-level">
                                                <div class="trigger-header">
                                                    <span class="trigger-name">THROTTLE</span>
                                                    <span class="trigger-threshold">Score ≥ 50</span>
                                                </div>
                                                <div class="trigger-status">
                                                    <i class="fas fa-times-circle"></i>
                                                    <span>Inactive</span>
                                                </div>
                                            </div>
                                            <div class="trigger-level">
                                                <div class="trigger-header">
                                                    <span class="trigger-name">TEMPORARY BLOCK</span>
                                                    <span class="trigger-threshold">Score ≥ 75</span>
                                                </div>
                                                <div class="trigger-status">
                                                    <i class="fas fa-times-circle"></i>
                                                    <span>Inactive</span>
                                                </div>
                                            </div>
                                            <div class="trigger-level">
                                                <div class="trigger-header">
                                                    <span class="trigger-name">PERMANENT BAN</span>
                                                    <span class="trigger-threshold">Score ≥ 90</span>
                                                </div>
                                                <div class="trigger-status">
                                                    <i class="fas fa-times-circle"></i>
                                                    <span>Inactive</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <!-- Security Playbooks Section -->
                            <section class="analysis-section">
                                <div class="section-header">
                                    <h4><i class="fas fa-play-circle"></i> Automated Security Playbooks</h4>
                                </div>
                                
                                <div class="section-content">
                                    <div class="playbooks-grid">
                                        <div class="playbook-card">
                                            <div class="playbook-header">
                                                <div class="playbook-icon">
                                                    <i class="fas fa-syringe"></i>
                                                </div>
                                                <h5>Repeated Injection</h5>
                                            </div>
                                            <div class="playbook-body">
                                                <p>Triggers after 3 injection attempts within 5 minutes</p>
                                                <div class="playbook-actions">
                                                    <span class="action-tag">sanitization</span>
                                                    <span class="action-tag">lockout</span>
                                                </div>
                                                <div class="playbook-status active">
                                                    <span>Last triggered: 2 hours ago</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="playbook-card">
                                            <div class="playbook-header">
                                                <div class="playbook-icon">
                                                    <i class="fas fa-key"></i>
                                                </div>
                                                <h5>Secret Leakage</h5>
                                            </div>
                                            <div class="playbook-body">
                                                <p>Triggers on high-entropy string detection</p>
                                                <div class="playbook-actions">
                                                    <span class="action-tag">redaction</span>
                                                    <span class="action-tag">escalation</span>
                                                </div>
                                                <div class="playbook-status">
                                                    <span>Never triggered</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="playbook-card">
                                            <div class="playbook-header">
                                                <div class="playbook-icon">
                                                    <i class="fas fa-radiation"></i>
                                                </div>
                                                <h5>Toxicity Escalation</h5>
                                            </div>
                                            <div class="playbook-body">
                                                <p>Triggers on harmful content patterns</p>
                                                <div class="playbook-actions">
                                                    <span class="action-tag">filtering</span>
                                                    <span class="action-tag">logging</span>
                                                </div>
                                                <div class="playbook-status active">
                                                    <span>Last triggered: 1 day ago</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="playbook-card">
                                            <div class="playbook-header">
                                                <div class="playbook-icon">
                                                    <i class="fas fa-ban"></i>
                                                </div>
                                                <h5>Disallowed Workflow</h5>
                                            </div>
                                            <div class="playbook-body">
                                                <p>Triggers on unauthorized access patterns</p>
                                                <div class="playbook-actions">
                                                    <span class="action-tag">block</span>
                                                    <span class="action-tag">alert</span>
                                                </div>
                                                <div class="playbook-status">
                                                    <span>Never triggered</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <!-- Forensic Logging Section -->
                            <section class="analysis-section">
                                <div class="section-header">
                                    <h4><i class="fas fa-clipboard-list"></i> Forensic Logging</h4>
                                    <button class="btn btn-secondary" id="exportLogsBtn">
                                        <i class="fas fa-download"></i>
                                        Export Logs
                                    </button>
                                </div>
                                
                                <div class="section-content">
                                    <div class="log-stats">
                                        <div class="stat-card">
                                            <div class="stat-icon">
                                                <i class="fas fa-database"></i>
                                            </div>
                                            <div class="stat-info">
                                                <span class="stat-value">1,247</span>
                                                <span class="stat-label">Total Logs</span>
                                            </div>
                                        </div>
                                        <div class="stat-card">
                                            <div class="stat-icon">
                                                <i class="fas fa-shield-alt"></i>
                                            </div>
                                            <div class="stat-info">
                                                <span class="stat-value">42</span>
                                                <span class="stat-label">Violations</span>
                                            </div>
                                        </div>
                                        <div class="stat-card">
                                            <div class="stat-icon">
                                                <i class="fas fa-clock"></i>
                                            </div>
                                            <div class="stat-info">
                                                <span class="stat-value">24h</span>
                                                <span class="stat-label">Retention</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="log-data">
                                        <h5><i class="fas fa-file-alt"></i> Stored Data Points</h5>
                                        <div class="data-grid">
                                            <div class="data-item">
                                                <span class="data-label">Raw Input:</span>
                                                <span class="data-value">Yes</span>
                                            </div>
                                            <div class="data-item">
                                                <span class="data-label">Sanitized Input:</span>
                                                <span class="data-value">Yes</span>
                                            </div>
                                            <div class="data-item">
                                                <span class="data-label">Raw Output:</span>
                                                <span class="data-value">Yes</span>
                                            </div>
                                            <div class="data-item">
                                                <span class="data-label">Sanitized Output:</span>
                                                <span class="data-value">Yes</span>
                                            </div>
                                            <div class="data-item">
                                                <span class="data-label">Violation Metadata:</span>
                                                <span class="data-value">Complete</span>
                                            </div>
                                            <div class="data-item">
                                                <span class="data-label">Entropy Scores:</span>
                                                <span class="data-value">4.2 avg</span>
                                            </div>
                                            <div class="data-item">
                                                <span class="data-label">Regex Hit Logs:</span>
                                                <span class="data-value">342 matches</span>
                                            </div>
                                            <div class="data-item">
                                                <span class="data-label">Tamper Resistance:</span>
                                                <span class="data-value status-bg-safe">Active</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="log-preview">
                                        <h5><i class="fas fa-search"></i> Recent Log Entry Preview</h5>
                                        <div class="preview-content">
                                            <pre><code>{
  "timestamp": "2024-01-15T14:30:22Z",
  "session_id": "sess_7f8a2b4c5d6e",
  "user_id": "user_12345",
  "phase": 1,
  "check_type": "structural",
  "status": "blocked",
  "reason": "nested_instruction_injection",
  "score_impact": 12,
  "entropy_score": 4.8,
  "regex_hits": ["ignore.*previous.*instruction"],
  "sanitized": true,
  "response_time": 42
}</code></pre>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('analysisModal');
        
        // Add CSS for modal
        this.addModalStyles();
    }

    addModalStyles() {
        const styles = `
            .analysis-sections {
                display: flex;
                flex-direction: column;
                gap: 24px;
            }

            .analysis-section {
                background: linear-gradient(135deg, rgba(42, 50, 71, 0.5), rgba(47, 39, 60, 0.5));
                border-radius: 12px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                padding: 24px;
                animation: slideInFromBottom 0.3s ease;
            }

            .analysis-section:nth-child(1) { animation-delay: 0.1s; }
            .analysis-section:nth-child(2) { animation-delay: 0.2s; }
            .analysis-section:nth-child(3) { animation-delay: 0.3s; }

            .section-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 24px;
                padding-bottom: 16px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }

            .section-header h4 {
                display: flex;
                align-items: center;
                gap: 12px;
                color: #f1f5f9;
                font-size: 18px;
                margin: 0;
            }

            .section-header h4 i {
                color: #667eea;
            }

            .score-display {
                display: flex;
                align-items: center;
                gap: 20px;
            }

            .score-circle {
                position: relative;
                width: 120px;
                height: 120px;
            }

            .score-value {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                text-align: center;
            }

            .score-value span {
                font-size: 32px;
                font-weight: 700;
                color: #f1f5f9;
            }

            .score-value small {
                font-size: 14px;
                color: #94a3b8;
            }

            .section-content {
                display: flex;
                flex-direction: column;
                gap: 24px;
            }

            .algorithm-info h5,
            .threshold-triggers h5 {
                display: flex;
                align-items: center;
                gap: 8px;
                color: #cbd5e1;
                margin-bottom: 16px;
                font-size: 16px;
            }

            .info-grid {
                display: grid;
                gap: 16px;
            }

            .info-item {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .info-label {
                color: #94a3b8;
                font-size: 14px;
            }

            .progress-bar {
                height: 8px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
                overflow: hidden;
                flex: 1;
            }

            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, var(--teal-1), var(--blue-2));
                border-radius: 4px;
                animation: progress 2s ease-out;
            }

            .progress-text {
                font-size: 12px;
                color: #cbd5e1;
                min-width: 60px;
                text-align: right;
            }

            .score-breakdown {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .breakdown-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 6px;
            }

            .breakdown-item span:first-child {
                color: #cbd5e1;
            }

            .score-value {
                color: #f59e0b;
                font-weight: 600;
            }

            .decay-visual {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .decay-bar {
                flex: 1;
                height: 8px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
                overflow: hidden;
            }

            .decay-fill {
                height: 100%;
                background: linear-gradient(90deg, var(--purple-1), var(--purple-3));
                border-radius: 4px;
                animation: progress 1.5s ease-out;
            }

            .decay-text {
                font-size: 12px;
                color: #cbd5e1;
                min-width: 80px;
            }

            .triggers-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 16px;
            }

            .trigger-level {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 8px;
                padding: 16px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                transition: all 0.3s ease;
            }

            .trigger-level:hover {
                border-color: rgba(102, 126, 234, 0.3);
                transform: translateY(-2px);
            }

            .trigger-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
            }

            .trigger-name {
                font-weight: 600;
                color: #f1f5f9;
                font-size: 14px;
            }

            .trigger-threshold {
                font-size: 12px;
                color: #94a3b8;
                background: rgba(255, 255, 255, 0.1);
                padding: 2px 8px;
                border-radius: 10px;
            }

            .trigger-status {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
            }

            .trigger-status.active {
                color: #10b981;
            }

            .trigger-status i {
                font-size: 16px;
            }

            .playbooks-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 16px;
            }

            .playbook-card {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 8px;
                padding: 16px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                transition: all 0.3s ease;
            }

            .playbook-card:hover {
                border-color: rgba(102, 126, 234, 0.3);
                transform: translateY(-2px);
            }

            .playbook-header {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 12px;
            }

            .playbook-icon {
                width: 40px;
                height: 40px;
                border-radius: 8px;
                background: linear-gradient(135deg, var(--blue-1), var(--blue-3));
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 18px;
            }

            .playbook-card:nth-child(2) .playbook-icon {
                background: linear-gradient(135deg, var(--teal-1), var(--blue-2));
            }

            .playbook-card:nth-child(3) .playbook-icon {
                background: linear-gradient(135deg, var(--purple-1), var(--purple-3));
            }

            .playbook-card:nth-child(4) .playbook-icon {
                background: linear-gradient(135deg, var(--navy-1), var(--navy-2));
            }

            .playbook-header h5 {
                color: #f1f5f9;
                margin: 0;
                font-size: 16px;
            }

            .playbook-body {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .playbook-body p {
                color: #cbd5e1;
                font-size: 14px;
                margin: 0;
                line-height: 1.5;
            }

            .playbook-actions {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }

            .action-tag {
                padding: 4px 12px;
                background: rgba(102, 126, 234, 0.2);
                color: #cbd5e1;
                border-radius: 12px;
                font-size: 12px;
                border: 1px solid rgba(102, 126, 234, 0.3);
            }

            .playbook-status {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 12px;
                color: #94a3b8;
            }

            .playbook-status.active {
                color: #10b981;
            }

            .log-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 16px;
                margin-bottom: 24px;
            }

            .stat-card {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 8px;
                padding: 16px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                align-items: center;
                gap: 12px;
                transition: all 0.3s ease;
            }

            .stat-card:hover {
                border-color: rgba(102, 126, 234, 0.3);
                transform: translateY(-2px);
            }

            .stat-icon {
                width: 40px;
                height: 40px;
                border-radius: 8px;
                background: linear-gradient(135deg, var(--purple-1), var(--purple-3));
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 18px;
            }

            .stat-info {
                display: flex;
                flex-direction: column;
            }

            .stat-value {
                font-size: 24px;
                font-weight: 700;
                color: #f1f5f9;
            }

            .stat-label {
                font-size: 12px;
                color: #94a3b8;
            }

            .log-data h5 {
                display: flex;
                align-items: center;
                gap: 8px;
                color: #cbd5e1;
                margin-bottom: 16px;
                font-size: 16px;
            }

            .data-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 12px;
                margin-bottom: 24px;
            }

            .data-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .data-label {
                color: #cbd5e1;
                font-size: 14px;
            }

            .data-value {
                color: #f1f5f9;
                font-weight: 500;
                font-size: 14px;
            }

            .log-preview h5 {
                display: flex;
                align-items: center;
                gap: 8px;
                color: #cbd5e1;
                margin-bottom: 16px;
                font-size: 16px;
            }

            .preview-content {
                background: rgba(0, 0, 0, 0.3);
                border-radius: 8px;
                padding: 16px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                overflow: auto;
            }

            .preview-content pre {
                margin: 0;
                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                font-size: 12px;
                line-height: 1.5;
                color: #cbd5e1;
            }

            .preview-content code {
                display: block;
                padding: 12px;
            }

            @keyframes progress {
                from { width: 0%; }
                to { width: var(--target-width); }
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    bindEvents() {
        // Close modal
        document.getElementById('modalCloseBtn').addEventListener('click', () => {
            this.close();
        });

        // Close on overlay click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        // Export logs button
        document.getElementById('exportLogsBtn').addEventListener('click', () => {
            this.exportLogs();
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    open(data = null) {
        this.currentData = data;
        this.isOpen = true;
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Animate score circle
        this.animateScoreCircle();
    }

    close() {
        this.isOpen = false;
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    animateScoreCircle() {
        const score = 45; // Example score
        const circle = document.getElementById('scoreCircle');
        const circumference = 2 * Math.PI * 54;
        const offset = circumference - (score / 100) * circumference;
        
        circle.style.strokeDashoffset = offset;
        circle.style.animation = 'none';
        
        setTimeout(() => {
            circle.style.transition = 'stroke-dashoffset 1s ease-out';
            circle.style.strokeDashoffset = offset;
        }, 100);
    }

    exportLogs() {
        // Simulate log export
        const logs = {
            timestamp: new Date().toISOString(),
            logs: this.generateSampleLogs()
        };
        
        const dataStr = JSON.stringify(logs, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `promptguard-logs-${Date.now()}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        // Show success message
        this.showToast('Logs exported successfully!', 'success');
    }

    generateSampleLogs() {
        return {
            sinner_score: 45,
            playbooks: [
                {
                    name: "Repeated Injection",
                    triggered: true,
                    last_trigger: "2024-01-15T12:30:00Z"
                },
                {
                    name: "Secret Leakage",
                    triggered: false,
                    last_trigger: null
                }
            ],
            forensic_logs: Array.from({length: 10}, (_, i) => ({
                id: i + 1,
                timestamp: new Date(Date.now() - i * 3600000).toISOString(),
                event: `Security check ${i + 1}`,
                status: i % 3 === 0 ? 'blocked' : 'passed'
            }))
        };
    }

    showToast(message, type = 'info') {
        // Create toast
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        // Add toast styles
        if (!document.querySelector('#toast-styles')) {
            const toastStyles = `
                .toast {
                    position: fixed;
                    bottom: 24px;
                    right: 24px;
                    background: linear-gradient(135deg, var(--blue-1), var(--blue-3));
                    color: white;
                    padding: 16px 24px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    animation: slideInFromRight 0.3s ease;
                    z-index: 10001;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
                }
                
                .toast-success {
                    background: linear-gradient(135deg, #10b981, #059669);
                }
                
                .toast i {
                    font-size: 20px;
                }
            `;
            
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.textContent = toastStyles;
            document.head.appendChild(style);
        }
        
        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideInFromRight 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize modal when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.analysisModal = new AnalysisModal();
});