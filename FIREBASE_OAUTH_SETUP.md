# Firebase OAuth Setup for VoxForge Studio

## 🚨 **Current Issue**

Firebase authentication is failing on production with this error:

```
The current domain is not authorized for OAuth operations.
Add your domain (voxforge-studio.vercel.app) to the OAuth redirect domains list.
```

## ✅ **Solution: Authorize Vercel Domain**

### **Step 1: Access Firebase Console**

1. Go to: https://console.firebase.google.com/
2. Select project: **still-federation-3flln**

### **Step 2: Navigate to Authentication**

1. Click **"Authentication"** in the left sidebar
2. Click **"Settings"** tab at the top
3. Click **"Authorized domains"** tab

### **Step 3: Add Production Domain**

1. Click **"Add domain"** button
2. Enter: `voxforge-studio.vercel.app`
3. Click **"Add"** to save

### **Step 4: Verify Configuration**

Your authorized domains list should include:

- ✅ `localhost` - For local development
- ✅ `127.0.0.1` - For local development (optional)
- ✅ `still-federation-3flln.firebaseapp.com` - Default Firebase domain
- ✅ `voxforge-studio.vercel.app` - **Production Vercel domain** ⚠️ **ADD THIS**

### **Step 5: Test Authentication**

1. Visit: https://voxforge-studio.vercel.app
2. Click **"Sign In"** button
3. Complete Google OAuth flow
4. Verify successful sign-in

## 🔐 **OAuth Configuration Details**

### **Current Firebase Config**
- **Project ID**: `still-federation-3flln`
- **Auth Domain**: `still-federation-3flln.firebaseapp.com`
- **OAuth Client ID**: `328575981674-plhvqomcfsqkiaskjrt6a5sjpv33a6au.apps.googleusercontent.com`

### **Required OAuth Redirect URIs**

Firebase automatically configures these patterns:
```
https://voxforge-studio.vercel.app/__/auth/handler
https://voxforge-studio.vercel.app/__/auth/iframe
```

## 🛠️ **Additional Domains to Consider**

If you deploy preview branches, you may need to add:

### **Vercel Preview Domains**
```
*.vercel.app
voxforge-studio-*.vercel.app
```

**Note**: Wildcards (`*.vercel.app`) may not work in Firebase. You'll need to add specific preview URLs manually if needed.

### **Custom Domains**
If you add a custom domain later:
```
voxforge.studio
www.voxforge.studio
```

## 🔍 **Troubleshooting**

### **Issue: "Auth domain not configured"**
**Solution**: Ensure `authDomain` in `firebase-applet-config.json` matches Firebase console

### **Issue: "Popup blocked by browser"**
**Solution**: 
- Try `signInWithRedirect` instead of `signInWithPopup`
- Allow popups for the domain

### **Issue: "OAuth client ID mismatch"**
**Solution**: 
- Verify OAuth client ID in Firebase Console → Authentication → Sign-in method → Google
- Check Google Cloud Console for matching OAuth client

### **Issue: "CORS errors"**
**Solution**: 
- Firebase should handle CORS automatically for authorized domains
- Verify domain is correctly added (no typos, correct protocol)

## 📝 **Development Workflow**

### **Local Development**
```bash
npm run dev
# Access at: http://localhost:5173
# Firebase OAuth works with 'localhost' authorized
```

### **Production Deployment**
```bash
vercel --prod
# Access at: https://voxforge-studio.vercel.app
# Requires domain to be authorized in Firebase
```

### **Preview Deployments**
```bash
vercel
# Access at: https://voxforge-studio-[hash].vercel.app
# May require adding preview URL to Firebase authorized domains
```

## 🎯 **Quick Checklist**

Before deploying to production:

- [ ] Firebase project selected
- [ ] Authentication enabled with Google provider
- [ ] Production domain added to authorized domains
- [ ] OAuth client ID configured
- [ ] Test sign-in flow on production URL
- [ ] Verify Firestore rules allow authenticated users
- [ ] Check browser console for any remaining errors

## 🔗 **Useful Links**

- **Firebase Console**: https://console.firebase.google.com/project/still-federation-3flln
- **Firebase Auth Docs**: https://firebase.google.com/docs/auth/web/google-signin
- **Vercel Deployment**: https://voxforge-studio.vercel.app
- **Google Cloud Console**: https://console.cloud.google.com/

## 🚀 **After Fixing**

Once you've added the domain:

1. **Clear browser cache** (or use incognito mode)
2. **Visit production site**: https://voxforge-studio.vercel.app
3. **Click "Sign In"**
4. **Complete Google OAuth**
5. **Verify dashboard access**

The authentication should now work perfectly! 🎉

---

**Status**: ⚠️ **ACTION REQUIRED**  
**Priority**: 🔴 **HIGH** - Blocks production authentication  
**ETA**: ~2 minutes to configure in Firebase Console