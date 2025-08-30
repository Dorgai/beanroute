# 🖼️ BeanRoute PWA Icons

## 📋 Icon Requirements

This directory should contain PWA icons in the following sizes:

### Required Sizes:
- **icon-72x72.png** - Basic mobile icon
- **icon-96x96.png** - Medium density screens  
- **icon-128x128.png** - High density screens
- **icon-144x144.png** - Extra high density
- **icon-152x152.png** - iOS specific
- **icon-192x192.png** - Chrome minimum (should be maskable)
- **icon-384x384.png** - Large screens
- **icon-512x512.png** - Splash screens (should be maskable)

## 🎨 Design Source

Base the icons on the existing logo files:
- **Source SVG**: `/public/images/sonic-beans-logo.svg`
- **Source JPG**: `/public/images/sonic-beans-logo.jpg`

## 🛠️ Icon Generation Tools

### Online Generators:
1. **PWA Builder Image Generator**: https://www.pwabuilder.com/imageGenerator
2. **Real Favicon Generator**: https://realfavicongenerator.net/
3. **Favicon.io**: https://favicon.io/

### Design Guidelines:
- **Minimum safe area**: Keep important elements within 80% of the icon
- **High contrast**: Ensure visibility on both light and dark backgrounds
- **Simple design**: Icons should be recognizable at 72x72px
- **Consistent branding**: Use BeanRoute color scheme (#2563eb)

## 📱 Testing

After adding icons, test on:
- **Android Chrome**: Check install prompt and home screen icon
- **iOS Safari**: Verify "Add to Home Screen" functionality
- **Various screen densities**: Ensure icons look crisp

## 🔄 Temporary Fallback

Until custom icons are created, browsers will:
1. Use the existing favicon.ico
2. Generate icons from the website logo
3. Show a default PWA icon

The PWA functionality will work without custom icons, but custom icons provide a better user experience.

---

**Next Steps:**
1. Create or convert existing logo to PWA icon sizes
2. Test icons across different devices and browsers
3. Update manifest.json if needed for optimization
