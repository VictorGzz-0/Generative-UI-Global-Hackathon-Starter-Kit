const cards = document.querySelectorAll('.app-card');
const contentPanel = document.getElementById('content-panel');
const closeBtn = document.getElementById('close-btn');
const panelTitle = document.getElementById('panel-title');
const panelContent = document.getElementById('panel-content');
const cardsContainer = document.querySelector('.cards-container'); // Get reference to cards container
const appDock = document.getElementById('app-dock'); // New: Get reference to the dock
const dockItems = document.querySelectorAll('.dock-item'); // New: Get all dock items

// New: Dock panel elements
const dockPanel = document.getElementById('dock-panel');
const dockPanelTitle = document.getElementById('dock-panel-title');
const dockPanelContent = document.getElementById('dock-panel-content');
const dockCloseBtn = document.getElementById('dock-close-btn'); // New: Close button for dock panel

// New: Global touch variables for body swipe to reveal dock
let bodyTouchStartY = 0;
let bodyTouchEndY = 0;

// New: Map to store initial touch Y for each card for swipe-to-remove
const cardTouchStates = new Map();

// New: History storage (load from localStorage)
let historyEntries = JSON.parse(localStorage.getItem('aiChatHistory') || '[]');

// New: Track cards that are currently being amplified
const amplifyingCards = new Set();

// NEW: Track the currently displayed history entry ID
let currentHistoryEntryId = null;

// New: PDF Generation Options
const pdfOptions = {
    margin: 10,
    filename: 'reporte-ADA-IA.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, logging: false, dpi: 192, letterRendering: true }, // Added logging, dpi, letterRendering for potentially better quality
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
};

document.body.addEventListener('touchstart', (e) => {
    // Only track if a single touch is active and no panels are open
    if (e.touches.length === 1 && !contentPanel.classList.contains('active') && !dockPanel.classList.contains('active')) {
        bodyTouchStartY = e.touches[0].screenY;
    }
});

document.body.addEventListener('touchend', (e) => {
    // Only process if a single touch ended and no panels are open
    if (e.changedTouches.length === 1 && !contentPanel.classList.contains('active') && !dockPanel.classList.contains('active')) {
        bodyTouchEndY = e.changedTouches[0].screenY;
        handleBodySwipe();
    }
});

function handleBodySwipe() {
    // Swipe up (end Y is less than start Y) and dock is hidden
    const swipeThreshold = 70; // Pixels for a significant swipe
    if (appDock.classList.contains('hidden') && bodyTouchEndY < bodyTouchStartY - swipeThreshold) {
        appDock.classList.remove('hidden');
    }
}

const contentData = {
    info: {
        title: 'Información General',
        content: `
            <div class="content-section">
   <p>¡Hola! Soy ADA, un agente creado por el <strong>Centro de Investigación y Docencia Económicas (CIDE)</strong>. 
    Estoy aquí para apoyarte en el fortalecimiento de tus estrategias de comercio internacional y atracción de inversión en México.</p>
</div>

<div class="content-section">
    <h3>¿En qué puedo ayudarte?</h3>
    <ul>
        <li><strong>Atracción de Inversión Extranjera Directa (IED):</strong> Identifica oportunidades para invertir en sectores estratégicos de México.</li>
        <li><strong>Promoción de Exportaciones Mexicanas:</strong> Encuentra mercados internacionales ideales para tus productos.</li>
        <li><strong>Internacionalización de Empresas:</strong> Diseña estrategias para expandir tu empresa mexicana al extranjero.</li>
        <li><strong>Fortalecimiento de la Imagen de México:</strong> Apoya proyectos que impulsen la presencia global del país.</li>
    </ul>
</div>

<div class="content-section">
    <h3>¿Qué necesito saber para asesorarte mejor?</h3>
    <ul>
        <li><strong>Sector o industria de interés:</strong> (Ejemplo: automotriz, agroindustrial, tecnológico, etc.)</li>
        <li><strong>Objetivo específico de tu consulta:</strong> (Ejemplo: atraer inversión, buscar compradores, expandirte internacionalmente)</li>
        <li><strong>Tipo de empresa:</strong>
            <ul>
                <li>Mexicana</li>
                <li>Extranjera</li>
            </ul>
        </li>
        <li><strong>Región geográfica de interés:</strong>
            <ul>
                <li>Estados o regiones dentro de México</li>
                <li>Países o regiones internacionales</li>
            </ul>
        </li>
    </ul>
</div>

<div class="content-section">
    <h3>¿Qué puedo ofrecerte?</h3>
    <ul>
        <li><strong>Análisis de mercado actualizados:</strong> Identificación de tendencias, riesgos y oportunidades.</li>
        <li><strong>Información regulatoria relevante:</strong> Normas, tratados comerciales y políticas de inversión.</li>
        <li><strong>Contactos clave en el sector:</strong> Entidades, cámaras empresariales y socios estratégicos.</li>
        <li><strong>Oportunidades específicas de negocio:</strong> Sectores en expansión y proyectos de inversión activos.</li>
        <li><strong>Estrategias de entrada al mercado:</strong> Recomendaciones personalizadas para lograr un aterrizaje exitoso.</li>
    </ul>
</div>

<div class="content-section">
    <h3>Fuentes de información y herramientas</h3>
    <p>Cuento con acceso a <strong>DataMéxico</strong> y otras bases de datos institucionales que me permiten ofrecerte reportes detallados 
    sobre empresas, sectores y contactos relevantes.</p>
    <p><em>Puedo enviarte tu reporte directamente por correo electrónico.</em></p>
</div>

<div class="content-section">
    <h3>¡Comencemos tu estrategia internacional!</h3>
    <p>Cuéntame qué información específica estás buscando o qué proyecto deseas impulsar, 
    y trabajaremos juntos para conectar tu iniciativa con las mejores oportunidades globales.</p>
</div>


        `
    },
    video: {
        title: 'Video Recomendado',
        content: `
            <div class="content-section">
                <p>Descubre como ADA te puede ayudar.</p>
                <div class="video-container">
                    <iframe src="https://www.youtube.com/embed/2UqUVBM10Fk?si=kfLWFQk-tez4hkp5" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                </div>
            </div>
        `
    }
};

