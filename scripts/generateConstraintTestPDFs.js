import PDFDocument from "pdfkit";
import fs from "fs";

// Generate 2 test programmes to demonstrate all 3 constraint trends (Up, Down, Stable)

const ORANGE = "#D35400";
const BLACK = "#000000";
const GRAY = "#666666";
const LIGHT_GRAY = "#E5E5E5";
const WHITE = "#FFFFFF";
const HEADER_BG = "#F0F0F0";
const GREEN = "#27AE60";
const BLUE = "#3498DB";
const RED = "#E74C3C";
const AMBER = "#F39C12";

function generateProgrammePDF(config) {
  const doc = new PDFDocument({
    size: "A3",
    layout: "landscape",
    margins: { top: 15, bottom: 15, left: 15, right: 15 },
  });

  doc.pipe(fs.createWriteStream(config.outputPath));

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
  const GANTT_START_X = 640;
  const GANTT_WIDTH = pageWidth - GANTT_START_X;

  let y = 15;

  doc.fontSize(12).fillColor(BLACK);
  doc.text(config.title, 15, y);
  doc.fontSize(8).fillColor(GRAY);
  doc.text("19/05/2026", pageWidth - 60, y);

  y += 35;

  doc.rect(COL_ID_X, y, TABLE_END_X - COL_ID_X, 22).fill(HEADER_BG);
  doc.rect(GANTT_START_X, y, GANTT_WIDTH, 22).fill(HEADER_BG);

  doc.fontSize(8).fillColor(BLACK).font("Helvetica-Bold");
  doc.text("Activity ID", COL_ID_X + 3, y + 6);
  doc.text("Activity Name", COL_NAME_X + 3, y + 6);
  doc.text("Duration", COL_DURATION_X + 3, y + 6);
  doc.text("Start", COL_START_X + 3, y + 6);
  doc.text("Finish", COL_FINISH_X + 3, y + 6);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];
  doc.fontSize(7).fillColor(GRAY);

  const timelineStart = new Date(2026, 0, 1);
  const timelineEnd = new Date(2026, 7, 31);
  const totalDays = (timelineEnd - timelineStart) / (1000 * 60 * 60 * 24);
  const pixelsPerDay = GANTT_WIDTH / totalDays;

  const getXForDate = (date) => {
    const days = (new Date(date) - timelineStart) / (1000 * 60 * 60 * 24);
    return GANTT_START_X + days * pixelsPerDay;
  };

  months.forEach((month, idx) => {
    const monthStart = new Date(2026, idx, 1);
    const x = getXForDate(monthStart);
    if (x >= GANTT_START_X && x < pageWidth - 20) {
      doc.text(month, x + 2, y + 7);
    }
  });

  doc.strokeColor(GRAY).lineWidth(0.5);
  [COL_NAME_X, COL_DURATION_X, COL_START_X, COL_FINISH_X, TABLE_END_X].forEach(x => {
    doc.moveTo(x, y).lineTo(x, y + 22).stroke();
  });

  y += 22;

  const rowHeight = 20;
  doc.font("Helvetica");

  config.activities.forEach((activity, index) => {
    const rowY = y + index * rowHeight;

    if (index % 2 === 0) {
      doc.rect(COL_ID_X, rowY, TABLE_END_X - COL_ID_X, rowHeight).fill("#FAFAFA");
    } else {
      doc.rect(COL_ID_X, rowY, TABLE_END_X - COL_ID_X, rowHeight).fill(WHITE);
    }

    if (activity.isHeader) {
      doc.rect(COL_ID_X, rowY, TABLE_END_X - COL_ID_X, rowHeight).fill(ORANGE);
    }

    doc.rect(GANTT_START_X, rowY, GANTT_WIDTH, rowHeight).fill(index % 2 === 0 ? "#FAFAFA" : WHITE);

    doc.strokeColor(LIGHT_GRAY).lineWidth(0.3);
    doc.rect(COL_ID_X, rowY, TABLE_END_X - COL_ID_X, rowHeight).stroke();
    doc.rect(GANTT_START_X, rowY, GANTT_WIDTH, rowHeight).stroke();

    [COL_NAME_X, COL_DURATION_X, COL_START_X, COL_FINISH_X].forEach(x => {
      doc.moveTo(x, rowY).lineTo(x, rowY + rowHeight).stroke();
    });

    doc.fontSize(7);
    doc.fillColor(activity.isHeader ? WHITE : BLACK);
    doc.font(activity.isHeader ? "Helvetica-Bold" : "Helvetica");
    doc.text(activity.id, COL_ID_X + 3, rowY + 6, { width: COL_ID_WIDTH - 6 });
    doc.text(activity.name, COL_NAME_X + 3, rowY + 6, { width: COL_NAME_WIDTH - 6 });

    doc.font("Helvetica").fillColor(BLACK);
    doc.text(activity.duration, COL_DURATION_X + 3, rowY + 6, { width: COL_DURATION_WIDTH - 6, align: "center" });
    doc.text(activity.start, COL_START_X + 3, rowY + 6, { width: COL_START_WIDTH - 6, align: "center" });
    doc.text(activity.finish, COL_FINISH_X + 3, rowY + 6, { width: COL_FINISH_WIDTH - 6, align: "center" });

    const barY = rowY + 5;
    const barHeight = 10;

    if (activity.startDate && activity.endDate) {
      const barStartX = Math.max(getXForDate(activity.startDate), GANTT_START_X);
      const barEndX = Math.min(getXForDate(activity.endDate), pageWidth - 15);
      const barWidth = barEndX - barStartX;

      if (barWidth > 0) {
        if (activity.isHeader) {
          doc.strokeColor(ORANGE).lineWidth(2);
          doc.moveTo(barStartX, barY + barHeight).lineTo(barStartX, barY + barHeight - 3).stroke();
          doc.moveTo(barStartX, barY + barHeight).lineTo(barEndX, barY + barHeight).stroke();
          doc.moveTo(barEndX, barY + barHeight).lineTo(barEndX, barY + barHeight - 3).stroke();
        } else {
          doc.rect(barStartX, barY, barWidth, barHeight).fill(activity.barColor || BLUE);
        }
      }
    }
  });

  const footerY = y + config.activities.length * rowHeight + 20;
  doc.fontSize(6).fillColor(GRAY);
  doc.text("Generated by PlanSure | Constraint Intelligence Test", 15, footerY);

  doc.end();
  console.log(`Generated: ${config.outputPath}`);
}

