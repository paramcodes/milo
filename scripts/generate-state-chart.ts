import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

interface Point {
  x: number;
  y: number;
}

interface NodeBox {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  cx: number;
  text: string[];
  type: 'default' | 'works' | 'bug' | 'fixed';
}

interface Edge {
  points: Point[];
  label?: string;
  labelPos?: Point;
}

interface Diamond {
  x: number;
  y: number;
  size: number;
  question: string;
}

const WIDTH = 2100;
const HEIGHT = 1350;

const nodes: NodeBox[] = [];
const diamonds: Diamond[] = [];
const edges: Edge[] = [];

function addNode(
  id: string,
  centerX: number,
  centerY: number,
  w: number,
  h: number,
  text: string[],
  type: 'default' | 'works' | 'bug' | 'fixed' = 'default',
): NodeBox {
  const node: NodeBox = {
    id,
    x: Math.round(centerX - w / 2),
    y: Math.round(centerY - h / 2),
    w,
    h,
    cx: Math.round(centerX),
    text,
    type,
  };
  nodes.push(node);
  return node;
}

function addDiamond(x: number, y: number, size: number, question: string): Diamond {
  const diamond: Diamond = { x, y, size, question };
  diamonds.push(diamond);
  return diamond;
}

function addEdge(points: Point[], label?: string, labelPos?: Point) {
  edges.push({ points, label, labelPos });
}

// =========================================================================
// Layout Construction
// =========================================================================

// Start Dot
const startDot: Point = { x: 1050, y: 120 };

// Root Node
const rootNode = addNode(
  'root',
  1050,
  175,
  240,
  50,
  ['User performs an', 'action on the board'],
  'default',
);

addEdge([startDot, { x: 1050, y: rootNode.y }]);

// Fork Y from Root
const forkY1 = 232;

// -------------------------------------------------------------------------
// Column 1 (Left): List Reordering (X = 220)
// -------------------------------------------------------------------------
const col1X = 220;

const listColNode = addNode(
  'list_col',
  col1X,
  315,
  220,
  52,
  ['Lists slide into new slot', 'instantly on client (optimistic)'],
  'default',
);

addEdge(
  [
    { x: 1050, y: rootNode.y + rootNode.h },
    { x: 1050, y: forkY1 },
    { x: col1X, y: forkY1 },
    { x: col1X, y: listColNode.y },
  ],
  'a list column drag',
  { x: 580, y: forkY1 - 10 },
);

const listDbNode = addNode(
  'list_db',
  col1X,
  420,
  220,
  52,
  ['reorderListsAction commits', 'new list positions in SQLite'],
  'default',
);

addEdge(
  [
    { x: col1X, y: listColNode.y + listColNode.h },
    { x: col1X, y: listDbNode.y },
  ],
  'drag release',
  { x: col1X, y: 367 },
);

const listForkY = 475;

const listWorksNode = addNode(
  'list_works',
  120,
  550,
  160,
  64,
  ['Positions sync cleanly;', 'board canvas revalidates', 'without layout flicker'],
  'works',
);

const listBugNode = addNode(
  'list_bug',
  310,
  550,
  160,
  64,
  ['Network error / DB lock:', 'client stays in new order,', 'reverts on refresh'],
  'bug',
);

const listFixNode = addNode(
  'list_fix',
  310,
  680,
  160,
  64,
  ['Rollback lists to snapshot', 'and surface toast error:', '"Failed to reorder lists"'],
  'fixed',
);

addEdge(
  [
    { x: col1X, y: listDbNode.y + listDbNode.h },
    { x: col1X, y: listForkY },
    { x: 120, y: listForkY },
    { x: 120, y: listWorksNode.y },
  ],
  'write succeeds',
  { x: 120, y: 502 },
);

addEdge(
  [
    { x: col1X, y: listDbNode.y + listDbNode.h },
    { x: col1X, y: listForkY },
    { x: 310, y: listForkY },
    { x: 310, y: listBugNode.y },
  ],
  'write fails',
  { x: 310, y: 502 },
);

