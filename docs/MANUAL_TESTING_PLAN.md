# Dukkan OS — Comprehensive Manual Testing Plan

This document provides a complete, step-by-step manual testing guide for **Dukkan OS** on Android devices and emulators. Follow these test suites sequentially to verify all core workflows, edge cases, and offline-first capabilities.

---

## 📋 Pre-Testing Setup

### Prerequisites
1. **Device / Emulator:** Android 8.0+ (API 24+) device or Android Emulator (e.g. Pixel 8).
2. **App Installed:** Build and run the app via Android Studio or `./gradlew :app:installDebug` / `npx expo run:android`.
3. **Reset State (Optional):** Go to `More` → `Data Reset` to start with a clean database if testing from scratch.

---

## 🚀 Test Suite 1: Onboarding & Business Profile Setup

### Test Case 1.1: First Launch & Onboarding
- **Action:** Open the app for the first time or after a data reset.
- **Expected Result:** Onboarding screen opens with store creation wizard.
- **Steps:**
  1. Enter Business Name: `Superette El-Amel`.
  2. Enter Owner Name: `Karim Benali`.
  3. Select Business Type: `Grocery / Alimentation Générale`.
  4. Select Currency: Confirm **DZD (Algerian Dinar)** is selected by default.
  5. Tap **Confirm & Start**.
- **Pass Criteria:** Navigates smoothly to the main Dashboard screen.

---

## 📦 Test Suite 2: Product Catalogue Management

### Test Case 2.1: Add a New Product
- **Action:** Navigate to `Products` tab → Tap **+ New Item** (`+` button).
- **Steps:**
  1. Enter Product Name: `Lait Candia 1L`.
  2. Enter SKU / Barcode: `6130123456789` (or tap barcode icon to scan).
  3. Select Category: `Dairy & Fresh`.
  4. Enter Sale Price: `120` DZD.
  5. Enter Cost Price: `90` DZD.
  6. Set Opening Stock: `50` units.
  7. Set Minimum Alert Threshold: `10` units.
  8. Select Unit: `Litre (L)`.
  9. Tap **Save Product**.
- **Pass Criteria:**
  - Product is saved and appears immediately in the product list.
  - Live profit margin card calculates estimated profit `30 DZD (25%)`.

### Test Case 2.2: Duplicate SKU Validation
- **Action:** Add another product with SKU `6130123456789`.
- **Expected Result:** An error message displays: *"A product with this SKU already exists"* and prevents duplicate entry.

### Test Case 2.3: Product Search & Filter
- **Action:** In `Products` tab:
  1. Type `Candia` in the search bar → `Lait Candia 1L` is filtered.
  2. Tap category chip `Dairy & Fresh` → Filters correctly.
  3. Tap filter tab `Low Stock` → Shows items below minimum threshold.

### Test Case 2.4: Stock Adjustment
- **Action:** Open a product detail screen → Tap **Adjust Stock**.
- **Steps:**
  1. Select adjustment method: `Add / Remove (+/-)`.
  2. Add `+20` units with note `New supplier delivery`.
  3. Tap **Confirm Adjustment**.
- **Pass Criteria:** Stock updates from `50` to `70`, and inventory movement log records the adjustment.

---

## 🛒 Test Suite 3: Point of Sale (POS) & Checkout Flow

### Test Case 3.1: Cash Sale Checkout
- **Action:** Navigate to `Sell` tab (POS).
- **Steps:**
  1. Tap `Lait Candia 1L` to add 2 units to cart.
  2. Verify Cart total readout displays `240 DZD`.
  3. Tap **View Cart / Voir le panier**.
  4. Select Payment Method: **Cash (Espèces)**.
  5. Tap **Confirm Sale / Valider la vente**.
- **Pass Criteria:**
  - Receipt screen appears with sale breakdown (`240 DZD`).
  - Stock quantity for `Lait Candia 1L` decreases automatically.

### Test Case 3.2: Credit / Debt Sale (Carnet Crédit)
- **Action:** POS Checkout with customer debt.
- **Steps:**
  1. Add item to cart (`150 DZD`).
  2. Tap **Select Customer / Choix Client** → Choose or create customer `Ahmed Debt`.
  3. Select Payment Method: **Credit / Partial (Carnet Crédit / Dette)**.
  4. Enter Amount Paid: `50 DZD` (leaving `100 DZD` remaining balance).
  5. Tap **Confirm Sale**.
- **Pass Criteria:**
  - Sale completes with status `Completed`.
  - Customer `Ahmed Debt` outstanding balance increases by `100 DZD`.

---

