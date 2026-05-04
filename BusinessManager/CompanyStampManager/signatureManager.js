// Signature Management System

class SignatureManager {
    constructor() {
        this.signatures = {};
        this.currentSignature = null;
        this.loadSignatures();
    }

    // Load signatures from storage
    loadSignatures() {
        const stored = localStorage.getItem('mcharv_signatures');
        if (stored) {
            this.signatures = JSON.parse(stored);
        }
    }

    // Save signatures to storage
    saveSignatures() {
        localStorage.setItem('mcharv_signatures', JSON.stringify(this.signatures));
    }

    // Add new signature
    addSignature(name, title, imageData, description = '') {
        const id = this.generateId(name);
        this.signatures[id] = {
            id: id,
            name: name,
            title: title,
            imageData: imageData,
            description: description,
            uploadDate: new Date().toISOString(),
            status: 'active'
        };
        this.saveSignatures();
        return id;
    }

    // Get signature by ID
    getSignature(id) {
        return this.signatures[id];
    }

    // Get all signatures
    getAllSignatures() {
        return Object.values(this.signatures);
    }

    // Delete signature
    deleteSignature(id) {
        delete this.signatures[id];
        this.saveSignatures();
    }

    // Set current signature
    setCurrentSignature(id) {
        if (this.signatures[id]) {
            this.currentSignature = id;
            return true;
        }
        return false;
    }

    // Get current signature data
    getCurrentSignatureData() {
        if (this.currentSignature && this.signatures[this.currentSignature]) {
            return this.signatures[this.currentSignature].imageData;
        }
        return null;
    }

    // Generate ID from name
    generateId(name) {
        return name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
    }

    // Extract signature from image URL
    extractSignatureFromImage(imageUrl, callback) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            callback(canvas.toDataURL('image/png'));
        };
        img.onerror = function() {
            console.error('Failed to load image');
            callback(null);
        };
        img.src = imageUrl;
    }

    // Export signatures as JSON
    exportSignatures() {
        return JSON.stringify(this.signatures, null, 2);
    }

    // Import signatures from JSON
    importSignatures(jsonData) {
        try {
            const imported = JSON.parse(jsonData);
            this.signatures = { ...this.signatures, ...imported };
            this.saveSignatures();
            return true;
        } catch (e) {
            console.error('Failed to import signatures:', e);
            return false;
        }
    }
}

// Initialize global signature manager
const signatureManager = new SignatureManager();

// Register pre-loaded signatures
function registerPredefinedSignatures() {
    // Harshitha B.P - Director
    const harshithaSignature = {
        id: 'harshitha-bp-director',
        name: 'Harshitha B.P',
        title: 'Director',
        uploadDate: '2026-03-26',
        status: 'active',
        description: 'Official signature of Director Harshitha B.P'
    };
    
    signatureManager.signatures['harshitha-bp-director'] = harshithaSignature;
    signatureManager.saveSignatures();
}

// Call on initialization
registerPredefinedSignatures();
