# BeanRoute PWA Quick Setup Guide

## 🚀 Fast Manual Setup (5 minutes)

If the automated script doesn't work, follow these steps manually:

### Step 1: Install Dependencies
```bash
npm install web-push@3.6.7
```

### Step 2: Generate VAPID Keys
```bash
node generate-vapid-keys.js
```
**Copy the output** - you'll need these for your `.env` file.

### Step 3: Update .env File
Add these lines to your `.env` file:
```env
VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_SUBJECT=mailto:admin@beanroute.com
```

### Step 4: Database Migration
```bash
npx prisma migrate dev --name add_push_notifications --skip-seed
```

### Step 5: Start Development Server
```bash
npm run dev
```

## 🧪 Testing PWA Features

1. **Open** http://localhost:3000 in Chrome
2. **Look for** notification badge in header (top right)
3. **Click** the badge to enable notifications
4. **Grant permission** when browser prompts
5. **Test** by going to `/settings/notifications`

## 🔧 Troubleshooting

- **VAPID keys not working?** Check your `.env` file has the correct keys
- **Migration fails?** Try `npx prisma migrate reset` first
- **Notifications not showing?** Check browser console for errors
- **Service worker issues?** Clear browser cache and reload

## 📱 PWA Features Available

- ✅ App manifest (Add to Home Screen)
- ✅ Service worker (Offline support)
- ✅ Push notifications
- ✅ Background sync
- ✅ Mobile app shortcuts

## 🚀 Next Steps

After local testing, deploy to Railway:
```bash
git add .
git commit -m "PWA implementation complete"
git push
railway up
```
