// Company Stamp Manager Script

let currentStamp = null;
let stampConfig = {
    type: null,
    positionX: 70,
    positionY: 70,
    scale: 100,
    rotation: 0,
    opacity: 100
};

// Multi-page PDF support
let pdfDocument = null;
let currentPageNumber = 1;
let totalPagesCount = 1;
let pdfPages = {}; // Track pages and their transforms

// Per-element transform controls
let currentSelectedElement = null;
let elementTransforms = {}; // Track transforms per element

// Get current date in YYYY format
function getCurrentDate() {
    const today = new Date();
    return today.getFullYear().toString();
}

const stampData = {
    company: {
        name: 'Company Seal',
        text: 'For Mcharv Techlabs Pvt. Ltd.',
        fullName: 'For Mcharv Techlabs Pvt. Ltd.',
        color: '#1e40af',
        borderColor: '#1e40af',
        className: 'company-seal-div',
        isSeal: true,
        topText: 'For Mcharv Techlabs Pvt. Ltd.'
    },
    director: {
        name: 'Director Seal',
        text: 'Shwita',
        subtitle: 'Director',
        fullName: 'Director - Shwita',
        color: '#1e40af',
        borderColor: '#1e40af',
        className: 'director-seal-div',
        isSeal: true,
        signature: 'Shwita'
    }
};

// Select Stamp
function selectStamp(stampType) {
    currentStamp = stampType;
    stampConfig.type = stampType;
    
    // Update UI
    document.querySelectorAll('.stamp-card').forEach((card, index) => {
        card.classList.remove('selected');
    });
    event.target.closest('.stamp-card').classList.add('selected');
    
    // Show customization section
    document.getElementById('customizationSection').style.display = 'block';
    document.getElementById('previewSection').style.display = 'block';
    document.getElementById('configSection').style.display = 'block';
    
    // Update preview
    updatePreview();
    updateConfigDisplay();
}

// Update Preview
function updatePreview() {
    // Update values from ranges
    stampConfig.positionX = parseInt(document.getElementById('positionX').value);
    stampConfig.positionY = parseInt(document.getElementById('positionY').value);
    stampConfig.scale = parseInt(document.getElementById('scale').value);
    stampConfig.rotation = parseInt(document.getElementById('rotation').value);
    stampConfig.opacity = parseInt(document.getElementById('opacity').value);
    
    // Update display values
    document.getElementById('positionXValue').textContent = stampConfig.positionX + '%';
    document.getElementById('positionYValue').textContent = stampConfig.positionY + '%';
    document.getElementById('scaleValue').textContent = stampConfig.scale + '%';
    document.getElementById('rotationValue').textContent = stampConfig.rotation + '°';
    document.getElementById('opacityValue').textContent = stampConfig.opacity + '%';
    
    // Update preview stamp
    if (currentStamp) {
        const previewContainer = document.getElementById('stampPreview');
        previewContainer.innerHTML = '';
        
        const stampData_current = stampData[currentStamp];
        const stampDiv = document.createElement('div');
        stampDiv.className = 'seal-container ' + stampData_current.className;
        
        // Create SVG seal
        if (currentStamp === 'company') {
            stampDiv.innerHTML = `<div style="text-align: center; padding: 40px; color: #999;">Company Seal Removed</div>`;
        } else {
            stampDiv.innerHTML = `<div style="text-align: center; padding: 40px; color: #999;">Director Seal Removed</div>`;
        }
        
        // Apply transforms
        const scale_factor = stampConfig.scale / 100;
        stampDiv.style.transform = `scale(${scale_factor}) rotate(${stampConfig.rotation}deg)`;
        stampDiv.style.opacity = stampConfig.opacity / 100;
        stampDiv.style.left = stampConfig.positionX + '%';
        stampDiv.style.top = stampConfig.positionY + '%';
        stampDiv.style.position = 'absolute';
        
        previewContainer.appendChild(stampDiv);
    }
    
    // Update config display
    updateConfigDisplay();
}

// Update Config Display
function updateConfigDisplay() {
    if (currentStamp) {
        const stamp = stampData[currentStamp];
        document.getElementById('configStampType').textContent = stamp.fullName;
        document.getElementById('configPosition').textContent = `X: ${stampConfig.positionX}%, Y: ${stampConfig.positionY}%`;
        document.getElementById('configScale').textContent = stampConfig.scale + '%';
        document.getElementById('configRotation').textContent = stampConfig.rotation + '°';
        document.getElementById('configOpacity').textContent = stampConfig.opacity + '%';
    }
}

// Reset Stamp
function resetStamp() {
    document.getElementById('positionX').value = 70;
    document.getElementById('positionY').value = 70;
    document.getElementById('scale').value = 100;
    document.getElementById('rotation').value = 0;
    document.getElementById('opacity').value = 100;
    
    updatePreview();
}

