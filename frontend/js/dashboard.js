// Dashboard Page Functionality

// Enhanced Opening Animation
function createMatrixRain() {
    const matrixContainer = document.getElementById('matrixRain');
    if (!matrixContainer) return;
    const digits = '01';

    for (let i = 0; i < 50; i++) {
        const digit = document.createElement('div');
        digit.className = 'matrix-digit';
        digit.textContent = digits[Math.floor(Math.random() * digits.length)];
        digit.style.left = `${Math.random() * 100}%`;
        digit.style.animationDuration = `${3 + Math.random() * 7}s`;
        digit.style.animationDelay = `${Math.random() * 5}s`;
        digit.style.opacity = Math.random() * 0.5 + 0.1;
        matrixContainer.appendChild(digit);
    }
}

function createParticles() {
    const container = document.getElementById('bgParticles');
    if (!container) return;
    const particleCount = 30;

    const palette = ['#006F70', '#005F78', '#00547A', '#361F3F'];
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.animationDuration = `${10 + Math.random() * 20}s`;
        particle.style.animationDelay = `${Math.random() * 5}s`;
        particle.style.opacity = Math.random() * 0.3;
        particle.style.backgroundColor = palette[Math.floor(Math.random() * palette.length)];
        container.appendChild(particle);
    }
}

// Enhanced Particle Burst Effect
function createParticleBurst(x, y, color) {
    const container = document.querySelector('.particle-burst-container');
    if (!container) return;

    const burst = document.createElement('div');
    burst.className = 'particle-burst';
    burst.style.left = `${x}px`;
    burst.style.top = `${y}px`;

    for (let i = 0; i < 16; i++) {
        const particle = document.createElement('div');
        particle.className = 'burst-particle';
        particle.style.backgroundColor = color;
        particle.style.animationDelay = `${i * 0.05}s`;
        burst.appendChild(particle);
    }

    container.appendChild(burst);
    setTimeout(() => burst.remove(), 1000);
}

// Create radar scan effect
function createRadarScan() {
    const container = document.querySelector('.radar-container');
    if (!container) return;

    const radar = document.createElement('div');
    radar.className = 'radar-scan';
    radar.style.position = 'absolute';
    radar.style.top = '50%';
    radar.style.left = '50%';
    radar.style.transform = 'translate(-50%, -50%)';

    const line = document.createElement('div');
    line.className = 'radar-line';

    radar.appendChild(line);
    container.appendChild(radar);
}

// Create data flow lines
function createDataFlowLines() {
    const container = document.querySelector('.data-flow-lines');
    if (!container) return;

    for (let i = 0; i < 8; i++) {
        const line = document.createElement('div');
        line.className = 'data-line';
        line.style.top = `${Math.random() * 100}%`;
        line.style.width = `${20 + Math.random() * 80}%`;
        line.style.animationDelay = `${Math.random() * 3}s`;
        line.style.animationDuration = `${2 + Math.random() * 3}s`;
        container.appendChild(line);
    }
}

function createParticleBurstContainer() {
    let container = document.querySelector('.particle-burst-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'particle-burst-container';
        document.querySelector('.app-container').appendChild(container);
    }
    return container;
}

function createRadarContainer() {
    let container = document.querySelector('.radar-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'radar-container';
        document.querySelector('.app-container').appendChild(container);
    }
    return container;
}

function createDataFlowContainer() {
    let container = document.querySelector('.data-flow-lines');
    if (!container) {
        container = document.createElement('div');
        container.className = 'data-flow-lines';
        document.querySelector('.app-container').appendChild(container);
    }
    return container;
}

function initializeBackground() {
    createMatrixRain();
    createParticles();

    // Create containers if needed
    if (document.querySelector('.app-container')) {
        createParticleBurstContainer();
        createRadarContainer();
        createDataFlowContainer();

        // Create effects
        createRadarScan();
        createDataFlowLines();
    }
}

