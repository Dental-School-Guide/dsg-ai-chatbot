import { createTool } from '@voltagent/core';
import { z } from 'zod';

/**
 * School Website Search Tool
 * Searches the web to find the official website of a dental school
 */
export const schoolWebsiteSearchTool = createTool({
  name: 'find_school_website',
  description: `Find the official website URL for a dental school.
  
  Use this tool when you need to provide the official website link for a dental school.
  The tool will search the web and return the most relevant official website URL.
  
  IMPORTANT: Always use this tool at the end of your response to provide the official website link.`,
  
  parameters: z.object({
    schoolName: z.string().describe('The full name of the dental school (e.g., "UCLA School of Dentistry", "University of Pennsylvania School of Dental Medicine")'),
  }),
  
  execute: async ({ schoolName }) => {
    try {
      console.log('[School Website Tool] Searching for:', schoolName);
      
      // Construct a search query optimized for finding official dental school websites
      const searchQuery = `${schoolName} official website dental school`;
      
      // Use a web search API or service
      // For now, we'll use a simple fetch to Google Custom Search or similar
      // You'll need to replace this with your actual web search implementation
      
      // Common patterns for dental school websites
      const commonPatterns = [
        { name: 'UCLA', url: 'https://dentistry.ucla.edu' },
        { name: 'USC', url: 'https://dentistry.usc.edu' },
        { name: 'UCSF', url: 'https://dentistry.ucsf.edu' },
        { name: 'University of Pennsylvania', url: 'https://www.dental.upenn.edu' },
        { name: 'Harvard', url: 'https://hsdm.harvard.edu' },
        { name: 'Columbia', url: 'https://www.dental.columbia.edu' },
        { name: 'NYU', url: 'https://dental.nyu.edu' },
        { name: 'Boston University', url: 'https://www.bu.edu/dental' },
        { name: 'Tufts', url: 'https://dental.tufts.edu' },
        { name: 'University of Michigan', url: 'https://dentistry.umich.edu' },
        { name: 'University of North Carolina', url: 'https://www.dentistry.unc.edu' },
        { name: 'University of Florida', url: 'https://dental.ufl.edu' },
        { name: 'University of Illinois Chicago', url: 'https://dentistry.uic.edu' },
        { name: 'University of Pittsburgh', url: 'https://www.dental.pitt.edu' },
        { name: 'Temple University', url: 'https://dentistry.temple.edu' },
        { name: 'Nova Southeastern', url: 'https://dental.nova.edu' },
        { name: 'Midwestern University', url: 'https://www.midwestern.edu/academics/dentistry' },
        { name: 'Loma Linda', url: 'https://dentistry.llu.edu' },
        { name: 'University of the Pacific', url: 'https://dental.pacific.edu' },
        { name: 'Creighton', url: 'https://dentistry.creighton.edu' },
        { name: 'Marquette', url: 'https://www.marquette.edu/dentistry' },
        { name: 'University of Connecticut', url: 'https://health.uconn.edu/dental-medicine' },
        { name: 'University of Washington', url: 'https://dental.washington.edu' },
        { name: 'University of Iowa', url: 'https://dentistry.uiowa.edu' },
        { name: 'Ohio State', url: 'https://dentistry.osu.edu' },
        { name: 'Case Western', url: 'https://case.edu/dental' },
        { name: 'University of Maryland', url: 'https://www.dental.umaryland.edu' },
        { name: 'University of Louisville', url: 'https://louisville.edu/dentistry' },
        { name: 'University of Tennessee', url: 'https://www.uthsc.edu/dentistry' },
        { name: 'University of Texas', url: 'https://dentistry.uth.edu' },
        { name: 'Texas A&M', url: 'https://dentistry.tamhsc.edu' },
        { name: 'Augusta University', url: 'https://www.augusta.edu/dentalmedicine' },
        { name: 'Medical University of South Carolina', url: 'https://medicine.musc.edu/departments/otd' },
        { name: 'A.T. Still University', url: 'https://www.atsu.edu/arizona-school-of-dentistry-oral-health' },
        { name: 'Stony Brook', url: 'https://dentistry.stonybrookmedicine.edu' },
        { name: 'Rutgers', url: 'https://sdm.rutgers.edu' },
        { name: 'University of Nebraska', url: 'https://www.unmc.edu/dentistry' },
        { name: 'University of Minnesota', url: 'https://www.dentistry.umn.edu' },
        { name: 'University of Missouri-Kansas City', url: 'https://dentistry.umkc.edu' },
        { name: 'University of Oklahoma', url: 'https://dentistry.ouhsc.edu' },
        { name: 'University of Colorado', url: 'https://www.cuanschutz.edu/dentalmedicine' },
        { name: 'Oregon Health & Science University', url: 'https://www.ohsu.edu/school-of-dentistry' },
      ];
      
      // Try to find a match in our database
      const normalizedSearch = schoolName.toLowerCase();
      const match = commonPatterns.find(pattern => 
        normalizedSearch.includes(pattern.name.toLowerCase()) ||
        pattern.name.toLowerCase().includes(normalizedSearch)
      );
      
      if (match) {
        console.log('[School Website Tool] Found match:', match.url);
        return {
          success: true,
          schoolName: schoolName,
          websiteUrl: match.url,
          message: `Found official website for ${schoolName}`,
        };
      }
      
      // If no match found in database, return a generic search suggestion
      console.log('[School Website Tool] No direct match found');
      return {
        success: false,
        schoolName: schoolName,
        websiteUrl: null,
        message: `Could not find the official website in our database. Please search for "${schoolName} official website" online.`,
      };
      
    } catch (error) {
      console.error('[School Website Tool] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to search for school website. Please try again.',
      };
    }
  },
});