// New: Content data for dock actions (initial static structure, dynamic content will replace it)
const dockContentData = {
    chat: {
        title: '¡Hola! soy ADA',
        content: `
            <div class="content-section">
                <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                    <img src="/logoADA.png" alt="ADA Logo" style="width: 80px; height: 80px; margin-right: 15px; border-radius: 50%; object-fit: cover; border: 2px solid var(--palm-link);">
                </div>
                <p>Te apoyare con estrategias de comercio y atracción de inversión.</p>
                <div class="chat-input-area">
                    <div style="display: flex; align-items: center; justify-content: flex-start; gap: 10px; margin-bottom: 10px;">
                        <label style="color: var(--palm-light); font-weight: 600;">solo CHAT</label>
                        <label class="switch" style="position: relative; display: inline-block; width: 50px; height: 24px;">
                            <input type="checkbox" id="chat-role-switch" style="opacity: 0; width: 0; height: 0;" checked>
                            <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--palm-divider); transition: .4s; border-radius: 24px; box-shadow: inset 0 1px 3px rgba(0,0,0,0.3);"></span>
                            <span style="position: absolute; content: ''; height: 18px; width: 18px; left: 3px; top: 3px; background-color: var(--palm-light); transition: .4s; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></span>
                        </label>
                    </div>
                    <textarea id="chat-input" placeholder="Sobre que te gustaria saber..." rows="4"></textarea>
                    <button id="send-chat-btn">Enviar</button>
                </div>
                <div id="chat-feedback" style="margin-top: 15px; text-align: center; font-style: italic;"></div>
                <div id="progress-area" class="progress-area">
                    <p id="progress-message" class="progress-message">Procesando consulta...</p>
                    <div class="progress-bar-container">
                        <div class="progress-bar" id="progress-bar"></div>
                    </div>
                </div>
            </div>
        `
    },
    recommendations: {
        title: 'Cultura Viva Mx',
        content: `
            <div class="content-section" style="flex-grow: 1; display: flex; flex-direction: column;">
                <div style="position: relative; width: 100%; flex-grow: 1; border-radius: 10px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.2);">
                    <iframe src="https://cultura-mexico.netlify.app/" 
                            style="width: 100%; height: 100%; border: none;" 
                            frameborder="0"
                            allowfullscreen>
                    </iframe>
                </div>
            </div>
        `
    },
    // Placeholder content for download-pdf action, actual generation is handled by function
    'download-pdf': {
        title: 'Copiar Reporte',
        content: '<div class="content-section" style="text-align:center;"><p>Preparando contenido para copiar...</p></div>'
    },
    telegram: {
        title: 'Contáctanos en Telegram',
        content: `
            <div class="content-section" style="text-align: center; display: flex; flex-direction: column; align-items: center;">
                <p>Escanea el código QR o busca nuestro bot:</p>
                <img src="/QRADA_Viajes.png" alt="Telegram QR Code" style="width: 100%; max-width: 165px; height: auto; margin: 20px auto; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.2);">
                <a href="https://t.me/ADATAMEX_BOT" target="_blank" class="external-link" style="margin-top: 15px;">Abrir en Telegram</a>
            </div>
        `
    }
};

// New: Maximum cards visible at once in carousel mode
const MAX_VISIBLE_CARDS = 5;
let currentCardPage = 0;

function openPanel(cardType) {
    const data = contentData[cardType];
    if (!data) return;

    panelTitle.textContent = data.title;
    panelContent.innerHTML = data.content; // Content is already HTML if parsed by marked.js

    // Check if this card is currently being amplified and update button state
    if (amplifyingCards.has(cardType)) {
        const amplifyBtn = panelContent.querySelector(`[data-card-id="${cardType}"]`);
        if (amplifyBtn) {
            amplifyBtn.disabled = true;
            amplifyBtn.textContent = 'Ampliando...';
            amplifyBtn.style.background = 'var(--palm-muted)';
        }
    }

    contentPanel.classList.add('active');
    cardsContainer.classList.add('panel-open'); // Add class to cards container when panel opens
    appDock.classList.add('hidden'); // Hide the dock when a main panel opens

    // Add active state to clicked card
    document.querySelectorAll('.app-card').forEach(card => {
        if (card.dataset.card === cardType) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });

    // Close dock panel if it's open
    closeDockPanel();
}

function closePanel() {
    contentPanel.classList.remove('active');
    cardsContainer.classList.remove('panel-open'); // Remove class from cards container when panel closes
    document.querySelectorAll('.app-card').forEach(card => card.classList.remove('active')); // Remove active state from all cards
    appDock.classList.remove('hidden'); // Show the dock when the main panel closes
}

