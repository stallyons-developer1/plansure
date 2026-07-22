import PDFDocument from "pdfkit";
import fs from "fs";

// Colors
const BLACK = "#000000";
const GRAY = "#666666";
const LIGHT_GRAY = "#E5E5E5";
const WHITE = "#FFFFFF";
const HEADER_BG = "#F0F0F0";

// 12 activities, 4 per zone.
//
// IMPORTANT: upload this with the device date set to 3 July 2026. The week
// window is anchored to lookaheadStartDate (the UPLOAD date), not to anything
// in this file — see programmeUploadRoutes.js:583. Uploading on 3 Jul gives:
//   Weeks 1-2 : 3 Jul  .. 16 Jul   <- close-week opens once today >= 16 Jul
//   Weeks 3-4 : 17 Jul .. 30 Jul
//   Weeks 5-6 : 31 Jul .. 13 Aug
// The zones below are laid out to match that anchor. Upload on any other date
// and the activities will fall into different zones than labelled here.
const activities = [
  // --- Weeks 1-2 : 3 Jul .. 16 Jul ---
  { id: "JUL-001", name: "Site Mobilisation", duration: "4d", start: "03-Jul-26", finish: "06-Jul-26", zone: "Weeks 1-2" },
  { id: "JUL-002", name: "Temporary Works & Site Setup", duration: "4d", start: "07-Jul-26", finish: "10-Jul-26", zone: "Weeks 1-2" },
  { id: "JUL-003", name: "Earthworks Cut and Fill", duration: "5d", start: "10-Jul-26", finish: "14-Jul-26", zone: "Weeks 1-2" },
  { id: "JUL-004", name: "Drainage Connections", duration: "2d", start: "15-Jul-26", finish: "16-Jul-26", zone: "Weeks 1-2" },

  // --- Weeks 3-4 : 17 Jul .. 30 Jul ---
  { id: "JUL-005", name: "Foundation Piling", duration: "6d", start: "17-Jul-26", finish: "22-Jul-26", zone: "Weeks 3-4" },
  { id: "JUL-006", name: "Pile Cap Construction", duration: "4d", start: "21-Jul-26", finish: "24-Jul-26", zone: "Weeks 3-4" },
  { id: "JUL-007", name: "Ground Floor Slab Pour", duration: "5d", start: "24-Jul-26", finish: "28-Jul-26", zone: "Weeks 3-4" },
  { id: "JUL-008", name: "Steel Column Erection", duration: "2d", start: "29-Jul-26", finish: "30-Jul-26", zone: "Weeks 3-4" },

  // --- Weeks 5-6 : 31 Jul .. 13 Aug ---
  { id: "JUL-009", name: "Structural Steel Frame", duration: "6d", start: "31-Jul-26", finish: "05-Aug-26", zone: "Weeks 5-6" },
  { id: "JUL-010", name: "Metal Deck Installation", duration: "3d", start: "04-Aug-26", finish: "06-Aug-26", zone: "Weeks 5-6" },
  { id: "JUL-011", name: "Roof Structure & Covering", duration: "6d", start: "07-Aug-26", finish: "12-Aug-26", zone: "Weeks 5-6" },
  { id: "JUL-012", name: "External Wall Framing", duration: "2d", start: "12-Aug-26", finish: "13-Aug-26", zone: "Weeks 5-6" },
];

const doc = new PDFDocument({
  size: "A3",
  layout: "landscape",
  margins: { top: 15, bottom: 15, left: 15, right: 15 },
});

const outputPath = "/Users/apple/Downloads/test_programme_jul3_anchor_2026.pdf";
doc.pipe(fs.createWriteStream(outputPath));

const pageWidth = doc.page.width - 30;

// Column positions
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

// Title
doc.fontSize(12).fillColor(BLACK);
doc.text("July-August Construction Programme / 2026", 15, y);
doc.fontSize(8).fillColor(GRAY);
doc.text("03/07/2026", pageWidth - 60, y);

y += 35;

// Column headers
doc.rect(COL_ID_X, y, TABLE_END_X - COL_ID_X, 22).fill(HEADER_BG);

doc.fontSize(8).fillColor(BLACK).font("Helvetica-Bold");
doc.text("Activity ID", COL_ID_X + 3, y + 6);
doc.text("Activity Name", COL_NAME_X + 3, y + 6);
doc.text("Duration", COL_DURATION_X + 3, y + 6);
doc.text("Start", COL_START_X + 3, y + 6);
doc.text("Finish", COL_FINISH_X + 3, y + 6);

doc.strokeColor(GRAY).lineWidth(0.5);
[COL_NAME_X, COL_DURATION_X, COL_START_X, COL_FINISH_X, TABLE_END_X].forEach((x) => {
  doc.moveTo(x, y).lineTo(x, y + 22).stroke();
});

y += 22;

// Rows
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
    doc.moveTo(x, rowY).lineTo(x, rowY + rowHeight).stroke();
  });

  doc.fontSize(7).fillColor(BLACK).font("Helvetica");
  doc.text(activity.id, COL_ID_X + 3, rowY + 6, { width: COL_ID_WIDTH - 6 });
  doc.text(activity.name, COL_NAME_X + 3, rowY + 6, { width: COL_NAME_WIDTH - 6 });
  doc.text(activity.duration, COL_DURATION_X + 3, rowY + 6, { width: COL_DURATION_WIDTH - 6, align: "center" });
  doc.text(activity.start, COL_START_X + 3, rowY + 6, { width: COL_START_WIDTH - 6, align: "center" });
  doc.text(activity.finish, COL_FINISH_X + 3, rowY + 6, { width: COL_FINISH_WIDTH - 6, align: "center" });
});

// Footer
const footerY = y + activities.length * rowHeight + 20;
doc.fontSize(6).fillColor(GRAY);
doc.text("Generated by PlanSure | upload with device date = 3 Jul 2026", 15, footerY);

doc.end();

console.log(`PDF generated: ${outputPath}`);
console.log(`Total activities: ${activities.length}`);
console.log("\n=== Zone distribution (assumes upload on 3 Jul 2026) ===");
const ranges = {
  "Weeks 1-2": "03-Jul .. 16-Jul",
  "Weeks 3-4": "17-Jul .. 30-Jul",
  "Weeks 5-6": "31-Jul .. 13-Aug",
};
["Weeks 1-2", "Weeks 3-4", "Weeks 5-6"].forEach((z) => {
  const inZone = activities.filter((a) => a.zone === z);
  console.log(`${z.padEnd(9)} (${ranges[z].padEnd(17)}): ${inZone.length} - ${inZone.map((a) => a.id).join(", ")}`);
});
console.log("\nUpload with device date = 3 Jul 2026 -> Weeks 1-2 closes once today >= 16 Jul.");
