import { createTool } from '@voltagent/core';
import { z } from 'zod';

/**
 * FAQ Tool
 * Searches through frequently asked questions from the FAQ Google Doc
 */

// The public Google Doc ID for FAQ
const FAQ_DOC_ID = '1uJRYo4FXtDzwQg8uW4zwaIY-2IrJwLsS1krOvqkAO7Y';

// Export as plain text using Google Docs export API
const FAQ_DOC_EXPORT_URL = `https://docs.google.com/document/d/${FAQ_DOC_ID}/export?format=txt`;

// Cache for the document content
let cachedFaqContent: string | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

/**
 * Fetch the FAQ Google Doc content
 */
async function fetchFaqDoc(): Promise<string> {
  // Check cache first
  if (cachedFaqContent && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
    console.log('[FAQ Tool] Using cached FAQ document');
    return cachedFaqContent;
  }

  try {
    console.log('[FAQ Tool] Fetching FAQ document from Google Docs');
    const response = await fetch(FAQ_DOC_EXPORT_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch FAQ Doc: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    
    // Cache the content
    cachedFaqContent = text;
    cacheTimestamp = Date.now();
    
    console.log('[FAQ Tool] FAQ document fetched successfully, length:', text.length);
    return text;
  } catch (error) {
    console.error('[FAQ Tool] Error fetching FAQ document:', error);
    throw error;
  }
}

/**
 * Search for relevant FAQ content based on query
 */
function searchFaqContent(faqContent: string, query: string): string {
  console.log('[FAQ Tool] Searching FAQ for:', query);
  
  const normalized = query.toLowerCase().trim();
  const lines = faqContent.split('\n');
  
  // Find relevant sections
  const relevantSections: string[] = [];
  let currentSection: string[] = [];
  let isRelevantSection = false;
  let sectionTitle = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) {
      // If we were in a relevant section, save it
      if (isRelevantSection && currentSection.length > 0) {
        relevantSections.push(`**${sectionTitle}**\n${currentSection.join('\n')}`);
        currentSection = [];
        isRelevantSection = false;
      }
      continue;
    }
    
    const lineNormalized = line.toLowerCase();
    
    // Check if this line is a question/section header (typically ends with ? or is in bold/caps)
    const looksLikeQuestion = 
      line.endsWith('?') || 
      line.match(/^[A-Z][A-Z\s]+$/) || // ALL CAPS
      line.match(/^Q:|^Question:|^\d+\./); // Numbered or Q: format
    
    if (looksLikeQuestion) {
      // Save previous section if it was relevant
      if (isRelevantSection && currentSection.length > 0) {
        relevantSections.push(`**${sectionTitle}**\n${currentSection.join('\n')}`);
      }
      
      // Check if this question is relevant to the query
      isRelevantSection = lineNormalized.includes(normalized) || 
                          normalized.split(/\s+/).some(word => 
                            word.length > 3 && lineNormalized.includes(word)
                          );
      
      if (isRelevantSection) {
        sectionTitle = line;
        currentSection = [];
        console.log('[FAQ Tool] Found relevant section:', sectionTitle);
      }
    } else if (isRelevantSection) {
      // Add content to current section
      currentSection.push(line);
    }
  }
  
  // Don't forget the last section
  if (isRelevantSection && currentSection.length > 0) {
    relevantSections.push(`**${sectionTitle}**\n${currentSection.join('\n')}`);
  }
  
  if (relevantSections.length === 0) {
    console.log('[FAQ Tool] No relevant FAQ sections found');
    // Return the entire FAQ content for the AI to search through
    return faqContent;
  }
  
  console.log('[FAQ Tool] Found', relevantSections.length, 'relevant FAQ sections');
  return relevantSections.join('\n\n---\n\n');
}

/**
 * FAQ Search Tool
 */
export const faqTool = createTool({
  name: 'search_faq',
  description: `Search through frequently asked questions (FAQ) about dental school admissions.
  
  This tool searches a comprehensive FAQ document that contains common questions and answers about:
  - Dental school application process
  - DAT preparation and requirements
  - GPA and academic requirements
  - Personal statements and essays
  - Interview preparation
  - Extracurricular activities and volunteering
  - Shadowing requirements
  - Letters of recommendation
  - Application timelines
  - Financial aid and scholarships
  - Discount codes and resources
  - And many other dental school-related topics
  
  Use this tool when:
  - The user asks a common question about dental school admissions
  - You need specific information about application requirements or processes
  - The user asks about discount codes, resources, or specific programs
  - You want to provide authoritative answers from the official FAQ
  
  The tool will return relevant FAQ sections that match the query.`,
  
  parameters: z.object({
    query: z.string().describe('The question or topic to search for in the FAQ (e.g., "discount codes", "DAT score requirements", "personal statement tips")'),
  }),
  
  execute: async ({ query }) => {
    try {
      console.log('[FAQ Tool] Processing query:', query);
      
      // Fetch the FAQ document
      const faqContent = await fetchFaqDoc();
      
      // Search for relevant content
      const relevantContent = searchFaqContent(faqContent, query);
      
      if (!relevantContent || relevantContent.trim().length === 0) {
        return {
          success: false,
          query,
          message: `No FAQ content found for "${query}". The FAQ may not cover this topic yet.`,
          content: '',
        };
      }
      
      return {
        success: true,
        query,
        content: relevantContent,
        message: `Found relevant FAQ information for "${query}"`,
      };
      
    } catch (error) {
      console.error('[FAQ Tool] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to search FAQ. Please try again.',
      };
    }
  },
});