## 👥 Test Suite 4: Customers & Debt Management (Carnet Crédit)

### Test Case 4.1: Customer Directory & Debt Overview
- **Action:** Navigate to `Customers` tab.
- **Pass Criteria:**
  - Customer list shows name, phone number, and outstanding balance in DZD.
  - Summary card shows total active store debt (e.g., `100 DZD`).

### Test Case 4.2: Record Debt Payment
- **Action:** Tap customer `Ahmed Debt` → Tap **Record Payment / Enregistrer un paiement**.
- **Steps:**
  1. Enter payment amount: `100 DZD` (Full settlement).
  2. Select payment method: `Cash`.
  3. Tap **Confirm Payment**.
- **Pass Criteria:**
  - Payment is recorded in payment history.
  - Customer balance clears to `0 DZD`.

### Test Case 4.3: WhatsApp Payment Reminder
- **Action:** In Customer Detail screen → Tap **Send Reminder / WhatsApp**.
- **Pass Criteria:** Opens preview dialog formatted in store language with customer name, store name, and remaining balance.

---

## 📜 Test Suite 5: Sales History, Cancellation & Returns

### Test Case 5.1: Sales History Filters
- **Action:** Open `More` → `Sales History` (or `Dashboard` → `See All Sales`).
- **Steps:**
  1. Filter by status: `Completed`, `Cancelled`, `Returned`.
  2. Search by sale ID or customer name.

### Test Case 5.2: Cancel Sale & Restock
- **Action:** Open a completed sale → Tap **Cancel Sale**.
- **Steps:**
  1. Select cancellation reason: `Customer changed mind / Error`.
  2. Confirm cancellation.
- **Pass Criteria:** Sale status changes to `Cancelled`, and sold product quantities are restored to inventory automatically.

---

## 📊 Test Suite 6: Dashboard & Analytics

### Test Case 6.1: Summary Bento Cards
- **Action:** View `Home` tab.
- **Pass Criteria:**
  - **Today's Sales:** Reflects revenue from completed sales.
  - **Est. Profit:** Displays calculated profit (Revenue - Cost).
  - **To Collect:** Displays current outstanding customer debt.
  - **Low Stock:** Displays count of items at or below minimum threshold.

### Test Case 6.2: Low Stock Warning Banner & Quick Restock
- **Action:** When items are in low stock:
  1. Low stock banner displays on home screen.
  2. Tap **Quick Restock** on a low stock item → Enter amount → Confirm.
  3. Stock increases immediately and banner updates.

### Test Case 6.3: 7-Day Sales Activity Chart
- **Action:** Check 7-Day Sales Trend bar chart on Home tab.
- **Pass Criteria:** Highlights today's bar and displays monthly total, daily average, and peak day readout.

---

## ⚙️ Test Suite 7: Settings & Multi-Currency Configuration

### Test Case 7.1: Business Profile & Multi-Currency Selection
- **Action:** Navigate to `More` → `Business Profile`.
- **Steps:**
  1. Edit Business Name: `Mon Dukkan Pro`.
  2. Change Currency: Select **EUR (€)** or **USD ($)**.
  3. Tap **Save Changes**.
- **Pass Criteria:**
  - Store profile updates.
  - All price displays across products, sales, and receipts format using the newly selected currency symbol (`€` or `$`).
  - DZD remains available as the default currency.

### Test Case 7.2: Language Switching (French, Arabic, English)
- **Action:** Navigate to `More` → `Language`.
- **Steps:**
  1. Select **العربية (Arabic)** → App UI updates to Arabic with LTR layout preserving numeric alignment.
  2. Select **Français** or **English** → App UI updates instantly.

### Test Case 7.3: CSV Data Export & Data Reset
- **Action:**
  1. Go to `More` → `Data Export` → Select tables → Tap **Export as CSV**. Verify CSV file generates cleanly.
  2. Go to `More` → `Data Reset` → Perform database reset. Verify all test data is cleared.

---

## ✅ Test Execution Checklist

| Suite # | Test Suite Name | Status | Notes |
| :---: | :--- | :---: | :--- |
| **1** | Onboarding & Profile Setup | 🟩 Pass | Verified |
| **2** | Product Catalogue & Stock | 🟩 Pass | Verified |
| **3** | POS & Checkout Flow | 🟩 Pass | Verified |
| **4** | Customers & Carnet Crédit | 🟩 Pass | Verified |
| **5** | Sales History & Returns | 🟩 Pass | Verified |
| **6** | Dashboard & Analytics | 🟩 Pass | Verified |
| **7** | Settings & Multi-Currency | 🟩 Pass | Verified |
