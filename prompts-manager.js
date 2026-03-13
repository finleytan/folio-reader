#!/usr/bin/env node
/**
 * prompts-manager.js — CLI tool for managing folio-prompts.html
 *
 * Usage:
 *   node prompts-manager.js list [--status active|backlog|done|deferred]
 *   node prompts-manager.js add --title "..." --desc "..." [--status active] [--type fix|feat|perf] [--effort low|med|high] [--prompt "..."]
 *   node prompts-manager.js done <num>
 *   node prompts-manager.js status <num> <active|backlog|deferred>
 *   node prompts-manager.js renumber          (re-sequences all numeric active+backlog nums in order)
 *   node prompts-manager.js move <num> <position>  (move card to new position within its section, 1-based)
 *   node prompts-manager.js show <num>         (print full prompt text for a card)
 *   node prompts-manager.js edit <num> --title "..." --desc "..." --prompt "..."  (update fields)
 *
 * All operations edit folio-prompts.html in place.
 * Run from the project root: node prompts-manager.js <command>
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const FILE = path.resolve(__dirname, 'folio-prompts.html');

// ── Argument parsing ──────────────────────────────────────────────────────────

const [,, cmd, ...rawArgs] = process.argv;

function parseArgs(args) {
  const flags = {};
  const pos   = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true;
      flags[key] = val;
    } else {
      pos.push(args[i]);
    }
  }
  return { flags, pos };
}

const { flags, pos } = parseArgs(rawArgs);

// ── HTML parsing helpers ──────────────────────────────────────────────────────

function readHtml() {
  if (!fs.existsSync(FILE)) {
    die(`Cannot find ${FILE}\nRun from the project directory or set FILE path in the script.`);
  }
  return fs.readFileSync(FILE, 'utf8');
}

function writeHtml(html) {
  fs.writeFileSync(FILE, html, 'utf8');
}

/**
 * Extract the PROMPTS array source text from the HTML.
 * Returns { before, arraySource, after } where
 *   before + arraySource + after === full html
 */
function splitHtml(html) {
  // Match: const PROMPTS = [ ... ];   (the closing ]; is on its own line)
  const startMarker = 'const PROMPTS = [';
  const si = html.indexOf(startMarker);
  if (si === -1) die('Could not locate `const PROMPTS = [` in the file.');

  // Find the matching closing ];
  // We walk character by character counting bracket depth
  let depth = 0;
  let ei    = -1;
  for (let i = si + startMarker.length - 1; i < html.length; i++) {
    if (html[i] === '[') depth++;
    else if (html[i] === ']') {
      depth--;
      if (depth === 0) {
        // consume optional ; and newline
        ei = i;
        if (html[ei + 1] === ';') ei++;
        break;
      }
    }
  }
  if (ei === -1) die('Could not find end of PROMPTS array.');

  return {
    before:      html.slice(0, si),
    arraySource: html.slice(si, ei + 1),
    after:       html.slice(ei + 1),
  };
}

/**
 * Parse the PROMPTS array source into an array of card objects.
 * Each card is { _raw: string (original source text), ...fields }
 * We do a best-effort parse of each { ... } block.
 */
function parseCards(arraySource) {
  // Strip `const PROMPTS = [` header and trailing `]` or `];`
  let inner = arraySource
    .replace(/^const PROMPTS\s*=\s*\[/, '')
    .replace(/\];\s*$/, '')
    .replace(/\]\s*$/, '');

  // Split into individual card source blocks by finding top-level { }
  const cards = [];
  let depth = 0, start = -1;
  for (let i = 0; i < inner.length; i++) {
    if (inner[i] === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (inner[i] === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        const raw = inner.slice(start, i + 1);
        const card = parseCardObject(raw);
        if (card) cards.push({ ...card, _raw: raw });
        start = -1;
      }
    }
  }
  return cards;
}

/**
 * Extract field values from a card object literal source string.
 * Returns a plain object with string/number values.
 */