addEdge(
  [
    { x: 310, y: listBugNode.y + listBugNode.h },
    { x: 310, y: listFixNode.y },
  ],
  'with the fix',
  { x: 310, y: 615 },
);

// -------------------------------------------------------------------------
// Column 2 (Center): Drag & Drop Cards (Center X = 950)
// -------------------------------------------------------------------------
const col2X = 950;

const cardLiftNode = addNode(
  'card_lift',
  col2X,
  315,
  240,
  52,
  ['Card lifts and follows pointer', 'via @hello-pangea/dnd'],
  'default',
);

addEdge(
  [
    { x: 1050, y: rootNode.y + rootNode.h },
    { x: 1050, y: forkY1 },
    { x: col2X, y: forkY1 },
    { x: col2X, y: cardLiftNode.y },
  ],
  'a card drag & drop',
  { x: 950, y: forkY1 - 10 },
);

// Decision diamond
const cardDiamond = addDiamond(col2X, 415, 26, 'where is card dropped?');

addEdge([
  { x: col2X, y: cardLiftNode.y + cardLiftNode.h },
  { x: col2X, y: cardDiamond.y - cardDiamond.size / 2 },
]);

// Fork line below diamond question text (question sits at y=415+13+13=441, so fork at 468)
const cardForkY = 468;

// Branch 2A: Dropped outside / original slot (X = 520)
const cardDropCancel = addNode(
  'card_cancel',
  520,
  550,
  170,
  64,
  ['Card snaps back smoothly', 'to origin; zero server', 'requests dispatched'],
  'works',
);

addEdge(
  [
    { x: col2X, y: cardDiamond.y + cardDiamond.size / 2 },
    { x: col2X, y: cardForkY },
    { x: 520, y: cardForkY },
    { x: 520, y: cardDropCancel.y },
  ],
  'outside or same slot',
  { x: 520, y: 495 },
);

// Branch 2B: Within same list (X = 890)
const cardSameNode = addNode(
  'card_same',
  890,
  520,
  230,
  50,
  ['calculateReorderedPosition', 'updates client state instantly'],
  'default',
);

addEdge(
  [
    { x: col2X, y: cardDiamond.y + cardDiamond.size / 2 },
    { x: col2X, y: cardForkY },
    { x: 890, y: cardForkY },
    { x: 890, y: cardSameNode.y },
  ],
  'within the same list',
  { x: 790, y: 480 },
);

const sameForkY = 575;

const cardSameWorks = addNode(
  'card_same_works',
  740,
  660,
  155,
  64,
  ['moveCardAction persists;', 'SQLite updates position;', 'CardActivity logged'],
  'works',
);

const cardSameBug1 = addNode(
  'card_same_bug1',
  910,
  660,
  155,
  64,
  ['Server error / 401 auth:', 'card stays in moved slot;', 'desynced until refresh'],
  'bug',
);

const cardSameFix1 = addNode(
  'card_same_fix1',
  910,
  785,
  155,
  64,
  ['Optimistic rollback reverts', 'cards to pre-drag snapshot', 'with warning toast'],
  'fixed',
);

const cardSameBug2 = addNode(
  'card_same_bug2',
  1085,
  660,
  165,
  64,
  ['Rapid multi-card drags:', 'revalidation from drag 1', 'wipes out drag 2 position'],
  'bug',
);

const cardSameFix2 = addNode(
  'card_same_fix2',
  1085,
  785,
  165,
  64,
  ['Monotonic request ID drops', 'stale revalidations until', 'all mutations settle'],
  'fixed',
);

addEdge(
  [
    { x: 890, y: cardSameNode.y + cardSameNode.h },
    { x: 890, y: sameForkY },
    { x: 740, y: sameForkY },
    { x: 740, y: cardSameWorks.y },
  ],
  'server succeeds',
  { x: 740, y: 605 },
);

