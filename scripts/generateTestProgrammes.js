import PDFDocument from "pdfkit";
import fs from "fs";

// Generate multiple test programmes for Governance Dashboard demo

const today = new Date();
const formatDate = (date) => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, "0")}-${months[d.getMonth()]}-${String(d.getFullYear()).slice(-2)}`;
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

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

function generateProgrammePDF(config) {
  const doc = new PDFDocument({
    size: "A3",
    layout: "landscape",
    margins: { top: 15, bottom: 15, left: 15, right: 15 },
  });

  doc.pipe(fs.createWriteStream(config.outputPath));

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
  const GANTT_START_X = 640;
  const GANTT_WIDTH = pageWidth - GANTT_START_X;

  let y = 15;

  // Title
  doc.fontSize(12).fillColor(BLACK);
  doc.text(config.title, 15, y);
  doc.fontSize(8).fillColor(GRAY);
  doc.text(new Date().toLocaleDateString(), pageWidth - 60, y);

  y += 35;

  // Column Headers
  doc.rect(COL_ID_X, y, TABLE_END_X - COL_ID_X, 22).fill(HEADER_BG);
  doc.rect(GANTT_START_X, y, GANTT_WIDTH, 22).fill(HEADER_BG);

  doc.fontSize(8).fillColor(BLACK).font("Helvetica-Bold");
  doc.text("Activity ID", COL_ID_X + 3, y + 6);
  doc.text("Activity Name", COL_NAME_X + 3, y + 6);
  doc.text("Duration", COL_DURATION_X + 3, y + 6);
  doc.text("Start", COL_START_X + 3, y + 6);
  doc.text("Finish", COL_FINISH_X + 3, y + 6);

  // Timeline months
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  doc.fontSize(7).fillColor(GRAY);

  const timelineStart = new Date(2026, 0, 1);
  const timelineEnd = new Date(2026, 11, 31);
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

  // Draw rows
  const rowHeight = 20;
  doc.font("Helvetica");

  config.activities.forEach((activity, index) => {
    const rowY = y + index * rowHeight;

    // Row backgrounds
    if (index % 2 === 0) {
      doc.rect(COL_ID_X, rowY, TABLE_END_X - COL_ID_X, rowHeight).fill("#FAFAFA");
    } else {
      doc.rect(COL_ID_X, rowY, TABLE_END_X - COL_ID_X, rowHeight).fill(WHITE);
    }

    if (activity.isHeader) {
      doc.rect(COL_ID_X, rowY, COL_NAME_X - COL_ID_X + COL_NAME_WIDTH, rowHeight).fill(ORANGE);
    }

    doc.rect(GANTT_START_X, rowY, GANTT_WIDTH, rowHeight).fill(index % 2 === 0 ? "#FAFAFA" : WHITE);

    // Grid lines
    doc.strokeColor(LIGHT_GRAY).lineWidth(0.3);
    doc.rect(COL_ID_X, rowY, TABLE_END_X - COL_ID_X, rowHeight).stroke();
    doc.rect(GANTT_START_X, rowY, GANTT_WIDTH, rowHeight).stroke();

    [COL_NAME_X, COL_DURATION_X, COL_START_X, COL_FINISH_X].forEach(x => {
      doc.moveTo(x, rowY).lineTo(x, rowY + rowHeight).stroke();
    });

    // Text content
    doc.fontSize(7);
    doc.fillColor(activity.isHeader ? WHITE : BLACK);
    doc.font(activity.isHeader ? "Helvetica-Bold" : "Helvetica");
    doc.text(activity.id, COL_ID_X + 3, rowY + 6, { width: COL_ID_WIDTH - 6 });
    doc.text(activity.name, COL_NAME_X + 3, rowY + 6, { width: COL_NAME_WIDTH - 6 });

    doc.font("Helvetica").fillColor(BLACK);
    doc.text(activity.duration, COL_DURATION_X + 3, rowY + 6, { width: COL_DURATION_WIDTH - 6, align: "center" });
    doc.text(activity.start, COL_START_X + 3, rowY + 6, { width: COL_START_WIDTH - 6, align: "center" });
    doc.text(activity.finish, COL_FINISH_X + 3, rowY + 6, { width: COL_FINISH_WIDTH - 6, align: "center" });

    // Gantt bars
    const barY = rowY + 5;
    const barHeight = 10;

    if (activity.isMilestone) {
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
      const barStartX = Math.max(getXForDate(activity.startDate), GANTT_START_X);
      const barEndX = Math.min(getXForDate(activity.endDate), pageWidth - 15);
      const barWidth = barEndX - barStartX;

      if (barWidth > 0) {
        if (activity.isHeader) {
          doc.strokeColor(activity.barColor || ORANGE).lineWidth(2);
          doc.moveTo(barStartX, barY + barHeight).lineTo(barStartX, barY + barHeight - 3).stroke();
          doc.moveTo(barStartX, barY + barHeight).lineTo(barEndX, barY + barHeight).stroke();
          doc.moveTo(barEndX, barY + barHeight).lineTo(barEndX, barY + barHeight - 3).stroke();
        } else {
          doc.rect(barStartX, barY, barWidth, barHeight).fill(activity.barColor || BLUE);
        }
      }
    }
  });

  // Footer
  const footerY = y + config.activities.length * rowHeight + 20;
  doc.fontSize(6).fillColor(GRAY);
  doc.text("Generated by PlanSure | " + new Date().toLocaleString(), 15, footerY);

  doc.end();
  console.log(`Generated: ${config.outputPath}`);
}

// Programme 1: Airport Terminal Project - Has Material Delivery delays
const programme1 = {
  title: "Airport Terminal 2 Expansion / 2026 Programme",
  outputPath: "./test-programme-1.pdf",
  activities: [
    {
      id: "AT2-PROG",
      name: "Airport Terminal 2 Expansion Programme",
      duration: "365",
      start: formatDate(new Date(2026, 0, 1)),
      finish: formatDate(new Date(2026, 11, 31)),
      isHeader: true,
      barColor: ORANGE,
      startDate: new Date(2026, 0, 1),
      endDate: new Date(2026, 11, 31),
    },
    {
      id: "WP-MD-001",
      name: "Steel Material Delivery Phase 1",
      duration: "30",
      start: formatDate(addDays(today, -45)),
      finish: formatDate(addDays(today, -15)),
      barColor: RED,
      startDate: addDays(today, -45),
      endDate: addDays(today, -15),
    },
    {
      id: "WP-MD-002",
      name: "Concrete Material Delivery Batch 1",
      duration: "14",
      start: formatDate(addDays(today, -30)),
      finish: formatDate(addDays(today, -16)),
      barColor: RED,
      startDate: addDays(today, -30),
      endDate: addDays(today, -16),
    },
    {
      id: "WP-AP-001",
      name: "Building Permit Approval Zone A",
      duration: "21",
      start: formatDate(addDays(today, -35)),
      finish: formatDate(addDays(today, -14)),
      barColor: RED,
      startDate: addDays(today, -35),
      endDate: addDays(today, -14),
    },
    {
      id: "WP-FW-001",
      name: "Foundation Works Zone A",
      duration: "45",
      start: formatDate(addDays(today, -10)),
      finish: formatDate(addDays(today, 35)),
      barColor: GREEN,
      startDate: addDays(today, -10),
      endDate: addDays(today, 35),
    },
    {
      id: "WP-ST-001",
      name: "Steel Structure Erection Main Hall",
      duration: "60",
      start: formatDate(addDays(today, 10)),
      finish: formatDate(addDays(today, 70)),
      barColor: GREEN,
      startDate: addDays(today, 10),
      endDate: addDays(today, 70),
    },
    {
      id: "MS-SC-001",
      name: "Structural Completion Milestone",
      duration: "0",
      start: formatDate(addDays(today, 70)),
      finish: formatDate(addDays(today, 70)),
      isMilestone: true,
      startDate: addDays(today, 70),
    },
    {
      id: "WP-ME-001",
      name: "MEP Installation Level 1",
      duration: "45",
      start: formatDate(addDays(today, 75)),
      finish: formatDate(addDays(today, 120)),
      barColor: BLUE,
      startDate: addDays(today, 75),
      endDate: addDays(today, 120),
    },
    {
      id: "WP-FA-001",
      name: "Facade Installation East Wing",
      duration: "60",
      start: formatDate(addDays(today, 100)),
      finish: formatDate(addDays(today, 160)),
      barColor: BLUE,
      startDate: addDays(today, 100),
      endDate: addDays(today, 160),
    },
    {
      id: "WP-IF-001",
      name: "Interior Fit-Out Departures",
      duration: "90",
      start: formatDate(addDays(today, 150)),
      finish: formatDate(addDays(today, 240)),
      barColor: BLUE,
      startDate: addDays(today, 150),
      endDate: addDays(today, 240),
    },
  ],
};

// Programme 2: Commercial Tower Project - Has Approval & Subcontractor delays
const programme2 = {
  title: "Commercial Tower Development / 2026 Programme",
  outputPath: "./test-programme-2.pdf",
  activities: [
    {
      id: "CT-PROG",
      name: "Commercial Tower Development Programme",
      duration: "300",
      start: formatDate(new Date(2026, 0, 15)),
      finish: formatDate(new Date(2026, 10, 15)),
      isHeader: true,
      barColor: ORANGE,
      startDate: new Date(2026, 0, 15),
      endDate: new Date(2026, 10, 15),
    },
    {
      id: "WP-AP-002",
      name: "Planning Approval Submission",
      duration: "45",
      start: formatDate(addDays(today, -60)),
      finish: formatDate(addDays(today, -15)),
      barColor: RED,
      startDate: addDays(today, -60),
      endDate: addDays(today, -15),
    },
    {
      id: "WP-AP-003",
      name: "Environmental Permit Sign-off",
      duration: "30",
      start: formatDate(addDays(today, -40)),
      finish: formatDate(addDays(today, -10)),
      barColor: RED,
      startDate: addDays(today, -40),
      endDate: addDays(today, -10),
    },
    {
      id: "WP-SC-001",
      name: "Subcontractor Mobilization Electrical",
      duration: "21",
      start: formatDate(addDays(today, -28)),
      finish: formatDate(addDays(today, -7)),
      barColor: AMBER,
      startDate: addDays(today, -28),
      endDate: addDays(today, -7),
    },
    {
      id: "WP-SC-002",
      name: "Subcontractor Mechanical Systems",
      duration: "14",
      start: formatDate(addDays(today, -20)),
      finish: formatDate(addDays(today, -6)),
      barColor: AMBER,
      startDate: addDays(today, -20),
      endDate: addDays(today, -6),
    },
    {
      id: "WP-EX-001",
      name: "Excavation Works Basement",
      duration: "30",
      start: formatDate(addDays(today, -5)),
      finish: formatDate(addDays(today, 25)),
      barColor: GREEN,
      startDate: addDays(today, -5),
      endDate: addDays(today, 25),
    },
    {
      id: "WP-PI-001",
      name: "Piling Works Deep Foundation",
      duration: "45",
      start: formatDate(addDays(today, 20)),
      finish: formatDate(addDays(today, 65)),
      barColor: GREEN,
      startDate: addDays(today, 20),
      endDate: addDays(today, 65),
    },
    {
      id: "MS-FD-001",
      name: "Foundation Complete Milestone",
      duration: "0",
      start: formatDate(addDays(today, 65)),
      finish: formatDate(addDays(today, 65)),
      isMilestone: true,
      startDate: addDays(today, 65),
    },
    {
      id: "WP-CO-001",
      name: "Core Construction Levels 1-10",
      duration: "90",
      start: formatDate(addDays(today, 70)),
      finish: formatDate(addDays(today, 160)),
      barColor: BLUE,
      startDate: addDays(today, 70),
      endDate: addDays(today, 160),
    },
    {
      id: "WP-CL-001",
      name: "Cladding Installation",
      duration: "60",
      start: formatDate(addDays(today, 140)),
      finish: formatDate(addDays(today, 200)),
      barColor: BLUE,
      startDate: addDays(today, 140),
      endDate: addDays(today, 200),
    },
  ],
};

// Programme 3: Hospital Project - Has Resource & Design delays
const programme3 = {
  title: "Central Hospital Expansion / 2026 Programme",
  outputPath: "./test-programme-3.pdf",
  activities: [
    {
      id: "CH-PROG",
      name: "Central Hospital Expansion Programme",
      duration: "280",
      start: formatDate(new Date(2026, 1, 1)),
      finish: formatDate(new Date(2026, 10, 30)),
      isHeader: true,
      barColor: ORANGE,
      startDate: new Date(2026, 1, 1),
      endDate: new Date(2026, 10, 30),
    },
    {
      id: "WP-DS-001",
      name: "Detailed Design Package A Drawings",
      duration: "30",
      start: formatDate(addDays(today, -50)),
      finish: formatDate(addDays(today, -20)),
      barColor: RED,
      startDate: addDays(today, -50),
      endDate: addDays(today, -20),
    },
    {
      id: "WP-DS-002",
      name: "MEP Design Coordination Drawings",
      duration: "21",
      start: formatDate(addDays(today, -35)),
      finish: formatDate(addDays(today, -14)),
      barColor: RED,
      startDate: addDays(today, -35),
      endDate: addDays(today, -14),
    },
    {
      id: "WP-RS-001",
      name: "Skilled Labour Resource Mobilization",
      duration: "14",
      start: formatDate(addDays(today, -25)),
      finish: formatDate(addDays(today, -11)),
      barColor: AMBER,
      startDate: addDays(today, -25),
      endDate: addDays(today, -11),
    },
    {
      id: "WP-MD-003",
      name: "Medical Equipment Delivery Phase 1",
      duration: "30",
      start: formatDate(addDays(today, -8)),
      finish: formatDate(addDays(today, 22)),
      barColor: GREEN,
      startDate: addDays(today, -8),
      endDate: addDays(today, 22),
    },
    {
      id: "WP-DM-001",
      name: "Demolition Existing Wing B",
      duration: "21",
      start: formatDate(addDays(today, -3)),
      finish: formatDate(addDays(today, 18)),
      barColor: GREEN,
      startDate: addDays(today, -3),
      endDate: addDays(today, 18),
    },
    {
      id: "WP-FW-002",
      name: "Foundation Works Wing B",
      duration: "35",
      start: formatDate(addDays(today, 20)),
      finish: formatDate(addDays(today, 55)),
      barColor: GREEN,
      startDate: addDays(today, 20),
      endDate: addDays(today, 55),
    },
    {
      id: "MS-FW-001",
      name: "Foundation Complete Milestone",
      duration: "0",
      start: formatDate(addDays(today, 55)),
      finish: formatDate(addDays(today, 55)),
      isMilestone: true,
      startDate: addDays(today, 55),
    },
    {
      id: "WP-ST-002",
      name: "Steel Frame Erection",
      duration: "45",
      start: formatDate(addDays(today, 60)),
      finish: formatDate(addDays(today, 105)),
      barColor: BLUE,
      startDate: addDays(today, 60),
      endDate: addDays(today, 105),
    },
    {
      id: "WP-QA-001",
      name: "Quality Inspection Structural",
      duration: "14",
      start: formatDate(addDays(today, 100)),
      finish: formatDate(addDays(today, 114)),
      barColor: BLUE,
      startDate: addDays(today, 100),
      endDate: addDays(today, 114),
    },
  ],
};

// Programme 4: Infrastructure Project - Good progress, minimal delays
const programme4 = {
  title: "Highway Extension Project / 2026 Programme",
  outputPath: "./test-programme-4.pdf",
  activities: [
    {
      id: "HW-PROG",
      name: "Highway Extension Project Programme",
      duration: "240",
      start: formatDate(new Date(2026, 2, 1)),
      finish: formatDate(new Date(2026, 10, 1)),
      isHeader: true,
      barColor: ORANGE,
      startDate: new Date(2026, 2, 1),
      endDate: new Date(2026, 10, 1),
    },
    {
      id: "WP-SV-001",
      name: "Site Survey and Testing Complete",
      duration: "21",
      start: formatDate(addDays(today, -30)),
      finish: formatDate(addDays(today, -9)),
      barColor: GREEN,
      startDate: addDays(today, -30),
      endDate: addDays(today, -9),
    },
    {
      id: "WP-CL-001",
      name: "Land Clearing Section 1",
      duration: "14",
      start: formatDate(addDays(today, -15)),
      finish: formatDate(addDays(today, -1)),
      barColor: GREEN,
      startDate: addDays(today, -15),
      endDate: addDays(today, -1),
    },
    {
      id: "WP-EW-001",
      name: "Earthworks Section 1",
      duration: "30",
      start: formatDate(addDays(today, -5)),
      finish: formatDate(addDays(today, 25)),
      barColor: GREEN,
      startDate: addDays(today, -5),
      endDate: addDays(today, 25),
    },
    {
      id: "WP-DR-001",
      name: "Drainage Installation",
      duration: "21",
      start: formatDate(addDays(today, 15)),
      finish: formatDate(addDays(today, 36)),
      barColor: GREEN,
      startDate: addDays(today, 15),
      endDate: addDays(today, 36),
    },
    {
      id: "WP-SB-001",
      name: "Sub-base Layer Construction",
      duration: "28",
      start: formatDate(addDays(today, 30)),
      finish: formatDate(addDays(today, 58)),
      barColor: BLUE,
      startDate: addDays(today, 30),
      endDate: addDays(today, 58),
    },
    {
      id: "MS-SB-001",
      name: "Sub-base Complete Milestone",
      duration: "0",
      start: formatDate(addDays(today, 58)),
      finish: formatDate(addDays(today, 58)),
      isMilestone: true,
      startDate: addDays(today, 58),
    },
    {
      id: "WP-AS-001",
      name: "Asphalt Laying Section 1",
      duration: "21",
      start: formatDate(addDays(today, 60)),
      finish: formatDate(addDays(today, 81)),
      barColor: BLUE,
      startDate: addDays(today, 60),
      endDate: addDays(today, 81),
    },
    {
      id: "WP-LM-001",
      name: "Line Marking and Signage",
      duration: "14",
      start: formatDate(addDays(today, 85)),
      finish: formatDate(addDays(today, 99)),
      barColor: BLUE,
      startDate: addDays(today, 85),
      endDate: addDays(today, 99),
    },
    {
      id: "MS-PC-001",
      name: "Practical Completion Milestone",
      duration: "0",
      start: formatDate(addDays(today, 100)),
      finish: formatDate(addDays(today, 100)),
      isMilestone: true,
      startDate: addDays(today, 100),
    },
  ],
};

// Generate all PDFs
console.log("Generating test programmes...\n");
generateProgrammePDF(programme1);
generateProgrammePDF(programme2);
generateProgrammePDF(programme3);
generateProgrammePDF(programme4);

console.log("\n=== Summary ===");
console.log("Generated 4 test programmes:");
console.log("1. Airport Terminal 2 - Material Delivery delays (Overdue)");
console.log("2. Commercial Tower - Approvals & Subcontractor delays (Overdue)");
console.log("3. Central Hospital - Design & Resource delays (Overdue)");
console.log("4. Highway Extension - Good progress (minimal delays)");
console.log("\nUpload these to different projects to see Constraint Intelligence data!");
