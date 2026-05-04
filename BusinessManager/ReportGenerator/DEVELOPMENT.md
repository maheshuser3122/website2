# Development Guide - Report Generator

This guide covers development, customization, and extension of the Report Generator.

## Development Setup

### Clone and Install
```bash
git clone <repository>
cd ReportGenerator
npm install
```

### Environment File
```bash
cp .env.example .env
```

### Start Development
```bash
npm run dev
```

Hot reload enabled - changes reflect immediately!

---

## Project Architecture

### Component Hierarchy
```
App
├── Layout
│   ├── Header
│   ├── Sidebar
│   └── Dashboard (main content)
│       ├── FileUpload
│       ├── DataPreview
│       ├── ReportPreview
│       └── Export Controls
└── Error Boundary
```

### State Management (Zustand)
```typescript
// Global state
useReportStore()
  ├── currentReport
  ├── excelData
  ├── isLoading
  └── error
```

### Data Flow
```
User Upload
    ↓
FileUpload Component
    ↓
useExcelUpload Hook
    ↓
excelParser Utility
    ↓
reportStore (Zustand)
    ↓
Dashboard Display
```

---

## Adding Features

### 1. Add New Component

Create file: `src/components/NewFeature.tsx`

```typescript
import React from 'react'

interface NewFeatureProps {
  data: any
  onAction: () => void
}

function NewFeature({ data, onAction }: NewFeatureProps) {
  return (
    <div className="card">
      <h3 className="text-lg font-semibold">New Feature</h3>
      {/* Component content */}
    </div>
  )
}

export default NewFeature
```

### 2. Add New Hook

Create file: `src/hooks/useNewFeature.ts`

```typescript
import { useState, useCallback } from 'react'

interface UseNewFeatureReturn {
  data: any
  isLoading: boolean
  error: string | null
  performAction: () => Promise<void>
}

export const useNewFeature = (): UseNewFeatureReturn => {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const performAction = useCallback(async () => {
    setIsLoading(true)
    try {
      // Implement logic
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { data, isLoading, error, performAction }
}
```

### 3. Add New Service

Create file: `src/services/newService.ts`

```typescript
import axios, { AxiosInstance } from 'axios'

class NewService {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL,
      timeout: 30000,
    })
  }

  async fetchData(params: any): Promise<any> {
    const response = await this.client.get('/endpoint', { params })
    return response.data
  }
}

export const newService = new NewService()
```

### 4. Add New Type

Update `src/types/index.ts`:

```typescript
export interface NewType {
  id: string
  name: string
  // ... other properties
}
```

---

## Customization Guide

### Change Color Theme

Edit `tailwind.config.js`:
```js
theme: {
  extend: {
    colors: {
      primary: '#YOUR_COLOR',
      secondary: '#YOUR_COLOR',
      // Update other colors
    }
  }
}
```

### Modify CSS

Add to `src/index.css`:
```css
.custom-class {
  @apply px-4 py-2 rounded-lg bg-blue-500 text-white;
}
```

### Update Report Templates

Edit `src/utils/powerPointGenerator.ts`:
- Change slide layouts
- Modify colors
- Add new section types

### Add New Report Section Type

1. Update interface in `src/types/index.ts`:
```typescript
export type ReportSectionType = 'text' | 'table' | 'chart' | 'image' | 'custom'
```

2. Add rendering in `powerPointGenerator.ts`:
```typescript
case 'custom':
  addCustomSlide(slide, section.content)
  break
```

---

## Testing

### Unit Tests
Create `src/utils/__tests__/excelParser.test.ts`:

```typescript
import { parseExcelFile } from '../excelParser'

describe('parseExcelFile', () => {
  it('should parse valid Excel file', async () => {
    const file = new File(['...'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const result = await parseExcelFile(file)
    expect(result.rows.length).toBeGreaterThan(0)
  })
})
```

### Running Tests
```bash
npm run test
```

### Manual Testing
1. Open DevTools (F12)
2. Check Console for errors
3. Test all file upload scenarios
4. Verify PowerPoint downloads

---

## Performance Optimization

### Bundle Analysis
```bash
npm run build
```

Check `dist/` folder size

### Lazy Loading Components
```typescript
import { lazy, Suspense } from 'react'

const ReportPreview = lazy(() => import('./ReportPreview'))

<Suspense fallback={<div>Loading...</div>}>
  <ReportPreview {...props} />
</Suspense>
```

### Optimize Images
Use WebP format and compress before adding

### Code Splitting
Vite does this automatically - check `vite.config.ts` rollupOptions

---

## Backend Integration

### API Client Pattern

```typescript
import axios, { AxiosInstance } from 'axios'

class ApiClient {
  private client: AxiosInstance

  constructor(baseURL: string) {
    this.client = axios.create({ baseURL })
    
    // Interceptors
    this.client.interceptors.response.use(
      res => res,
      error => this.handleError(error)
    )
  }

  private handleError(error: any) {
    // Log, format, rethrow
    console.error('API Error:', error)
    throw error
  }
}
```

### SharePoint Integration

Example using @pnp/sp:

```typescript
import { sp } from '@pnp/sp'

async function getSharePointItems(listId: string) {
  const items = await sp.web.lists.getById(listId).items.getAll()
  return items
}
```

---

## Debugging

### Debug Component Props
```typescript
console.log('Component Props:', { data, isLoading, error })
```

### Debug State Changes
```typescript
const { data } = useReportStore()
useEffect(() => {
  console.log('Data changed:', data)
}, [data])
```

### Network Debugging
1. Open DevTools Network tab
2. Watch API requests
3. Check response payloads
4. Monitor errors

### React DevTools
Install React DevTools browser extension to:
- Inspect component hierarchy
- Monitor props and state
- Trace re-renders

---

## Deployment

### Build
```bash
npm run build
```

### Preview Build Locally
```bash
npm run preview
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
npm run build
# Then drag dist/ folder to Netlify
```

### Deploy Docker
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

Build and push:
```bash
docker build -t report-generator .
docker run -p 3000:3000 report-generator
```

---

## Code Quality

### Linting
```bash
npm run lint
```

### Auto-format
```bash
npm run format
```

### Type Checking
```bash
npm run type-check
```

### Pre-commit Hook
Create `.husky/pre-commit`:
```bash
#!/bin/sh
npm run lint
npm run type-check
```

---

## Troubleshooting Development

| Issue | Solution |
|-------|----------|
| Hot reload not working | Restart `npm run dev` |
| Types not recognized | Run `npm run type-check` |
| Module not found | Clear node_modules: `rm -rf node_modules && npm install` |
| Port already in use | Change port in vite.config.ts |
| Memory issues | Increase Node memory: `NODE_OPTIONS=--max-old-space-size=4096` |

---

## Contributing

1. Create feature branch: `git checkout -b feature/name`
2. Make changes and test
3. Run `npm run lint` and `npm run format`
4. Commit: `git commit -m "feat: description"`
5. Push and create Pull Request

---

## Resources

- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Zustand](https://github.com/pmndrs/zustand)
- [PptxGenJS](https://gitbrent.github.io/PptxGenJS/)

---

Happy Coding! 🚀
