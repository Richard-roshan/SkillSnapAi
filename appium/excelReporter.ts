import ExcelJS from 'exceljs';
import * as path from 'path';
import * as fs from 'fs';

export interface TestCaseResult {
  id: string;
  category: string;
  feature: string;
  description: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED';
  durationSeconds: number;
  assertionVerdict: string;
  timestamp: string;
  errorDetails?: string;
}

export interface TestRunSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  passRate: string;
  totalDurationSeconds: number;
  startTime: string;
  endTime: string;
  platform: string;
  device: string;
  appId: string;
}

export async function generateExcelAppiumReport(
  results: TestCaseResult[],
  summary: TestRunSummary,
  outputPath: string = path.join(process.cwd(), 'appium', 'Appium_Mobile_E2E_Test_Report.xlsx')
): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SkillSnap AI Appium Automation Engine';
  workbook.created = new Date();

  // -------------------------------------------------------------
  // Sheet 1: Executive Summary & Overview
  // -------------------------------------------------------------
  const summarySheet = workbook.addWorksheet('Executive Summary', {
    views: [{ showGridLines: true }]
  });

  // Title Row
  summarySheet.mergeCells('A1:E2');
  const titleCell = summarySheet.getCell('A1');
  titleCell.value = '📱 SkillSnap AI — Appium Android E2E Test Execution Report';
  titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } }; // Indigo-600
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Environment & Metadata Block
  summarySheet.addRow([]);
  summarySheet.addRow(['Execution Date:', summary.startTime, '', 'Target Platform:', summary.platform]);
  summarySheet.addRow(['Target App ID:', summary.appId, '', 'Target Device:', summary.device]);
  summarySheet.addRow(['Total Duration:', `${summary.totalDurationSeconds}s`, '', 'Automation Engine:', 'Appium (UiAutomator2)']);

  // Format Metadata Labels
  ['A4', 'A5', 'A6', 'D4', 'D5', 'D6'].forEach(cellRef => {
    const c = summarySheet.getCell(cellRef);
    c.font = { bold: true, color: { argb: 'FF334155' } };
  });

  summarySheet.addRow([]);

  // Summary Metrics Header
  summarySheet.mergeCells('A8:E8');
  const metricHeader = summarySheet.getCell('A8');
  metricHeader.value = '📊 Test Run Metrics Summary';
  metricHeader.font = { size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  metricHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }; // Slate-800
  metricHeader.alignment = { horizontal: 'left', vertical: 'middle' };

  // Metrics Cards Table
  const headersRow = summarySheet.addRow(['Total Test Cases', 'Passed', 'Failed', 'Skipped', 'Pass Rate %']);
  headersRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headersRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
    cell.alignment = { horizontal: 'center' };
  });

  const valuesRow = summarySheet.addRow([
    summary.total,
    summary.passed,
    summary.failed,
    summary.skipped,
    `${summary.passRate}%`
  ]);
  valuesRow.font = { size: 14, bold: true };
  valuesRow.getCell(1).alignment = { horizontal: 'center' };
  valuesRow.getCell(2).font = { color: { argb: 'FF16A34A' }, bold: true, size: 14 }; // Green
  valuesRow.getCell(2).alignment = { horizontal: 'center' };
  valuesRow.getCell(3).font = { color: { argb: 'FFDC2626' }, bold: true, size: 14 }; // Red
  valuesRow.getCell(3).alignment = { horizontal: 'center' };
  valuesRow.getCell(4).alignment = { horizontal: 'center' };
  valuesRow.getCell(5).font = { color: { argb: 'FF2563EB' }, bold: true, size: 14 }; // Blue
  valuesRow.getCell(5).alignment = { horizontal: 'center' };

  summarySheet.columnKeyMap = {};
  summarySheet.columns = [
    { width: 22 },
    { width: 30 },
    { width: 15 },
    { width: 22 },
    { width: 25 }
  ];

  // -------------------------------------------------------------
  // Sheet 2: Detailed Test Cases Analysis
  // -------------------------------------------------------------
  const detailsSheet = workbook.addWorksheet('Detailed Test Results', {
    views: [{ showGridLines: true }]
  });

  // Table Headers
  const tableHeader = detailsSheet.addRow([
    'Test ID',
    'Category',
    'Feature Module',
    'Test Case Description',
    'Status',
    'Duration (s)',
    'Assertion Verdict',
    'Timestamp',
    'Error Log / Cause'
  ]);

  tableHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  tableHeader.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // Populate Test Cases
  results.forEach(res => {
    const row = detailsSheet.addRow([
      res.id,
      res.category,
      res.feature,
      res.description,
      res.status,
      res.durationSeconds,
      res.assertionVerdict,
      res.timestamp,
      res.errorDetails || 'N/A'
    ]);

    // Status Cell Styling
    const statusCell = row.getCell(5);
    statusCell.alignment = { horizontal: 'center' };
    if (res.status === 'PASSED') {
      statusCell.font = { bold: true, color: { argb: 'FF15803D' } }; // Dark Green
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } }; // Light Green
    } else if (res.status === 'FAILED') {
      statusCell.font = { bold: true, color: { argb: 'FFB91C1C' } }; // Dark Red
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }; // Light Red
    } else {
      statusCell.font = { bold: true, color: { argb: 'FFB45309' } };
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
    }
  });

  // Set Column Widths for Readability
  detailsSheet.columns = [
    { width: 14 }, // Test ID
    { width: 18 }, // Category
    { width: 25 }, // Feature Module
    { width: 45 }, // Description
    { width: 14 }, // Status
    { width: 14 }, // Duration
    { width: 40 }, // Assertion Verdict
    { width: 16 }, // Timestamp
    { width: 50 }  // Error Log
  ];

  // Save Workbook to File
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  await workbook.xlsx.writeFile(outputPath);
  return outputPath;
}
