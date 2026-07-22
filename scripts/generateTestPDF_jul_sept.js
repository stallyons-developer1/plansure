import PDFDocument from "pdfkit";
import fs from "fs";

// Colors
const BLACK = "#000000";
const GRAY = "#666666";
const LIGHT_GRAY = "#E5E5E5";
const WHITE = "#FFFFFF";
const HEADER_BG = "#F0F0F0";

// 16 activities, 4 per zone, spanning 15-Jul-2026 to 15-Sep-2026.
// Zone is driven by the scheduled START date:
//   Week 1-2  : 15-Jul .. 28-Jul
//   Week 3-4  : 29-Jul .. 11-Aug
//   Week 5-6  : 12-Aug .. 25-Aug
//   Excluded  : 26-Aug and later
// `zone` is for the console summary only; it is not rendered into the PDF.
const activities = [
  // --- Week 1-2 : 15-Jul .. 28-Jul ---
  { id: "SEP-001", name: "Site Mobilisation", duration: "3d", start: "15-Jul-26", finish: "17-Jul-26", zone: "Week 1-2" },
  { id: "SEP-002", name: "Temporary Works & Site Setup", duration: "4d", start: "20-Jul-26", finish: "23-Jul-26", zone: "Week 1-2" },
  { id: "SEP-003", name: "Earthworks Cut and Fill", duration: "6d", start: "22-Jul-26", finish: "27-Jul-26", zone: "Week 1-2" },
  { id: "SEP-004", name: "Drainage Connections", duration: "2d", start: "27-Jul-26", finish: "28-Jul-26", zone: "Week 1-2" },

  // --- Week 3-4 : 29-Jul .. 11-Aug ---
  { id: "SEP-005", name: "Foundation Piling", duration: "7d", start: "29-Jul-26", finish: "04-Aug-26", zone: "Week 3-4" },
  { id: "SEP-006", name: "Pile Cap Construction", duration: "4d", start: "03-Aug-26", finish: "06-Aug-26", zone: "Week 3-4" },
  { id: "SEP-007", name: "Ground Floor Slab Pour", duration: "5d", start: "06-Aug-26", finish: "10-Aug-26", zone: "Week 3-4" },
  { id: "SEP-008", name: "Steel Column Erection", duration: "2d", start: "10-Aug-26", finish: "11-Aug-26", zone: "Week 3-4" },

  // --- Week 5-6 : 12-Aug .. 25-Aug ---
  { id: "SEP-009", name: "Structural Steel Frame", duration: "7d", start: "12-Aug-26", finish: "18-Aug-26", zone: "Week 5-6" },
  { id: "SEP-010", name: "Metal Deck Installation", duration: "3d", start: "17-Aug-26", finish: "19-Aug-26", zone: "Week 5-6" },
  { id: "SEP-011", name: "Roof Structure & Covering", duration: "6d", start: "19-Aug-26", finish: "24-Aug-26", zone: "Week 5-6" },
  { id: "SEP-012", name: "External Wall Framing", duration: "2d", start: "24-Aug-26", finish: "25-Aug-26", zone: "Week 5-6" },

  // --- Excluded : 26-Aug and later ---
  { id: "SEP-013", name: "Cladding Installation", duration: "7d", start: "26-Aug-26", finish: "01-Sep-26", zone: "Excluded" },
  { id: "SEP-014", name: "Window and Glazing", duration: "6d", start: "02-Sep-26", finish: "07-Sep-26", zone: "Excluded" },
  { id: "SEP-015", name: "M&E First Fix", duration: "7d", start: "08-Sep-26", finish: "14-Sep-26", zone: "Excluded" },
  { id: "SEP-016", name: "Internal Partitions", duration: "2d", start: "14-Sep-26", finish: "15-Sep-26", zone: "Excluded" },
];

const doc = new PDFDocument({
  size: "A3",
  layout: "landscape",
  margins: { top: 15, bottom: 15, left: 15, right: 15 },
});

const outputPath = "/Users/apple/Downloads/test_programme_jul_sept_2026.pdf";
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
doc.text("July-September Construction Programme / 2026", 15, y);
doc.fontSize(8).fillColor(GRAY);
doc.text("15/07/2026", pageWidth - 60, y);

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
doc.text("Generated by PlanSure | " + new Date().toLocaleString(), 15, footerY);

doc.end();

console.log(`PDF generated: ${outputPath}`);
console.log(`Total activities: ${activities.length}`);
console.log("\n=== Zone distribution (by scheduled start) ===");
const zones = ["Week 1-2", "Week 3-4", "Week 5-6", "Excluded"];
const ranges = {
  "Week 1-2": "15-Jul .. 28-Jul",
  "Week 3-4": "29-Jul .. 11-Aug",
  "Week 5-6": "12-Aug .. 25-Aug",
  Excluded: "26-Aug and later",
};
zones.forEach((z) => {
  const inZone = activities.filter((a) => a.zone === z);
  console.log(`${z.padEnd(9)} (${ranges[z].padEnd(18)}): ${inZone.length} - ${inZone.map((a) => a.id).join(", ")}`);
});
