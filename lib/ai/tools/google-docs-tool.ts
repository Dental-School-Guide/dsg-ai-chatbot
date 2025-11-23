import { createTool } from '@voltagent/core';
import { z } from 'zod';

/**
 * Google Docs Interview Questions Tool
 * Fetches dental school interview questions from a public Google Doc
 */

// The public Google Doc ID
const GOOGLE_DOC_ID = '1VFXY90zNK92PWDFbHZtzmpK37punGFTMQb5LIfCOdV0';

// Export as plain text using Google Docs export API
const GOOGLE_DOC_EXPORT_URL = `https://docs.google.com/document/d/${GOOGLE_DOC_ID}/export?format=txt`;

// Cache for the document content
let cachedDocContent: string | null = null;
let cachedParsedSchools: SchoolInterviewData[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface SchoolInterviewData {
  fullName: string;
  abbreviation?: string;
  questions: string[];
}

/**
 * Fetch the Google Doc content
 */
async function fetchGoogleDoc(): Promise<string> {
  // Check cache first
  if (cachedDocContent && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
    console.log('[Google Docs Tool] Using cached document');
    return cachedDocContent;
  }

  try {
    console.log('[Google Docs Tool] Fetching document from Google Docs');
    const response = await fetch(GOOGLE_DOC_EXPORT_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Google Doc: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    
    // Cache the content
    cachedDocContent = text;
    cacheTimestamp = Date.now();
    
    console.log('[Google Docs Tool] Document fetched successfully, length:', text.length);
    return text;
  } catch (error) {
    console.error('[Google Docs Tool] Error fetching document:', error);
    throw error;
  }
}

/**
 * Parse entire document into structured JSON format
 */
function parseDocumentToJSON(docContent: string): SchoolInterviewData[] {
  console.log('[Google Docs Tool] Parsing entire document to JSON');
  
  const lines = docContent.split('\n');
  const schools: SchoolInterviewData[] = [];
  let currentSchool: SchoolInterviewData | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Check if this line is a school header
    const looksLikeSchoolName = 
      line.includes('University') || 
      line.includes('College') || 
      line.includes('School of Dentistry') ||
      line.includes('Dental') ||
      (line.match(/^[A-Z]/) && line.includes('–')) ||
      (line.match(/^[A-Z]/) && line.includes('(') && line.includes(')'));
    
    if (looksLikeSchoolName) {
      // Save previous school if exists
      if (currentSchool && currentSchool.questions.length > 0) {
        schools.push(currentSchool);
      }
      
      // Extract school name and abbreviation
      let fullName = line;
      let abbreviation: string | undefined;
      
      // Extract abbreviation from parentheses
      const abbrMatch = line.match(/\(([^)]+)\)/);
      if (abbrMatch) {
        abbreviation = abbrMatch[1];
        // Clean full name (remove abbreviation part for cleaner matching)
        fullName = line.replace(/\s*\([^)]+\)\s*$/, '').trim();
      }
      
      // Start new school
      currentSchool = {
        fullName,
        abbreviation,
        questions: []
      };
      
      console.log('[Google Docs Tool] Found school:', fullName, abbreviation ? `(${abbreviation})` : '');
    } else if (currentSchool) {
      // This is a question line
      currentSchool.questions.push(line);
    }
  }
  
  // Don't forget the last school
  if (currentSchool && currentSchool.questions.length > 0) {
    schools.push(currentSchool);
  }
  
  console.log('[Google Docs Tool] Parsed', schools.length, 'schools from document');
  return schools;
}

/**
 * Search for a school in the parsed data
 */
function findSchoolInData(schools: SchoolInterviewData[], searchTerm: string): SchoolInterviewData | null {
  const normalized = searchTerm.toLowerCase().trim();
  
  // Try exact matches first
  for (const school of schools) {
    // Match full name
    if (school.fullName.toLowerCase().includes(normalized)) {
      return school;
    }
    
    // Match abbreviation
    if (school.abbreviation && school.abbreviation.toLowerCase() === normalized) {
      return school;
    }
    
    // Match if search term is in full name
    if (normalized.includes(school.fullName.toLowerCase())) {
      return school;
    }
  }
  
  // Try partial word matches
  const searchWords = normalized.split(/\s+/).filter(w => w.length > 3);
  for (const school of schools) {
    const schoolWords = school.fullName.toLowerCase().split(/\s+/);
    const matchCount = searchWords.filter(sw => 
      schoolWords.some(scw => scw.includes(sw) || sw.includes(scw))
    ).length;
    
    // If most words match, consider it a match
    if (matchCount >= Math.min(2, searchWords.length)) {
      return school;
    }
  }
  
  return null;
}

