
# 🏥 MedFlow POS - Smart Pharmacy Management

### 🛑 GITHUB WARNING: AGAR WHITE PAGE AA RAHA HAI...
Agar aapne files upload kar di hain lekin screen khali (white) hai, toh ye 2 cheezein check karein:

1. **Pages Setting**:
   - GitHub Repo > **Settings** > **Pages**.
   - "Build and deployment" mein "Source" ko **"Deploy from a branch"** hi rehne dein.
   - Branch: **main** aur folder: **/(root)** select kar ke **Save** karein.
   - **Ghalti na karein**: Agar aapne "GitHub Actions" wala option select kiya, toh wo error dega.

2. **Error "GEMINI_API_KEY missing"**:
   - Agar GitHub Actions tab mein error aa rahi hai, toh fikar na karein. Wo software build karne ki koshish kar raha hai jiski zaroorat nahi hai.
   - Bas upar bataye gaye "Deploy from a branch" tareeqe se setting save karein, 1 minute baad link check karein, software chal jayega.

---

### 🚀 Live Chalane ka Sahi Tareeqa:
1. Saari files GitHub par upload karein.
2. Settings > Pages mein ja kar Branch **main** select karein.
3. Link par click karein.

---

### 💾 Online Backup Kaise On Karein?
App jab chal jaye, toh uski **Settings** (App ke andar) mein jayen:
- Firebase Realtime Database ka URL daalein.
- Ab aap jo bhi sale karenge, wo Google Cloud par hamesha save rahegi.

---

### 🛠 Technical Info:
- **No Node.js/npm**: This is a direct browser React app.
- **Transpiler**: Uses esm.sh for runtime loading.
- **Entry Point**: index.html loads index.tsx directly as a module.