// Attach click event listeners via delegation for cards
cardsContainer.addEventListener('click', (e) => {
    const cardElement = e.target.closest('.app-card');
    if (cardElement && !cardElement.classList.contains('removing')) {
        openPanel(cardElement.dataset.card);
    }
});

closeBtn.addEventListener('click', closePanel);

// Close panel when clicking outside
contentPanel.addEventListener('click', (e) => {
    if (e.target === contentPanel) {
        closePanel();
    }
});

// Handle mobile touch gestures for main content panel (swipe left to close)
let touchStartX = 0;
let touchEndX = 0;

contentPanel.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
});

contentPanel.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    // Swipe left to close (from right to left)
    if (touchEndX < touchStartX - 50) {
        closePanel();
    }
}

// New: Helper function to remove a card visually and from DOM
function removeCard(card) {
    card.classList.add('removing'); // Add class for CSS animation
    card.addEventListener('transitionend', () => {
        card.remove(); // Remove from DOM after animation
        setupCardCarousel(); // Recalculate carousel
        updateCardRotations(); // Reapply rotations to remaining cards
    }, { once: true });
}

// New: Function to update card rotations dynamically after removal or addition
function updateCardRotations() {
    const currentCards = document.querySelectorAll('.app-card:not(.removing):not([style*="display: none"])'); // Exclude hidden cards in carousel
    const totalCards = currentCards.length;

    currentCards.forEach((card, index) => {
        let initialRotate;
        let newZIndex;

        if (totalCards <= 1) { // If 0 or 1 card left, no fan effect
            initialRotate = 0;
            newZIndex = 1;
        } else {
            const baseRotation = 15; // Max rotation for outer cards
            // Distribute rotation evenly across remaining cards
            initialRotate = -baseRotation + (index * (baseRotation * 2 / (totalCards - 1)));
            newZIndex = totalCards - index; // Deeper cards have lower z-index
        }

        card.style.setProperty('--initial-rotate', `${initialRotate}deg`);

        // Apply transform and z-index only if the card is NOT active
        // Active cards rely on their .active class for z-index: 6 and specific transform.
        if (!card.classList.contains('active')) {
            card.style.transform = `rotate(${initialRotate}deg)`; // Apply calculated rotation
            card.style.zIndex = newZIndex; // Apply calculated z-index for non-active cards
        } else {
            // For active cards, ensure no conflicting inline styles from this function
            card.style.removeProperty('transform'); // Let CSS .app-card.active handle transform
            card.style.removeProperty('z-index'); // Let CSS .app-card.active handle z-index
        }
    });
}

// New: Function to add touch listeners for swipe-to-remove
function addCardTouchListeners(cardElement) {
    cardElement.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            // Store touch state only if no panels are open
            if (!contentPanel.classList.contains('active') && !dockPanel.classList.contains('active')) {
                cardTouchStates.set(cardElement, { 
                    startY: e.touches[0].screenY,
                    startX: e.touches[0].screenX
                });
            }
        }
    });

    cardElement.addEventListener('touchend', (e) => {
        if (e.changedTouches.length === 1) {
            const touchState = cardTouchStates.get(cardElement);
            if (touchState) {
                const endY = e.changedTouches[0].screenY;
                const endX = e.changedTouches[0].screenX;
                const swipeThreshold = 100; // Pixels for a significant swipe
                
                // Detect orientation
                const isPortrait = window.innerHeight > window.innerWidth;

                // Check for appropriate swipe based on orientation
                if (!contentPanel.classList.contains('active') && !dockPanel.classList.contains('active')) {
                    if (isPortrait) {
                        // Portrait: right-to-left swipe
                        if (endX < touchState.startX - swipeThreshold) {
                            removeCard(cardElement);
                        }
                    } else {
                        // Landscape: upward swipe
                        if (endY < touchState.startY - swipeThreshold) {
                            removeCard(cardElement);
                        }
                    }
                }
            }
            cardTouchStates.delete(cardElement); // Clean up state
        }
    });
}

// Initial application of touch listeners to existing cards
cards.forEach(addCardTouchListeners);

// Initial call to update card rotations to ensure consistency.
updateCardRotations();