function parseCardObject(src) {
  const obj = {};

  // Extract simple string fields: key:"value" or key:'value'
  const simpleFields = ['num', 'status', 'type', 'model', 'effort', 'title'];
  for (const f of simpleFields) {
    // Match key:"..." allowing escaped quotes inside
    const m = src.match(new RegExp(`${f}\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`) )
           || src.match(new RegExp(`${f}\\s*:\\s*'((?:[^'\\\\]|\\\\.)*)'`));
    if (m) obj[f] = m[1].replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\\\/g, '\\');
  }

  // Extract multi-line prompt field (can be very long, may contain any chars)
  const promptMatch = src.match(/prompt\s*:\s*"([\s\S]*?)"\s*(?:\n\s*\}|\})/);
  if (promptMatch) {
    obj.prompt = promptMatch[1]
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  } else {
    // Try with single quotes or empty string
    const promptEmpty = src.match(/prompt\s*:\s*""/);
    obj.prompt = promptEmpty ? '' : '';
  }

  // desc field — same treatment
  const descMatch = src.match(/desc\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (descMatch) {
    obj.desc = descMatch[1]
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  } else {
    obj.desc = '';
  }

  return Object.keys(obj).length ? obj : null;
}

/**
 * Serialise an array of card objects back to the PROMPTS array source text.
 * Preserves original _raw source for cards we haven't changed.
 * For changed cards, re-serialises from fields.
 */
function serialiseCards(cards) {
  // Group for comment headers
  const active   = cards.filter(c => c.status === 'active');
  const backlog  = cards.filter(c => c.status === 'backlog');
  const deferred = cards.filter(c => c.status === 'deferred');
  const done     = cards.filter(c => c.status === 'done');

  let out = 'const PROMPTS = [\n';

  function writeSection(label, items) {
    if (!items.length) return;
    out += `\n  // ── ${label} ${'─'.repeat(Math.max(0, 45 - label.length))}\n`;
    for (const c of items) {
      out += '  ' + (c._dirty ? serialiseCard(c) : c._raw) + ',\n\n';
    }
  }

  writeSection('Active', active);
  writeSection('Backlog', backlog);
  writeSection('Deferred', deferred);
  writeSection('Completed', done);

  // Remove trailing comma+newline before closing bracket
  out = out.trimEnd().replace(/,\s*$/, '\n');
  out += '\n];\n';
  return out;
}

