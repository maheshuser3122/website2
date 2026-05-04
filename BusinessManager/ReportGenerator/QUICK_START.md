# Quick Start Guide - Report Generator

Get the Report Generator up and running in 5 minutes!

## Prerequisites
- Node.js 16 or higher
- npm or yarn
- An Excel file with data (optional, demo mode available)

## 🚀 Quick Installation

### 1. Install Dependencies
```bash
cd ReportGenerator
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

The application will automatically open at `http://localhost:3000`

## 📊 First Report in 3 Steps

### Step 1: Prepare Your Data
Create an Excel file with this structure:
| Name | Department | Q4_Sales | Target |
|------|-----------|----------|--------|
| John | Sales    | 50000    | 60000  |
| Jane | Marketing| 45000    | 50000  |

### Step 2: Upload to Report Generator
- Drag and drop your Excel file into the app
- Or click to browse and select

### Step 3: Export as PowerPoint
- Give your report a title
- Click "Generate Report"
- Click "Export to PowerPoint"
- Done! Download starts automatically

## 🎯 Demo Mode

To test without data:
1. Click the help section for sample data format
2. App works offline - no backend needed initially
3. PowerPoint export works immediately

## ⚙️ Configuration

### Environment Setup (Optional)
```bash
cp .env.example .env
# Edit .env if needed for SharePoint integration
```

### Production Build
```bash
npm run build
npm run preview
```

## 📚 Common Tasks

### Upload Different File
- Go back to upload step using the progress bar
- Select new file

### Customize Report Title
- Enter title before generating
- Used in PowerPoint filename and first slide

### Change Export Settings
- Check/uncheck Table of Contents
- Enable/disable page numbers
- Select theme (Professional/Modern/Default)

### Clear All Data
- Refresh browser page
- Or use "Start New Report" button

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| App won't start | `npm install` then `npm run dev` |
| Port 3000 in use | Change port in `vite.config.ts` |
| File upload fails | Check file is .xlsx format, < 10MB |
| PowerPoint corrupted | Try different theme in export settings |

## 📁 Project Structure
```
ReportGenerator/
├── src/
│   ├── components/    ← React UI components
│   ├── pages/        ← Main dashboard
│   ├── hooks/        ← Custom logic
│   ├── services/     ← API calls
│   └── utils/        ← Helper functions
├── package.json      ← Dependencies
├── vite.config.ts    ← Build config
└── README.md         ← Full documentation
```

## 🆘 Getting Help

1. **Check In-App Help** - Scroll to bottom of dashboard
2. **Read README.md** - Comprehensive documentation
3. **Review BACKEND_REFERENCE.md** - API details
4. **Browser Console** - `F12` for error messages

## 🚀 Next Steps

### For Local Testing
You're all set! Everything works offline.

### For Production
1. Build: `npm run build`
2. Deploy to: Vercel, Netlify, or any static host
3. Optional: Set up backend for SharePoint integration

### For Backend Integration
1. See BACKEND_REFERENCE.md for API specs
2. Set VITE_API_URL in .env
3. Configure SharePoint credentials

## 💡 Tips & Tricks

- **Drag & Drop**: Faster than clicking
- **Keyboard Nav**: Tab through form fields
- **Batch Export**: Generate multiple reports quickly
- **Mobile Friendly**: Works on tablets and phones
- **Dark Mode**: Enable in browser settings

## 📞 Support

For issues or questions:
1. Check troubleshooting section above
2. Review browser console for errors
3. Verify Node.js version: `node --version`
4. Clear cache: `npm cache clean --force`

---

**Happy Report Generating! 🎉**