// Export Stamp Configuration
function exportStampConfig() {
    if (!currentStamp) {
        alert('Please select a seal first');
        return;
    }
    
    const config = {
        timestamp: new Date().toISOString(),
        sealType: currentStamp,
        sealName: stampData[currentStamp].fullName,
        position: {
            x: stampConfig.positionX,
            y: stampConfig.positionY
        },
        scale: stampConfig.scale,
        rotation: stampConfig.rotation,
        opacity: stampConfig.opacity,
        cssTransform: `scale(${stampConfig.scale / 100}) rotate(${stampConfig.rotation}deg)`,
        cssOpacity: stampConfig.opacity / 100
    };
    
    // Create JSON export
    const dataString = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataString], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `seal-config-${currentStamp}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Show success message
    showNotification('Seal configuration exported successfully!', 'success');
}

// Clear Selection
function clearSelection() {
    currentStamp = null;
    stampConfig = {
        type: null,
        positionX: 70,
        positionY: 70,
        scale: 100,
        rotation: 0,
        opacity: 100
    };
    
    // Hide sections
    document.getElementById('customizationSection').style.display = 'none';
    document.getElementById('previewSection').style.display = 'none';
    document.getElementById('configSection').style.display = 'none';
    
    // Remove selection from cards
    document.querySelectorAll('.stamp-card').forEach(card => {
        card.classList.remove('selected');
    });
}

// Show Notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#3b82f6'};
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Utility: Get stamp configuration as JavaScript object
function getStampConfig() {
    return JSON.parse(JSON.stringify(stampConfig));
}

// ========== NEW: Document Upload and Processing ==========

let uploadedDocument = null;
let uploadedDocumentName = null;
let documentType = null; // 'image', 'pdf', 'word', 'spreadsheet', or 'other'

// Handle Document Upload
function handleDocumentUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        showNotification('File size exceeds 10MB limit!', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        uploadedDocument = e.target.result;
        uploadedDocumentName = file.name;
        
        // Detect document type from MIME type and extension
        if (file.type.startsWith('image')) {
            documentType = 'image';
        } else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
            documentType = 'pdf';
        } else if (file.type.includes('word') || file.type.includes('document') || 
                   file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc')) {
            documentType = 'word';
        } else if (file.type.includes('spreadsheet') || file.name.toLowerCase().endsWith('.xlsx') || 
                   file.name.toLowerCase().endsWith('.xls')) {
            documentType = 'spreadsheet';
        } else {
            documentType = 'other';
        }
        
        // Show relevant sections in simplified workflow
        document.getElementById('applyElementsSection').style.display = 'block';
        document.getElementById('documentPreviewSection').style.display = 'block';
        
        // Update preview
        updateDocumentPreview();
        showNotification(`Document uploaded successfully! (${documentType.toUpperCase()})`, 'success');
    };
    reader.readAsDataURL(file);
}

// Start Over - Reset the process
function startOver() {
    uploadedDocument = null;
    uploadedDocumentName = null;
    documentType = null;
    croppedSignature = null;
    
    // Reset PDF tracking
    pdfDocument = null;
    currentPageNumber = 1;
    totalPagesCount = 1;
    pdfPages = {};
    
    // Reset element transforms
    elementTransforms = {};
    currentSelectedElement = null;
    
    // Reset form inputs
    document.getElementById('documentUpload').value = '';
    document.getElementById('applySealCompany').checked = false;
    document.getElementById('applySealDirector').checked = false;
    if (document.getElementById('applySealMcharv')) {
        document.getElementById('applySealMcharv').checked = false;
    }
    if (document.getElementById('applySignature')) {
        document.getElementById('applySignature').checked = false;
    }
    
    // Hide sections
    document.getElementById('applyElementsSection').style.display = 'none';
    document.getElementById('documentPreviewSection').style.display = 'none';
    
    // Clear preview
    document.getElementById('documentPreview').innerHTML = '<p style="color: #999; text-align: center;">Upload a document to see preview</p>';
    
    showNotification('Ready for a new document!', 'info');
}

// Update Header Preview
function updateHeaderPreview() {
    const companyName = document.getElementById('companyName').value;
    const headerSubtitle = document.getElementById('headerSubtitle').value;
    const headerHeight = document.getElementById('headerHeight').value;
    const headerColor = document.getElementById('headerColor').value;
    
    // Update display value
    document.getElementById('headerHeightValue').textContent = headerHeight + 'px';
}

// Toggle Header Preview
function toggleHeaderPreview() {
    // This function toggles the preview of the header on the document
    updateDocumentPreview();
    showNotification('Header preview toggled!', 'info');
}

// Update Document Preview with Seals
function updateDocumentPreview() {
    if (!uploadedDocument) {
        showNotification('Please upload a document first!', 'info');
        return;
    }

    const previewDiv = document.getElementById('documentPreview');
    previewDiv.innerHTML = '';

    // Add PDF navigation controls if PDF
    if (documentType === 'pdf') {
        const navContainer = document.createElement('div');
        navContainer.id = 'pdf-nav-container';
        navContainer.style.cssText = `
            background: #f3f4f6;
            padding: 12px 15px;
            border-bottom: 1px solid #d1d5db;
            display: flex;
            gap: 20px;
            align-items: center;
            flex-wrap: wrap;
        `;
        navContainer.innerHTML = `
            <div style="display: flex; gap: 8px; align-items: center;">
                <button onclick="previousPdfPage()" style="padding: 6px 12px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">◀ Prev</button>
                <span id="pageIndicator" style="min-width: 100px; text-align: center; font-weight: 600; color: #1f2937;">Page 1 of 1</span>
                <button onclick="nextPdfPage()" style="padding: 6px 12px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Next ▶</button>
            </div>
            <div style="border-left: 1px solid #d1d5db; padding-left: 15px; color: #666; font-size: 0.9em;">
                💡 <strong>Hover over seals/signatures</strong> to adjust size and rotation
            </div>
        `;
        previewDiv.appendChild(navContainer);
    }

    // Create container for document and seals
    const container = document.createElement('div');
    container.style.cssText = `
        position: relative;
        display: block;
        width: 100%;
        max-width: 780px;
        margin: 0 auto;
        background: white;
        border: 1px solid #d1d5db;
        border-radius: 0 0 12px 12px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        overflow: hidden;
    `;

    // Add header if needed
    if (true) { // Always add header
        const headerDiv = document.createElement('div');
        const headerHeight = document.getElementById('headerHeight').value;
        const companyName = document.getElementById('companyName').value;
        const headerSubtitle = document.getElementById('headerSubtitle').value;

        headerDiv.style.cssText = `
            background: linear-gradient(to right, #1f2937 0%, #2d3e50 50%, #1f2937 100%);
            color: white;
            padding: 20px 30px;
            border-bottom: 8px solid #2563eb;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
            display: flex;
            align-items: center;
            gap: 25px;
            margin-bottom: -1px;
            position: relative;
        `;
        headerDiv.innerHTML = `
            <div style="flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                <div style="width: 90px; height: 90px; background: white; border-radius: 10px; padding: 5px; box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; overflow: hidden;">
                    <img src="logo.avif" alt="MCT Logo" style="width: 100%; height: 100%; object-fit: contain; border-radius: 8px;">
                </div>
            </div>
            <div style="flex: 1; color: white; border-right: 2px solid rgba(255,255,255,0.2); padding-right: 25px;">
                <h2 style="margin: 0 0 3px 0; font-size: 26px; font-weight: 900; letter-spacing: 0.5px; line-height: 1.1; color: #e8eef7;">MCHARV TECHLABS<br/><span style="font-size: 18px; font-weight: 700; letter-spacing: 1px; color: #d0d9e8; display: block;">PRIVATE LIMITED</span></h2>
                <div style="display: flex; flex-direction: column; gap: 3px; margin-top: 6px; font-size: 11.5px;">
                    <div style="opacity: 0.92; font-weight: 500; color: #e8eef7;">📍 # 53, Near Sharada School, Jayanna Layout, Attibele, Bangalore-562107</div>
                    <div style="opacity: 0.92; font-weight: 500; color: #e8eef7;">📞 +44 7771090667</div>
                    <div style="opacity: 0.92; font-weight: 500; color: #e8eef7;">✉️ info@mcharvtechlabs.com</div>
                    <div style="opacity: 0.92; font-weight: 500; color: #e8eef7;">🌐 https://mcharvtechlabs.com</div>
                </div>
            </div>
            <div style="text-align: center; flex-shrink: 0;">
                <div style="font-size: 40px; font-weight: 900; color: #2563eb; letter-spacing: 1px; text-shadow: 0 2px 8px rgba(0,0,0,0.4); margin: 0; line-height: 1;">EST.<br/>2023</div>
                <div style="font-size: 11px; color: #cbd5e1; margin-top: 4px; font-weight: 600; letter-spacing: 0.5px;">Trusted Partner</div>
            </div>
        `;
        container.appendChild(headerDiv);
    }

    // Add document - handle different types
    if (documentType === 'image') {
        renderImageDocument(container);
    } else if (documentType === 'pdf') {
        renderPdfDocument(container);
    } else {
        renderOtherDocument(container);
    }

    previewDiv.appendChild(container);
}

// Render Image Document
function renderImageDocument(container) {
    const imgDiv = document.createElement('div');
    imgDiv.style.cssText = `
        position: relative;
        width: 100%;
        background: white;
        border: none;
        border-radius: 0;
        overflow: hidden;
    `;
    imgDiv.className = 'document-canvas';

    // Document image container - handles sizing
    const imageContainer = document.createElement('div');
    imageContainer.style.cssText = `
        width: 100%;
        padding: 0;
        position: relative;
        z-index: 1;
    `;

    const img = document.createElement('img');
    img.src = uploadedDocument;
    img.style.cssText = `
        width: 100%;
        height: auto;
        border-radius: 0;
        box-shadow: none;
        display: block;
        position: relative;
    `;
    
    imageContainer.appendChild(img);
    imgDiv.appendChild(imageContainer);

    // Create overlay layer for seals and signatures
    const overlayLayer = document.createElement('div');
    overlayLayer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: auto;
        z-index: 10;
    `;

    // Add company seal if selected
    if (document.getElementById('applySealCompany').checked) {
        const companySealSvg = createCompanySealSvg();
        const sealContainer = createDraggableContainer('company-seal', companySealSvg, 'right', 'bottom');
        overlayLayer.appendChild(sealContainer);
    }

    // Add director seal if selected
    if (document.getElementById('applySealDirector').checked) {
        const directorSealSvg = createDirectorSealSvg();
        const sealContainer = createDraggableContainer('director-seal', directorSealSvg, 'right', 'bottom', 180);
        overlayLayer.appendChild(sealContainer);
    }

    // Add Mcharv seal if selected
    if (document.getElementById('applySealMcharv') && document.getElementById('applySealMcharv').checked) {
        const mcharvSealSvg = createMcharvSealSvg();
        const sealContainer = createDraggableContainer('mcharv-seal', mcharvSealSvg, 'center', 'bottom');
        overlayLayer.appendChild(sealContainer);
    }

    // Add signature if selected
    if (document.getElementById('applySignature') && document.getElementById('applySignature').checked && croppedSignature) {
        const signatureImg = document.createElement('img');
        signatureImg.src = croppedSignature;
        const sigContainer = createDraggableContainer('signature', signatureImg, 'left', 'bottom');
        overlayLayer.appendChild(sigContainer);
    }

    imgDiv.appendChild(overlayLayer);
    container.appendChild(imgDiv);
}

