# Signature Extraction & Storage Guide

## Overview
The CompanyStampManager now includes a complete signature management system that allows you to extract, crop, store, and reuse signatures across multiple documents.

## Features

### 1. **Signature Upload** 📸
- Upload signature images in JPG, PNG, or GIF format
- Maximum file size: 5MB
- Automatically provides cropping tools

### 2. **Signature Cropping** ✂️
The cropping interface provides precise control:
- **Crop Width (10-100%)** - Control how much of the image to keep horizontally
- **Crop Height (10-100%)** - Control vertical dimensions
- **Horizontal Offset (0-50%)** - Position the crop box left-right
- **Vertical Offset (0-50%)** - Position the crop box up-down

**Steps:**
1. Upload signature image
2. Adjust crop parameters to frame the signature perfectly
3. Click "✂️ Apply Crop" to finalize
4. Click "💾 Save to Library" to store

### 3. **Signature Library** 📚
Persistent storage of all your signatures with:
- Signature thumbnail preview
- Name and designation/title
- Upload date tracking
- Optional description/notes
- Quick-use and delete buttons

**Storage:** Uses browser's localStorage for persistence (saved on your device)

### 4. **Using Stored Signatures**
1. Open **Signature Library** tab
2. Click **"📍 Use"** on any signature card
3. The signature is instantly loaded for use
4. Check "Apply Signature" when uploading documents
5. Download document with signature applied

### 5. **Signature Application on Documents**
Once a signature is loaded, you can:
- **Upload a document/image**
- **Check "Apply Signature"** in the Seals & Signature section
- Optionally apply **Company Seal** and **Director Seal**
- **Download** the final document with all elements

## Pre-loaded Signatures

The system comes with:
- **Harshitha B.P - Director** (Default example)

## Storage Structure

Signatures are stored with the following metadata:
```json
{
  "id": "unique-identifier",
  "name": "Harshitha B.P",
  "title": "Director",
  "imageData": "data:image/png;base64,...",
  "uploadDate": "2026-03-26T12:00:00Z",
  "status": "active",
  "description": "Optional notes"
}
```

## Browser Compatibility

- Works in modern browsers (Chrome, Firefox, Safari, Edge)
- Uses localStorage for persistence
- Clear browser data will delete stored signatures

## Tips for Best Results

1. **Clean Background** - Signatures on clean/white backgrounds crop better
2. **Good Resolution** - Use at least 300×100px images
3. **Proper Framing** - Leave minimal white space around signature
4. **Consistent Format** - Keep all signatures in the same format for consistency

## Workflow Examples

### Example 1: Create and Store Director Signature
1. Upload signature image
2. Crop to frame perfectly
3. Enter: Name: "Harshitha B.P", Title: "Director"
4. Click "Save to Library"
5. Future documents just "Use" from library

### Example 2: Apply Multiple Elements to Document
1. Upload document
2. Select Company Seal ✓
3. Select Director Seal ✓
4. Select Signature (from library) ✓
5. Download document with all three elements

### Example 3: Manage Multiple Signatures
- Store signatures for different authorized signatories
- Use **Signature Library** to browse all stored signatures
- Quickly switch between signatories without re-uploading
- Delete outdated signatures as needed

## API / Integration

The `SignatureManager` class provides programmatic access:

```javascript
// Add new signature
signatureManager.addSignature(name, title, imageData, description);

// Get all signatures
const signatures = signatureManager.getAllSignatures();

// Use specific signature
signatureManager.setCurrentSignature(signatureId);

// Get current signature image
const imageData = signatureManager.getCurrentSignatureData();

// Delete signature
signatureManager.deleteSignature(signatureId);

// Export/Import
const json = signatureManager.exportSignatures();
signatureManager.importSignatures(json);
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Signature not saving | Check browser allows localStorage |
| Signatures disappear | Clearing browser data deletes localStorage |
| Crop not working | Reload page and try again |
| Image too large | Ensure file is under 5MB |

## Security Notes

- Signatures are stored locally in your browser
- Not sent to any external server
- Clear browser data to permanently delete signatures
- Use with care - only store authorized signatures

---

**Version:** 1.0 | **Last Updated:** March 2026
