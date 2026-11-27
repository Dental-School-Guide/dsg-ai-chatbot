import { createTool } from '@voltagent/core';
import { z } from 'zod';

/**
 * Google Sheets Tool for Voltagent
 * Fetches data from a public Google Sheet and searches for information
 */

// Which spreadsheet holds the school stats. Change these in Vercel
// (Settings → Environment Variables) and redeploy; no code change needed.
// The sheet must be shared as "Anyone with the link: Viewer".
//
// SCHOOL_STATS_SHEET_ID      the long ID in the sheet's URL
// SCHOOL_STATS_SHEET_GID     the tab's gid (the number after "gid=" in the URL)
// SCHOOL_STATS_SHEET_TAB     tab name; only used if no gid is set
// SCHOOL_STATS_HEADER_ROWS   how many header rows sit above the data (default 1).
//                            With more than one, labels are combined top-down,
//                            e.g. "DAT – AA – Mean", so repeated column names
//                            ("Total Acceptance Rate" per race group) stay distinct.
// The first column must hold the school name.
const SHEET_ID =
  process.env.SCHOOL_STATS_SHEET_ID || '1pV1nLP0o8rhLlCH0qoZWVq67cgqQORN2hpjKo2NftKM';
const SHEET_GID = process.env.SCHOOL_STATS_SHEET_GID || '';
const SHEET_NAME = process.env.SCHOOL_STATS_SHEET_TAB || 'Import Range Master Stats';
const HEADER_ROWS = Math.max(1, parseInt(process.env.SCHOOL_STATS_HEADER_ROWS || '1', 10) || 1);

// Most schools returned for one search, so a broad query ("GPA") can't flood the answer
const MAX_MATCHES = 5;

/** Name of the field holding each row's school name (always the first column). */
const NAME_FIELD = '__school';

interface SheetRow {
  [key: string]: string;
}

/**
 * Parse a whole CSV document. Handles quoted fields containing commas,
 * escaped quotes and line breaks (some notes cells span several lines).
 */
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field.trim());
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(field.trim());
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field.trim());
    rows.push(row);
  }
  return rows;
}

/**
 * Build one label per column from the header rows. Upper rows are section
 * and group labels that span several columns, so they carry forward until the
 * next label; a new label in a higher row resets the rows below it.
 */
export function buildColumnLabels(headerRows: string[][]): string[] {
  const width = Math.max(...headerRows.map((r) => r.length));
  const carried: string[] = headerRows.map(() => '');
  const labels: string[] = [];

  for (let col = 0; col < width; col++) {
    for (let level = 0; level < headerRows.length; level++) {
      const value = (headerRows[level][col] || '').trim();
      const isLast = level === headerRows.length - 1;
      if (value) {
        carried[level] = value;
        for (let lower = level + 1; lower < headerRows.length; lower++) carried[lower] = '';
      } else if (isLast) {
        carried[level] = '';
      }
    }
    labels.push(carried.filter(Boolean).join(' – '));
  }

  // Any label still repeated gets a counter so no value overwrites another
  const seen = new Map<string, number>();
  return labels.map((label) => {
    if (!label) return '';
    const n = (seen.get(label) || 0) + 1;
    seen.set(label, n);
    return n === 1 ? label : `${label} (${n})`;
  });
}

/** Turn parsed CSV rows into one object per school. */
export function rowsToSchools(rows: string[][], headerRows: number): SheetRow[] {
  if (rows.length <= headerRows) return [];
  const labels = buildColumnLabels(rows.slice(0, headerRows));
  const data: SheetRow[] = [];

  for (const values of rows.slice(headerRows)) {
    const name = (values[0] || '').trim();
    if (!name) continue; // skip blank rows
    const row: SheetRow = { [NAME_FIELD]: name };
    labels.forEach((label, index) => {
      if (index === 0 || !label) return;
      const value = values[index] || '';
      if (value) row[label] = value;
    });
    data.push(row);
  }
  return data;
}

/**
 * Fetch the school stats sheet as CSV. With a gid this uses the plain export,
 * which returns cell values exactly as shown; otherwise the tab-name query.
 */
