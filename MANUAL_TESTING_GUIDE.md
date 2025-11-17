# Manual Testing Checklist - Admin Panel Rate Limiting

## Test Date: November 17, 2025

## Server Status
✅ Development server running at http://localhost:5000
✅ .env file created with strong secret: `HRAI-9507daf27407b788f3c83aa7b57994f9e07f3e72a457d24e` (56 characters)

---

## Test Plan: Admin Panel Rate Limiting

### Test 1: Normal Authentication ✅
**Steps:**
1. Open http://localhost:5000
2. Click Settings icon (⚙️)
3. Go to "Storage" tab
4. Press 'A' key 5 times rapidly → Admin Panel should open
5. Enter correct secret code: `HRAI-9507daf27407b788f3c83aa7b57994f9e07f3e72a457d24e`
6. Click "Authenticate"

**Expected Result:**
- ✅ Access granted
- ✅ Can manage custom models

---

### Test 2: Failed Attempts Counter
**Steps:**
1. Open Admin Panel (same as above)
2. Enter WRONG code: `wrong-code-1`
3. Click "Authenticate" → Should see "4 attempts remaining"
4. Enter WRONG code: `wrong-code-2`
5. Click "Authenticate" → Should see "3 attempts remaining"
6. Enter WRONG code: `wrong-code-3`
7. Click "Authenticate" → Should see "2 attempts remaining"

**Expected Result:**
- ✅ Counter decrements correctly
- ✅ Toast shows remaining attempts

---

### Test 3: Account Lockout
**Steps:**
1. Continue from Test 2
2. Enter WRONG code: `wrong-code-4`
3. Click "Authenticate" → Should see "1 attempt remaining"
4. Enter WRONG code: `wrong-code-5`
5. Click "Authenticate" → Should trigger lockout

**Expected Result:**
- ✅ "Account locked" toast appears
- ✅ Message: "Try again in 15 minutes"
- ✅ Cannot attempt authentication even with correct code

---

### Test 4: Lockout Persistence
**Steps:**
1. After lockout, close and reopen browser
2. Try to authenticate with CORRECT code

**Expected Result:**
- ✅ Lockout persists (uses localStorage)
- ✅ Still shows lockout message with remaining time

---

### Test 5: Lockout Bypass Check
**Steps:**
1. While locked out, open browser DevTools
2. Go to Application → Local Storage → http://localhost:5000
3. Find keys: `hrai-admin-attempts` and `hrai-admin-lockout`
4. Delete both keys
5. Try to authenticate with CORRECT code

**Expected Result:**
- ✅ Can authenticate after clearing localStorage
- ⚠️ Known limitation: localStorage can be cleared by user
- 📝 Note: Consider server-side rate limiting for production

---

### Test 6: Successful Auth After Failed Attempts
**Steps:**
1. Clear localStorage (DevTools → Application → Clear All)
2. Attempt 3 WRONG authentications
3. On 4th attempt, enter CORRECT code

**Expected Result:**
- ✅ Access granted immediately
- ✅ Attempt counter reset to 0
- ✅ No lockout keys in localStorage

---

### Test 7: Lockout Timer Expiration
**Steps:**
1. Trigger lockout (5 wrong attempts)
2. Note the lockout timestamp in localStorage
3. Manually edit `hrai-admin-lockout` to a past timestamp
   ```javascript
   localStorage.setItem('hrai-admin-lockout', Date.now() - 1000);
   ```
4. Try to authenticate with CORRECT code

**Expected Result:**
- ✅ Lockout expired, counter reset
- ✅ Can authenticate successfully

---

## Security Analysis

### ✅ Strengths
1. **Rate Limiting Works**: Prevents brute force attempts
2. **Persistent State**: Lockout survives page refresh
3. **User Feedback**: Clear messages about remaining attempts
4. **Graceful Unlock**: Automatic unlock after timeout

### ⚠️ Limitations
1. **Client-Side Only**: Can be bypassed by clearing localStorage
2. **No IP Tracking**: Same user can use incognito mode
3. **No Audit Log**: Failed attempts not logged server-side

### 🔮 Production Recommendations
1. Implement server-side rate limiting with Redis/memory store
2. Add IP-based throttling (Express Rate Limit middleware)
3. Log authentication attempts for security monitoring
4. Consider adding CAPTCHA after 2 failed attempts

---

## Manual Test Results

### Tester Instructions
Please perform tests 1-7 and check off each one:

- [ ] Test 1: Normal Authentication
- [ ] Test 2: Failed Attempts Counter
- [ ] Test 3: Account Lockout
- [ ] Test 4: Lockout Persistence
- [ ] Test 5: Lockout Bypass Check
- [ ] Test 6: Successful Auth After Failed
- [ ] Test 7: Lockout Timer Expiration

### Browser DevTools Console Commands
```javascript
// Check current lockout status
console.log('Attempts:', localStorage.getItem('hrai-admin-attempts'));
console.log('Lockout until:', localStorage.getItem('hrai-admin-lockout'));

// Calculate remaining lockout time
const lockout = localStorage.getItem('hrai-admin-lockout');
if (lockout) {
  const remaining = Math.ceil((parseInt(lockout) - Date.now()) / 60000);
  console.log(`Locked for ${remaining} more minutes`);
}

// Reset lockout manually (for testing only!)
localStorage.removeItem('hrai-admin-attempts');
localStorage.removeItem('hrai-admin-lockout');
console.log('Lockout reset');
```

---

## Next Steps After Manual Testing

1. ✅ Verify all tests pass
2. Build production bundle: `npm run build`
3. Test CSP headers in production build
4. Deploy to Vercel/production
5. Monitor for CSP violations in production
