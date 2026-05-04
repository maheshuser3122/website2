# 🚀 Quick Start Guide

## ⚡ 60-Second Setup

### 1. Get OpenAI API Key
- Go to: https://platform.openai.com/api-keys
- Create new API key
- Copy the key

### 2. Start Backend
```bash
cd backend
node src/server.js
```
✅ Server ready on http://localhost:5000

### 3. Start Frontend  
```bash
cd frontend
npm run dev
```
✅ App ready on http://localhost:5173

### 4. Process Photos
1. **Paste API Key** → Click "Test API Key"
2. **Enter Folder Path** (example: `C:\Photos`)
3. **Set Quality Threshold** (0-100, default 60)
4. **Click "Start Processing"**
5. **Watch Photos Analyze in Real-Time!**

---

## 📊 What You'll See

### During Processing:
- 📸 **Photo Preview** - Current photo being analyzed
- 📊 **Quality Score** - 0-100 rating
- ✅/❌ **Decision** - Good or Bad photo
- 💡 **Reason** - Why it was good/bad
- ⚠️ **Issues** - Problems found (if any)
- 📋 **Queues** - Photos waiting & already done

### After Processing:
**Files organized in folders:**
```
Your_Folder/
├── Bad_Photos/          ← Low quality photos
├── Enhanced_Photos/     ← Good photos, enhanced
├── By_Location/         ← Organized by EXIF location
└── Original photos...
```

---

## ⚙️ Configuration

### Quality Threshold (Important!)
- **0-30**: Very strict (more photos rejected)
- **31-50**: Strict (many photos rejected)
- **51-70**: Moderate (balanced)
- **71-100**: Lenient (only worst rejected)

**Default: 60** (Moderate)

---

## ✅ Verification Checklist

Before processing your real photos:

- [ ] Backend server running (http://localhost:5000)
- [ ] Frontend app loaded (http://localhost:5173)
- [ ] API key copied from platform.openai.com
- [ ] API key tested (shows "Valid" badge)
- [ ] Folder path entered
- [ ] Quality threshold set
- [ ] Test with 5-10 photos first

---

## 🎯 Best Practices

1. **Test First**
   - Process a small folder first (10-20 photos)
   - Check results before processing entire library

2. **Quality Threshold**
   - Start with 60 (moderate)
   - Adjust based on results
   - Lower = stricter filtering

3. **API Key**
   - Key is saved to browser (safe)
   - Only you can see it
   - Click trash icon to delete

4. **Large Libraries**
   - Process in batches (100-500 photos)
   - Allows monitoring and adjustments
   - Prevents long processing sessions

---

## 🆘 Troubleshooting

### Backend won't start?
```bash
# Kill any running processes
taskkill /F /IM node.exe

# Clear cache
rm -r node_modules package-lock.json
npm install

# Try again
node src/server.js
```

### Frontend won't load?
```bash
# In frontend folder
npm install
npm run dev
```

### API key shows "Invalid"?
1. Check key is copied fully (no spaces)
2. Verify key from: https://platform.openai.com/api-keys
3. Test at: https://platform.openai.com/account/billing/overview

### Processing is slow?
- Normal: 1-3 seconds per photo
- Uses gpt-4-turbo model (latest, accurate)
- Larger images take longer
- Check API rate limits at platform.openai.com

---

## 💡 Tips

- **Save API Key**: After testing, key saves automatically
- **Clear Without Processing**: Click "Reset" to clear
- **Check Progress**: Watch the queue and completion counts
- **Review Issues**: Read the "Issues Found" section carefully
- **Adjust Threshold**: Try different values if results aren't right

---

## 📞 Support Info

**System**: Batch Photo Processor with OpenAI Vision  
**Model**: GPT-4 Turbo (latest)  
**Language**: Python backend, React frontend  
**Status**: ✅ Fully functional  

---

**Ready? Start with Step 1 above! 🎉**