// Render PDF Document
function renderPdfDocument(container) {
    const pdfDiv = document.createElement('div');
    pdfDiv.style.cssText = `
        position: relative;
        width: 100%;
        background: white;
        border: none;
        border-radius: 0;
        overflow: hidden;
    `;
    pdfDiv.className = 'document-canvas';

    // PDF Canvas container
    const canvasContainer = document.createElement('div');
    canvasContainer.style.cssText = `
        width: 100%;
        padding: 0;
        position: relative;
        z-index: 1;
        text-align: center;
    `;

    const canvas = document.createElement('canvas');
    canvas.style.cssText = `
        max-width: 100%;
        height: auto;
        border-radius: 0;
        box-shadow: none;
        display: block;
        margin: 0 auto;
    `;
    
    canvasContainer.appendChild(canvas);
    pdfDiv.appendChild(canvasContainer);

    // Render PDF asyncly - with current page number
    renderPdfToCanvas(canvas, currentPageNumber);
    
    // Update page indicator after loading
    setTimeout(() => updatePageIndicator(), 100);

    // Create overlay layer for seals and signatures
    const overlayLayer = document.createElement('div');
    overlayLayer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: auto;
        z-index: 10;
    `;

    // Add company seal if selected
    if (document.getElementById('applySealCompany').checked) {
        const companySealSvg = createCompanySealSvg();
        const sealContainer = createDraggableContainer('company-seal', companySealSvg, 'right', 'bottom');
        overlayLayer.appendChild(sealContainer);
    }

    // Add director seal if selected
    if (document.getElementById('applySealDirector').checked) {
        const directorSealSvg = createDirectorSealSvg();
        const sealContainer = createDraggableContainer('director-seal', directorSealSvg, 'right', 'bottom', 180);
        overlayLayer.appendChild(sealContainer);
    }

    // Add Mcharv seal if selected
    if (document.getElementById('applySealMcharv') && document.getElementById('applySealMcharv').checked) {
        const mcharvSealSvg = createMcharvSealSvg();
        const sealContainer = createDraggableContainer('mcharv-seal', mcharvSealSvg, 'center', 'bottom');
        overlayLayer.appendChild(sealContainer);
    }

    // Add signature if selected
    if (document.getElementById('applySignature') && document.getElementById('applySignature').checked && croppedSignature) {
        const signatureImg = document.createElement('img');
        signatureImg.src = croppedSignature;
        const sigContainer = createDraggableContainer('signature', signatureImg, 'left', 'bottom');
        overlayLayer.appendChild(sigContainer);
    }

    pdfDiv.appendChild(overlayLayer);
    container.appendChild(pdfDiv);
}

// Multi-page PDF functions
function nextPdfPage() {
    if (currentPageNumber < totalPagesCount) {
        currentPageNumber++;
        updateDocumentPreview();
        updatePageIndicator();
    } else {
        showNotification('Already on the last page!', 'info');
    }
}

function previousPdfPage() {
    if (currentPageNumber > 1) {
        currentPageNumber--;
        updateDocumentPreview();
        updatePageIndicator();
    } else {
        showNotification('Already on the first page!', 'info');
    }
}

function updatePageIndicator() {
    const indicator = document.getElementById('pageIndicator');
    if (indicator) {
        indicator.textContent = `Page ${currentPageNumber} of ${totalPagesCount}`;
    }
}

// Per-element transform functions (for seal/signature)
function createElementTransformPanel(elementId) {
    const panel = document.createElement('div');
    panel.id = `transform-panel-${elementId}`;
    panel.style.cssText = `
        position: fixed;
        background: #1f2937;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        display: none;
        gap: 12px;
        align-items: center;
        white-space: nowrap;
        z-index: 9999;
        font-size: 0.85em;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        border: 1px solid #4b5563;
        pointer-events: none;
    `;
    
    panel.innerHTML = `
        <label style="margin: 0; font-weight: 600;">Size:</label>
        <input type="range" min="50" max="200" value="100" step="10" 
            onchange="updateElementTransform('${elementId}', 'zoom', this.value)" 
            style="width: 100px; cursor: pointer;">
        <span id="zoom-${elementId}" style="min-width: 35px; text-align: center;">100%</span>
        
        <span style="margin: 0 8px; color: #6b7280;">|</span>
        
        <label style="margin: 0; font-weight: 600;">Rotate:</label>
        <button onclick="rotateElement('${elementId}', -15)" style="padding: 4px 8px; background: #3b82f6; border: none; border-radius: 4px; cursor: pointer; color: white; font-size: 0.9em; font-weight: 600;">↶</button>
        <button onclick="rotateElement('${elementId}', 15)" style="padding: 4px 8px; background: #3b82f6; border: none; border-radius: 4px; cursor: pointer; color: white; font-size: 0.9em; font-weight: 600;">↷</button>
        <span id="rot-${elementId}" style="min-width: 35px; text-align: center;">0°</span>
        
        <span style="margin: 0 8px; color: #6b7280;">|</span>
        
        <button onclick="deleteElement('${elementId}')" style="padding: 4px 10px; background: #ef4444; border: none; border-radius: 4px; cursor: pointer; color: white; font-size: 0.9em; font-weight: 600;">🗑️ Delete</button>
    `;
    
    // Keep panel open when hovering over it
    panel.addEventListener('mouseenter', function() {
        panel.style.pointerEvents = 'auto';
        panel.dataset.active = 'hover';
        panel.dataset.pendingHide = 'false';
    });
    
    panel.addEventListener('mouseleave', function() {
        panel.style.pointerEvents = 'none';
        panel.dataset.active = 'false';
        panel.dataset.pendingHide = 'true';
        
        // Hide after a short delay
        setTimeout(() => {
            if (panel.dataset.pendingHide === 'true' && panel.dataset.active !== 'hover') {
                panel.style.display = 'none';
            }
        }, 200);
    });
    
    document.body.appendChild(panel);
    return panel;
}

function deleteElement(elementId) {
    const elem = document.getElementById(elementId);
    if (elem) {
        elem.remove();
    }
    
    const panel = document.getElementById(`transform-panel-${elementId}`);
    if (panel) {
        panel.remove();
    }
    
    delete elementTransforms[elementId];
    showNotification('Element deleted!', 'success');
}

function updateElementTransform(elementId, property, value) {
    if (!elementTransforms[elementId]) {
        elementTransforms[elementId] = { zoom: 100, rotation: 0 };
    }
    
    if (property === 'zoom') {
        elementTransforms[elementId].zoom = parseInt(value);
        document.getElementById(`zoom-${elementId}`).textContent = value + '%';
        
        const elem = document.getElementById(elementId);
        if (elem) {
            const scale = parseInt(value) / 100;
            elem.style.transform = `scale(${scale}) rotate(${elementTransforms[elementId].rotation}deg)`;
        }
    }
}

function rotateElement(elementId, degrees) {
    if (!elementTransforms[elementId]) {
        elementTransforms[elementId] = { zoom: 100, rotation: 0 };
    }
    
    elementTransforms[elementId].rotation = (elementTransforms[elementId].rotation + degrees) % 360;
    if (elementTransforms[elementId].rotation < 0) {
        elementTransforms[elementId].rotation += 360;
    }
    
    document.getElementById(`rot-${elementId}`).textContent = elementTransforms[elementId].rotation + '°';
    
    const elem = document.getElementById(elementId);
    if (elem) {
        const scale = elementTransforms[elementId].zoom / 100;
        elem.style.transform = `scale(${scale}) rotate(${elementTransforms[elementId].rotation}deg)`;
    }
}

function deleteCurrentPageSeals(sealType) {
    // Remove seals from the current page display
    const pageElements = document.querySelectorAll(`[id="pdf-page-${currentPageNumber}"] .draggable-element`);
    pageElements.forEach(elem => {
        if ((sealType === 'company' && elem.dataset.type.includes('company-seal')) ||
            (sealType === 'director' && elem.dataset.type.includes('director-seal')) ||
            (sealType === 'signature' && elem.dataset.type === 'signature')) {
            elem.remove();
        }
    });
    
    // Also toggle the checkbox
    if (sealType === 'company') {
        document.getElementById('applySealCompany').checked = false;
    } else if (sealType === 'director') {
        document.getElementById('applySealDirector').checked = false;
    } else if (sealType === 'mcharv') {
        document.getElementById('applySealMcharv').checked = false;
    } else if (sealType === 'signature') {
        document.getElementById('applySignature').checked = false;
    }
    
    showNotification(`${sealType.charAt(0).toUpperCase() + sealType.slice(1)} removed from this page!`, 'success');
}

// Render PDF to Canvas using PDF.js with multi-page support
async function renderPdfToCanvas(canvas, pageNum = 1) {
    try {
        // Initialize PDF.js worker
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
            
            // Load PDF from data URL if not already loaded
            if (!pdfDocument) {
                pdfDocument = await pdfjsLib.getDocument(uploadedDocument).promise;
                totalPagesCount = pdfDocument.numPages;
                currentPageNumber = 1;
            }
            
            // Get specified page
            const page = await pdfDocument.getPage(pageNum);
            
            // Set scale - standard 2x for clarity (no zoom - fixed scale)
            const scale = 2;
            const viewport = page.getViewport({ scale });
            
            // Setup canvas
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            // Render page to canvas
            const context = canvas.getContext('2d');
            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            
            await page.render(renderContext).promise;
            
            // Update page info
            currentPageNumber = pageNum;
        } else {
            throw new Error('PDF.js not loaded');
        }
    } catch (error) {
        console.error('Error rendering PDF:', error);
        // Fallback: Show error message
        canvas.style.display = 'none';
        const errorDiv = canvas.parentElement;
        errorDiv.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #999;">
                <div style="font-size: 32px; margin-bottom: 10px;">⚠️</div>
                <p>Unable to display PDF preview</p>
                <p style="font-size: 0.9em;">File: ${uploadedDocumentName}</p>
                <p style="font-size: 0.85em; margin-top: 10px;">You can still position seals and download</p>
            </div>
        `;
    }
}