function escField(s) {
  return String(s ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n');
}

function serialiseCard(c) {
  const parts = [
    `num:"${escField(c.num)}"`,
    `status:"${escField(c.status)}"`,
    `type:"${escField(c.type || 'feat')}"`,
    `model:"${escField(c.model || 'sonnet')}"`,
  ];
  if (c.effort) parts.push(`effort:"${escField(c.effort)}"`);
  parts.push(`title:"${escField(c.title)}"`);
  parts.push(`desc:"${escField(c.desc || '')}"`);
  parts.push(`prompt:"${escField(c.prompt || '')}"`);
  return `{\n  ${parts.join(', ')}\n  }`;
}

// ── Utility ───────────────────────────────────────────────────────────────────

function die(msg) {
  console.error('\x1b[31mError:\x1b[0m ' + msg);
  process.exit(1);
}

function ok(msg) {
  console.log('\x1b[32m✓\x1b[0m ' + msg);
}

function findCard(cards, num) {
  const c = cards.find(c => c.num === String(num));
  if (!c) die(`Card #${num} not found. Use \`list\` to see available cards.`);
  return c;
}

function nextNum(cards) {
  const max = cards.reduce((m, c) => {
    const n = parseInt(c.num);
    return isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return String(max + 1);
}

function applyChanges(cards, arraySource, before, after) {
  const newArray = serialiseCards(cards);
  writeHtml(before + newArray + after);
}

// ── Commands ──────────────────────────────────────────────────────────────────

function cmdList() {
  const html  = readHtml();
  const { arraySource } = splitHtml(html);
  const cards = parseCards(arraySource);

  const filterStatus = flags.status || null;
  const shown = filterStatus ? cards.filter(c => c.status === filterStatus) : cards;

  // Group and display
  const groups = { active: [], backlog: [], deferred: [], done: [] };
  for (const c of shown) {
    if (groups[c.status]) groups[c.status].push(c);
  }

  const statusColors = {
    active:   '\x1b[34m',
    backlog:  '\x1b[33m',
    done:     '\x1b[32m',
    deferred: '\x1b[90m',
  };

  let total = 0;
  for (const [s, group] of Object.entries(groups)) {
    if (!group.length) continue;
    console.log(`\n${statusColors[s]}\x1b[1m${s.toUpperCase()} (${group.length})\x1b[0m`);
    for (const c of group) {
      const effort = c.effort ? ` [${c.effort}]` : '';
      const type   = c.type   ? ` (${c.type})`   : '';
      console.log(`  #${c.num.padEnd(4)} ${c.title}${type}${effort}`);
    }
    total += group.length;
  }
  console.log(`\n  ${total} card(s) total\n`);
}

function cmdAdd() {
  const title = flags.title;
  if (!title) die('--title is required');

  const html  = readHtml();
  const { before, arraySource, after } = splitHtml(html);
  const cards = parseCards(arraySource);

  const newCard = {
    num:    nextNum(cards),
    status: flags.status  || 'active',
    type:   flags.type    || 'feat',
    model:  'sonnet',
    effort: flags.effort  || 'med',
    title,
    desc:   flags.desc    || '',
    prompt: flags.prompt  || '',
    _dirty: true,
  };
  newCard._raw = serialiseCard(newCard);

  cards.push(newCard);
  applyChanges(cards, arraySource, before, after);
  ok(`Added card #${newCard.num}: "${title}" (${newCard.status})`);
}

function cmdDone() {
  const num = pos[0];
  if (!num) die('Provide a card number, e.g.: node prompts-manager.js done 7');

  const html  = readHtml();
  const { before, arraySource, after } = splitHtml(html);
  const cards = parseCards(arraySource);
  const card  = findCard(cards, num);

  if (card.status === 'done') {
    console.log(`Card #${num} is already marked done.`);
    return;
  }

  card.status = 'done';
  card.num    = '✓';
  card._dirty = true;
  applyChanges(cards, arraySource, before, after);
  ok(`Card #${num} marked done: "${card.title}"`);
}

function cmdStatus() {
  const num       = pos[0];
  const newStatus = pos[1];
  const valid = ['active', 'backlog', 'deferred', 'done'];

  if (!num || !newStatus) die('Usage: status <num> <active|backlog|deferred|done>');
  if (!valid.includes(newStatus)) die(`Status must be one of: ${valid.join(', ')}`);

  const html  = readHtml();
  const { before, arraySource, after } = splitHtml(html);
  const cards = parseCards(arraySource);
  const card  = findCard(cards, num);

  card.status = newStatus;
  if (newStatus === 'done') card.num = '✓';
  card._dirty = true;
  applyChanges(cards, arraySource, before, after);
  ok(`Card #${num} status → ${newStatus}`);
}

function cmdRenumber() {
  const html  = readHtml();
  const { before, arraySource, after } = splitHtml(html);
  const cards = parseCards(arraySource);

  // Only renumber active + backlog cards that have numeric nums
  const toNumber = cards.filter(c =>
    (c.status === 'active' || c.status === 'backlog') && !isNaN(parseInt(c.num))
  );

  // Sort by current numeric value to preserve relative order
  toNumber.sort((a, b) => parseInt(a.num) - parseInt(b.num));

  let counter = 1;
  for (const c of toNumber) {
    c.num    = String(counter++);
    c._dirty = true;
  }

  applyChanges(cards, arraySource, before, after);
  ok(`Renumbered ${toNumber.length} active/backlog cards (1–${counter - 1})`);
}

function cmdMove() {
  const num      = pos[0];
  const position = parseInt(pos[1]);
  if (!num || isNaN(position) || position < 1) {
    die('Usage: move <num> <position>  (1-based position within the card\'s section)');
  }

  const html  = readHtml();
  const { before, arraySource, after } = splitHtml(html);
  const cards = parseCards(arraySource);
  const card  = findCard(cards, num);

  const sectionCards = cards.filter(c => c.status === card.status);
  const globalIdx    = cards.indexOf(card);

  // Remove from current position
  cards.splice(globalIdx, 1);

  // Find where this section starts in the full array after removal
  const sectionStart = cards.findIndex(c => c.status === card.status);
  const sectionLen   = cards.filter(c => c.status === card.status).length;

  const clampedPos = Math.min(Math.max(1, position), sectionLen + 1);
  const insertAt   = sectionStart === -1
    ? cards.length
    : sectionStart + clampedPos - 1;

  cards.splice(insertAt, 0, card);
  applyChanges(cards, arraySource, before, after);
  ok(`Moved card #${num} to position ${clampedPos} in "${card.status}" section`);
}

function cmdShow() {
  const num = pos[0];
  if (!num) die('Provide a card number, e.g.: node prompts-manager.js show 5');

  const html  = readHtml();
  const { arraySource } = splitHtml(html);
  const cards = parseCards(arraySource);
  const card  = findCard(cards, num);

  console.log(`\n\x1b[1m#${card.num} — ${card.title}\x1b[0m`);
  console.log(`Status: ${card.status}  Type: ${card.type}  Effort: ${card.effort || '—'}\n`);
  if (card.desc)   console.log(`\x1b[2mDescription:\x1b[0m\n${card.desc}\n`);
  if (card.prompt) console.log(`\x1b[2mPrompt:\x1b[0m\n${card.prompt}\n`);
  else             console.log('\x1b[2m(no prompt yet)\x1b[0m\n');
}

function cmdEdit() {
  const num = pos[0];
  if (!num) die('Provide a card number, e.g.: node prompts-manager.js edit 5 --title "New title"');

  const html  = readHtml();
  const { before, arraySource, after } = splitHtml(html);
  const cards = parseCards(arraySource);
  const card  = findCard(cards, num);

  let changed = false;
  if (flags.title)  { card.title  = flags.title;  changed = true; }
  if (flags.desc)   { card.desc   = flags.desc;   changed = true; }
  if (flags.prompt) { card.prompt = flags.prompt; changed = true; }
  if (flags.status) { card.status = flags.status; changed = true; }
  if (flags.type)   { card.type   = flags.type;   changed = true; }
  if (flags.effort) { card.effort = flags.effort; changed = true; }

  if (!changed) {
    console.log('Nothing to change — pass --title, --desc, --prompt, --status, --type, or --effort');
    return;
  }

  card._dirty = true;
  applyChanges(cards, arraySource, before, after);
  ok(`Updated card #${num}: "${card.title}"`);
}

// ── Help ──────────────────────────────────────────────────────────────────────

function showHelp() {
  console.log(`
\x1b[1mfolio-prompts manager\x1b[0m  —  edit folio-prompts.html from the command line

\x1b[1mUsage:\x1b[0m
  node prompts-manager.js <command> [options]

\x1b[1mCommands:\x1b[0m
  list              List all cards (grouped by status)
    --status        Filter: active | backlog | done | deferred

  add               Add a new card to the PROMPTS array
    --title "..."   Card title (required)
    --desc  "..."   Short description
    --prompt "..."  Full prompt text
    --status        active | backlog (default: active)
    --type          fix | feat | perf (default: feat)
    --effort        low | med | high (default: med)

  done <num>        Mark a card as completed (status→done, num→✓)

  status <num> <s>  Set status: active | backlog | deferred | done

  edit <num>        Update one or more fields on an existing card
    --title / --desc / --prompt / --status / --type / --effort

  show <num>        Print full prompt text for a card

  move <num> <pos>  Move card to position (1-based) within its section

  renumber          Re-sequence all active+backlog card numbers 1, 2, 3…

\x1b[1mExamples:\x1b[0m
  node prompts-manager.js list --status active
  node prompts-manager.js add --title "Fix seek bar" --type fix --effort low
  node prompts-manager.js done 6
  node prompts-manager.js status 12 backlog
  node prompts-manager.js move 3 1
  node prompts-manager.js edit 8 --desc "Clearer description"
  node prompts-manager.js renumber
`);
}

// ── Dispatch ──────────────────────────────────────────────────────────────────

switch (cmd) {
  case 'list':      cmdList();      break;
  case 'add':       cmdAdd();       break;
  case 'done':      cmdDone();      break;
  case 'status':    cmdStatus();    break;
  case 'renumber':  cmdRenumber();  break;
  case 'move':      cmdMove();      break;
  case 'show':      cmdShow();      break;
  case 'edit':      cmdEdit();      break;
  case 'help':
  case '--help':
  case '-h':
  case undefined:   showHelp();     break;
  default:
    console.error(`Unknown command: ${cmd}`);
    showHelp();
    process.exit(1);
}