// New: Function to process markdown report and display cards
function processAndDisplayReport(reportMarkdown) {
    const appTitleElement = document.querySelector('.app-title');
    const appSubtitleElement = document.querySelector('.app-subtitle');
    let contentToProcessForCards = reportMarkdown; // The remaining content after title/subtitle extraction

    // 1. Try to extract main title (prefixed with #)
    const titleMatch = contentToProcessForCards.match(/^#\s*(.*?)\n/);
    let mainTitle = 'ADA IA'; // Default title
    if (titleMatch) {
        mainTitle = titleMatch[1].trim();
        appTitleElement.textContent = mainTitle;
        contentToProcessForCards = contentToProcessForCards.substring(titleMatch[0].length).trim();
    } else {
        appTitleElement.textContent = 'ADA IA';
    }

    // 2. Extract subtitle (text between main title line and first ## section)
    const firstSectionDelimiterIndex = contentToProcessForCards.indexOf('\n\n##');
    let subtitleText = '';

    if (firstSectionDelimiterIndex !== -1) {
        subtitleText = contentToProcessForCards.substring(0, firstSectionDelimiterIndex).trim();
        contentToProcessForCards = contentToProcessForCards.substring(firstSectionDelimiterIndex).trim();
    } else {
        subtitleText = contentToProcessForCards.trim();
        contentToProcessForCards = '';
    }

    if (subtitleText) {
        // Fix for "Invalid regular expression: missing /" by using RegExp constructor
        appSubtitleElement.textContent = marked.parse(subtitleText).replace(new RegExp('<[^>]*>', 'g'), '').trim();
    } else {
        appSubtitleElement.textContent = 'Explora los detalles de tu consulta';
    }

    // Remove previously generated AI cards and their content data
    document.querySelectorAll('.app-card[data-card^="ai-report-"]').forEach(card => card.remove());
    // Remove initial cards (Conoce ADA and Video Adicional)
    document.querySelectorAll('.app-card[data-card="info"], .app-card[data-card="video"]').forEach(card => card.remove());
    for (const key in contentData) {
        if (key.startsWith('ai-report-')) {
            delete contentData[key];
        }
    }

    // 3. Process remaining content for '\n\n## ' sections to create cards (only exact match with space)
    const sections = contentToProcessForCards.split('\n\n## ').map(s => s.trim()).filter(s => s.length > 0);

    for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const lines = section.split('\n');
        let cardTitle = lines[0].trim();
        const cardRawContent = lines.slice(1).join('\n').trim();

        // Remove all leading # symbols and trim whitespace
        while (cardTitle.startsWith('#')) {
            cardTitle = cardTitle.substring(1).trim();
        }
        if (cardTitle.startsWith('**') && cardTitle.endsWith('**')) {
            cardTitle = cardTitle.substring(2, cardTitle.length - 2).trim();
        }

        // VALIDATION: Only create card if both title and content exist
        if (cardTitle && cardRawContent) {
            const newCardId = `ai-report-${Date.now()}-${i}`;
            contentData[newCardId] = {
                title: cardTitle,
                content: `<div class="content-section">${marked.parse(cardRawContent)}<div class="amplify-section" style="margin-top: 20px; text-align: center; border-top: 1px solid rgba(63,68,72,.3); padding-top: 15px;"><button class="amplify-btn" data-card-id="${newCardId}" style="background: var(--palm-link); color: var(--palm-light); border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 1rem; transition: var(--palm-background-transition);">Ampliar respuesta</button></div><div class="amplified-content" id="amplified-${newCardId}" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(63,68,72,.2); display: none;"></div></div>`
            };

            const newCardElement = document.createElement('div');
            newCardElement.classList.add('app-card');
            newCardElement.dataset.card = newCardId;
            newCardElement.innerHTML = `
                <div class="card-icon">📖</div>
                <h3>${cardTitle}</h3>
                <div class="card-indicator"></div>
            `;
            cardsContainer.appendChild(newCardElement);
            addCardTouchListeners(newCardElement);
        }
    }

    // NEW: Setup carousel if needed
    setupCardCarousel();
    updateCardRotations();
    closeDockPanel(); // Close dock panel after processing and displaying cards
}

// NEW: Card carousel system
function setupCardCarousel() {
    const allCards = Array.from(document.querySelectorAll('.app-card:not(.removing)'));

    // Remove existing carousel controls
    const existingControls = document.querySelector('.carousel-controls');
    if (existingControls) existingControls.remove();

    if (allCards.length <= MAX_VISIBLE_CARDS) {
        // No carousel needed
        allCards.forEach(card => card.style.display = '');
        currentCardPage = 0;
        return;
    }

    // Create carousel controls
    const carouselControls = document.createElement('div');
    carouselControls.className = 'carousel-controls';
    carouselControls.innerHTML = `
        <button class="carousel-btn carousel-prev" title="Tarjetas anteriores">‹</button>
        <span class="carousel-indicator"></span>
        <button class="carousel-btn carousel-next" title="Siguientes tarjetas">›</button>
    `;
    cardsContainer.insertAdjacentElement('afterend', carouselControls);

    // Add event listeners
    const prevBtn = carouselControls.querySelector('.carousel-prev');
    const nextBtn = carouselControls.querySelector('.carousel-next');

    prevBtn.addEventListener('click', () => {
        if (currentCardPage > 0) {
            currentCardPage--;
            updateCarouselView();
        }
    });

    nextBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(allCards.length / MAX_VISIBLE_CARDS);
        if (currentCardPage < totalPages - 1) {
            currentCardPage++;
            updateCarouselView();
        }
    });

    updateCarouselView();
}

function updateCarouselView() {
    const allCards = Array.from(document.querySelectorAll('.app-card:not(.removing)'));
    const totalPages = Math.ceil(allCards.length / MAX_VISIBLE_CARDS);
    const startIdx = currentCardPage * MAX_VISIBLE_CARDS;
    const endIdx = startIdx + MAX_VISIBLE_CARDS;

    // Show/hide cards based on current page
    allCards.forEach((card, idx) => {
        if (idx >= startIdx && idx < endIdx) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });

    // Update indicator
    const indicator = document.querySelector('.carousel-indicator');
    if (indicator) {
        indicator.textContent = `${currentCardPage + 1} / ${totalPages}`;
    }

    // Update button states
    const prevBtn = document.querySelector('.carousel-prev');
    const nextBtn = document.querySelector('.carousel-next');

    if (prevBtn) prevBtn.disabled = currentCardPage === 0;
    if (nextBtn) nextBtn.disabled = currentCardPage === totalPages - 1;

    // Reapply rotations to visible cards after changing page
    updateCardRotations();
}