// Render Other Documents (Word, Excel, etc.)
function renderOtherDocument(container) {
    const otherDiv = document.createElement('div');
    otherDiv.style.cssText = `
        position: relative;
        width: 100%;
        background: white;
        border: 1px solid #e5e7eb;
        border-top: none;
        border-radius: 0 0 4px 4px;
        min-height: 400px;
        overflow: visible;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
    `;

    // Document Preview Box
    const previewBox = document.createElement('div');
    previewBox.style.cssText = `
        text-align: center;
        z-index: 1;
    `;
    
    let icon = '📋';
    let typeText = 'Document';
    
    if (documentType === 'word') {
        icon = '📝';
        typeText = 'Word Document';
    } else if (documentType === 'spreadsheet') {
        icon = '📊';
        typeText = 'Spreadsheet';
    }
    
    previewBox.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 15px;">${icon}</div>
        <h3 style="margin: 0 0 10px 0; color: #1a365d;">${typeText}</h3>
        <p style="margin: 0 0 15px 0; color: #666; font-size: 0.95em;">${uploadedDocumentName}</p>
        <p style="margin: 0; color: #999; font-size: 0.85em;">Position seals and signatures to preview layout</p>
    `;
    otherDiv.appendChild(previewBox);

    // Create overlay layer for seals and signatures
    const overlayLayer = document.createElement('div');
    overlayLayer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: auto;
        z-index: 10;
    `;

    // Add company seal if selected
    if (document.getElementById('applySealCompany').checked) {
        const companySealSvg = createCompanySealSvg();
        const sealContainer = createDraggableContainer('company-seal', companySealSvg, 'right', 'bottom');
        overlayLayer.appendChild(sealContainer);
    }

    // Add director seal if selected
    if (document.getElementById('applySealDirector').checked) {
        const directorSealSvg = createDirectorSealSvg();
        const sealContainer = createDraggableContainer('director-seal', directorSealSvg, 'right', 'bottom', 180);
        overlayLayer.appendChild(sealContainer);
    }

    // Add Mcharv seal if selected
    if (document.getElementById('applySealMcharv') && document.getElementById('applySealMcharv').checked) {
        const mcharvSealSvg = createMcharvSealSvg();
        const sealContainer = createDraggableContainer('mcharv-seal', mcharvSealSvg, 'center', 'bottom');
        overlayLayer.appendChild(sealContainer);
    }

    // Add signature if selected
    if (document.getElementById('applySignature') && document.getElementById('applySignature').checked && croppedSignature) {
        const signatureImg = document.createElement('img');
        signatureImg.src = croppedSignature;
        const sigContainer = createDraggableContainer('signature', signatureImg, 'left', 'bottom');
        overlayLayer.appendChild(sigContainer);
    }

    otherDiv.appendChild(overlayLayer);
    container.appendChild(otherDiv);
}

