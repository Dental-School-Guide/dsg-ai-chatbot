import { createTool } from '@voltagent/core';
import { z } from 'zod';

/**
 * Google Sheets Tool for Voltagent
 * Fetches data from a public Google Sheet and searches for information
 */

const SHEET_ID = '1pV1nLP0o8rhLlCH0qoZWVq67cgqQORN2hpjKo2NftKM';
const SHEET_NAME = 'Import Range Master Stats'; // Change this if your sheet has a different name

interface SheetRow {
  [key: string]: string;
}

/**
 * Parse CSV line handling quoted fields with commas
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add last field
  result.push(current.trim());
  return result;
}

/**
 * Fetch data from Google Sheets using the public CSV export
 */
async function fetchSheetData(): Promise<SheetRow[]> {
  try {
    // Use Google Sheets CSV export URL for public sheets
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_NAME}`;
    
    console.log('[Google Sheets Tool] Fetching from:', csvUrl);
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch sheet: ${response.statusText}`);
    }

    const csvText = await response.text();
    console.log('[Google Sheets Tool] CSV length:', csvText.length);
    
    // Parse CSV
    const rows = csvText.split('\n').filter(row => row.trim());
    if (rows.length === 0) {
      console.log('[Google Sheets Tool] No rows found');
      return [];
    }

    // First row is headers
    const headers = parseCSVLine(rows[0]);
    console.log('[Google Sheets Tool] Headers:', headers);
    
    // Parse data rows
    const data: SheetRow[] = [];
    for (let i = 1; i < rows.length; i++) {
      const values = parseCSVLine(rows[i]);
      const row: SheetRow = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      data.push(row);
    }

    console.log('[Google Sheets Tool] Parsed rows:', data.length);
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

  // Search through all rows
  data.forEach((row, index) => {
    let matchScore = 0;
    const rowText = Object.values(row).join(' ').toLowerCase();
    
    // Check if any query words match
    queryWords.forEach(word => {
      if (rowText.includes(word)) {
        matchScore++;
      }
    });

    // If we have matches, include this row
    if (matchScore > 0) {
      // Format the row data
      const rowData = Object.entries(row)
        .filter(([key, value]) => value && value.trim() !== '') // Only non-empty values
        .map(([key, value]) => `**${key}**: ${value}`)
        .join('\n');
      
      results.push(`### ${row['School'] || `School ${index + 1}`}\n${rowData}`);
      console.log(`[Google Sheets Tool] Match found: ${row['School']} (score: ${matchScore})`);
    }
  });

  if (results.length === 0) {
    console.log('[Google Sheets Tool] No matches found');
    // Return sample of available schools to help user
    const schoolNames = data.slice(0, 5).map(r => r['School']).filter(Boolean);
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
