import PDFDocument from "pdfkit";
import fs from "fs";

// Colors
const ORANGE = "#D35400";
const BLACK = "#000000";
const GRAY = "#666666";
const LIGHT_GRAY = "#E5E5E5";
const WHITE = "#FFFFFF";
const HEADER_BG = "#F0F0F0";

const activities = [
  // Header row
  { id: "JUN-PROG", name: "May-June Construction Programme", duration: "52d", start: "18-May-26", finish: "08-Jul-26", isHeader: true },

  // Completed activities (with "A" suffix)
  { id: "JUN-001", name: "Site Survey & Planning", duration: "3d", start: "18-May-26 A", finish: "20-May-26 A" },
  { id: "JUN-002", name: "Permit Acquisition", duration: "2d", start: "19-May-26 A", finish: "20-May-26 A" },
  { id: "JUN-003", name: "Ground Preparation", duration: "4d", start: "21-May-26 A", finish: "24-May-26 A" },

  // Current/upcoming activities
  { id: "JUN-004", name: "Foundation Marking", duration: "3d", start: "25-May-26", finish: "27-May-26" },
  { id: "JUN-005", name: "Excavation Phase 1", duration: "4d", start: "28-May-26", finish: "31-May-26" },
  { id: "JUN-006", name: "Concrete Foundation", duration: "3d", start: "01-Jun-26", finish: "03-Jun-26" },
  { id: "JUN-007", name: "Steel Framework", duration: "4d", start: "03-Jun-26 B", finish: "06-Jun-26 B" }, // Blocked
  { id: "JUN-008", name: "Foundation Curing", duration: "3d", start: "08-Jun-26", finish: "10-Jun-26" },
  { id: "JUN-009", name: "Plumbing Installation", duration: "3d", start: "10-Jun-26", finish: "12-Jun-26" },
  { id: "JUN-010", name: "HVAC Ductwork", duration: "3d", start: "12-Jun-26", finish: "14-Jun-26" },
  { id: "JUN-011", name: "Final Inspection", duration: "5d", start: "15-Jun-26", finish: "20-Jun-26" },
  { id: "JUN-012", name: "Wall Framing", duration: "4d", start: "16-Jun-26", finish: "19-Jun-26" },
  { id: "JUN-013", name: "Insulation Work", duration: "3d", start: "20-Jun-26", finish: "22-Jun-26" },
  { id: "JUN-014", name: "Roofing Work", duration: "4d", start: "22-Jun-26", finish: "25-Jun-26" },
  { id: "JUN-015", name: "Window Installation", duration: "3d", start: "24-Jun-26", finish: "26-Jun-26" },
  { id: "JUN-016", name: "Drywall Installation", duration: "3d", start: "27-Jun-26", finish: "29-Jun-26" },
  { id: "JUN-017", name: "External Finishing", duration: "4d", start: "29-Jun-26", finish: "02-Jul-26" },
  { id: "JUN-018", name: "Interior Painting", duration: "3d", start: "03-Jul-26", finish: "05-Jul-26" },
  { id: "JUN-019", name: "Electrical Rough-In", duration: "3d", start: "06-Jul-26", finish: "08-Jul-26" },

  // === ACTIVITIES BEYOND 6-WEEK WINDOW (After July 20, 2026) ===
  // These should NOT appear in the lookahead until the week rolls forward
  { id: "JUN-020", name: "Landscaping Phase 1", duration: "5d", start: "21-Jul-26", finish: "25-Jul-26" },
  { id: "JUN-021", name: "Parking Lot Paving", duration: "4d", start: "22-Jul-26", finish: "25-Jul-26" },
  { id: "JUN-022", name: "Security System Install", duration: "3d", start: "27-Jul-26", finish: "29-Jul-26" },
  { id: "JUN-023", name: "Fire Alarm Testing", duration: "2d", start: "28-Jul-26", finish: "29-Jul-26" },
  { id: "JUN-024", name: "Final Walkthrough", duration: "3d", start: "01-Aug-26", finish: "03-Aug-26" },
  { id: "JUN-025", name: "Punch List Items", duration: "5d", start: "04-Aug-26", finish: "08-Aug-26" },
  { id: "JUN-026", name: "Client Handover", duration: "2d", start: "10-Aug-26", finish: "11-Aug-26" },
  { id: "JUN-027", name: "Documentation Closeout", duration: "3d", start: "12-Aug-26", finish: "14-Aug-26" },
];