/* -------------------------
   Sidebar open/close helper
   ------------------------- */

function setSidebarState(state) {
    // state: 'minimized' or 'expanded'
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebarToggle');

    if (!sidebar) return;

    if (state === 'minimized') {
        sidebar.classList.add('minimized');
        if (toggle) toggle.title = 'Expand Sidebar';
    } else {
        sidebar.classList.remove('minimized');
        if (toggle) toggle.title = 'Minimize Sidebar';
    }
    localStorage.setItem('sidebarState', state);
    updateSidebarOpener();
}

function updateSidebarOpener() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    let opener = document.getElementById('sidebarOpener');

    if (sidebar.classList.contains('minimized')) {
        // add button if missing
        if (!opener) {
            opener = document.createElement('button');
            opener.id = 'sidebarOpener';
            opener.className = 'sidebar-opener';
            opener.title = 'Open Sidebar';
            opener.innerHTML = '<i class="fas fa-chevron-right"></i>';
            document.body.appendChild(opener);

            opener.addEventListener('click', function () {
                setSidebarState('expanded');
            });
        }
    } else {
        // remove button if present
        if (opener) opener.remove();
    }
}

/* -------------------------
   DOMContentLoaded
   ------------------------- */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize background animations (if present)
    initializeBackground();

    // Launch buttons
    const launchButtons = document.querySelectorAll('.launch-btn');

    launchButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modelCard = this.closest('.model-card');
            const modelType = modelCard && modelCard.dataset ? modelCard.dataset.model : 'text';

            // Store the selected model type in localStorage
            localStorage.setItem('selectedModel', modelType);

            // Add loading animation
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Launching...';
            this.disabled = true;

            // Simulate loading and redirect to chat page
            setTimeout(() => {
                window.location.href = 'chat.html';
            }, 1000);
        });
    });

    // Add hover effects to model cards with particle bursts
    const modelCards = document.querySelectorAll('.model-card:not(.disabled)');

    modelCards.forEach(card => {
        card.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            const color = this.classList.contains('model-card') ? '#C05800' : '#541057';
            createParticleBurst(x, y, color);
        });

        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px) scale(1.02)';
            this.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
        });
    });

    // Add hover effects to layer steps with particle burst
    const layerSteps = document.querySelectorAll('.layer-step');

    layerSteps.forEach(step => {
        step.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.1)';
            const rect = this.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            createParticleBurst(x, y, 'rgba(192, 88, 0, 0.6)');
        });

        step.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });

    // Navigation active state
    const navItems = document.querySelectorAll('.sidebar-nav li');

    navItems.forEach(item => {
        item.addEventListener('click', function() {
            navItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Opening animation hide/show logic
    const openingAnimation = document.getElementById('openingAnimation');
    const appContainer = document.querySelector('.app-container');
    if (openingAnimation && appContainer) {
        // Hide animation and show app after 4 seconds
        setTimeout(() => {
            openingAnimation.style.animation = 'fadeOut 1s ease forwards';
            setTimeout(() => {
                openingAnimation.style.display = 'none';
                appContainer.style.display = 'flex';
                appContainer.style.animation = 'fadeIn 0.5s ease';
            }, 1000);
        }, 4000);
    }

    // Sidebar Minimize/Expand Functionality
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');

    // make toggle defensive (may not exist in some views)
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('minimized');
            const isMinimized = sidebar.classList.contains('minimized');
            // Save state
            setSidebarState(isMinimized ? 'minimized' : 'expanded');
        });
    }

    // restore sidebar state from localStorage
    try {
        const saved = localStorage.getItem('sidebarState');
        if (saved) {
            setSidebarState(saved);
        } else {
            // default: expanded
            updateSidebarOpener(); // ensure opener visibility if needed
        }
    } catch (e) {
        // ignore storage errors
        updateSidebarOpener();
    }

    // ensure opener is correct on load
    updateSidebarOpener();
});
