import PDFDocument from "pdfkit";
import fs from "fs";

const BLACK = "#000000";
const GRAY = "#666666";
const LIGHT_GRAY = "#E5E5E5";
const WHITE = "#FFFFFF";
const HEADER_BG = "#F0F0F0";

// Programme window: 29-Jul-2026 .. 16-Sep-2026 (upload with device date = 29 Jul 2026)
// Zones relative to the 6-week lookahead anchored on 29-Jul-2026:
//   Weeks 1-2 : 29-Jul .. 11-Aug
//   Weeks 3-4 : 12-Aug .. 25-Aug
//   Weeks 5-6 : 26-Aug .. 08-Sep
//   Excluded  : 09-Sep and later
const activities = [
  {
    id: "ACT-001",
    name: "Site Mobilisation",
    duration: "3d",
    start: "29-Jul-26",
    finish: "31-Jul-26",
    zone: "Weeks 1-2",
  },
  {
    id: "ACT-002",
    name: "Temporary Works & Site Setup",
    duration: "4d",
    start: "31-Jul-26",
    finish: "05-Aug-26",
    zone: "Weeks 1-2",
  },
  {
    id: "ACT-003",
    name: "Earthworks Cut and Fill",
    duration: "6d",
    start: "04-Aug-26",
    finish: "11-Aug-26",
    zone: "Weeks 1-2",
  },
  {
    id: "ACT-004",
    name: "Drainage Connections",
    duration: "2d",
    start: "10-Aug-26",
    finish: "11-Aug-26",
    zone: "Weeks 1-2",
  },

  {
    id: "ACT-005",
    name: "Foundation Piling",
    duration: "7d",
    start: "12-Aug-26",
    finish: "20-Aug-26",
    zone: "Weeks 3-4",
  },
  {
    id: "ACT-006",
    name: "Pile Cap Construction",
    duration: "4d",
    start: "18-Aug-26",
    finish: "21-Aug-26",
    zone: "Weeks 3-4",
  },
  {
    id: "ACT-007",
    name: "Ground Floor Slab Pour",
    duration: "5d",
    start: "19-Aug-26",
    finish: "25-Aug-26",
    zone: "Weeks 3-4",
  },
  {
    id: "ACT-008",
    name: "Steel Column Erection",
    duration: "2d",
    start: "24-Aug-26",
    finish: "25-Aug-26",
    zone: "Weeks 3-4",
  },

  {
    id: "ACT-009",
    name: "Structural Steel Frame",
    duration: "7d",
    start: "26-Aug-26",
    finish: "03-Sep-26",
    zone: "Weeks 5-6",
  },
  {
    id: "ACT-010",
    name: "Metal Deck Installation",
    duration: "3d",
    start: "01-Sep-26",
    finish: "03-Sep-26",
    zone: "Weeks 5-6",
  },
  {
    id: "ACT-011",
    name: "Roof Structure & Covering",
    duration: "6d",
    start: "01-Sep-26",
    finish: "08-Sep-26",
    zone: "Weeks 5-6",
  },
  {
    id: "ACT-012",
    name: "External Wall Framing",
    duration: "2d",
    start: "07-Sep-26",
    finish: "08-Sep-26",
    zone: "Weeks 5-6",
  },

  {
    id: "ACT-013",
    name: "Cladding Installation",
    duration: "5d",
    start: "09-Sep-26",
    finish: "15-Sep-26",
    zone: "Excluded",
  },
  {
    id: "ACT-014",
    name: "Window and Glazing",
    duration: "4d",
    start: "10-Sep-26",
    finish: "15-Sep-26",
    zone: "Excluded",
  },
  {
    id: "ACT-015",
    name: "M&E First Fix",
    duration: "5d",
    start: "10-Sep-26",
    finish: "16-Sep-26",
    zone: "Excluded",
  },
  {
    id: "ACT-016",
    name: "Internal Partitions",
    duration: "2d",
    start: "15-Sep-26",
    finish: "16-Sep-26",
    zone: "Excluded",
  },
];