// ========================================
// PDF 1: Alpha Project
// ========================================
// DOWN: Site Works (Completed), Foundation (Completed), Structural (Overdue), MEP (Overdue)
// UP: Roofing (Overdue - unique), Design (Overdue - unique)
// STABLE: Procurement (Overdue), Testing (Overdue) - both projects have these overdue

const programme1 = {
  title: "Alpha Construction Project / Constraint Test 1",
  outputPath: "./test-constraint-programme-1.pdf",
  activities: [
    {
      id: "ALP-PROG",
      name: "Alpha Construction Programme",
      duration: "200",
      start: "01-Jan-26",
      finish: "20-Jul-26",
      isHeader: true,
      startDate: new Date(2026, 0, 1),
      endDate: new Date(2026, 6, 20),
    },
    // Site Works - COMPLETED (for DOWN - Beta has overdue)
    {
      id: "ALP-001",
      name: "Site Mobilization",
      duration: "15",
      start: "01-Jan-26",
      finish: "15-Jan-26 A",
      barColor: GREEN,
      startDate: new Date(2026, 0, 1),
      endDate: new Date(2026, 0, 15),
    },
    {
      id: "ALP-002",
      name: "Site Survey Complete",
      duration: "10",
      start: "16-Jan-26",
      finish: "26-Jan-26 A",
      barColor: GREEN,
      startDate: new Date(2026, 0, 16),
      endDate: new Date(2026, 0, 26),
    },
    // Foundation - COMPLETED (for DOWN - Beta has overdue)
    {
      id: "ALP-003",
      name: "Foundation Excavation",
      duration: "30",
      start: "01-Feb-26",
      finish: "28-Feb-26 A",
      barColor: GREEN,
      startDate: new Date(2026, 1, 1),
      endDate: new Date(2026, 1, 28),
    },
    {
      id: "ALP-004",
      name: "Foundation Pour Complete",
      duration: "15",
      start: "01-Mar-26",
      finish: "15-Mar-26 A",
      barColor: GREEN,
      startDate: new Date(2026, 2, 1),
      endDate: new Date(2026, 2, 15),
    },
    // Structural - OVERDUE (for DOWN - Beta has completed)
    {
      id: "ALP-005",
      name: "Structural Steel Erection",
      duration: "30",
      start: "16-Mar-26",
      finish: "15-Apr-26",
      barColor: RED,
      startDate: new Date(2026, 2, 16),
      endDate: new Date(2026, 3, 15),
    },
    {
      id: "ALP-006",
      name: "Structural Concrete Pour",
      duration: "20",
      start: "16-Apr-26",
      finish: "05-May-26",
      barColor: RED,
      startDate: new Date(2026, 3, 16),
      endDate: new Date(2026, 4, 5),
    },
    // MEP Works - OVERDUE (for DOWN - Beta has completed)
    {
      id: "ALP-007",
      name: "MEP First Fix Installation",
      duration: "25",
      start: "01-Apr-26",
      finish: "25-Apr-26",
      barColor: RED,
      startDate: new Date(2026, 3, 1),
      endDate: new Date(2026, 3, 25),
    },
    {
      id: "ALP-008",
      name: "Electrical Rough-In",
      duration: "20",
      start: "26-Apr-26",
      finish: "15-May-26",
      barColor: RED,
      startDate: new Date(2026, 3, 26),
      endDate: new Date(2026, 4, 15),
    },
    // Roofing - OVERDUE (for UP - only Alpha has it)
    {
      id: "ALP-009",
      name: "Roofing Membrane Installation",
      duration: "15",
      start: "01-Apr-26",
      finish: "15-Apr-26",
      barColor: RED,
      startDate: new Date(2026, 3, 1),
      endDate: new Date(2026, 3, 15),
    },
    {
      id: "ALP-010",
      name: "Roof Insulation Works",
      duration: "15",
      start: "16-Apr-26",
      finish: "30-Apr-26",
      barColor: RED,
      startDate: new Date(2026, 3, 16),
      endDate: new Date(2026, 3, 30),
    },
    // Procurement - OVERDUE (for STABLE - both projects have overdue)
    {
      id: "ALP-011",
      name: "Material Procurement Phase 1",
      duration: "30",
      start: "01-Mar-26",
      finish: "30-Mar-26",
      barColor: AMBER,
      startDate: new Date(2026, 2, 1),
      endDate: new Date(2026, 2, 30),
    },
    {
      id: "ALP-012",
      name: "Material Delivery Batch 1",
      duration: "15",
      start: "01-Apr-26",
      finish: "15-Apr-26",
      barColor: AMBER,
      startDate: new Date(2026, 3, 1),
      endDate: new Date(2026, 3, 15),
    },
    // Testing - OVERDUE (for STABLE - both projects have overdue)
    {
      id: "ALP-013",
      name: "Quality Testing Phase 1",
      duration: "20",
      start: "01-Apr-26",
      finish: "20-Apr-26",
      barColor: AMBER,
      startDate: new Date(2026, 3, 1),
      endDate: new Date(2026, 3, 20),
    },
    {
      id: "ALP-014",
      name: "Inspection Structural Works",
      duration: "15",
      start: "21-Apr-26",
      finish: "05-May-26",
      barColor: AMBER,
      startDate: new Date(2026, 3, 21),
      endDate: new Date(2026, 4, 5),
    },
    // Design - OVERDUE (for UP - only Alpha has it)
    {
      id: "ALP-015",
      name: "Design Revision Package A",
      duration: "20",
      start: "01-Mar-26",
      finish: "20-Mar-26",
      barColor: RED,
      startDate: new Date(2026, 2, 1),
      endDate: new Date(2026, 2, 20),
    },
    // Future
    {
      id: "ALP-016",
      name: "Facade Glazing Installation",
      duration: "30",
      start: "20-May-26",
      finish: "20-Jun-26",
      barColor: BLUE,
      startDate: new Date(2026, 4, 20),
      endDate: new Date(2026, 5, 20),
    },
  ],
};

