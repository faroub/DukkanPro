# Dukkan OS — Offline-First Merchant Management App

**Dukkan OS** is an offline-first mobile application built with **React Native** and **Expo SDK 57** designed specifically for small retail merchants, grocers, and shopkeepers.

All business data (products, sales, customers, debt ledgers) is stored locally in an on-device **SQLite** database (`DukkanPro.db`) using atomic transactions and WAL journal mode. Zero cloud dependency.

---

## 🚀 Key Features

- **🛒 Point of Sale (POS & Caisse):** Fast product search, barcode scanning, cart management, instant checkout, and print/share receipts.
- **📦 Inventory & Catalogue:** Stock level tracking, low-stock threshold alert banners, quick counter restock modals, and stock movement audit logs.
- **👥 Customer Debt Ledger (*Carnet Crédit*):** Customer directory, credit sales tracking, partial/full debt payment recording, and automated WhatsApp/SMS debt reminder message previews.
- **💱 Multi-Currency Support:** Seamless support for **Algerian Dinar (DZD)** (Default), **Euro (€)**, and **US Dollar ($)** across all price displays, cart totals, receipts, and financial cards.
- **🌍 Multi-Language & LTR Layout:** Localized in **French (FR)**, **Arabic (AR)**, and **English (EN)** with strict visual LTR layout preservation (supporting Arabic right-aligned text within components).
- **🎨 Dynamic Theming:** Light and Dark mode UI components that adapt dynamically via `useTheme()`.
- **📊 Business Analytics:** Bento summary cards (today's revenue, estimated net profit, debt to collect, low stock count), 7-day sales activity chart, and quick operation shortcuts.
- **💾 Data Control & Export:** CSV export for products, customers, and sales, plus factory data reset capabilities.

---

## 🛠 Tech Stack

- **Framework:** React Native + Expo SDK 57 (Expo Router file-based routing)
- **Database:** `expo-sqlite` (SQLite singleton with WAL mode and foreign key constraints)
- **State Management:** Zustand (`cartStore` for POS cart) + React Context (`LocaleProvider`, `AppThemeProvider`)
- **Localization:** `i18next` + `react-i18next` + `expo-localization`
- **Testing:** Jest + `jest-expo` + React Native Testing Library (`@testing-library/react-native`)

---

## 📱 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Type Check
```bash
npx tsc --noemit
```

### 3. Run Automated Tests
```bash
npm test
```

### 4. Run on Android Emulator / Device
```bash
npx expo run:android
```
*Note: Ensure an Android emulator (e.g. Pixel 8) or connected physical device is running.*

---

## 📚 Documentation Index

Detailed engineering documentation is available in the `docs/` folder:

- **[Architecture Guide (`docs/ARCHITECTURE.md`)](docs/ARCHITECTURE.md):** Folder structure, data flow, SQLite transaction patterns, and LTR architecture rules.
- **[API & State Reference (`docs/API_AND_STATE.md`)](docs/API_AND_STATE.md):** Hook APIs, money formatting utilities, customer balance service, and repositories.
- **[Automated Testing Guide (`docs/TESTING.md`)](docs/TESTING.md):** Testing harness, database reset helpers, and Jest runner conventions.
- **[Manual Testing Plan (`docs/MANUAL_TESTING_PLAN.md`)](docs/MANUAL_TESTING_PLAN.md):** Step-by-step manual test cases covering onboarding, POS, inventory, debt management, and multi-currency features.

---

## 📄 License & Trademark

© mzilab. All rights reserved.