/**
 * Parse the document to extract school-specific interview questions
 * @deprecated Use parseDocumentToJSON and findSchoolInData instead
 */
function parseInterviewQuestions(docContent: string, schoolName: string): string {
  console.log('[Google Docs Tool] Parsing questions for school:', schoolName);
  
  // Normalize school name for matching (remove special chars, lowercase)
  const normalizedSchool = schoolName.toLowerCase().trim();
  
  // Split document into lines
  const lines = docContent.split('\n');
  
  let questions: string[] = [];
  let isInSchoolSection = false;
  let foundSchoolName = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines when not in a section
    if (!line && !isInSchoolSection) {
      continue;
    }
    
    const lineNormalized = line.toLowerCase();
    
    // Check if this line contains a school name
    // School names typically contain: University, College, School, or are proper names
    const looksLikeSchoolName = 
      line.includes('University') || 
      line.includes('College') || 
      line.includes('School of Dentistry') ||
      line.includes('Dental') ||
      (line.match(/^[A-Z]/) && line.includes('–')) || // Format: "Name – School"
      (line.match(/^[A-Z]/) && line.includes('(') && line.includes(')')); // Format: "Name (ABBR)"
    
    // If we're already in a section and hit a new school name, stop
    if (isInSchoolSection && looksLikeSchoolName) {
      console.log('[Google Docs Tool] Found next school, stopping:', line);
      break;
    }
    
    // Check if this line matches our target school
    if (!isInSchoolSection && looksLikeSchoolName) {
      // Try multiple matching strategies
      const matches = 
        lineNormalized.includes(normalizedSchool) ||
        normalizedSchool.includes(lineNormalized.split('–')[0].trim().toLowerCase()) ||
        // Match abbreviations in parentheses
        (line.match(/\(([^)]+)\)/) && normalizedSchool.includes(line.match(/\(([^)]+)\)/)?.[1].toLowerCase() || '')) ||
        // Partial word matching for multi-word schools
        normalizedSchool.split(/\s+/).some(word => 
          word.length > 3 && lineNormalized.includes(word)
        );
      
      if (matches) {
        foundSchoolName = line;
        isInSchoolSection = true;
        console.log('[Google Docs Tool] Found school section:', foundSchoolName);
        continue;
      }
    }
    
    // If we're in the right school section, collect questions
    if (isInSchoolSection) {
      // Skip empty lines but don't stop
      if (!line) {
        continue;
      }
      
      // Add the line (it's a question)
      questions.push(line);
    }
  }
  
  if (questions.length === 0) {
    console.log('[Google Docs Tool] No questions found for:', schoolName);
    return '';
  }
  
  console.log('[Google Docs Tool] Found', questions.length, 'questions for', foundSchoolName);
  return questions.join('\n');
}

/**
 * Common school abbreviations mapping
 */
const SCHOOL_ABBREVIATIONS: Record<string, string> = {
  // From the document
  'asdoh': 'A.T. Still University',
  'at still': 'A.T. Still University',
  'mosdoh': 'A.T. Still University',
  'atsu': 'A.T. Still University',
  'dcg': 'Augusta University',
  'augusta': 'Augusta University',
  'bu': 'Boston University',
  'boston': 'Boston University',
  'nyu': 'New York University',
  
  // Common abbreviations
  'ucla': 'UCLA',
  'usc': 'USC',
  'ucsf': 'UCSF',
  'upenn': 'University of Pennsylvania',
  'penn': 'University of Pennsylvania',
  'tufts': 'Tufts University',
  'harvard': 'Harvard',
  'columbia': 'Columbia',
  'uconn': 'University of Connecticut',
  'umich': 'University of Michigan',
  'michigan': 'University of Michigan',
  'unc': 'University of North Carolina',
  'uf': 'University of Florida',
  'florida': 'University of Florida',
  'uic': 'University of Illinois Chicago',
  'pitt': 'University of Pittsburgh',
  'pittsburgh': 'University of Pittsburgh',
  'temple': 'Temple University',
  'nova': 'Nova Southeastern',
  'midwestern': 'Midwestern University',
  'loma linda': 'Loma Linda',
  'pacific': 'University of the Pacific',
  'uop': 'University of the Pacific',
  'creighton': 'Creighton University',
  'marquette': 'Marquette University',
};

