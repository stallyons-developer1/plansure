import PDFDocument from "pdfkit";
import fs from "fs";

const doc = new PDFDocument({
  size: "A4",
  margins: { top: 50, bottom: 50, left: 50, right: 50 },
});

const outputPath = "./Governance_Dashboard_Logic.pdf";
doc.pipe(fs.createWriteStream(outputPath));

// Colors
const PRIMARY = "#1E3A5F";
const GREEN = "#27AE60";
const AMBER = "#F39C12";
const RED = "#E74C3C";
const GREY = "#95A5A6";
const BLACK = "#000000";
const DARK_GREY = "#333333";
const LIGHT_GREY = "#EEEEEE";

let y = 50;

// Title
doc.fontSize(24).fillColor(PRIMARY).font("Helvetica-Bold");
doc.text("Governance Dashboard", 50, y);
y += 30;
doc.fontSize(16).fillColor(DARK_GREY);
doc.text("Calculation Logic Document", 50, y);
y += 40;

// Section 1: Overview
doc.fontSize(14).fillColor(PRIMARY).font("Helvetica-Bold");
doc.text("1. Overview", 50, y);
y += 25;

doc.fontSize(10).fillColor(BLACK).font("Helvetica");
doc.text("The Governance Dashboard calculates two key values for each activity:", 50, y);
y += 20;
doc.text("    1. RAG Zone - How far the activity is from today's date", 50, y);
y += 15;
doc.text("    2. Status - Whether the activity needs attention (Ready, At Risk, Blocked, Complete)", 50, y);
y += 35;

// Section 2: RAG Zone Calculation
doc.fontSize(14).fillColor(PRIMARY).font("Helvetica-Bold");
doc.text("2. RAG Zone Calculation", 50, y);
y += 25;

doc.fontSize(10).fillColor(BLACK).font("Helvetica");
doc.text("RAG Zone is calculated based on the number of weeks between today's date and the activity's start date.", 50, y);
y += 25;

doc.font("Helvetica-Bold").text("Formula:", 50, y);
y += 15;
doc.font("Helvetica").fillColor(DARK_GREY);
doc.text("    Days Until Start = Activity Start Date - Today's Date", 50, y);
y += 12;
doc.text("    Weeks Until Start = Days Until Start / 7 (rounded up)", 50, y);
y += 25;

// RAG Zone Table
doc.font("Helvetica-Bold").fillColor(BLACK).text("RAG Zone Rules:", 50, y);
y += 20;

// Table Header
doc.rect(50, y, 495, 20).fill(PRIMARY);
doc.fillColor("white").fontSize(9);
doc.text("Condition", 55, y + 5);
doc.text("RAG Zone Display", 230, y + 5);
doc.text("Color", 380, y + 5);
y += 20;

// Table Rows
const ragRows = [
  ["Activity started AND finish date passed", "Overdue", "Red", RED],
  ["Activity started AND finish date NOT passed", "In Progress", "Green", GREEN],
  ["Start date within 1-2 weeks (1-14 days)", "Week 1 or Week 2", "Green", GREEN],
  ["Start date within 3-4 weeks (15-28 days)", "Week 3 or Week 4", "Amber", AMBER],
  ["Start date within 5-6 weeks (29-42 days)", "Week 5 or Week 6", "Red", RED],
  ["Start date beyond 6 weeks (43+ days)", "X Weeks (e.g., 20 Weeks)", "Grey", GREY],
];

ragRows.forEach((row, index) => {
  const bgColor = index % 2 === 0 ? LIGHT_GREY : "white";
  doc.rect(50, y, 495, 18).fill(bgColor);
  doc.fillColor(BLACK).fontSize(8).font("Helvetica");
  doc.text(row[0], 55, y + 5, { width: 170 });
  doc.text(row[1], 230, y + 5, { width: 140 });
  doc.fillColor(row[3]).font("Helvetica-Bold");
  doc.text(row[2], 380, y + 5);
  y += 18;
});

y += 30;

// Section 3: Status Calculation
doc.fontSize(14).fillColor(PRIMARY).font("Helvetica-Bold");
doc.text("3. Activity Status Calculation", 50, y);
y += 25;

