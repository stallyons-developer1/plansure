const PDFDocument = require("pdfkit");
const fs = require("fs");

// Create a PDF with activities that have all ended (finish dates before today - May 19, 2026)
const doc = new PDFDocument({
  size: "A4",
  layout: "landscape",
  margin: 30,
});

const outputPath = "./test-ended-project.pdf";
doc.pipe(fs.createWriteStream(outputPath));

// Title
doc.fontSize(16).font("Helvetica-Bold").text("Test Ended Project Programme", 30, 30);
doc.fontSize(10).font("Helvetica").text("All activities completed - Project Ended", 30, 50);

// Table headers
const startY = 80;
const colWidths = [80, 200, 50, 80, 80];
const headers = ["Activity ID", "Activity Name", "Duration", "Start", "Finish"];

let x = 30;
doc.fontSize(9).font("Helvetica-Bold");
headers.forEach((header, i) => {
  doc.text(header, x, startY);
  x += colWidths[i];
});

// Activities - all with finish dates before May 19, 2026 (today)
// Using dates from April-May 2026, all completed
const activities = [
  { id: "PROJ-001", name: "Project Kickoff Meeting", duration: "1", start: "01-Apr-26 A", finish: "01-Apr-26 A" },
  { id: "PROJ-002", name: "Requirements Gathering", duration: "5", start: "02-Apr-26 A", finish: "06-Apr-26 A" },
  { id: "PROJ-003", name: "Design Phase", duration: "7", start: "07-Apr-26 A", finish: "13-Apr-26 A" },
  { id: "PROJ-004", name: "Development Sprint 1", duration: "10", start: "14-Apr-26 A", finish: "23-Apr-26 A" },
  { id: "PROJ-005", name: "Development Sprint 2", duration: "10", start: "24-Apr-26 A", finish: "03-May-26 A" },
  { id: "PROJ-006", name: "Testing Phase", duration: "7", start: "04-May-26 A", finish: "10-May-26 A" },
  { id: "PROJ-007", name: "UAT Sign-off", duration: "3", start: "11-May-26 A", finish: "13-May-26 A" },
  { id: "PROJ-008", name: "Deployment", duration: "2", start: "14-May-26 A", finish: "15-May-26 A" },
  { id: "PROJ-009", name: "Project Closure", duration: "3", start: "16-May-26 A", finish: "18-May-26 A" }, // Last activity ended May 18, 2026
];

doc.font("Helvetica").fontSize(9);
let y = startY + 20;

activities.forEach((activity) => {
  x = 30;
  doc.text(activity.id, x, y);
  x += colWidths[0];
  doc.text(activity.name, x, y, { width: colWidths[1] - 10 });
  x += colWidths[1];
  doc.text(activity.duration, x, y);
  x += colWidths[2];
  doc.text(activity.start, x, y);
  x += colWidths[3];
  doc.text(activity.finish, x, y);
  y += 20;
});

// Add note at bottom
doc.fontSize(8).fillColor("gray");
doc.text(
  "Note: All activities have finish dates ending on 18-May-26. Today is 19-May-26, so this project should be marked as ENDED.",
  30,
  y + 30
);
doc.text(
  "Expected behavior: Assign buttons disabled, Close Week disabled, PM Override disabled, all showing 'Project Ended'",
  30,
  y + 45
);

doc.end();

console.log(`PDF created: ${outputPath}`);
console.log("This PDF has activities ending on May 18, 2026.");
console.log("Since today is May 19, 2026, the project should be marked as ENDED when uploaded.");