// Create PDF
const doc = new PDFDocument({
  size: "A3",
  layout: "landscape",
  margins: { top: 15, bottom: 15, left: 15, right: 15 },
});

const outputPath = "/Users/apple/Downloads/test_programme_june_2026_v2.pdf";
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
doc.text("June Construction Project / 2026", 15, y);
doc.fontSize(8).fillColor(GRAY);
doc.text("04/06/2026", pageWidth - 60, y);

y += 35;

// Column Headers
doc.rect(COL_ID_X, y, TABLE_END_X - COL_ID_X, 22).fill(HEADER_BG);

doc.fontSize(8).fillColor(BLACK).font("Helvetica-Bold");
doc.text("Activity ID", COL_ID_X + 3, y + 6);
doc.text("Activity Name", COL_NAME_X + 3, y + 6);
doc.text("Duration", COL_DURATION_X + 3, y + 6);
doc.text("Start", COL_START_X + 3, y + 6);
doc.text("Finish", COL_FINISH_X + 3, y + 6);

doc.strokeColor(GRAY).lineWidth(0.5);
[COL_NAME_X, COL_DURATION_X, COL_START_X, COL_FINISH_X, TABLE_END_X].forEach(x => {
  doc.moveTo(x, y).lineTo(x, y + 22).stroke();
});

y += 22;

// Draw rows
const rowHeight = 20;
doc.font("Helvetica");

activities.forEach((activity, index) => {
  const rowY = y + index * rowHeight;

  // Row backgrounds
  if (activity.isHeader) {
    doc.rect(COL_ID_X, rowY, TABLE_END_X - COL_ID_X, rowHeight).fill(ORANGE);
  } else if (index % 2 === 0) {
    doc.rect(COL_ID_X, rowY, TABLE_END_X - COL_ID_X, rowHeight).fill("#FAFAFA");
  } else {
    doc.rect(COL_ID_X, rowY, TABLE_END_X - COL_ID_X, rowHeight).fill(WHITE);
  }

  // Grid lines
  doc.strokeColor(LIGHT_GRAY).lineWidth(0.3);
  doc.rect(COL_ID_X, rowY, TABLE_END_X - COL_ID_X, rowHeight).stroke();

  [COL_NAME_X, COL_DURATION_X, COL_START_X, COL_FINISH_X].forEach(x => {
    doc.moveTo(x, rowY).lineTo(x, rowY + rowHeight).stroke();
  });

  // Text content
  doc.fontSize(7);
  doc.fillColor(activity.isHeader ? WHITE : BLACK);
  doc.font(activity.isHeader ? "Helvetica-Bold" : "Helvetica");
  doc.text(activity.id, COL_ID_X + 3, rowY + 6, { width: COL_ID_WIDTH - 6 });
  doc.text(activity.name, COL_NAME_X + 3, rowY + 6, { width: COL_NAME_WIDTH - 6 });

  doc.font("Helvetica").fillColor(activity.isHeader ? WHITE : BLACK);
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
console.log("\n=== 6-Week Lookahead Test ===");
console.log("Today: June 10, 2026");
console.log("Week Start (Monday): June 8, 2026");
console.log("6-Week End: July 20, 2026");
console.log("\nActivities WITHIN 6-week window (should show): JUN-001 to JUN-019");
console.log("Activities BEYOND 6-week window (should hide): JUN-020 to JUN-027");