// Create Company Seal SVG
function createCompanySealSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const currentYear = getCurrentDate();
    
    svg.setAttribute('viewBox', '0 0 200 200');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.innerHTML = `
        <defs>
            <radialGradient id="sealGradient3" cx="50%" cy="30%">
                <stop offset="0%" style="stop-color:#5b9dd9;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
            </radialGradient>
            <filter id="sealShadow3" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.3"/>
            </filter>
        </defs>
        <circle cx="100" cy="100" r="98" fill="none" stroke="#1e40af" stroke-width="1.5" opacity="0.4"/>
        <circle cx="100" cy="100" r="92" fill="none" stroke="#1e40af" stroke-width="2" opacity="0.6"/>
        <circle cx="100" cy="100" r="85" fill="url(#sealGradient3)" filter="url(#sealShadow3)"/>
        <path id="topCurve3" d="M 35,100 A 65,65 0 0,1 165,100" fill="none"/>
        <text font-family="Georgia, serif" font-size="13" font-weight="bold" fill="#ffffff" letter-spacing="2.5">
            <textPath href="#topCurve3" startOffset="50%" text-anchor="middle">
                FOR MCHARV TECHLABS
            </textPath>
        </text>
        <text x="100" y="120" font-family="Georgia, serif" font-size="13" font-weight="600" fill="#ffffff" text-anchor="middle" letter-spacing="1">DIRECTOR</text>
        <circle cx="100" cy="100" r="3" fill="#ffd700"/>
        <circle cx="70" cy="100" r="2" fill="#ffffff" opacity="0.8"/>
        <circle cx="130" cy="100" r="2" fill="#ffffff" opacity="0.8"/>
        <circle cx="100" cy="100" r="8" fill="none" stroke="#ffd700" stroke-width="1.5" opacity="0.7"/>
        <circle cx="100" cy="25" r="8" fill="#ffd700" opacity="0.9"/>
        <text x="100" y="28" font-family="Georgia, serif" font-size="10" font-weight="bold" fill="#1e40af" text-anchor="middle">MT</text>
        <text x="100" y="175" font-family="Georgia, serif" font-size="9" fill="#ffffff" text-anchor="middle" opacity="0.8">${currentYear}</text>
    `;
    return svg;
}

// Create Director Seal SVG
function createDirectorSealSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const currentYear = getCurrentDate();
    
    svg.setAttribute('viewBox', '0 0 200 200');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.innerHTML = `
        <defs>
            <radialGradient id="directorGradient3" cx="50%" cy="30%">
                <stop offset="0%" style="stop-color:#5b9dd9;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
            </radialGradient>
            <filter id="directorShadow3" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.3"/>
            </filter>
        </defs>
        <circle cx="100" cy="100" r="98" fill="none" stroke="#1e40af" stroke-width="1.5" opacity="0.4"/>
        <circle cx="100" cy="100" r="92" fill="none" stroke="#1e40af" stroke-width="2" opacity="0.6"/>
        <circle cx="100" cy="100" r="85" fill="url(#directorGradient3)" filter="url(#directorShadow3)"/>
        <circle cx="100" cy="100" r="78" fill="none" stroke="#ffd700" stroke-width="1" opacity="0.8"/>
        <text x="100" y="128" font-family="Georgia, serif" font-size="13" font-weight="600" fill="#ffffff" text-anchor="middle" letter-spacing="1">DIRECTOR</text>
        <g opacity="0.7">
            <line x1="65" y1="100" x2="75" y2="100" stroke="#ffd700" stroke-width="1"/>
            <line x1="125" y1="100" x2="135" y2="100" stroke="#ffd700" stroke-width="1"/>
        </g>
        <circle cx="100" cy="100" r="4" fill="none" stroke="#ffd700" stroke-width="1.5" opacity="0.8"/>
        <circle cx="100" cy="100" r="1.5" fill="#ffd700" opacity="0.9"/>
        <circle cx="100" cy="25" r="8" fill="#ffd700" opacity="0.9"/>
        <text x="100" y="28" font-family="Georgia, serif" font-size="10" font-weight="bold" fill="#1e40af" text-anchor="middle">MT</text>
        <text x="100" y="175" font-family="Georgia, serif" font-size="9" fill="#ffffff" text-anchor="middle" opacity="0.8">${currentYear}</text>
    `;
    return svg;
}

// Create Mcharv Techlabs Seal SVG (circular with company name and founding year)
function createMcharvSealSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 200 200');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('width', '120');
    svg.setAttribute('height', '120');
    
    svg.innerHTML = `
        <!-- Outer double circles -->
        <circle cx="100" cy="100" r="95" fill="none" stroke="black" stroke-width="2"/>
        <circle cx="100" cy="100" r="90" fill="none" stroke="black" stroke-width="1"/>
        <circle cx="100" cy="100" r="82" fill="none" stroke="black" stroke-width="1.5"/>
        
        <!-- Top curved text path -->
        <defs>
            <path id="topArc" d="M 30,100 A 70,70 0 0,1 170,100" fill="none"/>
            <path id="bottomArc" d="M 30,100 A 70,70 0 0,0 170,100" fill="none"/>
        </defs>
        
        <!-- Top text: MCHARV TECHLABS -->
        <text font-family="Georgia, serif" font-size="14" font-weight="bold" fill="black" letter-spacing="1">
            <textPath href="#topArc" startOffset="50%" text-anchor="middle">
                MCHARV TECHLABS
            </textPath>
        </text>
        
        <!-- Bottom text: SINCE 2023 -->
        <text font-family="Georgia, serif" font-size="12" font-weight="bold" fill="black" letter-spacing="1">
            <textPath href="#bottomArc" startOffset="50%" text-anchor="middle">
                SINCE 2023
            </textPath>
        </text>
        
        <!-- Center decorative dot -->
        <circle cx="100" cy="100" r="2" fill="black"/>
    `;
    return svg;
}