// New: Function to handle amplify button clicks
function handleAmplifyResponse(cardId) {
    const amplifyBtn = document.querySelector(`[data-card-id="${cardId}"]`);
    const amplifiedSection = document.getElementById(`amplified-${cardId}`);
    const cardElement = document.querySelector(`[data-card="${cardId}"]`);

    if (!amplifyBtn || !amplifiedSection) return;

    // Prevent multiple amplifications on the same card
    if (amplifyingCards.has(cardId)) {
        return;
    }

    // Get the card content (excluding the amplify button section)
    const cardData = contentData[cardId];
    if (!cardData) return;

    // Extract just the text content from the card for sending to webhook
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = cardData.content;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';

    amplifyBtn.disabled = true;
    amplifyBtn.textContent = 'Ampliando...';
    amplifyBtn.style.background = 'var(--palm-muted)';

    // Add to amplifying set
    amplifyingCards.add(cardId);

    // Add amplifying state to card
    if (cardElement) {
        cardElement.classList.add('amplifying');
    }

    const webhookUrl = "https://cidedata.app.n8n.cloud/webhook/7917986b-b4cd-4760-bcc1-adataweb";

    const urlWithParams = `${webhookUrl}?message=${encodeURIComponent(textContent)}`;

    fetch(urlWithParams, {
        method: 'GET',
    })
    .then(response => response.json())
    .then(responseData => {
        // Remove from amplifying set
        amplifyingCards.delete(cardId);

        // Remove amplifying state, add amplified state
        if (cardElement) {
            cardElement.classList.remove('amplifying');
            cardElement.classList.add('amplified');

            // Remove amplified state after 3 seconds
            setTimeout(() => {
                cardElement.classList.remove('amplified');
            }, 3000);
        }

        // Get the response content and ensure it's prefixed with #
        let responseContent = responseData.Reporte || responseData.response || JSON.stringify(responseData);

        // Ensure the response starts with # for proper title extraction
        if (!responseContent.trim().startsWith('#')) {
            responseContent = '# ' + responseContent;
        }

        // Parse the amplified content to extract new title
        const titleMatch = responseContent.match(/^#\\s*(.*?)(?:\\n|$)/);
        let newTitle = cardData.title; // Default to existing title
        let newContent = responseContent;

        if (titleMatch) {
            newTitle = titleMatch[1].trim();
            // Remove the title line from content
            newContent = responseContent.substring(titleMatch[0].length).trim();
        }

        // Remove all leading # symbols from the new title
        while (newTitle.startsWith('#')) {
            newTitle = newTitle.substring(1).trim();
        }
        if (newTitle.startsWith('**') && newTitle.endsWith('**')) {
            newTitle = newTitle.substring(2, newTitle.length - 2).trim();
        }

        // Update the card's title in the DOM
        const cardTitleElement = cardElement.querySelector('h3');
        if (cardTitleElement) {
            cardTitleElement.textContent = newTitle;
        }

        // Replace the card's content completely with the new amplified content
        const newCardContent = `<div class="content-section">${marked.parse(newContent)}<div class="amplify-section" style="margin-top: 20px; text-align: center; border-top: 1px solid rgba(63,68,72,.3); padding-top: 15px;"><button class="amplify-btn" data-card-id="${cardId}" style="background: var(--palm-green); color: var(--palm-light); border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 1rem; transition: var(--palm-background-transition); cursor: not-allowed; opacity: 0.7;" disabled>Respuesta ampliada ✓</button></div></div>`;

        // Update contentData with new title and content
        contentData[cardId] = {
            title: newTitle,
            content: newCardContent
        };

        // Update the panel if it's currently showing this card
        if (contentPanel.classList.contains('active') && panelTitle.textContent === cardData.title) {
            panelTitle.textContent = newTitle;
            panelContent.innerHTML = newCardContent;
        }

        // Update history entry with amplified content
        try {
            if (historyEntries && historyEntries.length > 0 && currentHistoryEntryId) {
                // Find the current history entry by ID
                const currentEntryIndex = historyEntries.findIndex(h => h.id === currentHistoryEntryId);
                
                if (currentEntryIndex !== -1) {
                    // Replace the card section in the markdown content
                    const cardSectionRegex = new RegExp(`## ${cardData.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?(?=\\n\\n##|$)`, 'g');
                    historyEntries[currentEntryIndex].markdownContent = historyEntries[currentEntryIndex].markdownContent.replace(
                        cardSectionRegex,
                        `## ${newTitle}\n\n${newContent}`
                    );
                    historyEntries[currentEntryIndex].timestamp = new Date().toLocaleString();
                    localStorage.setItem('aiChatHistory', JSON.stringify(historyEntries));
                }
            }
        } catch (errHistory) {
            console.warn('No se pudo persistir la ampliación en el historial:', errHistory);
        }
    })
    .catch(error => {
        console.error('Error amplifying response:', error);

        // Remove from amplifying set
        amplifyingCards.delete(cardId);

        // Remove amplifying state on error
        if (cardElement) {
            cardElement.classList.remove('amplifying');
        }

        amplifyBtn.textContent = 'Error - Intentar de nuevo';
        amplifyBtn.style.background = 'var(--palm-red)';
        amplifyBtn.disabled = false;
    });
}

// New: Event delegation for amplify buttons
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('amplify-btn')) {
        const cardId = e.target.dataset.cardId;
        if (cardId) {
            handleAmplifyResponse(cardId);
        }
    }
});

