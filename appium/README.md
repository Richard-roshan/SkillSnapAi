# SkillSnap AI — Appium Android Mobile E2E Testing Framework

This directory (`appium/`) contains the complete **Appium Mobile End-to-End Automated Testing Suite** and **Excel Analysis Report Generator** for the SkillSnap AI Android mobile application (`com.skillsnap.ai`).

---

## 📁 Directory Structure

```text
appium/
├── config.ts                     # Appium UiAutomator2 Android Driver capabilities configuration
├── excelReporter.ts              # ExcelJS report generator for workbook formatting
├── runner.ts                     # Main test suite execution runner script
├── Appium_Mobile_E2E_Test_Report.xlsx  # Generated Excel analysis report
└── specs/
    └── mobile_e2e.ts             # 18 E2E Mobile Test Cases (Auth, Navigation, AI Tools, Dashboard)
```

---

## 📊 Excel Analysis Report (`Appium_Mobile_E2E_Test_Report.xlsx`)

The framework automatically outputs a styled Excel analysis workbook containing:

1. **Executive Summary Worksheet**:
   - Executive header banner (Indigo gradient)
   - Metadata block (Target App ID `com.skillsnap.ai`, Device name, Execution duration)
   - Summary Metric Cards: Total Tests, Passed Count (Green), Failed Count (Red), Skipped Count, Pass Rate % (Blue).

2. **Detailed Test Results Worksheet**:
   - Tabular breakdown of all 18 test cases across 6 feature categories.
   - Includes `Test ID`, `Category`, `Feature Module`, `Description`, `Status` (styled background pill), `Duration (s)`, `Assertion Verdict`, `Timestamp`, and `Error Log`.

---

## 🚀 Running Appium Tests Locally

### 1. Execute Test Suite & Generate Excel Report
Run the runner script using `npm`:

```bash
npm run test:appium
```

Or directly via `npx tsx`:

```bash
npx tsx appium/runner.ts
```

### 2. Prerequisites for Live Appium Server & Device
To execute against a live Android Emulator or physical device:

1. **Install Appium Server**:
   ```bash
   npm install -g appium
   appium driver install uiautomator2
   ```

2. **Start Appium Server**:
   ```bash
   appium --port 4723
   ```

3. **Verify Android Device/Emulator**:
   ```bash
   adb devices
   ```
