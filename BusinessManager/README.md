# MCHARV Business Manager Hub

A unified, professional dashboard that brings together all MCHARV business tools in one centralized location.

## 🚀 Quick Start

### Option 1: Using Node.js Server
```bash
cd BusinessManager
node server.js
```
Then open your browser to: `http://127.0.0.1:8080`

### Option 2: Direct File Access
Simply open `index.html` in your web browser.

## 📋 Available Tools

### 1. **Invoice Generator** 💼
- Generate professional invoices
- Company details management
- GST/Tax support
- PDF export
- Payment tracking
- **Access:** http://127.0.0.1:8080/InvoiceGenerator

### 2. **Company Stamp Manager** 🔖
- Add digital company seals
- Director stamps
- Customizable position, rotation, scale, and opacity
- Real-time preview
- PDF export support
- **Access:** http://127.0.0.1:8080/CompanyStampManager

### 3. **Photo Organizer** 📸
- AI-powered photo management
- Duplicate detection
- Bad photo detection
- Auto-enhancement
- Batch processing
- Location-based organization
- **Access:** http://127.0.0.1:8080/photo-organizer/frontend

### 4. **Resume Builder** 📝
- AI-powered resume creation
- Multiple professional templates
- Export to Word, PDF
- Online sharing
- Section management
- **Access:** http://127.0.0.1:8080/Resume Builder App

### 5. **Photo Print** 🖨️
- Photo preparation for printing
- Quality optimization
- Print-ready formatting
- Batch processing support
- **Access:** http://127.0.0.1:8080/Photo Print

## 🎯 Features

✅ **Unified Dashboard** - Access all tools from one interface  
✅ **Quick Navigation** - Easy shortcuts to each application  
✅ **Professional Design** - Modern, responsive UI  
✅ **Dark/Light Compatibility** - Works in any browser theme  
✅ **Mobile Responsive** - Optimized for all devices  
✅ **Fast Performance** - Minimal dependencies  

## 📁 Project Structure

```
BusinessManager/
├── index.html                 # Main dashboard
├── styles.css                 # Dashboard styling
├── server.js                  # Optional Node.js server
├── CompanyStampManager/       # Stamp management tool
├── InvoiceGenerator/          # Invoice creation tool
├── photo-organizer/           # AI photo management
├── Resume Builder App/        # Resume builder
└── Photo Print/               # Print management
```

## 🛠️ Technology Stack

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Backend:** Optional Node.js server
- **Icons:** Font Awesome 6.4.0
- **Fonts:** Google Fonts (Inter)
- **Responsive:** Mobile-first design

## 📱 Browser Support

- Chrome/Edge (Latest)
- Firefox (Latest)
- Safari (Latest)
- Opera (Latest)
- Mobile Browsers (iOS Safari, Chrome Mobile)

## 🎨 Customization

### Colors
Edit the CSS variables in `styles.css`:
```css
:root {
    --primary-color: #2563eb;
    --secondary-color: #1e40af;
    --accent-color: #f59e0b;
    /* ... more colors ... */
}
```

### Adding New Tools
1. Add a new app card in `index.html`
2. Include in the grid with appropriate category
3. Add link to your tool's index.html

## 🔐 Security

- Local processing - No data sent to external servers
- Client-side operations where possible
- Secure file handling
- CORS support for cross-origin requests

## 📞 Support

For issues or questions about specific tools, refer to their individual README files:
- `CompanyStampManager/README.md`
- `InvoiceGenerator/README.md`
- `photo-organizer/README.md`
- `Resume Builder App/README.md`

## 📄 License

MIT License - MCHARV TECHLABS

---

**Version:** 1.0.0  
**Last Updated:** 2024  
**Maintained by:** MCHARV TECHLABS