// New: Functions to open and close the dock panel
function openDockPanel(actionType) {
    const data = dockContentData[actionType];
    if (!data && actionType !== 'history' && actionType !== 'download-pdf') return; // download-pdf is now special

    // Handle download-pdf specially - generate preview content
    if (actionType === 'download-pdf') {
        dockPanelTitle.textContent = 'Vista Previa del Reporte';
        
        const title = document.querySelector('.app-title').textContent;
        const subtitle = document.querySelector('.app-subtitle').textContent;
        
        let previewHTML = `
            <div class="content-section" style="padding: 20px;">
                <h1 style="color: var(--palm-light); margin-bottom: 10px; font-size: 1.8rem; border-bottom: 2px solid rgba(63,68,72,.3); padding-bottom: 10px;">${title}</h1>
                <p style="color: var(--palm-muted); margin-bottom: 30px; font-size: 1rem; line-height: 1.6;">${subtitle}</p>
        `;
        
        // Iterate through cards present in DOM (not removed)
        const currentCards = document.querySelectorAll('.app-card[data-card^="ai-report-"]:not(.removing)');
        currentCards.forEach(cardElement => {
            const cardId = cardElement.dataset.card;
            const cardData = contentData[cardId];
            if (cardData && cardData.content) {
                // Create a temporary div to parse and clean the content
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = cardData.content;
                
                // Get the content-section div
                const contentSection = tempDiv.querySelector('.content-section');
                if (contentSection) {
                    // Remove amplify button section
                    const amplifySection = contentSection.querySelector('.amplify-section');
                    if (amplifySection) amplifySection.remove();
                    
                    // Remove amplified content section
                    const amplifiedContent = contentSection.querySelector('.amplified-content');
                    if (amplifiedContent) amplifiedContent.remove();
                    
                    // Get cleaned HTML
                    let cleanedContent = contentSection.innerHTML;
                    
                    previewHTML += `
                        <h2 style="color: var(--palm-light); margin-top: 30px; margin-bottom: 15px; font-size: 1.4rem;">${cardData.title}</h2>
                        <div style="color: var(--palm-light); line-height: 1.6; margin-bottom: 20px;">${cleanedContent}</div>
                    `;
                }
            }
        });
        
        previewHTML += `
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(63,68,72,.3);">
                    <button id="actual-download-pdf-btn" style="background: var(--palm-link); color: var(--palm-light); border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 1rem; transition: var(--palm-background-transition);">Copiar Texto</button>
                </div>
            </div>
        `;
        
        dockPanelContent.innerHTML = previewHTML;
        
        // Add event listener for the copy button inside the preview
        const copyBtn = dockPanelContent.querySelector('#actual-download-pdf-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                copyReportToClipboard(copyBtn);
            });
        }
    } else {
        dockPanelTitle.textContent = data ? data.title : 'Historial de Consultas';
        // For chat and recommendations, use static content
        if (actionType === 'chat' || actionType === 'recommendations' || actionType === 'telegram') {
            dockPanelContent.innerHTML = data.content;
        }
    }

    dockPanel.classList.add('active');
    closePanel(); // Close main content panel if it's open

    // Add/remove full-screen class based on actionType
    if (actionType === 'recommendations') {
        dockPanel.classList.add('full-screen');
    } else {
        dockPanel.classList.remove('full-screen');
    }

    if (actionType === 'chat') {
        const chatInput = dockPanelContent.querySelector('#chat-input');
        const sendButton = dockPanelContent.querySelector('#send-chat-btn');
        const feedbackDiv = dockPanelContent.querySelector('#chat-feedback');
        const progressArea = dockPanelContent.querySelector('#progress-area');
        const progressBar = dockPanelContent.querySelector('#progress-bar');
        const progressMessage = dockPanelContent.querySelector('#progress-message');

        // Hide progress area by default
        if (progressArea) progressArea.style.display = 'none';
        if (progressBar) progressBar.style.width = '0%';

        if (sendButton && chatInput && feedbackDiv) {
            sendButton.onclick = async () => {
                const message = chatInput.value.trim();
                const roleSwitch = dockPanelContent.querySelector('#chat-role-switch');
                const rolValue = roleSwitch ? roleSwitch.checked : false;

                if (!message) {
                    feedbackDiv.textContent = 'Por favor, escribe un mensaje.';
                    feedbackDiv.style.color = 'var(--palm-orange)';
                    setTimeout(() => { feedbackDiv.textContent = ''; }, 2000);
                    return;
                }

                feedbackDiv.textContent = ''; // Clear previous feedback
                sendButton.disabled = true;
                chatInput.disabled = true;

                // Show and reset progress
                if (progressArea) progressArea.style.display = 'block';
                if (progressMessage) progressMessage.textContent = 'Enviando consulta. Esto puede tomar un momento...';
                if (progressBar) progressBar.style.width = '0%';

                let currentProgress = 0;
                const maxPreCompleteProgress = 98; // Don't reach 100% until actual completion
                const progressInterval = setInterval(() => {
                    if (currentProgress < maxPreCompleteProgress) {
                        currentProgress += 1; // Increment by 1%
                        if (progressBar) progressBar.style.width = `${currentProgress}%`;
                    }
                }, 800); // Increment every 350ms for a slow pace

                const webhookUrl = "https://cidedata.app.n8n.cloud/webhook/7917986b-b4cd-4760-bcc1-adataweb";

                try {
                    const urlWithParams = `${webhookUrl}?message=${encodeURIComponent(message)}&rol=${rolValue}`;

                    const response = await fetch(urlWithParams, {
                        method: 'GET',
                    });

                    if (response.ok) {
                        const responseData = await response.json();
                        const reportContent = responseData.Reporte;

                        if (reportContent) {
                            // Extract main title for history storage before processing
                            const tempTitleMatch = reportContent.match(/^#\s*(.*?)\n/);
                            const mainTitleForHistory = tempTitleMatch ? tempTitleMatch[1].trim() : `Consulta AI (${new Date().toLocaleDateString()})`;

                            // Save to history
                            const newEntryId = Date.now().toString();
                            historyEntries.push({
                                id: newEntryId,
                                title: mainTitleForHistory,
                                markdownContent: reportContent,
                                timestamp: new Date().toLocaleString()
                            });
                            localStorage.setItem('aiChatHistory', JSON.stringify(historyEntries));

                            // NEW: Set the current history entry ID to the newly created entry
                            currentHistoryEntryId = newEntryId;

                            processAndDisplayReport(reportContent); // Use the new function
                            feedbackDiv.textContent = '¡Reporte IA añadido como nueva tarjeta(s)!';
                            feedbackDiv.style.color = 'var(--palm-green)';
                            chatInput.value = '';
                        } else {
                            feedbackDiv.textContent = 'Respuesta de IA vacía o inesperada.';
                            feedbackDiv.style.color = 'var(--palm-orange)';
                        }
                    } else {
                        const errorText = await response.text();
                        feedbackDiv.textContent = `Error al enviar: ${response.status} ${response.statusText} - ${errorText.substring(0, 50)}...`;
                        feedbackDiv.style.color = 'var(--palm-red)';
                        console.error('Webhook error:', response.status, response.statusText, errorText);
                    }
                } catch (error) {
                    feedbackDiv.textContent = 'Error de red. Inténtalo de nuevo.';
                    feedbackDiv.style.color = 'var(--palm-red)';
                    console.error('Fetch error:', error);
                } finally {
                    clearInterval(progressInterval); // Stop the slow increment
                    // Complete progress bar to 100%
                    if (progressBar) progressBar.style.width = '100%';
                    if (progressMessage) progressMessage.textContent = 'Consulta completada.';

                    setTimeout(() => {
                        if (progressArea) progressArea.style.display = 'none';
                        sendButton.disabled = false;
                        chatInput.disabled = false;
                        setTimeout(() => { feedbackDiv.textContent = ''; }, 3000);
                    }, 500); // Short delay to show 100% before hiding
                }
            };
        }
    } else if (actionType === 'history') {
        renderHistoryPanelContent();
    }
}

