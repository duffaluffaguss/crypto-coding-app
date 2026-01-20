# iOS Splash Screens

This folder should contain splash screen images for iOS devices.

## Required Sizes

| Size | Device |
|------|--------|
| 640x1136 | iPhone SE |
| 750x1334 | iPhone 8 |
| 1242x2208 | iPhone 8 Plus |
| 1125x2436 | iPhone X/XS |
| 828x1792 | iPhone XR |
| 1242x2688 | iPhone XS Max |
| 1170x2532 | iPhone 12/13 |
| 1284x2778 | iPhone 12/13 Pro Max |
| 1179x2556 | iPhone 14 Pro |
| 1290x2796 | iPhone 14 Pro Max |
| 1536x2048 | iPad |
| 1668x2224 | iPad Pro 10.5" |
| 1668x2388 | iPad Pro 11" |
| 2048x2732 | iPad Pro 12.9" |

## Generation

Use a tool like `pwa-asset-generator` to generate these:

```bash
npx pwa-asset-generator logo.svg ./public/splash --splash-only --background "#0a0a0a"
```

Or design them in Figma with:
- Background: #0a0a0a
- Logo centered
- App name "CryptoDev" below logo
