import { createTool } from '@voltagent/core';
import { z } from 'zod';

/**
 * Google Docs Volunteer Opportunities Tool
 * Fetches volunteer opportunity ideas from a public Google Doc
 */

// The public Google Doc ID for volunteer opportunities
const VOLUNTEER_DOC_ID = '1jgqy6PBaIS9vuBK0FHTGPcg_Azng3TKqif5G4DCVzYI';

// Export as plain text using Google Docs export API
const VOLUNTEER_DOC_EXPORT_URL = `https://docs.google.com/document/d/${VOLUNTEER_DOC_ID}/export?format=txt`;

// Cache for the document content
let cachedDocContent: string | null = null;
let cachedParsedOpportunities: VolunteerOpportunity[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface VolunteerOpportunity {
  name: string;
  description: string;
  websiteLink?: string;
  type: 'remote' | 'in-person' | 'both';
}

/**
 * Fetch the Google Doc content
 */
async function fetchVolunteerDoc(): Promise<string> {
  // Check cache first
  if (cachedDocContent && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
    console.log('[Volunteer Tool] Using cached document');
    return cachedDocContent;
  }

  try {
    console.log('[Volunteer Tool] Fetching document from Google Docs');
    const response = await fetch(VOLUNTEER_DOC_EXPORT_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Google Doc: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    
    // Cache the content
    cachedDocContent = text;
    cacheTimestamp = Date.now();
    
    console.log('[Volunteer Tool] Document fetched successfully, length:', text.length);
    return text;
  } catch (error) {
    console.error('[Volunteer Tool] Error fetching document:', error);
    throw error;
  }
}

/**
 * Parse document into structured volunteer opportunities
 */
function parseVolunteerOpportunities(docContent: string): VolunteerOpportunity[] {
  console.log('[Volunteer Tool] Parsing volunteer opportunities');
  
  const lines = docContent.split('\n');
  const opportunities: VolunteerOpportunity[] = [];
  
  let currentOpportunity: Partial<VolunteerOpportunity> | null = null;
  let collectingDescription = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) {
      if (collectingDescription && currentOpportunity) {
        collectingDescription = false;
      }
      continue;
    }
    
    // Check if line contains "Website Link" or if it's a URL
    if (line.toLowerCase().includes('website link')) {
      if (currentOpportunity) {
        // Check if URL is on the same line after "Website Link"
        const urlOnSameLine = line.match(/website link[:\s]*(https?:\/\/[^\s]+|www\.[^\s]+)/i);
        if (urlOnSameLine) {
          const url = urlOnSameLine[1];
          currentOpportunity.websiteLink = url.startsWith('http') ? url : `https://${url}`;
        } else {
          // URL should be on the next line
          const nextLine = lines[i + 1]?.trim();
          if (nextLine && (nextLine.startsWith('http') || nextLine.startsWith('www'))) {
            currentOpportunity.websiteLink = nextLine.startsWith('http') ? nextLine : `https://${nextLine}`;
            i++; // Skip the URL line
          }
        }
      }
      collectingDescription = false; // Stop collecting description after website link
      continue;
    }
    
    // Check if line is a standalone URL (in case "Website Link" text is missing)
    if (currentOpportunity && (line.startsWith('http://') || line.startsWith('https://') || line.startsWith('www.'))) {
      currentOpportunity.websiteLink = line.startsWith('http') ? line : `https://${line}`;
      collectingDescription = false;
      continue;
    }
    
    // Check if this is a new opportunity header (contains colon and type indicator)
    const headerMatch = line.match(/^(.+?):\s*\((remote|in-person|both)\)\s*[-–]?\s*(.*)$/i);
    
    if (headerMatch) {
      // Save previous opportunity if exists
      if (currentOpportunity && currentOpportunity.name) {
        opportunities.push(currentOpportunity as VolunteerOpportunity);
      }
      
      const [, name, type, description] = headerMatch;
      
      currentOpportunity = {
        name: name.trim(),
        type: type.toLowerCase() as 'remote' | 'in-person' | 'both',
        description: description.trim(),
      };
      
      collectingDescription = true;
      console.log('[Volunteer Tool] Found opportunity:', name, `(${type})`);
    } else if (collectingDescription && currentOpportunity && !line.toLowerCase().includes('website link')) {
      // Continue collecting description
      if (currentOpportunity.description) {
        currentOpportunity.description += ' ' + line;
      } else {
        currentOpportunity.description = line;
      }
    }
  }
  
  // Don't forget the last opportunity
  if (currentOpportunity && currentOpportunity.name) {
    opportunities.push(currentOpportunity as VolunteerOpportunity);
  }
  
  console.log('[Volunteer Tool] Parsed', opportunities.length, 'opportunities');
  return opportunities;
}

/**
 * Filter opportunities by type
 */
function filterOpportunitiesByType(
  opportunities: VolunteerOpportunity[],
  type: 'remote' | 'in-person' | 'all'
): VolunteerOpportunity[] {
  if (type === 'all') {
    return opportunities;
  }
  
  return opportunities.filter(opp => 
    opp.type === type || opp.type === 'both'
  );
}

/**
 * Volunteer Opportunities Tool
 */
export const volunteerOpportunitiesTool = createTool({
  name: 'get_volunteer_opportunities',
  description: `Get volunteer opportunity ideas for dental school applicants.
  
  This tool searches a curated database of volunteer opportunities that are valuable for dental school applications.
  Each opportunity includes:
  - Name and description
  - Type (remote, in-person, or both)
  - Website link (when available)
  
  Use this tool to find specific volunteer opportunities based on the user's preference for remote or in-person work.`,
  
  parameters: z.object({
    type: z.enum(['remote', 'in-person', 'all']).describe('Filter opportunities by type: "remote", "in-person", or "all"'),
    limit: z.number().optional().describe('Maximum number of opportunities to return (default: 5)'),
  }),
  
  execute: async ({ type, limit = 5 }) => {
    try {
      console.log('[Volunteer Tool] Searching for opportunities, type:', type);
      
      // Fetch and parse the document
      const docContent = await fetchVolunteerDoc();
      
      // Parse document if not cached
      if (!cachedParsedOpportunities || !cacheTimestamp || (Date.now() - cacheTimestamp >= CACHE_DURATION)) {
        cachedParsedOpportunities = parseVolunteerOpportunities(docContent);
      }
      
      // Filter by type
      const filteredOpportunities = filterOpportunitiesByType(cachedParsedOpportunities, type);
      
      if (filteredOpportunities.length === 0) {
        return {
          success: false,
          message: `No ${type === 'all' ? '' : type} volunteer opportunities found in the database.`,
          opportunities: [],
        };
      }
      
      // Limit results
      const limitedOpportunities = filteredOpportunities.slice(0, limit);
      
      return {
        success: true,
        message: `Found ${filteredOpportunities.length} ${type === 'all' ? '' : type} volunteer opportunities`,
        opportunities: limitedOpportunities.map(opp => ({
          name: opp.name,
          description: opp.description,
          type: opp.type,
          websiteLink: opp.websiteLink,
        })),
        totalCount: filteredOpportunities.length,
        returnedCount: limitedOpportunities.length,
      };
      
    } catch (error) {
      console.error('[Volunteer Tool] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to fetch volunteer opportunities. Please try again.',
        opportunities: [],
      };
    }
  },
});