// Download Document with Seals - PDF format
async function downloadDocument() {
    if (!uploadedDocument) {
        showNotification('Please upload a document first!', 'info');
        return;
    }

    try {
        showNotification('⏳ Generating PDF... Please wait', 'info');
        
        // Determine if document is PDF or image
        const isPDF = uploadedDocument.type && uploadedDocument.type.includes('pdf');
        
        // Initialize jsPDF
        let jsPDFConstructor;
        if (typeof window.jspdf !== 'undefined' && window.jspdf.jsPDF) {
            jsPDFConstructor = window.jspdf.jsPDF;
        } else if (typeof jsPDF !== 'undefined') {
            jsPDFConstructor = jsPDF;
        } else {
            showNotification('❌ PDF library not loaded. Please refresh the page.', 'error');
            return;
        }

        const pdfDoc = new jsPDFConstructor({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = pdfDoc.internal.pageSize.getWidth();
        const pageHeight = pdfDoc.internal.pageSize.getHeight();

        // Process each page
        for (let page = 1; page <= totalPagesCount; page++) {
            if (page > 1) {
                pdfDoc.addPage();
            }

            try {
                let pageCanvas;

                if (isPDF) {
                    console.log(`Rendering PDF page ${page}...`);
                    // For PDFs: Render fresh page with PDF.js (avoids tainted canvas)
                    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
                    
                    // Get or create PDF document
                    let pdfDocumentForRender = pdfDocument;
                    if (!pdfDocumentForRender) {
                        const arrayBuffer = await uploadedDocument.arrayBuffer();
                        pdfDocumentForRender = await pdfjsLib.getDocument(new Uint8Array(arrayBuffer)).promise;
                    }
                    
                    // Render specific page
                    const pdfPage = await pdfDocumentForRender.getPage(page);
                    const viewport = pdfPage.getViewport({ scale: 2 });
                    
                    pageCanvas = document.createElement('canvas');
                    pageCanvas.width = viewport.width;
                    pageCanvas.height = viewport.height;
                    
                    const context = pageCanvas.getContext('2d');
                    if (!context) throw new Error('Failed to get canvas context');
                    
                    await pdfPage.render({
                        canvasContext: context,
                        viewport: viewport
                    }).promise;
                } else {
                    console.log(`Capturing image with html2canvas...`);
                    // For images: Use html2canvas on preview
                    const previewDiv = document.getElementById('documentPreview');
                    if (!previewDiv) throw new Error('Preview div not found');
                    
                    pageCanvas = await html2canvas(previewDiv, {
                        backgroundColor: '#ffffff',
                        scale: 2,
                        useCORS: true,
                        logging: false,
                        imageTimeout: 15000
                    });
                }

                // Create overlay canvas for seals/signatures
                const overlayCanvas = document.createElement('canvas');
                overlayCanvas.width = pageCanvas.width;
                overlayCanvas.height = pageCanvas.height;
                const overlayCtx = overlayCanvas.getContext('2d');
                if (!overlayCtx) throw new Error('Failed to get overlay context');
                
                // Draw base page
                overlayCtx.drawImage(pageCanvas, 0, 0);

                // Calculate scale ratio for elements
                const containerWidth = document.querySelector('.page-container')?.offsetWidth || 210;
                const scaleRatio = overlayCanvas.width / containerWidth;

                // Get all draggable elements (seals, signatures) and add them
                const elements = document.querySelectorAll('.draggable-element');
                for (const el of elements) {
                    if (el.tagName === 'IMG' && el.src) {
                        try {
                            const img = new Image();
                            img.crossOrigin = 'anonymous';
                            
                            await new Promise((resolve, reject) => {
                                img.onload = () => {
                                    const x = (parseInt(el.style.left) || 0) * scaleRatio;
                                    const y = (parseInt(el.style.top) || 0) * scaleRatio;
                                    const w = el.offsetWidth * scaleRatio;
                                    const h = el.offsetHeight * scaleRatio;
                                    
                                    overlayCtx.drawImage(img, x, y, w, h);
                                    resolve();
                                };
                                img.onerror = () => reject(new Error(`Failed to load image: ${el.src}`));
                                img.src = el.src;
                            });
                        } catch (err) {
                            console.warn(`Could not add seal/signature: ${err.message}`);
                        }
                    }
                }

                // Convert overlay canvas to image
                const imgData = overlayCanvas.toDataURL('image/png');
                
                // Add image to PDF
                const imgWidth = pageWidth;
                const imgHeight = (overlayCanvas.height * imgWidth) / overlayCanvas.width;
                pdfDoc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

                console.log(`✓ Page ${page} added successfully`);

            } catch (pageError) {
                console.error(`❌ Error processing page ${page}:`, pageError);
                throw new Error(`Failed to process page ${page}: ${pageError.message}`);
            }
        }

        // Generate filename and download
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        const timeStr = today.getTime();
        const filename = `document-sealed-${dateStr}-${timeStr}.pdf`;

        pdfDoc.save(filename);

        showNotification('✅ PDF downloaded successfully!', 'success');
        console.log('✓ PDF downloaded:', filename);

    } catch (error) {
        console.error('❌ Download error:', error);
        showNotification('❌ Error downloading document: ' + (error.message || 'Unknown error'), 'error');
    }
}

// Clear Document
function clearDocument() {
    uploadedDocument = null;
    documentType = null;
    document.getElementById('documentUpload').value = '';
    document.getElementById('documentPreview').innerHTML = '<p style="color: #999; text-align: center;">Upload a document to preview</p>';
    document.getElementById('headerSection').style.display = 'none';
    document.getElementById('sealApplicationSection').style.display = 'none';
    
    showNotification('Document cleared!', 'info');
}

// ========== NEW: Signature Upload and Processing ==========

let uploadedSignature = null;
let originalSignature = null;
let croppedSignature = null;

// Handle Signature Upload
function handleSignatureUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('Signature file size exceeds 5MB limit!', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        uploadedSignature = e.target.result;
        originalSignature = e.target.result;
        croppedSignature = e.target.result;
        
        // Show crop section
        document.getElementById('signatureCropSection').style.display = 'block';
        document.getElementById('signatureImageToCrop').src = uploadedSignature;
        
        // Show signature checkbox in seal application
        if (document.getElementById('sealApplicationSection')) {
            document.getElementById('signatureCheckboxLabel').style.display = 'flex';
        }
        
        showNotification('Signature uploaded successfully! Adjust cropping if needed.', 'success');
    };
    reader.readAsDataURL(file);
}

// Update Signature Crop Preview
function updateSignatureCrop() {
    const width = document.getElementById('cropWidth').value;
    const height = document.getElementById('cropHeight').value;
    const offsetX = document.getElementById('cropOffsetX').value;
    const offsetY = document.getElementById('cropOffsetY').value;
    
    // Update display values
    document.getElementById('cropWidthValue').textContent = width + '%';
    document.getElementById('cropHeightValue').textContent = height + '%';
    document.getElementById('cropOffsetXValue').textContent = offsetX + '%';
    document.getElementById('cropOffsetYValue').textContent = offsetY + '%';
    
    // Apply visual crop effect
    const img = document.getElementById('signatureImageToCrop');
    const widthNum = parseFloat(width);
    const heightNum = parseFloat(height);
    const offsetXNum = parseFloat(offsetX);
    const offsetYNum = parseFloat(offsetY);
    
    img.style.clip = `rect(${offsetYNum}%, ${100-offsetXNum}%, ${100-offsetYNum}%, ${offsetXNum}%)`;
    img.style.transform = `scale(${100/widthNum})`;
}

// Apply Crop to Signature
function applyCropToSignature() {
    const width = parseFloat(document.getElementById('cropWidth').value);
    const height = parseFloat(document.getElementById('cropHeight').value);
    const offsetX = parseFloat(document.getElementById('cropOffsetX').value);
    const offsetY = parseFloat(document.getElementById('cropOffsetY').value);
    
    // Create canvas for cropping
    const img = new Image();
    img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const cropX = (img.width * offsetX) / 100;
        const cropY = (img.height * offsetY) / 100;
        const cropWidth = (img.width * width) / 100;
        const cropHeight = (img.height * height) / 100;
        
        canvas.width = cropWidth;
        canvas.height = cropHeight;
        
        ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
        
        // Enhance signature ink - increase contrast and darkness
        enhanceSignatureInk(ctx, canvas);
        
        croppedSignature = canvas.toDataURL('image/png');
        
        showNotification('Signature cropped successfully!', 'success');
        updateDocumentPreview();
    };
    img.src = originalSignature;
}

