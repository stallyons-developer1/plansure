import PDFDocument from "pdfkit";
import fs from "fs";

// Create PDF in landscape - MS Project style that parses correctly
const doc = new PDFDocument({
  size: "A3",
  layout: "landscape",
  margins: { top: 15, bottom: 15, left: 15, right: 15 },
});

const outputPath = "./ms-project-programme.pdf";
doc.pipe(fs.createWriteStream(outputPath));

// Colors
const ORANGE = "#D35400";
const BLACK = "#000000";
const GRAY = "#666666";
const LIGHT_GRAY = "#E5E5E5";
const WHITE = "#FFFFFF";
const HEADER_BG = "#F0F0F0";
const GREEN = "#27AE60";
const AMBER = "#F39C12";
const RED = "#E74C3C";
const BLUE = "#3498DB";

// Page dimensions
const pageWidth = doc.page.width - 30;
const pageHeight = doc.page.height - 30;

// Column positions - matching MS Project layout
// Parser looks for activity IDs at x < 200, dates at specific positions
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

// Gantt chart starts after table (will be filtered by parser as x > 780 check)
const GANTT_START_X = 640;
const GANTT_WIDTH = pageWidth - GANTT_START_X;

// 10 Activities in MS Project format
// Parser expects: Activity ID pattern, Activity Name, Duration (number), Start (DD-Mon-YY), Finish (DD-Mon-YY)
const activities = [
  {
    id: "VI_T2-PROG",
    name: "PP40 Terminal 2 Expansion Programme Phase 1",
    duration: "365",
    start: "01-Jan-26",
    finish: "31-Dec-26",
    isHeader: true,
    barColor: ORANGE,
    startDate: new Date(2026, 0, 1),
    endDate: new Date(2026, 11, 31),
  },
  {
    id: "WP-FW-001",
    name: "Foundation Works Zone A Construction",
    duration: "45",
    start: "01-Jan-26",
    finish: "14-Feb-26",
    barColor: GREEN,
    startDate: new Date(2026, 0, 1),
    endDate: new Date(2026, 1, 14),
  },
  {
    id: "WP-ST-002",
    name: "Steel Structure Erection Main Terminal Hall",
    duration: "60",
    start: "15-Feb-26",
    finish: "15-Apr-26",
    barColor: GREEN,
    startDate: new Date(2026, 1, 15),
    endDate: new Date(2026, 3, 15),
  },
  {
    id: "WP-ME-003",
    name: "MEP Rough-In Installation Level 1",
    duration: "30",
    start: "16-Apr-26",
    finish: "15-May-26",
    barColor: AMBER,
    startDate: new Date(2026, 3, 16),
    endDate: new Date(2026, 4, 15),
  },
  {
    id: "MS-SC-001",
    name: "Structural Completion Milestone",
    duration: "0",
    start: "15-May-26",
    finish: "15-May-26",
    isMilestone: true,
    startDate: new Date(2026, 4, 15),
  },
  {
    id: "WP-FA-004",
    name: "Facade Installation East Wing Cladding",
    duration: "45",
    start: "16-May-26",
    finish: "30-Jun-26",
    barColor: RED,
    startDate: new Date(2026, 4, 16),
    endDate: new Date(2026, 5, 30),
  },
  {
    id: "WP-IF-005",
    name: "Interior Fit-Out Departures Lounge Area",
    duration: "60",
    start: "01-Jul-26",
    finish: "30-Aug-26",
    barColor: BLUE,
    startDate: new Date(2026, 6, 1),
    endDate: new Date(2026, 7, 30),
  },
  {
    id: "WP-BM-006",
    name: "BMS Integration Testing and Commissioning",
    duration: "30",
    start: "01-Sep-26",
    finish: "30-Sep-26",
    barColor: BLUE,
    startDate: new Date(2026, 8, 1),
    endDate: new Date(2026, 8, 30),
  },
  {
    id: "MS-SH-002",
    name: "Systems Handover Milestone Review",
    duration: "0",
    start: "01-Oct-26",
    finish: "01-Oct-26",
    isMilestone: true,
    startDate: new Date(2026, 9, 1),
  },
  {
    id: "WP-CM-007",
    name: "Final Commissioning Snagging and Defects",
    duration: "90",
    start: "01-Oct-26",
    finish: "31-Dec-26",
    barColor: BLUE,
    startDate: new Date(2026, 9, 1),
    endDate: new Date(2026, 11, 31),
  },
];

// Timeline settings for Gantt
const timelineStart = new Date(2026, 0, 1);
const timelineEnd = new Date(2026, 11, 31);
const totalDays = (timelineEnd - timelineStart) / (1000 * 60 * 60 * 24);
const pixelsPerDay = GANTT_WIDTH / totalDays;

function getXForDate(date) {
  const days = (date - timelineStart) / (1000 * 60 * 60 * 24);
  return GANTT_START_X + days * pixelsPerDay;
}

// ============ DRAW PDF ============

let y = 15;

// Title - positioned at x > 800 so it won't interfere with parsing
doc.fontSize(12).fillColor(BLACK);
doc.text("MAN TP PP40 Project / 2026 Integrated Programme", 15, y);

// Right side header info (at high x position)
doc.fontSize(8).fillColor(GRAY);
doc.text("GBAOJE", pageWidth - 60, y);
doc.text(new Date().toLocaleDateString(), pageWidth - 60, y + 12);

y += 35;

// Column Headers Row
doc.rect(COL_ID_X, y, TABLE_END_X - COL_ID_X, 22).fill(HEADER_BG);
doc.rect(GANTT_START_X, y, GANTT_WIDTH, 22).fill(HEADER_BG);

