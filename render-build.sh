#!/usr/bin/env bash

# Kisi bhi error par exit ho jao
set -o errexit

echo "--- 📦 Installing Backend Dependencies ---"
# Root folder se Backend mein ja kar install karein
cd Backend
npm install
cd ..

echo "--- 🌐 Installing Chrome for Puppeteer ---"
# Render ke environment mein Chrome install karne ke liye
# Isse Puppeteer ko browser mil jayega
npx puppeteer browsers install chrome

echo "--- 🎨 Building Frontend ---"
# Frontend folder mein ja kar dependencies install aur build karein
cd Frontend
npm install
npm run build
cd ..

echo "--- ✅ Build Completed Successfully! ---"