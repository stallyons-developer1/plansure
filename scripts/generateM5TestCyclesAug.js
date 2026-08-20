import PDFDocument from "pdfkit";
import fs from "fs";

/*
 * Three MS-05 acceptance-test programmes.
 *
 * Each file: 16 activities — 4 in Weeks 1-2, 4 in Weeks 3-4, 4 in Weeks 5-6
 * (12 inside the six-week lookahead) and 4 starting beyond week 6.
 *
 * Zone boundaries are computed from the window start exactly as
 * generateWeekZones()/getWeekZone() do on the server: week N runs
 * anchor + (N-1)*7 .. +6 days, weeks 1-2 / 3-4 / 5-6, anything starting
 * after week 6 ends is "Beyond Lookahead".
 *
 * Layout matches the existing generateM5TestCycle*.js fixtures, which the
 * pdfjs column detection in programmeUploadRoutes.js is known to parse.
 * Durations stay in "Nd" form for the same reason — the parser only reads a
 * bare integer as a duration, so "5d" is ignored rather than misread.
 */

const BLACK = "#000000";
const GRAY = "#666666";
const LIGHT_GRAY = "#E5E5E5";
const WHITE = "#FFFFFF";
const HEADER_BG = "#F0F0F0";

const OUT_DIR = "/Users/apple/Desktop";

const cycles = [
  {
    file: "m5_test_cycle_1.pdf",
    title: "M5 Test Cycle 1 Construction Programme / 2026",
    purpose: "Normal closure test",
    windowLabel: "30 Jul 2026 - 21 Sep 2026",
    anchor: "30/07/2026",
    zones: {
      "Weeks 1-2": "30 Jul - 12 Aug",
      "Weeks 3-4": "13 Aug - 26 Aug",
      "Weeks 5-6": "27 Aug - 09 Sep",
      Excluded: "10 Sep onwards",
    },
    activities: [
      // Weeks 1-2 : 30-Jul .. 12-Aug
      ["ACT-001", "Site Mobilisation", "5d", "30-Jul-26", "03-Aug-26"],
      ["ACT-002", "Temporary Works & Site Setup", "5d", "03-Aug-26", "07-Aug-26"],
      ["ACT-003", "Earthworks Cut and Fill", "6d", "05-Aug-26", "12-Aug-26"],
      ["ACT-004", "Drainage Connections", "3d", "10-Aug-26", "12-Aug-26"],
      // Weeks 3-4 : 13-Aug .. 26-Aug
      ["ACT-005", "Foundation Piling", "7d", "13-Aug-26", "21-Aug-26"],
      ["ACT-006", "Pile Cap Construction", "5d", "18-Aug-26", "24-Aug-26"],
      ["ACT-007", "Ground Floor Slab Pour", "5d", "20-Aug-26", "26-Aug-26"],
      ["ACT-008", "Steel Column Erection", "2d", "25-Aug-26", "26-Aug-26"],
      // Weeks 5-6 : 27-Aug .. 09-Sep
      ["ACT-009", "Structural Steel Frame", "7d", "27-Aug-26", "04-Sep-26"],
      ["ACT-010", "Metal Deck Installation", "4d", "01-Sep-26", "04-Sep-26"],
      ["ACT-011", "Roof Structure & Covering", "6d", "02-Sep-26", "09-Sep-26"],
      ["ACT-012", "External Wall Framing", "2d", "08-Sep-26", "09-Sep-26"],
      // Beyond week 6 : 10-Sep .. 21-Sep
      ["ACT-013", "Cladding Installation", "5d", "10-Sep-26", "16-Sep-26"],
      ["ACT-014", "Window and Glazing", "5d", "11-Sep-26", "17-Sep-26"],
      ["ACT-015", "M&E First Fix", "6d", "14-Sep-26", "21-Sep-26"],
      ["ACT-016", "Internal Partitions", "3d", "17-Sep-26", "21-Sep-26"],
    ],
  },
  {
    file: "m5_test_cycle_2.pdf",
    title: "M5 Test Cycle 2 Construction Programme / 2026",
    purpose: "Upload prevention + Planner confirmation + second cycle test",
    windowLabel: "12 Aug 2026 - 04 Oct 2026",
    anchor: "12/08/2026",
    zones: {
      "Weeks 1-2": "12 Aug - 25 Aug",
      "Weeks 3-4": "26 Aug - 08 Sep",
      "Weeks 5-6": "09 Sep - 22 Sep",
      Excluded: "23 Sep onwards",
    },
    activities: [
      // Weeks 1-2 : 12-Aug .. 25-Aug
      ["ACT-101", "Site Establishment", "5d", "12-Aug-26", "17-Aug-26"],
      ["ACT-102", "Site Clearance and Grubbing", "5d", "14-Aug-26", "20-Aug-26"],
      ["ACT-103", "Bulk Excavation", "6d", "18-Aug-26", "25-Aug-26"],
      ["ACT-104", "Stormwater Drainage", "4d", "21-Aug-26", "25-Aug-26"],
      // Weeks 3-4 : 26-Aug .. 08-Sep
      ["ACT-105", "Piling Rig Setup", "4d", "26-Aug-26", "31-Aug-26"],
      ["ACT-106", "Bored Pile Installation", "7d", "28-Aug-26", "04-Sep-26"],
      ["ACT-107", "Pile Cap Reinforcement", "5d", "02-Sep-26", "08-Sep-26"],
      ["ACT-108", "Ground Beam Casting", "4d", "04-Sep-26", "08-Sep-26"],
      // Weeks 5-6 : 09-Sep .. 22-Sep
      ["ACT-109", "Basement Slab Pour", "6d", "09-Sep-26", "16-Sep-26"],
      ["ACT-110", "Column Formwork", "4d", "14-Sep-26", "18-Sep-26"],
      ["ACT-111", "Core Wall Construction", "6d", "15-Sep-26", "22-Sep-26"],
      ["ACT-112", "First Floor Deck", "4d", "18-Sep-26", "22-Sep-26"],
      // Beyond week 6 : 23-Sep .. 04-Oct
      ["ACT-113", "Second Floor Deck", "5d", "23-Sep-26", "29-Sep-26"],
      ["ACT-114", "Facade Bracketry", "6d", "25-Sep-26", "01-Oct-26"],
      ["ACT-115", "Lift Shaft Installation", "6d", "28-Sep-26", "04-Oct-26"],
      ["ACT-116", "Mechanical Plant Base", "4d", "30-Sep-26", "04-Oct-26"],
    ],
  },
  {
    file: "m5_test_cycle_3.pdf",
    title: "M5 Test Cycle 3 Construction Programme / 2026",
    purpose: "PM Override (per action) + third cycle test",
    windowLabel: "26 Aug 2026 - 18 Oct 2026",
    anchor: "26/08/2026",
    zones: {
      "Weeks 1-2": "26 Aug - 08 Sep",
      "Weeks 3-4": "09 Sep - 22 Sep",
      "Weeks 5-6": "23 Sep - 06 Oct",
      Excluded: "07 Oct onwards",
    },
    activities: [
      // Weeks 1-2 : 26-Aug .. 08-Sep
      ["ACT-201", "Site Setup and Hoarding", "4d", "26-Aug-26", "31-Aug-26"],
      ["ACT-202", "Access Road Formation", "5d", "28-Aug-26", "03-Sep-26"],
      ["ACT-203", "Utility Diversions", "6d", "01-Sep-26", "08-Sep-26"],
      ["ACT-204", "Sub-base Preparation", "4d", "03-Sep-26", "08-Sep-26"],
      // Weeks 3-4 : 09-Sep .. 22-Sep
      ["ACT-205", "Foundation Excavation", "5d", "09-Sep-26", "15-Sep-26"],
      ["ACT-206", "Blinding Concrete", "4d", "11-Sep-26", "16-Sep-26"],
      ["ACT-207", "Footing Reinforcement", "6d", "15-Sep-26", "22-Sep-26"],
      ["ACT-208", "Footing Concrete Pour", "3d", "18-Sep-26", "22-Sep-26"],
      // Weeks 5-6 : 23-Sep .. 06-Oct
      ["ACT-209", "Retaining Wall Construction", "6d", "23-Sep-26", "30-Sep-26"],
      ["ACT-210", "Backfill and Compaction", "5d", "28-Sep-26", "02-Oct-26"],
      ["ACT-211", "Slab on Grade", "6d", "29-Sep-26", "06-Oct-26"],
      ["ACT-212", "Steel Frame Delivery", "3d", "02-Oct-26", "06-Oct-26"],
      // Beyond week 6 : 07-Oct .. 18-Oct
      ["ACT-213", "Steel Frame Erection", "5d", "07-Oct-26", "13-Oct-26"],
      ["ACT-214", "Purlins and Sheeting Rails", "5d", "09-Oct-26", "15-Oct-26"],
      ["ACT-215", "Roof Sheeting", "5d", "12-Oct-26", "18-Oct-26"],
      ["ACT-216", "Wall Cladding", "5d", "14-Oct-26", "18-Oct-26"],
    ],
  },
];

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

