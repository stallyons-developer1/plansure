const PDFDocument = require("pdfkit");
const fs = require("fs");

const activities = [
  {
    id: "ACT-001",
    name: "Site Preparation Phase 1",
    start: "10-May-26",
    finish: "15-May-26",
    blocked: "",
  },
  {
    id: "ACT-002",
    name: "Foundation Inspection",
    start: "12-May-26",
    finish: "18-May-26",
    blocked: "Yes",
  },
  {
    id: "ACT-003",
    name: "Utility Connection Review",
    start: "15-May-26",
    finish: "22-May-26",
    blocked: "",
  },

  {
    id: "ACT-004",
    name: "Structural Steel Delivery",
    start: "26-May-26",
    finish: "30-May-26",
    blocked: "",
  },
  {
    id: "ACT-005",
    name: "Concrete Pouring Block A",
    start: "27-May-26",
    finish: "02-Jun-26",
    blocked: "",
  },
  {
    id: "ACT-006",
    name: "Electrical Rough-In Level 1",
    start: "28-May-26",
    finish: "03-Jun-26",
    blocked: "Yes",
  },
  {
    id: "ACT-007",
    name: "Plumbing Installation Zone 1",
    start: "01-Jun-26",
    finish: "05-Jun-26",
    blocked: "",
  },
  {
    id: "ACT-008",
    name: "HVAC Ductwork Section A",
    start: "03-Jun-26",
    finish: "08-Jun-26",
    blocked: "",
  },
  {
    id: "ACT-009",
    name: "Fire Protection System",
    start: "05-Jun-26",
    finish: "10-Jun-26",
    blocked: "Yes",
  },
  {
    id: "ACT-010",
    name: "Elevator Shaft Construction",
    start: "08-Jun-26",
    finish: "15-Jun-26",
    blocked: "",
  },

  {
    id: "ACT-011",
    name: "Roofing Installation",
    start: "09-Jun-26",
    finish: "14-Jun-26",
    blocked: "",
  },
  {
    id: "ACT-012",
    name: "External Cladding Phase 1",
    start: "10-Jun-26",
    finish: "18-Jun-26",
    blocked: "",
  },
  {
    id: "ACT-013",
    name: "Interior Framing Level 2",
    start: "12-Jun-26",
    finish: "19-Jun-26",
    blocked: "Yes",
  },
  {
    id: "ACT-014",
    name: "MEP Coordination Review",
    start: "15-Jun-26",
    finish: "20-Jun-26",
    blocked: "",
  },
  {
    id: "ACT-015",
    name: "Window Installation Block B",
    start: "17-Jun-26",
    finish: "24-Jun-26",
    blocked: "",
  },
  {
    id: "ACT-016",
    name: "Drywall Installation Level 1",
    start: "19-Jun-26",
    finish: "26-Jun-26",
    blocked: "",
  },
  {
    id: "ACT-017",
    name: "Sprinkler System Testing",
    start: "22-Jun-26",
    finish: "27-Jun-26",
    blocked: "",
  },

  {
    id: "ACT-018",
    name: "Facade Completion Zone A",
    start: "23-Jun-26",
    finish: "30-Jun-26",
    blocked: "",
  },
  {
    id: "ACT-019",
    name: "Painting Interior Level 1",
    start: "25-Jun-26",
    finish: "02-Jul-26",
    blocked: "",
  },
  {
    id: "ACT-020",
    name: "Flooring Installation Phase 1",
    start: "27-Jun-26",
    finish: "04-Jul-26",
    blocked: "",
  },
  {
    id: "ACT-021",
    name: "Ceiling Grid Installation",
    start: "29-Jun-26",
    finish: "06-Jul-26",
    blocked: "Yes",
  },
  {
    id: "ACT-022",
    name: "Final Electrical Connections",
    start: "01-Jul-26",
    finish: "08-Jul-26",
    blocked: "",
  },
  {
    id: "ACT-023",
    name: "HVAC Commissioning",
    start: "03-Jul-26",
    finish: "10-Jul-26",
    blocked: "",
  },
  {
    id: "ACT-024",
    name: "Security System Installation",
    start: "06-Jul-26",
    finish: "12-Jul-26",
    blocked: "",
  },
];

const doc = new PDFDocument({ margin: 50, size: "A4" });
const outputPath = "/Users/apple/Desktop/test_programme_may_june_2026.pdf";
doc.pipe(fs.createWriteStream(outputPath));

doc
  .fontSize(20)
  .font("Helvetica-Bold")
  .text("Test Programme - May/June 2026", { align: "center" });
