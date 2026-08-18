import PDFDocument from "pdfkit";
import fs from "fs";

const BLACK = "#000000";
const GRAY = "#666666";
const LIGHT_GRAY = "#E5E5E5";
const WHITE = "#FFFFFF";
const HEADER_BG = "#F0F0F0";

// Programme window: 25-Aug-2026 .. 13-Oct-2026 (upload with device date = 25 Aug 2026)
// Activity IDs ACT-201 .. ACT-216 (distinct from cycles 1 and 2).
// Zones relative to the 6-week lookahead anchored on 25-Aug-2026:
//   Weeks 1-2 : 25-Aug .. 07-Sep
//   Weeks 3-4 : 08-Sep .. 21-Sep
//   Weeks 5-6 : 22-Sep .. 05-Oct
//   Excluded  : 06-Oct and later
const activities = [
  {
    id: "ACT-201",
    name: "Site Mobilisation",
    duration: "3d",
    start: "25-Aug-26",
    finish: "27-Aug-26",
    zone: "Weeks 1-2",
  },
  {
    id: "ACT-202",
    name: "Temporary Works & Site Setup",
    duration: "4d",
    start: "27-Aug-26",
    finish: "01-Sep-26",
    zone: "Weeks 1-2",
  },
  {
    id: "ACT-203",
    name: "Earthworks Cut and Fill",
    duration: "6d",
    start: "31-Aug-26",
    finish: "07-Sep-26",
    zone: "Weeks 1-2",
  },
  {
    id: "ACT-204",
    name: "Drainage Connections",
    duration: "2d",
    start: "04-Sep-26",
    finish: "07-Sep-26",
    zone: "Weeks 1-2",
  },

  {
    id: "ACT-205",
    name: "Foundation Piling",
    duration: "7d",
    start: "08-Sep-26",
    finish: "16-Sep-26",
    zone: "Weeks 3-4",
  },
  {
    id: "ACT-206",
    name: "Pile Cap Construction",
    duration: "4d",
    start: "14-Sep-26",
    finish: "17-Sep-26",
    zone: "Weeks 3-4",
  },
  {
    id: "ACT-207",
    name: "Ground Floor Slab Pour",
    duration: "5d",
    start: "15-Sep-26",
    finish: "21-Sep-26",
    zone: "Weeks 3-4",
  },
  {
    id: "ACT-208",
    name: "Steel Column Erection",
    duration: "2d",
    start: "18-Sep-26",
    finish: "21-Sep-26",
    zone: "Weeks 3-4",
  },

  {
    id: "ACT-209",
    name: "Structural Steel Frame",
    duration: "7d",
    start: "22-Sep-26",
    finish: "30-Sep-26",
    zone: "Weeks 5-6",
  },
  {
    id: "ACT-210",
    name: "Metal Deck Installation",
    duration: "3d",
    start: "28-Sep-26",
    finish: "30-Sep-26",
    zone: "Weeks 5-6",
  },
  {
    id: "ACT-211",
    name: "Roof Structure & Covering",
    duration: "6d",
    start: "28-Sep-26",
    finish: "05-Oct-26",
    zone: "Weeks 5-6",
  },
  {
    id: "ACT-212",
    name: "External Wall Framing",
    duration: "2d",
    start: "02-Oct-26",
    finish: "05-Oct-26",
    zone: "Weeks 5-6",
  },

  {
    id: "ACT-213",
    name: "Cladding Installation",
    duration: "5d",
    start: "06-Oct-26",
    finish: "12-Oct-26",
    zone: "Excluded",
  },
  {
    id: "ACT-214",
    name: "Window and Glazing",
    duration: "4d",
    start: "07-Oct-26",
    finish: "12-Oct-26",
    zone: "Excluded",
  },
  {
    id: "ACT-215",
    name: "M&E First Fix",
    duration: "5d",
    start: "07-Oct-26",
    finish: "13-Oct-26",
    zone: "Excluded",
  },
  {
    id: "ACT-216",
    name: "Internal Partitions",
    duration: "2d",
    start: "12-Oct-26",
    finish: "13-Oct-26",
    zone: "Excluded",
  },
];

const doc = new PDFDocument({
  size: "A3",
  layout: "landscape",
  margins: { top: 15, bottom: 15, left: 15, right: 15 },
});

const outputPath = "/Users/apple/Downloads/m5_test_cycle_3.pdf";
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
doc.text("M5 Test Cycle 3 Construction Programme / 2026", 15, y);
doc.fontSize(8).fillColor(GRAY);
doc.text("25/08/2026", pageWidth - 60, y);

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
  "Generated by PlanSure | programme window 25 Aug 2026 - 13 Oct 2026 | upload with device date = 25 Aug 2026",
  15,
  footerY,
);

doc.end();