const build = (cycle) => {
  const doc = new PDFDocument({
    size: "A3",
    layout: "landscape",
    margins: { top: 15, bottom: 15, left: 15, right: 15 },
  });

  const outputPath = `${OUT_DIR}/${cycle.file}`;
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  const pageWidth = doc.page.width - 30;
  let y = 15;

  doc.fontSize(12).fillColor(BLACK);
  doc.text(cycle.title, 15, y);
  doc.fontSize(8).fillColor(GRAY);
  doc.text(cycle.anchor, pageWidth - 60, y);

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

  cycle.activities.forEach(([id, name, duration, start, finish], index) => {
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
    doc.text(id, COL_ID_X + 3, rowY + 6, { width: COL_ID_WIDTH - 6 });
    doc.text(name, COL_NAME_X + 3, rowY + 6, { width: COL_NAME_WIDTH - 6 });
    doc.text(duration, COL_DURATION_X + 3, rowY + 6, {
      width: COL_DURATION_WIDTH - 6,
      align: "center",
    });
    doc.text(start, COL_START_X + 3, rowY + 6, {
      width: COL_START_WIDTH - 6,
      align: "center",
    });
    doc.text(finish, COL_FINISH_X + 3, rowY + 6, {
      width: COL_FINISH_WIDTH - 6,
      align: "center",
    });
  });

  let footerY = y + cycle.activities.length * rowHeight + 18;
  doc.fontSize(6).fillColor(GRAY);
  doc.text(`${cycle.purpose}  |  programme window ${cycle.windowLabel}`, 15, footerY);
  footerY += 9;
  doc.text(
    `Six-week lookahead anchored on ${cycle.anchor} — ` +
      Object.entries(cycle.zones)
        .map(([zone, range]) => `${zone}: ${range}`)
        .join("  |  "),
    15,
    footerY,
  );
  footerY += 9;
  doc.text(
    "12 activities inside the lookahead (4 per zone), 4 beyond week 6. " +
      `Upload against a project whose start date is ${cycle.anchor}, or with the device date set to it.`,
    15,
    footerY,
  );

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on("finish", () => resolve(outputPath));
    stream.on("error", reject);
  });
};

const written = [];
for (const cycle of cycles) {
  written.push(await build(cycle));
}
written.forEach((p) => console.log(`wrote ${p}`));
