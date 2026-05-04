// Photo Print Manager - JavaScript Functionality

document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const previewArea = document.getElementById('previewArea');
    const photoGrid = document.getElementById('photoGrid');
    const clearBtn = document.getElementById('clearBtn');
    const printBtn = document.getElementById('printBtn');
    const templatesSection = document.getElementById('templatesSection');

    let uploadedPhotos = [];

    // Upload button click
    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
            fileInput.click();
        });
    }

    // Upload area click
    if (uploadArea) {
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--primary-color)';
            uploadArea.style.background = 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%)';
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = 'var(--border-color)';
            uploadArea.style.background = 'var(--light-bg)';
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--border-color)';
            uploadArea.style.background = 'var(--light-bg)';
            
            const files = e.dataTransfer.files;
            handleFiles(files);
        });
    }

    // File input change
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            handleFiles(e.target.files);
        });
    }

    // Handle uploaded files
    function handleFiles(files) {
        const newPhotos = Array.from(files).filter(file => file.type.startsWith('image/'));
        
        if (newPhotos.length === 0) {
            alert('Please select valid image files.');
            return;
        }

        newPhotos.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                uploadedPhotos.push({
                    name: file.name,
                    src: e.target.result,
                    size: file.size
                });
                updatePreview();
            };
            reader.readAsDataURL(file);
        });
    }

    // Update preview
    function updatePreview() {
        if (uploadedPhotos.length > 0) {
            uploadArea.classList.add('hidden');
            previewArea.classList.remove('hidden');
            renderPhotos();
        }
    }

    // Render photos
    function renderPhotos() {
        photoGrid.innerHTML = '';
        uploadedPhotos.forEach((photo, index) => {
            const photoItem = document.createElement('div');
            photoItem.className = 'photo-item';
            photoItem.innerHTML = `
                <img src="${photo.src}" alt="${photo.name}">
                <button class="photo-remove" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            photoGrid.appendChild(photoItem);
        });

        // Remove buttons
        document.querySelectorAll('.photo-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(btn.dataset.index);
                uploadedPhotos.splice(index, 1);
                renderPhotos();
                if (uploadedPhotos.length === 0) {
                    uploadArea.classList.remove('hidden');
                    previewArea.classList.add('hidden');
                }
            });
        });
    }

    // Clear all
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all photos?')) {
                uploadedPhotos = [];
                photoGrid.innerHTML = '';
                uploadArea.classList.remove('hidden');
                previewArea.classList.add('hidden');
                fileInput.value = '';
            }
        });
    }

    // Print functionality
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            const selectedPhotos = uploadedPhotos;
            if (selectedPhotos.length === 0) {
                alert('Please select photos to print.');
                return;
            }
            printPhotos(selectedPhotos);
        });
    }

    // Print photos
    function printPhotos(photos) {
        const printWindow = window.open('', '', 'width=800,height=600');
        let html = '<html><head><title>Print Photos</title>';
        html += '<style>';
        html += 'body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }';
        html += '.print-page { page-break-after: always; margin-bottom: 20px; }';
        html += '.print-page img { max-width: 100%; height: auto; }';
        html += '.photo-info { font-size: 12px; color: #666; margin-top: 10px; }';
        html += '.print-settings { margin-bottom: 20px; padding: 10px; border: 1px solid #ddd; background: #f9f9f9; }';
        html += '</style></head><body>';
        
        // Print settings
        const dpi = document.querySelector('.resolution-btn.active')?.dataset.dpi || '300';
        const colorProfile = document.getElementById('colorProfile').value;
        const paperType = document.getElementById('paperType').value;
        
        html += '<div class="print-settings">';
        html += `<strong>Print Settings:</strong><br/>`;
        html += `Resolution: ${dpi} DPI<br/>`;
        html += `Color Profile: ${colorProfile}<br/>`;
        html += `Paper Type: ${paperType}`;
        html += '</div>';

        photos.forEach((photo, index) => {
            html += `<div class="print-page">`;
            html += `<img src="${photo.src}" style="max-width: 100%; display: block;">`;
            html += `<div class="photo-info">Photo ${index + 1}: ${photo.name}</div>`;
            html += `</div>`;
        });

        html += '</body></html>';
        printWindow.document.write(html);
        printWindow.document.close();
        
        setTimeout(() => {
            printWindow.print();
        }, 250);
    }

    // Template selection
    document.querySelectorAll('.template-card').forEach(card => {
        card.addEventListener('click', () => {
            alert('Template selected! (Feature demo)');
        });
    });

    // Resolution button selection
    document.querySelectorAll('.resolution-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.resolution-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    console.log('Photo Print Manager initialized');
});