// Enhance signature ink to make it bolder and darker
function enhanceSignatureInk(ctx, canvas) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Increase contrast and darken the signature ink
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        
        // Calculate luminance to detect signature ink
        const luminance = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
        
        // If it's not white/light background, darken it more
        if (luminance < 0.7 && a > 100) {
            // Increase contrast and darkness
            const factor = 1.5; // Increase boldness
            data[i] = Math.min(255, r * factor);
            data[i + 1] = Math.min(255, g * factor);
            data[i + 2] = Math.min(255, b * factor);
            // Slightly increase opacity
            data[i + 3] = Math.min(255, a * 1.1);
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
}

// Reset Signature Crop
function resetSignatureCrop() {
    document.getElementById('cropWidth').value = 100;
    document.getElementById('cropHeight').value = 100;
    document.getElementById('cropOffsetX').value = 0;
    document.getElementById('cropOffsetY').value = 0;
    
    // Enhance original signature with bold ink
    const img = new Image();
    img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx.drawImage(img, 0, 0);
        enhanceSignatureInk(ctx, canvas);
        
        croppedSignature = canvas.toDataURL('image/png');
    };
    img.src = originalSignature;
    
    const imgElement = document.getElementById('signatureImageToCrop');
    imgElement.style.clip = 'auto';
    imgElement.style.transform = 'scale(1)';
    
    updateSignatureCrop();
    showNotification('Crop reset to original!', 'info');
}

// Clear Signature
function clearSignature() {
    uploadedSignature = null;
    originalSignature = null;
    croppedSignature = null;
    
    document.getElementById('signatureUpload').value = '';
    document.getElementById('signatureCropSection').style.display = 'none';
    document.getElementById('signatureCheckboxLabel').style.display = 'none';
    document.getElementById('applySignature').checked = false;
    
    if (document.getElementById('documentPreview')) {
        updateDocumentPreview();
    }
    
    showNotification('Signature removed!', 'info');
}

// ========== NEW: Tab Management ==========

function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    // Load signature library when library tab is opened
    if (tabName === 'library-tab' || tabName === 'sig-library-tab') {
        loadSignatureLibrary();
    }
}

// ========== NEW: Signature Library Management ==========

function loadSignatureLibrary() {
    const libraryList = document.getElementById('signatureLibraryList');
    const signatures = signatureManager.getAllSignatures();
    
    if (signatures.length === 0) {
        libraryList.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">No signatures saved yet. Upload and save one to get started.</p>';
        return;
    }
    
    libraryList.innerHTML = '';
    
    signatures.forEach(sig => {
        const card = document.createElement('div');
        card.className = 'signature-card';
        
        const date = new Date(sig.uploadDate);
        const formattedDate = date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
        
        card.innerHTML = `
            <div class="signature-card-image">
                ${sig.imageData ? `<img src="${sig.imageData}" alt="${sig.name}">` : '<span style="color: #cbd5e0;">No image</span>'}
            </div>
            <div class="signature-card-info">
                <div class="signature-card-name">${sig.name}</div>
                <div class="signature-card-title">${sig.title}</div>
                <div class="signature-card-date">${formattedDate}</div>
                ${sig.description ? `<div style="color: #718096; font-size: 0.8em; margin-top: 5px;">${sig.description}</div>` : ''}
            </div>
            <div class="signature-card-actions">
                <button class="signature-btn signature-btn-use" onclick="useSignatureFromLibrary('${sig.id}')">📍 Use</button>
                <button class="signature-btn signature-btn-delete" onclick="deleteSignatureFromLibrary('${sig.id}')">🗑️ Delete</button>
            </div>
        `;
        
        libraryList.appendChild(card);
    });
}

function useSignatureFromLibrary(signatureId) {
    const signature = signatureManager.getSignature(signatureId);
    if (signature && signature.imageData) {
        // Load and enhance the signature
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = img.width;
            canvas.height = img.height;
            
            ctx.drawImage(img, 0, 0);
            enhanceSignatureInk(ctx, canvas);
            
            croppedSignature = canvas.toDataURL('image/png');
            uploadedSignature = signature.imageData;
            originalSignature = signature.imageData;
            
            // Show signature checkbox in seal application
            document.getElementById('signatureCheckboxLabel').style.display = 'flex';
            document.getElementById('applySignature').checked = true;
            
            // Show document sections if document is uploaded
            if (uploadedDocument) {
                updateDocumentPreview();
            }
            
            showNotification(`Using signature: ${signature.name}`, 'success');
        };
        img.src = signature.imageData;
        
        // Switch to upload tab
        switchTab('upload-tab');
    }
}

function deleteSignatureFromLibrary(signatureId) {
    if (confirm('Are you sure you want to delete this signature?')) {
        signatureManager.deleteSignature(signatureId);
        loadSignatureLibrary();
        showNotification('Signature deleted!', 'info');
    }
}

function saveSignatureToLibrary() {
    if (!croppedSignature) {
        showNotification('Please upload and crop a signature first!', 'info');
        return;
    }
    
    const name = document.getElementById('signatureName').value.trim();
    const title = document.getElementById('signatureTitle').value.trim();
    const description = document.getElementById('signatureDescription').value.trim();
    
    if (!name) {
        showNotification('Please enter a name for the signature!', 'info');
        return;
    }
    
    const signatureId = signatureManager.addSignature(name, title, croppedSignature, description);
    
    // Show signature checkbox
    document.getElementById('signatureCheckboxLabel').style.display = 'flex';
    
    showNotification(`Signature "${name}" saved to library!`, 'success');
    
    // Reset form
    document.getElementById('signatureUpload').value = '';
    document.getElementById('signatureCropSection').style.display = 'none';
    document.getElementById('signatureName').value = 'Harshitha B.P';
    document.getElementById('signatureTitle').value = 'Director';
    document.getElementById('signatureDescription').value = '';
    
    uploadedSignature = null;
    originalSignature = null;
    croppedSignature = null;
}

// ========== NEW: Draggable Element Management ==========

let currentDraggingElement = null;
let dragOffset = { x: 0, y: 0 };

