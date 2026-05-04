# Report Generator - Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          USER BROWSER                                   │
│                      (http://localhost:3000)                            │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                   REACT APPLICATION (Vite)                     │    │
│  │                                                                 │    │
│  │  ┌──────────────────────────────────────────────────────┐      │    │
│  │  │              Layout & Navigation                     │      │    │
│  │  │  ┌──────────┐  ┌─────────┐  ┌─────────────────┐     │      │    │
│  │  │  │ Sidebar  │  │ Header  │  │    Dashboard    │     │      │    │
│  │  │  └──────────┘  └─────────┘  └─────────────────┘     │      │    │
│  │  └──────────────────────────────────────────────────────┘      │    │
│  │                           │                                 │    │
│  │                    ┌──────┴──────┐                         │    │
│  │                    ▼             ▼                         │    │
│  │            ┌──────────────┐  ┌─────────────┐             │    │
│  │            │ FileUpload   │  │Preview &    │             │    │
│  │            │ Component    │  │Generation   │             │    │
│  │            └──────────────┘  └─────────────┘             │    │
│  │                    │                    │                │    │
│  │                    ▼                    ▼                │    │
│  │         ┌──────────────────────────────────┐            │    │
│  │         │      React Hooks Layer           │            │    │
│  │         │  ┌──────────┐  ┌──────────────┐ │            │    │
│  │         │  │useExcel  │  │useReportGen  │ │            │    │
│  │         │  │Upload    │  │eration      │ │            │    │
│  │         │  └──────────┘  └──────────────┘ │            │    │
│  │         └──────────────────────────────────┘            │    │
│  │                    │                                    │    │
│  │                    ▼                                    │    │
│  │         ┌──────────────────────────────┐               │    │
│  │         │    Utilities Layer            │               │    │
│  │         │  ┌──────────────┐  ┌────────┐│               │    │
│  │         │  │excelParser   │  │pptx    ││               │    │
│  │         │  │              │  │Generator││              │    │
│  │         │  └──────────────┘  └────────┘│               │    │
│  │         └──────────────────────────────┘               │    │
│  │                    │                                    │    │
│  │            ┌───────┴────────┐                          │    │
│  │            │                │                          │    │
│  │            ▼                ▼                          │    │
│  │    ┌────────────┐    ┌─────────────┐                  │    │
│  │    │State Store │    │Services     │                  │    │
│  │    │(Zustand)  │    │Layer        │                  │    │
│  │    └────────────┘    └─────────────┘                  │    │
│  │         ▲                    │                         │    │
│  │         │                    ▼                         │    │
│  │         └───────────────────────────────┐              │    │
│  │                                         │              │    │
│  │  ┌──────────────────────────────────────┴──┐           │    │
│  │  │       Styling Layer (Tailwind CSS)      │           │    │
│  │  │  - Responsive Design                    │           │    │
│  │  │  - Dark/Light Mode Ready                │           │    │
│  │  │  - Animation & Transitions              │           │    │
│  │  └──────────────────────────────────────────┘           │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           Local Storage & Session Management            │   │
│  │  - Temporary file storage                              │   │
│  │  - Session state persistence                           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTP/REST APIs
                                │ (Optional Backend)
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        BACKEND (Optional)                               │
│                   Node.js/Express (Port 5000)                           │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                   Express Server                               │    │
│  │  ┌─────────────┐  ┌──────────┐  ┌──────────────────┐          │    │
│  │  │Reports API  │  │Templates │  │ SharePoint API   │          │    │
│  │  │ CRUD ops    │  │Management│  │ Authentication   │          │    │
│  │  └─────────────┘  └──────────┘  └──────────────────┘          │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                              │                                          │
│         ┌────────────────────┼────────────────────┐                    │
│         ▼                    ▼                    ▼                    │
│  ┌─────────────┐      ┌──────────────┐    ┌──────────────┐           │
│  │  SQLite DB  │      │ File Storage │    │ SharePoint   │           │
│  │  - Reports  │      │ - Uploads    │    │ Connection   │           │
│  │  - Users    │      │ - Archives   │    │ - Lists      │           │
│  │  - Templates│      │              │    │ - Items      │           │
│  └─────────────┘      └──────────────┘    └──────────────┘           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                │
                                │ Microsoft Graph API
                                │ (SharePoint Integration)
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    MICROSOFT 365 SERVICES                               │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                   SharePoint Online                            │    │
│  │                                                                │    │
│  │  ├─ Document Libraries                                        │    │
│  │  ├─ Lists with Data                                           │    │
│  │  ├─ Site Collections                                          │    │
│  │  └─ Versioning & Permissions                                 │    │
│  │                                                                │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
User Action          │          Component              │   Logic
─────────────────────┼──────────────────────────────────┼──────────────────
                     │                                  │
Upload File          │  FileUpload Component            │  
    │                │         │                        │
    └─────────────>  │         │                        │
                     │         └─> useExcelUpload       │
                     │             Hook                 │
                     │                │                 │
                     │                └──> excelParser  │ Parse XLSX
                     │                     Utility      │ Validate Data
                     │                │                 │
                     │                └──> Store        │ Zustand Store
Generate Report      │  Dashboard ────────────────────>  │
    │                │         │                        │
    └─────────────>  │         │                        │
                     │         └─> useReportGen          │
                     │             Hook                 │
                     │                │                 │
                     │                └──> Create       │ Structure Report
                     │                     Report Obj   │
                     │                │                 │
                     │                └──> Store        │ Zustand Store
Export PowerPoint    │  ReportPreview ────────────────>  │
    │                │  Component      │                │
    └─────────────>  │                 └──> pptxgen     │ Generate PPTX
                     │                     Utility      │ Download File
                     │                                  │
```

## Component Interaction

```
Dashboard (Main Orchestrator)
   │
   ├─> Step 1: Upload
   │   ├─> FileUpload
   │   │   └─> useExcelUpload Hook
   │   │       └─> excelParser.ts
   │   └─> Zustand Store (saves excelData)
   │
   ├─> Step 2: Preview
   │   ├─> DataPreview
   │   │   └─> Display Table & Stats
   │   └─> User Reviews Data
   │
   ├─> Step 3: Generate
   │   ├─> Form Input (Title)
   │   └─> ReportGeneration
   │       └─> useReportGeneration Hook
   │           ├─> Transform Data (excelData → reportData)
   │           ├─> Create Sections
   │           └─> Zustand Store (saves generatedReport)
   │
   └─> Step 4: Export
       ├─> ReportPreview
       │   └─> Display Report Details
       ├─> Export Options
       │   ├─> TOC Toggle
       │   ├─> Page Numbers
       │   └─> Theme Selection
       └─> PowerPoint Generation
           └─> powerPointGenerator.ts
               ├─> Generate Slides
               ├─> Add Content
               └─> Download File

```

## Technology Stack

### Frontend
- **React 18**: UI Framework
- **Vite**: Build Tool (ES Modules, Hot Reload)
- **TypeScript**: Type Safety
- **Tailwind CSS**: Styling
- **Zustand**: State Management

### Libraries
- **xlsx**: Excel parsing
- **pptxgen-js**: PowerPoint generation
- **Axios**: HTTP client
- **React Query**: Data caching
- **React Hot Toast**: Notifications
- **React Icons**: Icon library

### Development Tools
- **ESLint**: Code quality
- **Prettier**: Code formatting
- **Vite**: Build & dev server
- **TypeScript Compiler**: Type checking

### Deployment
- **Docker**: Containerization
- **Vercel/Netlify**: Static hosting
- **Node.js**: Backend (optional)

## Scaling Considerations

### For Large Files (>10MB)
- Implement chunked file upload
- Add progress bars
- Use Web Workers for parsing

### For Many Reports
- Implement pagination
- Add search/filter functionality
- Archive old reports

### For Team Collaboration
- Add sharing features
- Implement permission system
- Add comment capabilities

### For Analytics
- Track usage metrics
- Monitor report generation time
- Gather user feedback

## Security Architecture

```
┌─────────────────────────────────────────┐
│       Browser Security                  │
│  ┌─────────────────────────────────┐   │
│  │ - Input Validation              │   │
│  │ - File Type/Size Restrictions   │   │
│  │ - XSS Protection (React)        │   │
│  │ - CORS Policy Compliance        │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│       Transport Security                │
│  ┌─────────────────────────────────┐   │
│  │ - HTTPS/SSL Encryption          │   │
│  │ - API Token Authentication      │   │
│  │ - Request Signing               │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│       Backend Security                  │
│  ┌─────────────────────────────────┐   │
│  │ - Authentication & Authorization│   │
│  │ - Input Sanitization            │   │
│  │ - Rate Limiting                 │   │
│  │ - Data Encryption at Rest       │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

Created for Production Use ✅
