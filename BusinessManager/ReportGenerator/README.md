# Report Generator - Production-Grade Application

A professional React-based report generation system that transforms Excel and SharePoint data into stunning PowerPoint presentations.

## 🚀 Features

- **Excel/SharePoint Integration**: Upload data from Excel files or connect to SharePoint lists
- **Professional Report Generation**: Automatic conversion of data into well-formatted reports
- **PowerPoint Export**: Export reports with customizable themes and layouts
- **Production-Ready Architecture**: TypeScript, Zustand state management, error handling
- **Responsive UI**: Built with Tailwind CSS for modern, mobile-friendly interface
- **Data Preview**: Review your data before generating reports
- **Customizable Templates**: Multiple layout and theme options
- **Multi-step Wizard**: Intuitive step-by-step report creation process

## 📋 Prerequisites

- Node.js 16+ and npm/yarn
- Modern web browser (Chrome, Firefox, Safari, Edge)

## 🛠️ Installation

1. Navigate to the project directory:
```bash
cd ReportGenerator
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure environment variables if needed (optional for local development)

## 🏃 Running the Application

### Development Mode
```bash
npm run dev
# The app will open at http://localhost:3000
```

### Build for Production
```bash
npm run build
npm run preview
```

## 📁 Project Structure

```
ReportGenerator/
├── src/
│   ├── components/          # Reusable React components
│   │   ├── ErrorBoundary.tsx
│   │   ├── FileUpload.tsx
│   │   ├── DataPreview.tsx
│   │   ├── ReportPreview.tsx
│   │   ├── Header.tsx
│   │   ├── Layout.tsx
│   │   └── Sidebar.tsx
│   ├── pages/              # Page components
│   │   └── Dashboard.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── useExcelUpload.ts
│   │   └── useReportGeneration.ts
│   ├── services/           # API and external services
│   │   ├── reportService.ts
│   │   └── sharePointService.ts
│   ├── store/              # State management (Zustand)
│   │   └── reportStore.ts
│   ├── types/              # TypeScript interfaces
│   │   └── index.ts
│   ├── utils/              # Utility functions
│   │   ├── excelParser.ts
│   │   └── powerPointGenerator.ts
│   ├── App.tsx             # Root component
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── index.html              # HTML template
├── package.json            # Dependencies
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
├── tailwind.config.js      # Tailwind CSS
├── postcss.config.js       # PostCSS
├── .eslintrc.json          # ESLint rules
├── .prettierrc              # Code formatter
├── .env.example            # Environment variables template
└── README.md               # Documentation
```

## 🔑 Key Dependencies

### Frontend Framework
- **React 18**: UI library
- **Vite**: Build tool and dev server

### Utilities
- **xlsx**: Excel file parsing
- **pptxgen-js**: PowerPoint generation
- **Zustand**: State management
- **Axios**: HTTP client
- **React Query**: Data fetching and caching
- **React Hot Toast**: Notifications
- **React Icons**: Icon library
- **Tailwind CSS**: Styling

### Development Tools
- **TypeScript**: Type safety
- **ESLint**: Code linting
- **Prettier**: Code formatting

## 📖 Usage Guide

### Basic Workflow

1. **Upload Data**
   - Click on the upload area or drag-drop an Excel file
   - File is validated (max 10MB, .xlsx/.xls format)

2. **Review Data**
   - Preview your data in a paginated table
   - Check row/column counts and structure
   - Go back if you need to upload a different file

3. **Generate Report**
   - Enter a title for your report
   - Review data summary
   - Click "Generate Report" to create sections

4. **Export to PowerPoint**
   - Customize export settings (TOC, page numbers, theme)
   - Click "Export to PowerPoint"
   - File downloads automatically

### Data Requirements

Your Excel file should:
- Contain headers in the first row
- Have consistent column structure
- Include relevant data for your report
- Not exceed 10MB in size

Example Excel structure:
| Name | Department | Q4_Sales | Target |
|------|-----------|----------|--------|
| John | Sales    | 50000    | 60000  |
| Jane | Marketing| 45000    | 50000  |

## 🔌 API Integration

### SharePoint Connection (Optional)

To enable SharePoint integration:

1. Update `.env` file:
```env
VITE_SHAREPOINT_SITE_URL=https://yourtenant.sharepoint.com/sites/yoursite
VITE_SHAREPOINT_LIST_ID=your-list-id
```

2. The app will use the `sharePointService` to fetch data

### Backend Requirements

For full SharePoint integration, you'll need a backend API that:
- Authenticates with SharePoint
- Fetches list items
- Returns data in JSON format

See `backend-reference.md` for API specifications.

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:5000
VITE_SHAREPOINT_SITE_URL=https://yourtenant.sharepoint.com/sites/yoursite
VITE_SHAREPOINT_LIST_ID=your-list-id
VITE_ENABLE_MOCK_DATA=true
VITE_LOG_LEVEL=info
```

### Theme Customization

Edit `tailwind.config.js` to customize colors:

```javascript
theme: {
  extend: {
    colors: {
      primary: '#2563eb',      // Change primary color
      secondary: '#64748b',
      // ... other colors
    }
  }
}
```

## 🎨 PowerPoint Export Options

- **Themes**: Default, Professional, Modern
- **Table of Contents**: Automatically generated navigation
- **Page Numbers**: Numbered slides for easy reference
- **Multiple Section Types**: Text, tables, charts
- **Metadata**: Document information slides

## 🧪 Development

### Running Tests
```bash
npm run test
```

### Linting
```bash
npm run lint          # Check code
npm run format        # Auto-format code
```

### Type Checking
```bash
npm run type-check
```

## 📦 Building for Production

1. Build the application:
```bash
npm run build
```

2. Output files are in `dist/` directory

3. Deploy to your hosting:
   - Vercel
   - Netlify
   - AWS S3 + CloudFront
   - Azure Static Web Apps
   - Docker container

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## 🔒 Security Features

- ✅ Input validation for all file uploads
- ✅ File type and size restrictions
- ✅ XSS protection with React's built-in escaping
- ✅ CORS configuration for API requests
- ✅ Error boundary for graceful error handling
- ✅ No sensitive data storage in browser

## 🐛 Troubleshooting

### Issue: Upload fails with "File not recognized"
**Solution**: Ensure you're uploading a valid .xlsx or .xls file

### Issue: PowerPoint opens with warning messages
**Solution**: Disable macro warnings - the files are safe

### Issue: Large files are slow
**Solution**: Keep Excel files under 10MB. Consider splitting data into multiple sheets.

### Issue: SharePoint connection fails
**Solution**: Check backend API is running and configured correctly

## 📚 Additional Resources

- [Vite Documentation](https://vitejs.dev)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org)
- [Tailwind CSS](https://tailwindcss.com)
- [PptxGenJS Documentation](https://gitbrent.github.io/PptxGenJS)
- [SheetJS (xlsx) Documentation](https://docs.sheetjs.com)

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Report Generator - Professional reporting solution for modern businesses.

---

**Need Help?** Check the in-app help section or contact support.
