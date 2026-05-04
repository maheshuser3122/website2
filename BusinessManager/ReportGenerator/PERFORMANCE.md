# Performance Optimization Guide

## Build Optimization

### Code Splitting
Vite automatically splits code into chunks:
```
dist/
├── index.js           (main app)
├── vendor.js          (dependencies)
├── xlsx.js            (large library)
└── pptx.js            (PowerPoint gen)
```

### Tree Shaking
Unused code is automatically removed during build.

### Minification
- All JS/CSS minified
- Source maps generated for debugging

---

## Runtime Optimization

### 1. Image Optimization
- Use WebP format where possible
- Compress before adding
- Lazy load images

### 2. Component Optimization
```typescript
// Bad: Re-renders every time
function DataTable({ data }) {
  const processedData = data.map(...)
  return <table>...</table>
}

// Good: Memoize expensive operations
const DataTable = memo(({ data }) => {
  const processedData = useMemo(() => data.map(...), [data])
  return <table>...</table>
})
```

### 3. State Management
- Use Zustand for minimal overhead
- Avoid derived state
- Subscribe to specific slices

### 4. API Caching
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // 5 min
      cacheTime: 10 * 60 * 1000,   // 10 min
    }
  }
})
```

---

## Monitoring

### Metrics to Track
- Page load time
- Time to interactive
- Largest contentful paint
- First input delay

### Tools
- Lighthouse (built-in Chrome DevTools)
- Web Vitals (web-vitals npm package)
- Sentry (error tracking)

---

## Bundle Analysis

```bash
npm run build  # Check dist/ folder
```

Typical sizes:
- App: ~45KB gzipped
- Dependencies: ~120KB gzipped
- Total: ~165KB gzipped

---

Generated for Production Use ✅
