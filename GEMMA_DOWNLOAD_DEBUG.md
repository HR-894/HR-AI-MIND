# Gemma Model Download Debugging Guide

## Current Status

✅ **Model IDs Fixed**: Both Gemma models now use correct WebLLM-compatible IDs:
- `gemma-2-2b-it-q4f16_1-MLC` (Gemma 2 2B)
- `gemma-2-9b-it-q4f16_1-MLC` (Gemma 2 9B)

✅ **Configuration Complete**:
- `public/models.json`: ✓ Contains both models
- `client/src/lib/models.ts`: ✓ Fallback list updated
- `client/src/lib/model-utils.ts`: ✓ Available models list updated
- `client/src/components/SettingsPanel.tsx`: ✓ Dropdown includes both models

## Troubleshooting Steps

### Step 1: Verify Model IDs in Browser Console

Open browser DevTools (F12) and run:

```javascript
// Check if models are loading
fetch('/models.json')
  .then(r => r.json())
  .then(models => {
    console.log('Gemma models:', models.filter(m => m.name.includes('Gemma')));
  });

// Check WebLLM prebuilt config
import('@mlc-ai/web-llm').then(webllm => {
  const gemmaModels = webllm.prebuiltAppConfig.model_list
    .filter(m => m.model_id.toLowerCase().includes('gemma'));
  console.log('WebLLM Gemma models:', gemmaModels.map(m => m.model_id));
});
```

**Expected Output**:
```javascript
// Your models.json
[
  {
    id: "gemma-2-2b-it-q4f16_1-MLC",
    name: "Gemma 2B",
    displayName: "Google Gemma 2 2B (Balanced)",
    ...
  },
  {
    id: "gemma-2-9b-it-q4f16_1-MLC",
    name: "Gemma 2 9B",
    displayName: "Google Gemma 2 9B (Pro)",
    ...
  }
]

// WebLLM prebuilt list (should match)
[
  "gemma-2-2b-it-q4f16_1-MLC",
  "gemma-2-9b-it-q4f16_1-MLC"
]
```

### Step 2: Check Download Initialization

Monitor network requests when clicking download:

```javascript
// In browser console, watch worker messages
const originalPostMessage = Worker.prototype.postMessage;
Worker.prototype.postMessage = function(...args) {
  console.log('Worker message:', args[0]);
  return originalPostMessage.apply(this, args);
};
```

**What to look for**:
- ✅ `{ type: "init", modelId: "gemma-2-2b-it-q4f16_1-MLC" }`
- ✅ Network requests to Hugging Face CDN: `https://huggingface.co/...`
- ❌ Error: "Model not found" → ID mismatch
- ❌ CORS errors → CDN issue (rare)

### Step 3: Verify WebGPU Support

```javascript
// Check WebGPU availability
if (!navigator.gpu) {
  console.error('❌ WebGPU not supported');
} else {
  navigator.gpu.requestAdapter().then(adapter => {
    if (adapter) {
      console.log('✅ WebGPU adapter found:', adapter);
    } else {
      console.error('❌ No WebGPU adapter available');
    }
  });
}
```

**Common Issues**:
- Firefox: WebGPU disabled by default (enable in `about:config` → `dom.webgpu.enabled`)
- Safari: Limited WebGPU support
- Hardware: Requires modern GPU (Intel HD 6000+, NVIDIA GTX 900+, AMD GCN 4+)

### Step 4: Test Model Download Manually

```javascript
// Manual download test
import('@mlc-ai/web-llm').then(async (webllm) => {
  const modelId = "gemma-2-2b-it-q4f16_1-MLC";
  
  const progressCallback = (progress) => {
    console.log(`Download: ${(progress.progress * 100).toFixed(1)}% - ${progress.text}`);
  };

  try {
    const engine = await webllm.CreateMLCEngine(modelId, {
      initProgressCallback: progressCallback
    });
    
    console.log('✅ Gemma 2 2B downloaded and initialized successfully');
    
    // Test inference
    const response = await engine.chat.completions.create({
      messages: [{ role: 'user', content: 'Say "Hello from Gemma!"' }],
      temperature: 0.7,
      max_tokens: 50
    });
    
    console.log('Response:', response.choices[0].message.content);
  } catch (error) {
    console.error('❌ Download failed:', error);
  }
});
```

### Step 5: Check IndexedDB Cache

```javascript
// Inspect model cache
indexedDB.databases().then(dbs => {
  console.log('IndexedDB databases:', dbs);
  
  // Look for WebLLM cache database
  const webllmDb = dbs.find(db => db.name?.includes('webllm') || db.name?.includes('model'));
  console.log('WebLLM cache DB:', webllmDb);
});

// Check storage usage
if (navigator.storage && navigator.storage.estimate) {
  navigator.storage.estimate().then(estimate => {
    const usedMB = (estimate.usage / 1024 / 1024).toFixed(2);
    const quotaMB = (estimate.quota / 1024 / 1024).toFixed(2);
    console.log(`Storage: ${usedMB} MB used / ${quotaMB} MB total`);
  });
}
```