addEdge(
  [
    { x: 890, y: cardSameNode.y + cardSameNode.h },
    { x: 890, y: sameForkY },
    { x: 910, y: sameForkY },
    { x: 910, y: cardSameBug1.y },
  ],
  'server error',
  { x: 910, y: 605 },
);

addEdge(
  [
    { x: 910, y: cardSameBug1.y + cardSameBug1.h },
    { x: 910, y: cardSameFix1.y },
  ],
  'with the fix',
  { x: 910, y: 722 },
);

addEdge(
  [
    { x: 890, y: cardSameNode.y + cardSameNode.h },
    { x: 890, y: sameForkY },
    { x: 1085, y: sameForkY },
    { x: 1085, y: cardSameBug2.y },
  ],
  'rapid successive drags',
  { x: 1085, y: 605 },
);

addEdge(
  [
    { x: 1085, y: cardSameBug2.y + cardSameBug2.h },
    { x: 1085, y: cardSameFix2.y },
  ],
  'with the fix',
  { x: 1085, y: 722 },
);

// Branch 2C: Across different lists (X = 1320)
const cardCrossNode = addNode(
  'card_cross',
  1320,
  520,
  220,
  50,
  ['Card spliced to dest list;', 'recalculated sparse positions'],
  'default',
);

addEdge(
  [
    { x: col2X, y: cardDiamond.y + cardDiamond.size / 2 },
    { x: col2X, y: cardForkY },
    { x: 1320, y: cardForkY },
    { x: 1320, y: cardCrossNode.y },
  ],
  'across into another list',
  { x: 1200, y: 480 },
);

const crossForkY = 575;

const cardCrossWorks = addNode(
  'card_cross_works',
  1265,
  660,
  155,
  64,
  ['moveCardAction commits;', 'targetListId & pos update;', '"moved card" logged in feed'],
  'works',
);

const cardCrossBug = addNode(
  'card_cross_bug',
  1435,
  660,
  155,
  64,
  [
    'Dest list deleted concurrently:',
    'card floats in missing list;',
    'server rejects ListNotFound',
  ],
  'bug',
);

const cardCrossFix = addNode(
  'card_cross_fix',
  1435,
  785,
  155,
  64,
  ['Reconcile state with server;', 'card returns to source list', 'with clarifying alert'],
  'fixed',
);

addEdge(
  [
    { x: 1320, y: cardCrossNode.y + cardCrossNode.h },
    { x: 1320, y: crossForkY },
    { x: 1265, y: crossForkY },
    { x: 1265, y: cardCrossWorks.y },
  ],
  'dest list exists',
  { x: 1265, y: 605 },
);

addEdge(
  [
    { x: 1320, y: cardCrossNode.y + cardCrossNode.h },
    { x: 1320, y: crossForkY },
    { x: 1435, y: crossForkY },
    { x: 1435, y: cardCrossBug.y },
  ],
  'dest list deleted',
  { x: 1435, y: 605 },
);

addEdge(
  [
    { x: 1435, y: cardCrossBug.y + cardCrossBug.h },
    { x: 1435, y: cardCrossFix.y },
  ],
  'with the fix',
  { x: 1435, y: 722 },
);

// -------------------------------------------------------------------------
// Column 3 (Right): Card Details Modal (Center X = 1790)
// -------------------------------------------------------------------------
const col3X = 1790;

const modalOpenNode = addNode(
  'modal_open',
  col3X,
  315,
  230,
  52,
  ['CardModal opens with title,', 'checklists, labels & due date'],
  'default',
);

addEdge(
  [
    { x: 1050, y: rootNode.y + rootNode.h },
    { x: 1050, y: forkY1 },
    { x: col3X, y: forkY1 },
    { x: col3X, y: modalOpenNode.y },
  ],
  'click on a card tile',
  { x: 1510, y: forkY1 - 10 },
);

const modalDiamond = addDiamond(col3X, 415, 26, 'what do you edit?');

