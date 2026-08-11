import ExcelJS from 'exceljs';
import * as path from 'path';
import * as fs from 'fs';

export interface SeleniumTestCaseResult {
  no: number;
  category: string;
  testName: string;
  timeSec: number;
  status: 'PASSED' | 'FAILED';
  message: string;
}

export interface SeleniumTestRunSummary {
  testSuite: string;
  totalTests: number;
  passed: number;
  failed: number;
  passRate: number;
  durationSec: number;
  startTime: string;
  endTime: string;
}

export async function generateSeleniumExcelReport(
  results: SeleniumTestCaseResult[],
  summary: SeleniumTestRunSummary,
  outputPath?: string
): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const defaultPath = path.join(process.cwd(), `E2E_Test_Report_SkillSnapAI_${timestamp}.xlsx`);
  const finalPath = outputPath || defaultPath;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SkillSnap AI Selenium E2E Test Automation';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('E2E Test Report', {
    views: [{ showGridLines: true }]
  });

  // -------------------------------------------------------------
  // 1. Summary Table Header Row (Navy Blue #1E293B)
  // -------------------------------------------------------------
  const summaryHeaderRow = sheet.addRow([
    'Test Suite',
    'Total Tests',
    'Passed',
    'Failed',
    'Pass Rate %',
    'Duration (sec)',
    'Start Time',
    'End Time'
  ]);

  summaryHeaderRow.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  summaryHeaderRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }; // Dark Navy
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // Summary Data Row
  const summaryDataRow = sheet.addRow([
    summary.testSuite,
    summary.totalTests,
    summary.passed,
    summary.failed,
    summary.passRate,
    summary.durationSec,
    summary.startTime,
    summary.endTime
  ]);

  summaryDataRow.font = { name: 'Segoe UI', size: 11, bold: true };
  summaryDataRow.getCell(1).alignment = { horizontal: 'left' };
  summaryDataRow.getCell(2).alignment = { horizontal: 'center' };
  summaryDataRow.getCell(3).font = { color: { argb: 'FF15803D' }, bold: true }; // Green
  summaryDataRow.getCell(3).alignment = { horizontal: 'center' };
  summaryDataRow.getCell(4).font = { color: { argb: 'FFB91C1C' }, bold: true }; // Red
  summaryDataRow.getCell(4).alignment = { horizontal: 'center' };
  summaryDataRow.getCell(5).font = { color: { argb: 'FF2563EB' }, bold: true }; // Blue
  summaryDataRow.getCell(5).alignment = { horizontal: 'center' };
  summaryDataRow.getCell(6).alignment = { horizontal: 'center' };
  summaryDataRow.getCell(7).alignment = { horizontal: 'center' };
  summaryDataRow.getCell(8).alignment = { horizontal: 'center' };

  sheet.addRow([]);
  sheet.addRow([]);

  // -------------------------------------------------------------
  // 2. Detailed Test Results Table Header Row
  // -------------------------------------------------------------
  const detailsHeaderRow = sheet.addRow([
    'No.',
    'Category',
    'Test Name',
    'Time (sec)',
    'Status',
    'Message / Error Details'
  ]);

  detailsHeaderRow.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  detailsHeaderRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // Populate Detailed Test Case Rows
  results.forEach(res => {
    const row = sheet.addRow([
      res.no,
      res.category,
      res.testName,
      res.timeSec,
      res.status,
      res.message
    ]);

    row.font = { name: 'Segoe UI', size: 10 };

    // Alignments
    row.getCell(1).alignment = { horizontal: 'center' };
    row.getCell(2).alignment = { horizontal: 'left' };
    row.getCell(3).alignment = { horizontal: 'left' };
    row.getCell(4).alignment = { horizontal: 'right' };
    row.getCell(5).alignment = { horizontal: 'center' };
    row.getCell(6).alignment = { horizontal: 'left' };

    // Row Highlighting (Matching reference PancreaScan report styling)
    const isPassed = res.status === 'PASSED';
    const bgArgb = isPassed ? 'FFDCFCE7' : 'FFFEE2E2'; // Soft Green vs Soft Pink
    const fgArgb = isPassed ? 'FF15803D' : 'FFB91C1C'; // Dark Green vs Dark Red

    row.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
    });

    const statusCell = row.getCell(5);
    statusCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: fgArgb } };
  });

  // Column Widths matching reference formatting
  sheet.columns = [
    { width: 8 },   // No.
    { width: 26 },  // Category
    { width: 48 },  // Test Name
    { width: 14 },  // Time (sec)
    { width: 14 },  // Status
    { width: 65 }   // Message / Error Details
  ];

  // Save Workbook File
  const dir = path.dirname(finalPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  await workbook.xlsx.writeFile(finalPath);
  return finalPath;
}