doc.fontSize(10).fillColor(BLACK).font("Helvetica");
doc.text("Status is determined by checking multiple conditions in priority order:", 50, y);
y += 25;

// Status Table Header
doc.rect(50, y, 495, 20).fill(PRIMARY);
doc.fillColor("white").fontSize(9).font("Helvetica-Bold");
doc.text("Priority", 55, y + 5);
doc.text("Condition", 110, y + 5);
doc.text("Status", 380, y + 5);
y += 20;

// Status Table Rows
const statusRows = [
  ["1", "Activity marked as 'Completed'", "Complete", GREEN],
  ["2", "Activity is blocked (has blocker)", "Blocked", RED],
  ["3", "Start AND finish date both passed (not completed)", "At Risk", AMBER],
  ["4", "RAG is Red (Week 5-6) or Amber (Week 3-4)", "At Risk", AMBER],
  ["5", "All other cases (Green or Grey RAG)", "Ready", GREEN],
];

statusRows.forEach((row, index) => {
  const bgColor = index % 2 === 0 ? LIGHT_GREY : "white";
  doc.rect(50, y, 495, 18).fill(bgColor);
  doc.fillColor(BLACK).fontSize(8).font("Helvetica");
  doc.text(row[0], 60, y + 5);
  doc.text(row[1], 110, y + 5, { width: 260 });
  doc.fillColor(row[3]).font("Helvetica-Bold");
  doc.text(row[2], 385, y + 5);
  y += 18;
});

y += 30;

// Section 4: Status Meaning
doc.fontSize(12).fillColor(PRIMARY).font("Helvetica-Bold");
doc.text("Status Meaning:", 50, y);
y += 20;

const meanings = [
  { status: "Ready", color: GREEN, meaning: "Activity is on track, no issues. No immediate action required." },
  { status: "At Risk", color: AMBER, meaning: "Activity needs attention. Review and resolve issues." },
  { status: "Blocked", color: RED, meaning: "Activity cannot proceed. Remove blocker immediately." },
  { status: "Complete", color: GREEN, meaning: "Activity is finished. No action required." },
];

meanings.forEach((item) => {
  doc.fillColor(item.color).font("Helvetica-Bold").fontSize(10);
  doc.text(item.status + ":", 50, y);
  doc.fillColor(BLACK).font("Helvetica");
  doc.text(item.meaning, 120, y, { width: 400 });
  y += 18;
});

// New Page for Examples
doc.addPage();
y = 50;

// Section 5: Example Calculation
doc.fontSize(14).fillColor(PRIMARY).font("Helvetica-Bold");
doc.text("4. Example Calculation", 50, y);
y += 25;

doc.fontSize(10).fillColor(BLACK).font("Helvetica");
doc.text("Today's Date: May 18, 2026", 50, y);
y += 25;

// Example Table Header
doc.rect(50, y, 495, 20).fill(PRIMARY);
doc.fillColor("white").fontSize(8).font("Helvetica-Bold");
doc.text("Activity", 55, y + 5);
doc.text("Start Date", 150, y + 5);
doc.text("Finish Date", 220, y + 5);
doc.text("Calculation", 295, y + 5);
doc.text("RAG Zone", 410, y + 5);
doc.text("Status", 480, y + 5);
y += 20;

// Example Rows
const examples = [
  ["MS-SC-001", "May 15", "May 15", "Finish passed", "Overdue", "At Risk"],
  ["WP-FW-001", "Jan 01", "Feb 14", "Finish passed", "Overdue", "At Risk"],
  ["WP-FA-004", "May 16", "Jun 30", "In progress", "In Progress", "Ready"],
  ["WP-IF-005", "Jul 01", "Aug 30", "44 days = 7 weeks", "7 Weeks", "Ready"],
  ["WP-BM-006", "Sep 01", "Sep 30", "106 days = 16 weeks", "16 Weeks", "Ready"],
  ["WP-CM-007", "Oct 01", "Dec 31", "136 days = 20 weeks", "20 Weeks", "Ready"],
];