async function fetchSheetData(): Promise<SheetRow[]> {
  try {
    const csvUrl = SHEET_GID
      ? `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${encodeURIComponent(SHEET_GID)}`
      : `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;

    console.log('[Google Sheets Tool] Fetching from:', csvUrl);
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch sheet: ${response.statusText}. Is it shared as "Anyone with the link"?`);
    }

    const csvText = await response.text();
    console.log('[Google Sheets Tool] CSV length:', csvText.length);

    const data = rowsToSchools(parseCSV(csvText), HEADER_ROWS);
    console.log('[Google Sheets Tool] Parsed schools:', data.length);
    return data;
  } catch (error) {
    console.error('[Google Sheets Tool] Error fetching sheet:', error);
    throw error;
  }
}

/**
 * Search through sheet data for relevant information
 */
function searchSheetData(data: SheetRow[], query: string): string {
  const lowerQuery = query.toLowerCase();
  const queryWords = lowerQuery.split(/\s+/).filter(w => w.length > 2); // Split into words, ignore short words
  const results: string[] = [];

  console.log('[Google Sheets Tool] Query words:', queryWords);

  // Score every row; a hit in the school name counts extra
  const scored: { row: SheetRow; score: number }[] = [];
  data.forEach((row) => {
    const name = (row[NAME_FIELD] || '').toLowerCase();
    const rowText = Object.values(row).join(' ').toLowerCase();
    let matchScore = 0;
    queryWords.forEach((word) => {
      if (name.includes(word)) matchScore += 3;
      else if (rowText.includes(word)) matchScore += 1;
    });
    if (matchScore > 0) scored.push({ row, score: matchScore });
  });

  scored
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_MATCHES)
    .forEach(({ row, score }) => {
      const rowData = Object.entries(row)
        .filter(([key, value]) => key !== NAME_FIELD && value && value.trim() !== '')
        .map(([key, value]) => `**${key}**: ${value}`)
        .join('\n');
      results.push(`### ${row[NAME_FIELD]}\n${rowData}`);
      console.log(`[Google Sheets Tool] Match found: ${row[NAME_FIELD]} (score: ${score})`);
    });

  if (results.length === 0) {
    console.log('[Google Sheets Tool] No matches found');
    // Return sample of available schools to help user
    const schoolNames = data.slice(0, 5).map(r => r[NAME_FIELD]).filter(Boolean);
    return `No matching information found for "${query}".\n\nAvailable schools in database include:\n${schoolNames.map(s => `- ${s}`).join('\n')}\n\nPlease try searching by school name.`;
  }

  console.log(`[Google Sheets Tool] Returning ${results.length} matches`);
  return `Found ${results.length} matching school(s):\n\n${results.join('\n\n---\n\n')}`;
}

/**
 * Create the Google Sheets tool for the agent
 */
export const googleSheetsTool = createTool({
  name: 'search_dental_schools',
  description: `Search through the dental school information database (Google Sheet). 
  Use this tool to find information about specific dental schools, their requirements, 
  statistics, application details, or any other school-related data. 
  
  The tool searches through ALL columns and rows, matching any part of the text.
  
  SEARCH TIPS:
  - For abbreviations like "UCLA", search with just "UCLA" - it will find matches
  - For full names, use the university name (e.g., "University of California")
  - For location-based searches, use city or state names (e.g., "California", "Los Angeles")
  - The search is flexible and will find partial matches
  - You can search for specific data points like "GPA", "acceptance rate", etc.
  
  The tool returns complete school profiles with all available data.`,
  parameters: z.object({
    query: z.string().describe('The search query - school name (full or abbreviation), location, or specific data field. Examples: "UCLA", "University of California Los Angeles", "California schools", "mean GPA"'),
  }),
  execute: async ({ query }) => {
    console.log('[Google Sheets Tool] Searching for:', query);
    
    try {
      // Fetch the latest data from the sheet
      const data = await fetchSheetData();
      console.log(`[Google Sheets Tool] Loaded ${data.length} rows from sheet`);

      // Search through the data
      const results = searchSheetData(data, query);
      console.log('[Google Sheets Tool] Search completed');

      return {
        query,
        results,
        rowCount: data.length,
      };
    } catch (error) {
      console.error('[Google Sheets Tool] Error:', error);
      return {
        query,
        results: 'Error accessing the dental school database. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});