function renderHistoryPanelContent() {
    let historyHtml = `
        <div class="content-section">
            <ul class="history-list" id="history-list">
    `;
    if (historyEntries.length === 0) {
        historyHtml += '<li style="color:var(--palm-muted);">No hay consultas anteriores.</li>';
    } else {
        historyEntries.slice().reverse().forEach(entry => {
            historyHtml += `
                <li class="history-item">
                    <a href="#" data-history-id="${entry.id}">${entry.title} <span class="history-timestamp">${entry.timestamp}</span></a>
                    <button class="history-delete-btn" data-delete-id="${entry.id}" title="Eliminar">×</button>
                </li>
            `;
        });
    }
    historyHtml += `
            </ul>
            <button class="clear-history-btn" id="clear-history-btn">Limpiar todo el historial</button>
        </div>
    `;
    dockPanelContent.innerHTML = historyHtml;

    // Add event listeners for history items
    const historyList = dockPanelContent.querySelector('#history-list');
    if (historyList) {
        historyList.addEventListener('click', (e) => {
            if (e.target.tagName === 'A' && e.target.dataset.historyId) {
                e.preventDefault();
                const entryId = e.target.dataset.historyId;
                const entry = historyEntries.find(h => h.id === entryId);
                if (entry) {
                    // NEW: Set the current history entry ID when loading from history
                    currentHistoryEntryId = entry.id;
                    
                    processAndDisplayReport(entry.markdownContent);
                    closeDockPanel();
                }
            } else if (e.target.classList.contains('history-delete-btn')) {
                const deleteId = e.target.dataset.deleteId;
                deleteHistoryEntry(deleteId);
            }
        });
    }

    const clearBtn = dockPanelContent.querySelector('#clear-history-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm('¿Estás seguro de que deseas borrar todo el historial?')) {
                historyEntries = [];
                localStorage.setItem('aiChatHistory', JSON.stringify(historyEntries));
                renderHistoryPanelContent();
            }
        });
    }
}

function deleteHistoryEntry(entryId) {
    historyEntries = historyEntries.filter(entry => entry.id !== entryId);
    localStorage.setItem('aiChatHistory', JSON.stringify(historyEntries));
    renderHistoryPanelContent();
}

function closeDockPanel() {
    dockPanel.classList.remove('active');
    dockPanel.classList.remove('full-screen');
}

// Dock panel close button
dockCloseBtn.addEventListener('click', closeDockPanel);

// Close dock panel when clicking outside
dockPanel.addEventListener('click', (e) => {
    if (e.target === dockPanel) {
        closeDockPanel();
    }
});

// Dock items click handlers
dockItems.forEach(item => {
    item.addEventListener('click', () => {
        const action = item.dataset.action;
        openDockPanel(action); // Now all actions open dock panel, including download-pdf
    });
});