doc.moveDown(0.5);
doc
  .fontSize(10)
  .font("Helvetica")
  .text(`Generated: ${new Date().toISOString()}`, { align: "center" });
doc.moveDown(1);

const blockedCount = activities.filter((a) => a.blocked === "Yes").length;
const atRiskCount = activities.filter(
  (a) =>
    !a.blocked &&
    new Date("2026-05-26") >
      new Date(
        a.finish.replace(/(\d{2})-([A-Za-z]{3})-(\d{2})/, "$2 $1, 20$3"),
      ),
).length;

doc.fontSize(12).font("Helvetica-Bold").text("Summary:");
doc.fontSize(10).font("Helvetica");
doc.text(`Total Activities: ${activities.length}`);
doc.text(`Date Range: 10-May-26 to 12-Jul-26`);
doc.moveDown(0.5);

doc.text("Expected RAG Zones (based on today = May 26, 2026):");
doc.text("  - Overdue: 3 activities (ACT-001 to ACT-003)");
doc.text("  - Green (Weeks 1-2): 7 activities (ACT-004 to ACT-010)");
doc.text("  - Amber (Weeks 3-4): 7 activities (ACT-011 to ACT-017)");
doc.text("  - Red (Weeks 5-6): 7 activities (ACT-018 to ACT-024)");
doc.moveDown(0.5);

doc.text("Expected Statuses:");
doc.text(`  - Blocked: ${blockedCount} (marked with "Yes" in Blocked column)`);
doc.text("  - At Risk: 2 (past activities not blocked)");
doc.text("  - Ready: 17 (future activities not blocked)");
doc.moveDown(1);

const startX = 50;
let y = doc.y;
const colWidths = [60, 180, 70, 70, 50];

doc.fontSize(9).font("Helvetica-Bold");
doc.text("Activity ID", startX, y);
doc.text("Activity Name", startX + colWidths[0], y);
doc.text("Start", startX + colWidths[0] + colWidths[1], y);
doc.text("Finish", startX + colWidths[0] + colWidths[1] + colWidths[2], y);
doc.text(
  "Blocked",
  startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3],
  y,
);

y += 20;
doc.moveTo(startX, y).lineTo(550, y).stroke();
y += 10;

doc.font("Helvetica").fontSize(8);
activities.forEach((activity, index) => {
  if (y > 750) {
    doc.addPage();
    y = 50;
  }

  doc.text(activity.id, startX, y);
  doc.text(activity.name, startX + colWidths[0], y, {
    width: colWidths[1] - 10,
  });
  doc.text(activity.start, startX + colWidths[0] + colWidths[1], y);
  doc.text(
    activity.finish,
    startX + colWidths[0] + colWidths[1] + colWidths[2],
    y,
  );
  doc.text(
    activity.blocked || "-",
    startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3],
    y,
  );

  y += 18;
});

doc.addPage();
doc
  .fontSize(14)
  .font("Helvetica-Bold")
  .text("How Status is Calculated:", { align: "left" });
doc.moveDown(1);
doc.fontSize(10).font("Helvetica");
doc.text("The backend calculates activity status based on:");
doc.moveDown(0.5);
doc.text(
  '1. BLOCKED: If "Blocked" column has "Yes", "Y", "Blocked", "Block", "true", or "1"',
);
doc.text(
  '2. COMPLETE: If dates have "A" suffix (Actual) OR action is completed',
);
doc.text("3. AT RISK: If Start AND Finish dates are in the past (overdue)");
doc.text("4. READY (default): Future activities");
doc.moveDown(1);

doc
  .fontSize(14)
  .font("Helvetica-Bold")
  .text("Blocked Activities in this PDF:", { align: "left" });
doc.moveDown(0.5);
doc.fontSize(10).font("Helvetica");
doc.text("ACT-002: Foundation Inspection");
doc.text("ACT-006: Electrical Rough-In Level 1");
doc.text("ACT-009: Fire Protection System");
doc.text("ACT-013: Interior Framing Level 2");
doc.text("ACT-021: Ceiling Grid Installation");
doc.moveDown(1);

doc
  .fontSize(14)
  .font("Helvetica-Bold")
  .text("RAG Zone Calculation:", { align: "left" });
doc.moveDown(0.5);
doc.fontSize(10).font("Helvetica");
doc.text("RAG is calculated based on weeks until activity start date:");
doc.moveDown(0.5);
doc.text("- GREEN (Weeks 1-2): Starts within next 2 weeks");
doc.text("- AMBER (Weeks 3-4): Starts in 3-4 weeks");
doc.text("- RED (Weeks 5-6): Starts in 5-6 weeks");
doc.text("- OVERDUE: Start & Finish dates have passed");

doc.end();