examples.forEach((row, index) => {
  const bgColor = index % 2 === 0 ? LIGHT_GREY : "white";
  doc.rect(50, y, 495, 18).fill(bgColor);
  doc.fillColor(BLACK).fontSize(7).font("Helvetica");
  doc.text(row[0], 55, y + 5);
  doc.text(row[1], 150, y + 5);
  doc.text(row[2], 220, y + 5);
  doc.text(row[3], 295, y + 5);
  doc.text(row[4], 410, y + 5);
  doc.text(row[5], 480, y + 5);
  y += 18;
});

y += 35;

// Section 6: Visual Timeline
doc.fontSize(14).fillColor(PRIMARY).font("Helvetica-Bold");
doc.text("5. Visual Timeline", 50, y);
y += 30;

// Draw timeline
const timelineY = y + 20;
doc.strokeColor(BLACK).lineWidth(2);
doc.moveTo(50, timelineY).lineTo(545, timelineY).stroke();

// Today marker
doc.moveTo(150, timelineY - 15).lineTo(150, timelineY + 15).stroke();
doc.fontSize(8).fillColor(BLACK).text("TODAY", 135, timelineY - 25);

// Past section
doc.fontSize(7).fillColor(RED);
doc.text("PAST", 70, timelineY + 20);
doc.text("(Overdue)", 65, timelineY + 30);
doc.text("AT RISK", 65, timelineY + 45);

// Week zones
const zones = [
  { label: "Week 1-2", color: GREEN, x: 180, status: "READY" },
  { label: "Week 3-4", color: AMBER, x: 280, status: "AT RISK" },
  { label: "Week 5-6", color: RED, x: 380, status: "AT RISK" },
  { label: "Beyond", color: GREY, x: 480, status: "READY" },
];

zones.forEach((zone) => {
  doc.rect(zone.x - 30, timelineY - 10, 60, 20).fill(zone.color);
  doc.fillColor("white").fontSize(7).font("Helvetica-Bold");
  doc.text(zone.label, zone.x - 25, timelineY - 5);
  doc.fillColor(BLACK).font("Helvetica");
  doc.text(zone.status, zone.x - 20, timelineY + 25);
});

y = timelineY + 70;

// Section 7: Quick Reference
doc.fontSize(14).fillColor(PRIMARY).font("Helvetica-Bold");
doc.text("6. Quick Reference Card", 50, y);
y += 25;

// Box 1: RAG Zone
doc.rect(50, y, 230, 120).stroke(PRIMARY);
doc.fontSize(10).fillColor(PRIMARY).font("Helvetica-Bold");
doc.text("RAG Zone by Weeks:", 60, y + 10);

doc.fontSize(9).font("Helvetica").fillColor(BLACK);
const ragRef = [
  { text: "Week 1-2 (0-14 days)", color: GREEN },
  { text: "Week 3-4 (15-28 days)", color: AMBER },
  { text: "Week 5-6 (29-42 days)", color: RED },
  { text: "Beyond 6 weeks (43+ days)", color: GREY },
];

let refY = y + 30;
ragRef.forEach((item) => {
  doc.rect(60, refY, 10, 10).fill(item.color);
  doc.fillColor(BLACK).text(item.text, 75, refY);
  refY += 20;
});

// Box 2: Status Logic
doc.rect(310, y, 235, 120).stroke(PRIMARY);
doc.fontSize(10).fillColor(PRIMARY).font("Helvetica-Bold");
doc.text("Status Logic:", 320, y + 10);

doc.fontSize(8).font("Helvetica").fillColor(BLACK);
const statusRef = [
  "Overdue (finish date passed) = AT RISK",
  "Week 3-6 (Amber/Red RAG) = AT RISK",
  "Week 1-2 or Beyond (Green/Grey) = READY",
  "Has blocker = BLOCKED",
  "Marked complete = COMPLETE",
];

refY = y + 30;
statusRef.forEach((item) => {
  doc.text("• " + item, 320, refY, { width: 215 });
  refY += 18;
});

y += 140;

// Footer
doc.fontSize(8).fillColor(GREY);
doc.text("Document generated for PlanSure Governance Dashboard", 50, y);
doc.text("Last updated: May 18, 2026", 50, y + 12);

// Finalize PDF
doc.end();

console.log(`PDF generated: ${outputPath}`);