addEdge([
  { x: col3X, y: modalOpenNode.y + modalOpenNode.h },
  { x: col3X, y: modalDiamond.y - modalDiamond.size / 2 },
]);

// Fork line below question text
const modalForkY = 468;

// Sub-branch 3A: Title / Description (X = 1660)
const editTitleNode = addNode(
  'edit_title',
  1660,
  520,
  160,
  50,
  ['Input blur triggers', 'updateCardAction'],
  'default',
);

addEdge(
  [
    { x: col3X, y: modalDiamond.y + modalDiamond.size / 2 },
    { x: col3X, y: modalForkY },
    { x: 1660, y: modalForkY },
    { x: 1660, y: editTitleNode.y },
  ],
  'title or description',
  { x: 1660, y: 485 },
);

const titleForkY = 575;

const titleWorks1 = addNode(
  'title_w1',
  1600,
  660,
  130,
  64,
  ['Non-empty text:', 'updates SQLite & logs', 'activity in feed'],
  'works',
);

const titleWorks2 = addNode(
  'title_w2',
  1740,
  660,
  130,
  64,
  ['Empty title:', 'reverts to original;', 'no mutation sent'],
  'works',
);

addEdge(
  [
    { x: 1660, y: editTitleNode.y + editTitleNode.h },
    { x: 1660, y: titleForkY },
    { x: 1600, y: titleForkY },
    { x: 1600, y: titleWorks1.y },
  ],
  'valid text',
  { x: 1600, y: 605 },
);

addEdge(
  [
    { x: 1660, y: editTitleNode.y + editTitleNode.h },
    { x: 1660, y: titleForkY },
    { x: 1740, y: titleForkY },
    { x: 1740, y: titleWorks2.y },
  ],
  'empty text',
  { x: 1740, y: 605 },
);

// Sub-branch 3B: Checklist (X = 1930)
const checklistNode = addNode(
  'checklist_node',
  1930,
  520,
  160,
  50,
  ['calculateChecklistProgress', 'updates % immediately'],
  'default',
);

addEdge(
  [
    { x: col3X, y: modalDiamond.y + modalDiamond.size / 2 },
    { x: col3X, y: modalForkY },
    { x: 1930, y: modalForkY },
    { x: 1930, y: checklistNode.y },
  ],
  'checklist toggle',
  { x: 1910, y: 485 },
);

const chkWorks = addNode(
  'chk_works',
  1870,
  660,
  130,
  64,
  ['All checked:', 'progress hits 100%,', 'bar turns green'],
  'works',
);

const chkBug = addNode(
  'chk_bug',
  2010,
  660,
  140,
  64,
  ['Rapid multi-clicks:', 'concurrent writes lock DB;', 'checkboxes desync'],
  'bug',
);

const chkFix = addNode(
  'chk_fix',
  2010,
  785,
  140,
  64,
  ['Item-level lock', 'serializes checklist', 'mutations safely in order'],
  'fixed',
);

addEdge(
  [
    { x: 1930, y: checklistNode.y + checklistNode.h },
    { x: 1930, y: titleForkY },
    { x: 1870, y: titleForkY },
    { x: 1870, y: chkWorks.y },
  ],
  'single click',
  { x: 1870, y: 605 },
);

addEdge(
  [
    { x: 1930, y: checklistNode.y + checklistNode.h },
    { x: 1930, y: titleForkY },
    { x: 2010, y: titleForkY },
    { x: 2010, y: chkBug.y },
  ],
  'rapid clicks',
  { x: 2010, y: 605 },
);

addEdge(
  [
    { x: 2010, y: chkBug.y + chkBug.h },
    { x: 2010, y: chkFix.y },
  ],
  'with the fix',
  { x: 2010, y: 722 },
);

// Sub-branch 3C: Due Date Flow (Center X = 1790, Y = 890)
const dueCardNode = addNode(
  'due_card_node',
  1790,
  890,
  240,
  52,
  ['getDueDateStatus computes status:', 'OVERDUE, DUE_SOON, COMPLETE'],
  'default',
);