// ========================================
// PDF 2: Beta Project
// ========================================
// DOWN: Site Works (Overdue), Foundation (Overdue), Structural (Completed), MEP (Completed)
// UP: Interior (Overdue - unique), Facade (Overdue - unique)
// STABLE: Procurement (Overdue), Testing (Overdue) - same as Alpha

const programme2 = {
  title: "Beta Construction Project / Constraint Test 2",
  outputPath: "./test-constraint-programme-2.pdf",
  activities: [
    {
      id: "BET-PROG",
      name: "Beta Construction Programme",
      duration: "180",
      start: "01-Feb-26",
      finish: "25-Jul-26",
      isHeader: true,
      startDate: new Date(2026, 1, 1),
      endDate: new Date(2026, 6, 25),
    },
    // Site Works - OVERDUE (for DOWN - Alpha completed)
    {
      id: "BET-001",
      name: "Site Clearing Works",
      duration: "20",
      start: "01-Feb-26",
      finish: "20-Feb-26",
      barColor: RED,
      startDate: new Date(2026, 1, 1),
      endDate: new Date(2026, 1, 20),
    },
    {
      id: "BET-002",
      name: "Site Preparation",
      duration: "15",
      start: "21-Feb-26",
      finish: "07-Mar-26",
      barColor: RED,
      startDate: new Date(2026, 1, 21),
      endDate: new Date(2026, 2, 7),
    },
    // Foundation - OVERDUE (for DOWN - Alpha completed)
    {
      id: "BET-003",
      name: "Foundation Piling",
      duration: "30",
      start: "08-Mar-26",
      finish: "06-Apr-26",
      barColor: RED,
      startDate: new Date(2026, 2, 8),
      endDate: new Date(2026, 3, 6),
    },
    {
      id: "BET-004",
      name: "Foundation Slab Pour",
      duration: "20",
      start: "07-Apr-26",
      finish: "26-Apr-26",
      barColor: RED,
      startDate: new Date(2026, 3, 7),
      endDate: new Date(2026, 3, 26),
    },
    // Structural - COMPLETED (for DOWN - Alpha overdue)
    {
      id: "BET-005",
      name: "Structural Framing",
      duration: "25",
      start: "01-Mar-26",
      finish: "25-Mar-26 A",
      barColor: GREEN,
      startDate: new Date(2026, 2, 1),
      endDate: new Date(2026, 2, 25),
    },
    {
      id: "BET-006",
      name: "Steel Structure Completion",
      duration: "20",
      start: "26-Mar-26",
      finish: "14-Apr-26 A",
      barColor: GREEN,
      startDate: new Date(2026, 2, 26),
      endDate: new Date(2026, 3, 14),
    },
    // MEP Works - COMPLETED (for DOWN - Alpha overdue)
    {
      id: "BET-007",
      name: "MEP Installation",
      duration: "25",
      start: "01-Mar-26",
      finish: "25-Mar-26 A",
      barColor: GREEN,
      startDate: new Date(2026, 2, 1),
      endDate: new Date(2026, 2, 25),
    },
    {
      id: "BET-008",
      name: "Electrical Wiring Complete",
      duration: "20",
      start: "26-Mar-26",
      finish: "14-Apr-26 A",
      barColor: GREEN,
      startDate: new Date(2026, 2, 26),
      endDate: new Date(2026, 3, 14),
    },
    {
      id: "BET-009",
      name: "Plumbing Installation",
      duration: "20",
      start: "15-Apr-26",
      finish: "04-May-26 A",
      barColor: GREEN,
      startDate: new Date(2026, 3, 15),
      endDate: new Date(2026, 4, 4),
    },
    // Interior - OVERDUE (for UP - only Beta has it)
    {
      id: "BET-010",
      name: "Interior Flooring Works",
      duration: "20",
      start: "01-Apr-26",
      finish: "20-Apr-26",
      barColor: RED,
      startDate: new Date(2026, 3, 1),
      endDate: new Date(2026, 3, 20),
    },
    {
      id: "BET-011",
      name: "Interior Painting Phase 1",
      duration: "25",
      start: "21-Apr-26",
      finish: "15-May-26",
      barColor: RED,
      startDate: new Date(2026, 3, 21),
      endDate: new Date(2026, 4, 15),
    },
    // Procurement - OVERDUE (for STABLE - both projects have overdue)
    {
      id: "BET-012",
      name: "Material Procurement Phase 2",
      duration: "25",
      start: "15-Mar-26",
      finish: "08-Apr-26",
      barColor: AMBER,
      startDate: new Date(2026, 2, 15),
      endDate: new Date(2026, 3, 8),
    },
    {
      id: "BET-013",
      name: "Material Delivery Batch 2",
      duration: "20",
      start: "09-Apr-26",
      finish: "28-Apr-26",
      barColor: AMBER,
      startDate: new Date(2026, 3, 9),
      endDate: new Date(2026, 3, 28),
    },
    // Testing - OVERDUE (for STABLE - both projects have overdue)
    {
      id: "BET-014",
      name: "Quality Testing Phase 2",
      duration: "15",
      start: "01-Apr-26",
      finish: "15-Apr-26",
      barColor: AMBER,
      startDate: new Date(2026, 3, 1),
      endDate: new Date(2026, 3, 15),
    },
    {
      id: "BET-015",
      name: "Inspection MEP Works",
      duration: "20",
      start: "16-Apr-26",
      finish: "05-May-26",
      barColor: AMBER,
      startDate: new Date(2026, 3, 16),
      endDate: new Date(2026, 4, 5),
    },
    // Facade - OVERDUE (for UP - only Beta has it)
    {
      id: "BET-016",
      name: "Facade Cladding Installation",
      duration: "20",
      start: "01-Apr-26",
      finish: "20-Apr-26",
      barColor: RED,
      startDate: new Date(2026, 3, 1),
      endDate: new Date(2026, 3, 20),
    },
    // Future
    {
      id: "BET-017",
      name: "Final Commissioning",
      duration: "15",
      start: "01-Jul-26",
      finish: "15-Jul-26",
      barColor: BLUE,
      startDate: new Date(2026, 6, 1),
      endDate: new Date(2026, 6, 15),
    },
  ],
};