/**
 * Expand school abbreviation to full name
 */
function expandSchoolName(input: string): string {
  const normalized = input.toLowerCase().trim();
  return SCHOOL_ABBREVIATIONS[normalized] || input;
}

/**
 * Google Docs Interview Questions Tool
 */
export const googleDocsTool = createTool({
  name: 'get_interview_questions',
  description: `Get dental school interview practice questions for a specific school.
  
  This tool searches a comprehensive database of interview questions organized by dental school.
  
  IMPORTANT SEARCH STRATEGIES:
  1. The user may provide school abbreviations (e.g., "UCLA", "USC", "UPenn") - expand these to full names
  2. Try multiple search variations:
     - Full official name (e.g., "University of California, Los Angeles")
     - Common short name (e.g., "UCLA")
     - Partial matches (e.g., "California" for UC schools)
  3. If no exact match, try searching for key words from the school name
  4. Common abbreviations are automatically expanded
  
  The tool returns interview questions specific to that dental school, which may include:
  - Why this school questions
  - Ethical scenarios
  - Personal background questions
  - Situational questions
  - School-specific questions
  
  If no questions are found for a school, the tool will return an empty result.`,
  
  parameters: z.object({
    schoolName: z.string().describe('The name or abbreviation of the dental school to get interview questions for (e.g., "UCLA", "University of Pennsylvania", "USC")'),
  }),
  
  execute: async ({ schoolName }) => {
    try {
      console.log('[Google Docs Tool] Searching for interview questions:', schoolName);
      
      // Expand abbreviation if needed
      const expandedName = expandSchoolName(schoolName);
      console.log('[Google Docs Tool] Expanded school name:', expandedName);
      
      // Fetch and parse the document
      const docContent = await fetchGoogleDoc();
      
      // Parse document to JSON if not cached
      if (!cachedParsedSchools || !cacheTimestamp || (Date.now() - cacheTimestamp >= CACHE_DURATION)) {
        cachedParsedSchools = parseDocumentToJSON(docContent);
      }
      
      // Search for the school
      let foundSchool = findSchoolInData(cachedParsedSchools, expandedName);
      
      // If not found with expanded name, try original
      if (!foundSchool && expandedName !== schoolName) {
        console.log('[Google Docs Tool] Trying original name:', schoolName);
        foundSchool = findSchoolInData(cachedParsedSchools, schoolName);
      }
      
      if (!foundSchool) {
        // List available schools for debugging
        const availableSchools = cachedParsedSchools
          .map(s => s.abbreviation ? `${s.fullName} (${s.abbreviation})` : s.fullName)
          .slice(0, 5)
          .join(', ');
        
        console.log('[Google Docs Tool] Available schools (first 5):', availableSchools);
        
        return {
          success: false,
          schoolName: expandedName,
          message: `No interview questions found for "${expandedName}". The school may not be in our database yet, or try using a different name variation (e.g., abbreviation or shorter name).`,
          questions: '',
          availableSchools: cachedParsedSchools.map(s => ({
            name: s.fullName,
            abbreviation: s.abbreviation
          }))
        };
      }
      
      // Format questions as numbered list
      const formattedQuestions = foundSchool.questions
        .map((q, i) => q.match(/^\d+[\).]/) ? q : `${i + 1}) ${q}`)
        .join('\n');
      
      return {
        success: true,
        schoolName: foundSchool.fullName,
        abbreviation: foundSchool.abbreviation,
        questions: formattedQuestions,
        questionCount: foundSchool.questions.length,
        message: `Found ${foundSchool.questions.length} interview questions for ${foundSchool.fullName}${foundSchool.abbreviation ? ` (${foundSchool.abbreviation})` : ''}`,
      };
      
    } catch (error) {
      console.error('[Google Docs Tool] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to fetch interview questions. Please try again.',
      };
    }
  },
});