addEdge(
  [
    { x: 1740, y: titleWorks2.y + titleWorks2.h },
    { x: 1740, y: 835 },
    { x: 1790, y: 835 },
    { x: 1790, y: dueCardNode.y },
  ],
  'set due date / complete',
  { x: 1790, y: 825 },
);

const dueForkY = 945;

const dueWorks = addNode(
  'due_works',
  1690,
  1025,
  160,
  64,
  ['Due < 24h: yellow "Due soon"', 'isCompleted: green "Complete"', 'Past & incomplete: "Overdue"'],
  'works',
);

const dueBug = addNode(
  'due_bug',
  1890,
  1025,
  175,
  64,
  ['Past date set on complete card:', 'date math overrides flag,', 'badge falsely shows "Overdue"'],
  'bug',
);

const dueFix = addNode(
  'due_fix',
  1890,
  1145,
  175,
  56,
  ['isCompleted guard takes priority;', 'badge remains "Complete"'],
  'fixed',
);

addEdge(
  [
    { x: 1790, y: dueCardNode.y + dueCardNode.h },
    { x: 1790, y: dueForkY },
    { x: 1690, y: dueForkY },
    { x: 1690, y: dueWorks.y },
  ],
  'normal date checks',
  { x: 1690, y: 975 },
);

addEdge(
  [
    { x: 1790, y: dueCardNode.y + dueCardNode.h },
    { x: 1790, y: dueForkY },
    { x: 1890, y: dueForkY },
    { x: 1890, y: dueBug.y },
  ],
  'past date while complete',
  { x: 1890, y: 975 },
);

addEdge(
  [
    { x: 1890, y: dueBug.y + dueBug.h },
    { x: 1890, y: dueFix.y },
  ],
  'with the fix',
  { x: 1890, y: 1085 },
);

// =========================================================================
// Render SVG String
// =========================================================================