// Generate PDFs
console.log("Generating Constraint Intelligence Test PDFs...\n");
generateProgrammePDF(programme1);
generateProgrammePDF(programme2);

console.log("\n=== Expected Results ===");
console.log("After uploading to 2 different projects:\n");
console.log("┌──────────────────────────┬───────────┬───────────┬─────────┐");
console.log("│ Constraint Type          │ Alpha     │ Beta      │ Trend   │");
console.log("├──────────────────────────┼───────────┼───────────┼─────────┤");
console.log("│ Site Works               │ Completed │ Overdue   │ DOWN ↓  │");
console.log("│ Foundation               │ Completed │ Overdue   │ DOWN ↓  │");
console.log("│ Structural               │ Overdue   │ Completed │ DOWN ↓  │");
console.log("│ MEP Works                │ Overdue   │ Completed │ DOWN ↓  │");
console.log("├──────────────────────────┼───────────┼───────────┼─────────┤");
console.log("│ Roofing                  │ Overdue   │ -         │ UP ↑    │");
console.log("│ Design & Approvals       │ Overdue   │ -         │ UP ↑    │");
console.log("│ Interior Fit-Out         │ -         │ Overdue   │ UP ↑    │");
console.log("│ Facade & Cladding        │ -         │ Overdue   │ UP ↑    │");
console.log("├──────────────────────────┼───────────┼───────────┼─────────┤");
console.log("│ Procurement              │ Overdue   │ Overdue   │ STABLE  │");
console.log("│ Testing & Commissioning  │ Overdue   │ Overdue   │ STABLE  │");
console.log("└──────────────────────────┴───────────┴───────────┴─────────┘");
console.log("\nUpload test-constraint-programme-1.pdf to Project A");
console.log("Upload test-constraint-programme-2.pdf to Project B");
