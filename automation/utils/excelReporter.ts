import ExcelJS from 'exceljs';
import * as path from 'path';
import * as fs from 'fs';
import { AutomationTestCase } from '../data/testCases';

export async function generateEnterpriseExcelReports(testCases: AutomationTestCase[], outputDir: string) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const passedCases = testCases.filter(c => c.status === 'PASSED');
  const failedCases = testCases.filter(c => c.status === 'FAILED');
  const skippedCases = testCases.filter(c => c.status === 'SKIPPED');
  const total = testCases.length;
  const passRate = total > 0 ? Number(((passedCases.length / total) * 100).toFixed(2)) : 100;
  const totalDuration = Number(testCases.reduce((a, b) => a + b.executionTimeSec, 0).toFixed(2));

  // =========================================================================
  // 1. Automation_Test_Report.xlsx (Multi-Sheet Workbook)
  // =========================================================================
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SkillSnap AI QA Automation Team';
  workbook.created = new Date();

  // Sheet 1: Executed Test Cases
  const sheet1 = workbook.addWorksheet('Executed Test Cases');
  sheet1.addRow(['Test ID', 'Module', 'Test Name', 'Status', 'Execution Time (s)', 'Priority']);
  sheet1.getRow(1).font = { name: 'Segoe UI', bold: true, color: { argb: 'FFFFFFFF' } };
  sheet1.getRow(1).eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } });

  testCases.forEach(tc => {
    const row = sheet1.addRow([tc.testId, tc.module, tc.testName, tc.status, tc.executionTimeSec, tc.priority]);
    row.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
    row.getCell(4).font = { color: { argb: 'FF15803D' }, bold: true };
  });
  sheet1.columns = [{ width: 14 }, { width: 25 }, { width: 45 }, { width: 14 }, { width: 20 }, { width: 14 }];

  // Sheet 2: Passed Tests
  const sheet2 = workbook.addWorksheet('Passed Tests');
  sheet2.addRow(['Test ID', 'Module', 'Test Name', 'Status', 'Expected Result', 'Actual Result']);
  sheet2.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet2.getRow(1).eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF15803D' } });
  passedCases.forEach(tc => sheet2.addRow([tc.testId, tc.module, tc.testName, tc.status, tc.expectedResult, tc.actualResult]));
  sheet2.columns = [{ width: 14 }, { width: 25 }, { width: 40 }, { width: 14 }, { width: 40 }, { width: 40 }];

  // Sheet 3: Failed Tests
  const sheet3 = workbook.addWorksheet('Failed Tests');
  sheet3.addRow(['Test ID', 'Module', 'Test Name', 'Status', 'Failure Reason']);
  sheet3.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet3.getRow(1).eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB91C1C' } });
  failedCases.forEach(tc => sheet3.addRow([tc.testId, tc.module, tc.testName, tc.status, tc.actualResult]));
  sheet3.columns = [{ width: 14 }, { width: 25 }, { width: 40 }, { width: 14 }, { width: 45 }];

  // Sheet 4: Skipped Tests
  const sheet4 = workbook.addWorksheet('Skipped Tests');
  sheet4.addRow(['Test ID', 'Module', 'Test Name', 'Status', 'Skip Reason']);
  sheet4.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet4.getRow(1).eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD97706' } });
  skippedCases.forEach(tc => sheet4.addRow([tc.testId, tc.module, tc.testName, tc.status, tc.actualResult]));
  sheet4.columns = [{ width: 14 }, { width: 25 }, { width: 40 }, { width: 14 }, { width: 45 }];

  // Sheet 5: Execution Metrics
  const sheet5 = workbook.addWorksheet('Execution Metrics');
  sheet5.addRow(['Metric Parameter', 'Value']);
  sheet5.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet5.getRow(1).eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } });
  sheet5.addRow(['Total Executed Test Cases', total]);
  sheet5.addRow(['Total Passed', passedCases.length]);
  sheet5.addRow(['Total Failed', failedCases.length]);
  sheet5.addRow(['Total Skipped', skippedCases.length]);
  sheet5.addRow(['Overall Pass Rate %', `${passRate}%`]);
  sheet5.addRow(['Total Execution Duration (s)', `${totalDuration}s`]);
  sheet5.columns = [{ width: 35 }, { width: 25 }];

  // Sheet 6: Defect Summary
  const sheet6 = workbook.addWorksheet('Defect Summary');
  sheet6.addRow(['Defect ID', 'Module', 'Associated Test ID', 'Severity', 'Status']);
  sheet6.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet6.getRow(1).eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } });
  sheet6.columns = [{ width: 16 }, { width: 25 }, { width: 20 }, { width: 16 }, { width: 16 }];

  const reportPath = path.join(outputDir, 'Automation_Test_Report.xlsx');
  await workbook.xlsx.writeFile(reportPath);

  // =========================================================================
  // 2. Summary_Report.xlsx
  // =========================================================================
  const summaryWb = new ExcelJS.Workbook();
  const summarySheet = summaryWb.addWorksheet('Executive Summary');
  summarySheet.addRow(['Test Suite', 'Total Tests', 'Passed', 'Failed', 'Pass Rate %', 'Duration (sec)']);
  summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  summarySheet.getRow(1).eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } });
  summarySheet.addRow(['Live GitHub Pages Selenium E2E Suite', total, passedCases.length, failedCases.length, `${passRate}%`, totalDuration]);
  summarySheet.columns = [{ width: 40 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 16 }, { width: 18 }];
  await summaryWb.xlsx.writeFile(path.join(outputDir, 'Summary_Report.xlsx'));

  // =========================================================================
  // 3. Passed_Test_Cases.xlsx
  // =========================================================================
  const passedWb = new ExcelJS.Workbook();
  const passedSheet = passedWb.addWorksheet('Passed Test Cases');
  passedSheet.addRow(['Test ID', 'Module', 'Test Name', 'Status', 'Time (s)']);
  passedSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  passedSheet.getRow(1).eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF15803D' } });
  passedCases.forEach(tc => passedSheet.addRow([tc.testId, tc.module, tc.testName, tc.status, tc.executionTimeSec]));
  passedSheet.columns = [{ width: 14 }, { width: 25 }, { width: 40 }, { width: 14 }, { width: 16 }];
  await passedWb.xlsx.writeFile(path.join(outputDir, 'Passed_Test_Cases.xlsx'));

  // =========================================================================
  // 4. Failed_Test_Cases.xlsx
  // =========================================================================
  const failedWb = new ExcelJS.Workbook();
  const failedSheet = failedWb.addWorksheet('Failed Test Cases');
  failedSheet.addRow(['Test ID', 'Module', 'Test Name', 'Status', 'Error Details']);
  failedSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  failedSheet.getRow(1).eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB91C1C' } });
  failedCases.forEach(tc => failedSheet.addRow([tc.testId, tc.module, tc.testName, tc.status, tc.actualResult]));
  failedSheet.columns = [{ width: 14 }, { width: 25 }, { width: 40 }, { width: 14 }, { width: 45 }];
  await failedWb.xlsx.writeFile(path.join(outputDir, 'Failed_Test_Cases.xlsx'));

  return reportPath;
}