// Create draggable container for signatures and seals
function createDraggableContainer(type, element, defaultHAlign = 'right', defaultVAlign = 'bottom', defaultRight = 40) {
    const container = document.createElement('div');
    const elementId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    container.id = elementId;
    container.className = `draggable-element draggable-${type}`;
    container.dataset.type = type;
    
    // Set default position
    container.style.cssText = `
        position: absolute;
        cursor: ${type === 'signature' ? 'pointer' : 'grab'};
        user-select: none;
        ${defaultHAlign}: ${defaultRight}px;
        ${defaultVAlign}: 40px;
        width: ${type === 'signature' ? '150px' : '120px'};
        height: ${type === 'signature' ? '80px' : '120px'};
        opacity: ${type === 'signature' ? '0.85' : '0.95'};
        padding: 0;
        margin: 0;
        background: transparent;
        z-index: ${type === 'signature' ? '5' : '10'};
        mix-blend-mode: ${type === 'signature' ? 'multiply' : 'normal'};
        ${type === 'signature' ? 'border: none !important; box-shadow: none !important; outline: none !important; filter: none;' : 'filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.2)); border: 2px solid transparent;'}
        transition: opacity 0.15s ease;
    `;
    
    // Initialize element transforms
    elementTransforms[elementId] = { zoom: 100, rotation: 0 };
    
    // Clone the element with clean styling
    const clonedElement = element.cloneNode(true);
    if (clonedElement.tagName === 'IMG') {
        clonedElement.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: contain;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
            box-shadow: none !important;
            outline: none !important;
            display: block;
        `;
    } else if (clonedElement.tagName === 'svg') {
        clonedElement.setAttribute('style', `
            width: 100%;
            height: 100%;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
            display: block;
        `);
    }
    
    container.appendChild(clonedElement);
    
    // Add info label
    const infoLabel = document.createElement('div');
    infoLabel.className = 'draggable-info';
    infoLabel.style.cssText = `
        position: absolute;
        top: -25px;
        left: 0;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 3px 8px;
        border-radius: 3px;
        font-size: 0.75em;
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease;
    `;
    infoLabel.textContent = `${type.toUpperCase()} - Click & Drag`;
    container.appendChild(infoLabel);
    
    // Mouse down - start dragging
    container.addEventListener('mousedown', function(e) {
        e.preventDefault();
        currentDraggingElement = container;
        currentSelectedElement = elementId;
        
        const rect = container.getBoundingClientRect();
        dragOffset.x = e.clientX - rect.left;
        dragOffset.y = e.clientY - rect.top;
        
        if (type === 'signature') {
            container.style.cursor = 'pointer';
            // Minimal visual feedback for signatures
            container.style.filter = 'drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.3))';
        } else {
            container.style.cursor = 'grabbing';
            container.style.border = '2px dashed #3b82f6';
        }
        
        container.style.opacity = '1';
        
        const infoLabel = container.querySelector('.draggable-info');
        if (infoLabel) {
            infoLabel.style.opacity = '1';
            infoLabel.textContent = `${type.toUpperCase()} - Drag to Position`;
        }
        
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);
    });
    
    // Hover effects - Show transform panel only on hover
    container.addEventListener('mouseenter', function() {
        if (currentDraggingElement !== container) {
            if (type === 'signature') {
                container.style.cursor = 'pointer';
            } else {
                container.style.cursor = 'grab';
            }
            
            // Show info label only for non-signature elements
            const infoLabel = container.querySelector('.draggable-info');
            if (infoLabel && type !== 'signature') {
                infoLabel.style.opacity = '0.7';
            }
            
            // Show transform panel and position it
            let transformPanel = document.getElementById(`transform-panel-${elementId}`);
            if (!transformPanel) {
                transformPanel = createElementTransformPanel(elementId);
            }
            
            // Position panel near the element
            const rect = container.getBoundingClientRect();
            const previewDiv = document.getElementById('documentPreview');
            if (previewDiv) {
                const previewRect = previewDiv.getBoundingClientRect();
                transformPanel.style.top = (previewRect.bottom - 10) + 'px';
                transformPanel.style.left = (rect.left + rect.width / 2) + 'px';
                transformPanel.style.transform = 'translateX(-50%)';
            }
            
            transformPanel.style.display = 'flex';
            transformPanel.style.pointerEvents = 'auto';
            transformPanel.dataset.active = 'true';
        }
    });
    
    container.addEventListener('mouseleave', function(e) {
        if (currentDraggingElement !== container) {
            // Hide info label immediately
            const infoLabel = container.querySelector('.draggable-info');
            if (infoLabel) {
                infoLabel.style.opacity = '0';
            }
            
            // Remove drag shadow from signature
            if (type === 'signature') {
                container.style.filter = 'none';
            }
            
            const transformPanel = document.getElementById(`transform-panel-${elementId}`);
            if (transformPanel) {
                transformPanel.dataset.pendingHide = 'true';
                setTimeout(() => {
                    if (transformPanel.dataset.pendingHide === 'true' && transformPanel.dataset.active !== 'hover') {
                        transformPanel.style.display = 'none';
                        transformPanel.dataset.active = 'false';
                    }
                }, 100);
            }
        }
    });
    
    return container;
}

// Handle drag movement
function handleDragMove(e) {
    if (!currentDraggingElement) return;
    
    const parentRect = currentDraggingElement.parentElement.getBoundingClientRect();
    
    let x = e.clientX - parentRect.left - dragOffset.x;
    let y = e.clientY - parentRect.top - dragOffset.y;
    
    // Constrain within parent
    x = Math.max(0, Math.min(x, parentRect.width - currentDraggingElement.offsetWidth));
    y = Math.max(0, Math.min(y, parentRect.height - currentDraggingElement.offsetHeight));
    
    currentDraggingElement.style.left = x + 'px';
    currentDraggingElement.style.top = y + 'px';
    currentDraggingElement.style.right = 'auto';
    currentDraggingElement.style.bottom = 'auto';
    
    // Update info label with position
    const infoLabel = currentDraggingElement.querySelector('.draggable-info');
    if (infoLabel) {
        infoLabel.textContent = `Position: ${Math.round(x)}px, ${Math.round(y)}px`;
    }
}

// Handle drag end
function handleDragEnd(e) {
    if (!currentDraggingElement) return;
    
    const elementType = currentDraggingElement.dataset.type;
    
    if (elementType === 'signature') {
        currentDraggingElement.style.cursor = 'pointer';
        currentDraggingElement.style.filter = 'none';
    } else {
        currentDraggingElement.style.cursor = 'grab';
        currentDraggingElement.style.border = '2px solid transparent';
    }
    
    const infoLabel = currentDraggingElement.querySelector('.draggable-info');
    if (infoLabel) {
        infoLabel.textContent = `${elementType.toUpperCase()} - Click & Drag`;
        infoLabel.style.opacity = '0';
    }
    
    setTimeout(() => {
        currentDraggingElement.style.opacity = elementType === 'signature' ? '1' : '0.95';
    }, 100);
    
    currentDraggingElement = null;
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    
    showNotification('Element positioned! Download to save changes.', 'info');
}

// Utility: Apply stamp to element (for integration)
function applyStampToElement(element, stampType = currentStamp, config = stampConfig) {
    if (!stampType || !element) return false;
    
    try {
        const stamp = stampData[stampType];
        const stampDiv = document.createElement('div');
        stampDiv.className = 'seal-container ' + stamp.className;
        
        // Create SVG seal
        if (stampType === 'company') {
            stampDiv.innerHTML = `<div style="text-align: center; padding: 20px; color: #999;">Company Seal Removed</div>`;
        } else {
            stampDiv.innerHTML = `<div style="text-align: center; padding: 20px; color: #999;">Director Seal Removed</div>`;
        }
        
        const scale_factor = (config.scale || 100) / 100;
        const rotation = config.rotation || 0;
        const opacity = (config.opacity || 100) / 100;
        const posX = config.positionX || 70;
        const posY = config.positionY || 70;
        
        stampDiv.style.cssText = `
            position: absolute;
            left: ${posX}%;
            top: ${posY}%;
            transform: translate(-50%, -50%) scale(${scale_factor}) rotate(${rotation}deg);
            opacity: ${opacity};
        `;
        
        if (element.style.position !== 'absolute' && element.style.position !== 'relative' && element.style.position !== 'fixed') {
            element.style.position = 'relative';
        }
        
        element.appendChild(stampDiv);
        return true;
    } catch (error) {
        console.error('Error applying stamp:', error);
        return false;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Set initial state
    clearSelection();
});