doc.fontSize(8).fillColor(BLACK).font("Helvetica-Bold");
doc.text("Activity ID", COL_ID_X + 3, y + 6);
doc.text("Activity Name", COL_NAME_X + 3, y + 6);
doc.text("Duration", COL_DURATION_X + 3, y + 6);
doc.text("Start", COL_START_X + 3, y + 6);
doc.text("Finish", COL_FINISH_X + 3, y + 6);

// Timeline months header
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
doc.fontSize(7).fillColor(GRAY);
months.forEach((month, idx) => {
  const monthStart = new Date(2026, idx, 1);
  const x = getXForDate(monthStart);
  if (x >= GANTT_START_X && x < pageWidth - 20) {
    doc.text(month, x + 2, y + 7);
  }
});

// Draw column separator lines
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

  // Alternate row backgrounds
  if (index % 2 === 0) {
    doc.rect(COL_ID_X, rowY, TABLE_END_X - COL_ID_X, rowHeight).fill("#FAFAFA");
  } else {
    doc.rect(COL_ID_X, rowY, TABLE_END_X - COL_ID_X, rowHeight).fill(WHITE);
  }

  // Header row styling (orange background)
  if (activity.isHeader) {
    doc.rect(COL_ID_X, rowY, COL_NAME_X - COL_ID_X + COL_NAME_WIDTH, rowHeight).fill(ORANGE);
  }

  // Gantt row background
  doc.rect(GANTT_START_X, rowY, GANTT_WIDTH, rowHeight).fill(index % 2 === 0 ? "#FAFAFA" : WHITE);

  // Draw grid lines
  doc.strokeColor(LIGHT_GRAY).lineWidth(0.3);
  doc.rect(COL_ID_X, rowY, TABLE_END_X - COL_ID_X, rowHeight).stroke();
  doc.rect(GANTT_START_X, rowY, GANTT_WIDTH, rowHeight).stroke();

  // Column separators
  [COL_NAME_X, COL_DURATION_X, COL_START_X, COL_FINISH_X].forEach(x => {
    doc.moveTo(x, rowY).lineTo(x, rowY + rowHeight).stroke();
  });

  // Draw month grid lines in Gantt area
  months.forEach((_, idx) => {
    const monthStart = new Date(2026, idx, 1);
    const x = getXForDate(monthStart);
    if (x >= GANTT_START_X && x < pageWidth) {
      doc.strokeColor("#E0E0E0").lineWidth(0.2);
      doc.moveTo(x, rowY).lineTo(x, rowY + rowHeight).stroke();
    }
  });

  // ============ TEXT CONTENT (what parser will extract) ============
  doc.fontSize(7);

  // Activity ID - CRITICAL: must be at x < 200 for parser
  doc.fillColor(activity.isHeader ? WHITE : BLACK);
  doc.font(activity.isHeader ? "Helvetica-Bold" : "Helvetica");
  doc.text(activity.id, COL_ID_X + 3, rowY + 6, { width: COL_ID_WIDTH - 6 });

  // Activity Name
  doc.text(activity.name, COL_NAME_X + 3, rowY + 6, { width: COL_NAME_WIDTH - 6 });

  // Duration
  doc.font("Helvetica").fillColor(BLACK);
  doc.text(activity.duration, COL_DURATION_X + 3, rowY + 6, { width: COL_DURATION_WIDTH - 6, align: "center" });

  // Start Date - CRITICAL: DD-Mon-YY format
  doc.text(activity.start, COL_START_X + 3, rowY + 6, { width: COL_START_WIDTH - 6, align: "center" });

  // Finish Date
  doc.text(activity.finish, COL_FINISH_X + 3, rowY + 6, { width: COL_FINISH_WIDTH - 6, align: "center" });

  // ============ GANTT BARS (visual only, parser ignores x > 780) ============
  const barY = rowY + 5;
  const barHeight = 10;

  if (activity.isMilestone) {
    // Diamond milestone
    const milestoneX = getXForDate(activity.startDate);
    if (milestoneX >= GANTT_START_X && milestoneX <= pageWidth - 20) {
      const size = 5;
      doc.fillColor(BLACK);
      doc.moveTo(milestoneX, barY + barHeight / 2 - size)
        .lineTo(milestoneX + size, barY + barHeight / 2)
        .lineTo(milestoneX, barY + barHeight / 2 + size)
        .lineTo(milestoneX - size, barY + barHeight / 2)
        .fill();
    }
  } else if (activity.startDate && activity.endDate) {
    // Gantt bar
    const barStartX = Math.max(getXForDate(activity.startDate), GANTT_START_X);
    const barEndX = Math.min(getXForDate(activity.endDate), pageWidth - 15);
    const barWidth = barEndX - barStartX;

    if (barWidth > 0) {
      if (activity.isHeader) {
        // Summary bar (bracket style)
        doc.strokeColor(activity.barColor).lineWidth(2);
        doc.moveTo(barStartX, barY + barHeight).lineTo(barStartX, barY + barHeight - 3).stroke();
        doc.moveTo(barStartX, barY + barHeight).lineTo(barEndX, barY + barHeight).stroke();
        doc.moveTo(barEndX, barY + barHeight).lineTo(barEndX, barY + barHeight - 3).stroke();
      } else {
        // Regular bar
        doc.rect(barStartX, barY, barWidth, barHeight).fill(activity.barColor);
      }
    }
  }
});

// Footer
const footerY = y + activities.length * rowHeight + 20;
doc.fontSize(6).fillColor(GRAY);
doc.text("Generated by PlanSure | " + new Date().toLocaleString(), 15, footerY);

// Finalize PDF
doc.end();

console.log(`MS Project style PDF generated: ${outputPath}`);
console.log(`Contains ${activities.length} activities`);
console.log("Activities:", activities.map(a => a.id).join(", "));