const doc = new PDFDocument({
  size: "A3",
  layout: "landscape",
  margins: { top: 15, bottom: 15, left: 15, right: 15 },
});

const outputPath = "/Users/apple/Downloads/m5_test_cycle_1.pdf";
doc.pipe(fs.createWriteStream(outputPath));

const pageWidth = doc.page.width - 30;

const COL_ID_X = 15;
const COL_ID_WIDTH = 85;
const COL_NAME_X = 100;
const COL_NAME_WIDTH = 320;
const COL_DURATION_X = 420;
const COL_DURATION_WIDTH = 60;
const COL_START_X = 480;
const COL_START_WIDTH = 75;
const COL_FINISH_X = 555;
const COL_FINISH_WIDTH = 75;
const TABLE_END_X = 630;

let y = 15;

doc.fontSize(12).fillColor(BLACK);
doc.text("M5 Test Cycle 1 Construction Programme / 2026", 15, y);
doc.fontSize(8).fillColor(GRAY);
doc.text("29/07/2026", pageWidth - 60, y);

y += 35;

doc.rect(COL_ID_X, y, TABLE_END_X - COL_ID_X, 22).fill(HEADER_BG);

doc.fontSize(8).fillColor(BLACK).font("Helvetica-Bold");
doc.text("Activity ID", COL_ID_X + 3, y + 6);
doc.text("Activity Name", COL_NAME_X + 3, y + 6);
doc.text("Duration", COL_DURATION_X + 3, y + 6);
doc.text("Start", COL_START_X + 3, y + 6);
doc.text("Finish", COL_FINISH_X + 3, y + 6);

doc.strokeColor(GRAY).lineWidth(0.5);
[COL_NAME_X, COL_DURATION_X, COL_START_X, COL_FINISH_X, TABLE_END_X].forEach(
  (x) => {
    doc
      .moveTo(x, y)
      .lineTo(x, y + 22)
      .stroke();
  },
);

y += 22;

const rowHeight = 20;
doc.font("Helvetica");

activities.forEach((activity, index) => {
  const rowY = y + index * rowHeight;

  doc
    .rect(COL_ID_X, rowY, TABLE_END_X - COL_ID_X, rowHeight)
    .fill(index % 2 === 0 ? "#FAFAFA" : WHITE);

  doc.strokeColor(LIGHT_GRAY).lineWidth(0.3);
  doc.rect(COL_ID_X, rowY, TABLE_END_X - COL_ID_X, rowHeight).stroke();

  [COL_NAME_X, COL_DURATION_X, COL_START_X, COL_FINISH_X].forEach((x) => {
    doc
      .moveTo(x, rowY)
      .lineTo(x, rowY + rowHeight)
      .stroke();
  });

  doc.fontSize(7).fillColor(BLACK).font("Helvetica");
  doc.text(activity.id, COL_ID_X + 3, rowY + 6, { width: COL_ID_WIDTH - 6 });
  doc.text(activity.name, COL_NAME_X + 3, rowY + 6, {
    width: COL_NAME_WIDTH - 6,
  });
  doc.text(activity.duration, COL_DURATION_X + 3, rowY + 6, {
    width: COL_DURATION_WIDTH - 6,
    align: "center",
  });
  doc.text(activity.start, COL_START_X + 3, rowY + 6, {
    width: COL_START_WIDTH - 6,
    align: "center",
  });
  doc.text(activity.finish, COL_FINISH_X + 3, rowY + 6, {
    width: COL_FINISH_WIDTH - 6,
    align: "center",
  });
});

const footerY = y + activities.length * rowHeight + 20;
doc.fontSize(6).fillColor(GRAY);
doc.text(
  "Generated by PlanSure | programme window 29 Jul 2026 - 16 Sep 2026 | upload with device date = 29 Jul 2026",
  15,
  footerY,
);

doc.end();