// PDF generation function
function generateAndDownloadPDF() {
    const pdfContent = document.createElement('div');
    pdfContent.style.padding = '20px';
    pdfContent.style.backgroundColor = '#ffffff';
    pdfContent.style.color = '#000000';
    pdfContent.style.fontFamily = 'Arial, sans-serif';

    const title = document.querySelector('.app-title').textContent;
    const subtitle = document.querySelector('.app-subtitle').textContent;

    pdfContent.innerHTML = `
        <h1 style="color: #000; margin-bottom: 10px;">${title}</h1>
        <p style="color: #333; margin-bottom: 20px; font-size: 14px;">${subtitle}</p>
        <hr style="border: 1px solid #ccc; margin-bottom: 20px;"/>
    `;

    // Iterate through cards present in DOM (not removed)
    const currentCards = document.querySelectorAll('.app-card[data-card^="ai-report-"]:not(.removing)');
    currentCards.forEach(cardElement => {
        const cardId = cardElement.dataset.card;
        const cardData = contentData[cardId];
        if (cardData && cardData.content) {
            // Create a temporary div to parse and clean the content
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = cardData.content;
            
            // Get the content-section div
            const contentSection = tempDiv.querySelector('.content-section');
            if (contentSection) {
                // Remove amplify button section
                const amplifySection = contentSection.querySelector('.amplify-section');
                if (amplifySection) amplifySection.remove();
                
                // Remove amplified content section
                const amplifiedContent = contentSection.querySelector('.amplified-content');
                if (amplifiedContent) amplifiedContent.remove();
                
                // Get cleaned HTML
                let cleanedContent = contentSection.innerHTML;
                
                // Create final section with proper styling
                const section = document.createElement('div');
                section.style.marginBottom = '30px';
                section.style.pageBreakInside = 'avoid';
                section.innerHTML = `
                    <h2 style="color: #000; margin-bottom: 15px; font-size: 18px; font-weight: bold;">${cardData.title}</h2>
                    <div style="color: #000; font-size: 12px; line-height: 1.6;">${cleanedContent}</div>
                    <hr style="border: 1px solid #eee; margin-top: 20px;"/>
                `;
                
                // Override all nested elements to black text
                section.querySelectorAll('*').forEach(el => {
                    el.style.color = '#000';
                });
                
                pdfContent.appendChild(section);
            }
        }
    });

    html2pdf().set(pdfOptions).from(pdfContent).save();
}

// Copy to clipboard function
function copyReportToClipboard(buttonElement) {
    const title = document.querySelector('.app-title').textContent;
    const subtitle = document.querySelector('.app-subtitle').textContent;
    
    let htmlContent = `<h1>${title}</h1><p>${subtitle}</p><hr/>`;
    let textContent = `${title}\n\n${subtitle}\n\n`;
    
    // Iterate through cards present in DOM (not removed)
    const currentCards = document.querySelectorAll('.app-card[data-card^="ai-report-"]:not(.removing)');
    currentCards.forEach(cardElement => {
        const cardId = cardElement.dataset.card;
        const cardData = contentData[cardId];
        if (cardData && cardData.content) {
            // Create a temporary div to parse and clean the content
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = cardData.content;
            
            // Get the content-section div
            const contentSection = tempDiv.querySelector('.content-section');
            if (contentSection) {
                // Remove amplify button section
                const amplifySection = contentSection.querySelector('.amplify-section');
                if (amplifySection) amplifySection.remove();
                
                // Remove amplified content section
                const amplifiedContent = contentSection.querySelector('.amplified-content');
                if (amplifiedContent) amplifiedContent.remove();
                
                // Get HTML content (preserves formatting)
                const sectionHtml = contentSection.innerHTML;
                
                // Get text content for fallback
                const sectionText = contentSection.textContent || contentSection.innerText || '';
                
                htmlContent += `<h2>${cardData.title}</h2>${sectionHtml}<hr/>`;
                textContent += `${cardData.title}\n\n${sectionText.trim()}\n\n---\n\n`;
            }
        }
    });
    
    // Copy to clipboard with HTML formatting
    const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
    const textBlob = new Blob([textContent], { type: 'text/plain' });
    
    const clipboardItem = new ClipboardItem({
        'text/html': htmlBlob,
        'text/plain': textBlob
    });
    
    navigator.clipboard.write([clipboardItem]).then(() => {
        // Success feedback
        const originalText = buttonElement.textContent;
        buttonElement.textContent = '✓ Copiado';
        buttonElement.style.background = 'var(--palm-green)';
        
        setTimeout(() => {
            buttonElement.textContent = originalText;
            buttonElement.style.background = 'var(--palm-link)';
        }, 2000);
    }).catch(err => {
        console.error('Error copying to clipboard:', err);
        
        // Select all content in the preview panel for manual copying, excluding the button
        const previewContent = dockPanelContent.querySelector('.content-section');
        if (previewContent) {
            // Find the button's parent div (the last div with the button)
            const buttonContainer = dockPanelContent.querySelector('#actual-download-pdf-btn')?.parentElement;
            
            const range = document.createRange();
            range.selectNodeContents(previewContent);
            
            // If button container exists, adjust range to exclude it
            if (buttonContainer && previewContent.contains(buttonContainer)) {
                range.setEndBefore(buttonContainer);
            }
            
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            
            buttonElement.textContent = 'Texto seleccionado - Copiar manualmente';
            buttonElement.style.background = 'var(--palm-orange)';
            
            setTimeout(() => {
                buttonElement.textContent = 'Copiar Texto';
                buttonElement.style.background = 'var(--palm-link)';
            }, 3000);
        } else {
            buttonElement.textContent = 'Error al copiar';
            buttonElement.style.background = 'var(--palm-red)';
            
            setTimeout(() => {
                buttonElement.textContent = 'Copiar Texto';
                buttonElement.style.background = 'var(--palm-link)';
            }, 2000);
        }
    });
}