function generateSvg(): string {
  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" style="background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#4B5563" />
    </marker>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="115%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#000000" flood-opacity="0.04" />
    </filter>
  </defs>

  <!-- Title & Subtitle -->
  <text x="${WIDTH / 2}" y="42" text-anchor="middle" font-size="20" font-weight="700" fill="#111827" letter-spacing="-0.3">
    What happens when you interact with a board in Milo
  </text>
  <text x="${WIDTH / 2}" y="66" text-anchor="middle" font-size="13" font-weight="400" fill="#6B7280">
    Tactile Kanban lifecycle, optimistic updates, concurrency race conditions &amp; verified fixes
  </text>

  <!-- Key in top-left -->
  <g transform="translate(60, 36)">
    <text x="0" y="22" font-size="13" font-weight="600" fill="#374151">Key</text>
    
    <!-- Works -->
    <rect x="40" y="5" width="80" height="28" rx="6" fill="#F3F4F6" stroke="#9CA3AF" stroke-width="1.2" />
    <text x="80" y="23" text-anchor="middle" font-size="12" font-weight="500" fill="#1F2937">Works</text>
    
    <!-- Bug -->
    <rect x="135" y="5" width="125" height="28" rx="6" fill="#FEF2F2" stroke="#EF4444" stroke-width="1.4" />
    <text x="197" y="23" text-anchor="middle" font-size="12" font-weight="600" fill="#B91C1C">Bug TLA+ found</text>
    
    <!-- Fixed -->
    <rect x="275" y="5" width="75" height="28" rx="6" fill="#ECFDF5" stroke="#10B981" stroke-width="1.4" />
    <text x="312" y="23" text-anchor="middle" font-size="12" font-weight="600" fill="#047857">Fixed</text>
  </g>

  <!-- Start Node (Solid Dot) -->
  <circle cx="${startDot.x}" cy="${startDot.y}" r="6" fill="#111827" />
`;

  // Draw Edges
  for (const edge of edges) {
    const firstPoint = edge.points[0];
    if (!firstPoint) continue;
    let d = `M ${firstPoint.x} ${firstPoint.y}`;
    for (let i = 1; i < edge.points.length; i++) {
      const pt = edge.points[i];
      if (pt) {
        d += ` L ${pt.x} ${pt.y}`;
      }
    }

    svg += `  <path d="${d}" fill="none" stroke="#4B5563" stroke-width="1.25" marker-end="url(#arrow)" />\n`;

    // Edge Label
    if (edge.label && edge.labelPos) {
      const lx = edge.labelPos.x;
      const ly = edge.labelPos.y;
      const labelText = escapeXml(edge.label);
      const textWidth = edge.label.length * 6.4;

      svg += `  <rect x="${lx - textWidth / 2 - 4}" y="${ly - 9}" width="${textWidth + 8}" height="15" fill="#ffffff" fill-opacity="0.95" rx="2" />\n`;
      svg += `  <text x="${lx}" y="${ly + 2}" text-anchor="middle" font-size="11" font-weight="400" fill="#4B5563">${labelText}</text>\n`;
    }
  }

  // Draw Diamonds
  for (const diamond of diamonds) {
    const s = diamond.size / 2;
    const pts = `${diamond.x},${diamond.y - s} ${diamond.x + s},${diamond.y} ${diamond.x},${diamond.y + s} ${diamond.x - s},${diamond.y}`;
    svg += `  <polygon points="${pts}" fill="#ffffff" stroke="#4B5563" stroke-width="1.4" filter="url(#shadow)" />\n`;

    if (diamond.question) {
      const qText = escapeXml(diamond.question);
      svg += `  <text x="${diamond.x}" y="${diamond.y + s + 13}" text-anchor="middle" font-size="11" font-style="italic" fill="#4B5563">${qText}</text>\n`;
    }
  }

  // Draw Nodes
  for (const node of nodes) {
    let fill = '#ffffff';
    let stroke = '#D1D5DB';
    let textFill = '#1F2937';
    let strokeWidth = '1.25';
    let fontWeight = '500';

    if (node.type === 'works') {
      fill = '#F3F4F6';
      stroke = '#9CA3AF';
      textFill = '#1F2937';
    } else if (node.type === 'bug') {
      fill = '#FEF2F2';
      stroke = '#EF4444';
      textFill = '#991B1B';
      strokeWidth = '1.4';
      fontWeight = '600';
    } else if (node.type === 'fixed') {
      fill = '#ECFDF5';
      stroke = '#10B981';
      textFill = '#065F46';
      strokeWidth = '1.4';
      fontWeight = '600';
    }

    svg += `  <!-- Node: ${node.id} -->
  <g id="${node.id}">
    <rect x="${node.x}" y="${node.y}" width="${node.w}" height="${node.h}" rx="6" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" filter="url(#shadow)" />\n`;

    const lineHeight = 14;
    const totalTextH = (node.text.length - 1) * lineHeight;
    const startY = node.y + node.h / 2 - totalTextH / 2 + 4;

    node.text.forEach((line, idx) => {
      svg += `    <text x="${node.cx}" y="${startY + idx * lineHeight}" text-anchor="middle" font-size="11" font-weight="${fontWeight}" fill="${textFill}">${escapeXml(line)}</text>\n`;
    });

    svg += '  </g>\n';
  }

  svg += '</svg>';
  return svg;
}

const svgContent = generateSvg();
writeFileSync('docs/assets/state-chart.svg', svgContent, 'utf-8');
console.log('Wrote docs/assets/state-chart.svg');

// Render PNG via chromium
try {
  execSync(
    `chromium --headless --disable-gpu --screenshot=docs/assets/state-chart.png --window-size=${WIDTH},${HEIGHT} docs/assets/state-chart.svg`,
  );
  console.log('Rendered docs/assets/state-chart.png');
} catch (err) {
  console.error('Failed to render PNG:', err);
}