## Known Issues & Solutions

### Issue 1: "Model not found" Error

**Symptom**: Download button clicked, but error says model doesn't exist

**Cause**: Model ID mismatch between your app and WebLLM's prebuilt config

**Solution**:
```bash
# Verify correct IDs (already fixed in commit f268224)
git log --oneline -n 5 | grep -i gemma
```

Should show: `f268224 fix: add Gemma models and correct model IDs`

### Issue 2: Download Starts But Fails

**Symptom**: Progress bar appears, reaches 10-30%, then fails

**Causes**:
1. **Insufficient storage**: Gemma 2 2B needs ~1.5GB, Gemma 2 9B needs ~5.5GB
   - Solution: Clear browser cache, delete old models
   
2. **Network interruption**: CDN connection dropped
   - Solution: Retry download, check internet stability

3. **Browser memory limit**: Large model exceeds available RAM
   - Solution: Close other tabs, use Gemma 2B (smaller) instead of 9B

**Check Memory**:
```javascript
// Monitor memory during download
const logMemory = () => {
  if (performance.memory) {
    const usedMB = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
    const limitMB = (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2);
    console.log(`Memory: ${usedMB} MB / ${limitMB} MB`);
  }
};

setInterval(logMemory, 5000); // Log every 5 seconds
```

### Issue 3: Model Downloaded But Won't Load

**Symptom**: Download completes (100%), but model fails to initialize

**Cause**: Corrupted cache or incomplete download

**Solution**:
```javascript
// Clear WebLLM cache
async function clearModelCache() {
  const dbs = await indexedDB.databases();
  for (const db of dbs) {
    if (db.name.includes('webllm') || db.name.includes('mlc')) {
      console.log('Deleting:', db.name);
      indexedDB.deleteDatabase(db.name);
    }
  }
  console.log('Cache cleared. Refresh page and retry download.');
}

// Run in console
clearModelCache();
```

### Issue 4: UI Shows "Downloaded" But Model Not Actually Cached

**Symptom**: Green checkmark shows, but clicking loads it again

**Cause**: `isModelCached()` returning false positives

**Debug**:
```typescript
// In browser console
import('@/lib/model-utils').then(({ isModelCached }) => {
  const modelId = 'gemma-2-2b-it-q4f16_1-MLC';
  isModelCached(modelId).then(cached => {
    console.log(`Is ${modelId} cached?`, cached);
  });
});
```

**Fix** (if needed):
Check `client/src/lib/model-utils.ts` → `isModelCached()` function uses correct IndexedDB database name

## Performance Expectations

### Gemma 2 2B (1.5 GB)
- **Download time**: 5-15 minutes (10 Mbps connection)
- **First load**: 8-12 seconds
- **Subsequent loads**: 3-5 seconds (from cache)
- **Inference speed**: 15-25 tokens/second (RTX 3060)
- **Memory usage**: 2.5 GB VRAM minimum

### Gemma 2 9B (5.5 GB)
- **Download time**: 20-45 minutes (10 Mbps connection)
- **First load**: 15-25 seconds
- **Subsequent loads**: 8-12 seconds (from cache)
- **Inference speed**: 8-15 tokens/second (RTX 3060)
- **Memory usage**: 7 GB VRAM minimum

## Testing Checklist

- [ ] Verify model IDs match WebLLM prebuilt config
- [ ] Confirm WebGPU is enabled and working
- [ ] Check available storage (>6GB free recommended)
- [ ] Test network connectivity to huggingface.co
- [ ] Clear browser cache if previous downloads failed
- [ ] Monitor browser console for errors during download
- [ ] Test on Chromium-based browser (Chrome/Edge)
- [ ] Verify models appear in dropdown after models.json loads
- [ ] Check "Downloaded" badge appears after successful cache
- [ ] Test model switching between cached models

## Success Verification

After download completes, verify:

```javascript
// 1. Check IndexedDB
indexedDB.databases().then(dbs => {
  const mlcDb = dbs.find(db => db.name.includes('mlc'));
  console.log('✅ MLC database exists:', !!mlcDb);
});

// 2. Test inference
import('@mlc-ai/web-llm').then(async (webllm) => {
  const engine = await webllm.CreateMLCEngine('gemma-2-2b-it-q4f16_1-MLC');
  const response = await engine.chat.completions.create({
    messages: [{ role: 'user', content: 'Hi!' }],
    max_tokens: 20
  });
  console.log('✅ Inference works:', response.choices[0].message.content);
});

// 3. Verify cache persistence
// Close browser, reopen, check if model loads instantly
```

## Support Resources

- **WebLLM Docs**: https://webllm.mlc.ai/docs/
- **MLC Models List**: https://mlc.ai/models
- **GitHub Issues**: https://github.com/mlc-ai/web-llm/issues
- **Model IDs Reference**: Check `node_modules/@mlc-ai/web-llm/src/config.ts`

---

**Status**: Gemma model IDs corrected as of commit `f268224`. Models should now download successfully. If issues persist, follow debugging steps above and check browser console for specific error messages.
