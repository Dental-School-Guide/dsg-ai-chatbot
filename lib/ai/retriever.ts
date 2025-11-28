import { BaseRetriever } from '@voltagent/core';
import { createClient } from '@supabase/supabase-js';
import { google } from '@ai-sdk/google';
import { embed } from 'ai';

export class LessonRetriever extends BaseRetriever {
  private supabase;

  constructor() {
    super({
      toolName: 'search_context',
      toolDescription: 'Search through dental school context materials and knowledge base',
    });

    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  async retrieve(input: string | any[], options?: any): Promise<string> {
    // Extract the query from input
    const query = typeof input === 'string' ? input : input[input.length - 1].content;

    console.log('[Retriever] Searching for:', query.substring(0, 100) + '...');

    try {
      // Generate embedding for the query using Google
      const { embedding } = await embed({
        model: google.textEmbeddingModel('text-embedding-004'),
        value: query,
      });

      // Search for similar embeddings in Supabase using pgvector
      const { data, error } = await this.supabase.rpc('match_context_embeddings', {
        query_embedding: embedding,
        match_threshold: 0.3, // Lower threshold to catch more results (was 0.5)
        match_count: 15, // Increased from 10 to get more context
      });

      if (error) {
        console.error('[Retriever] Error searching embeddings:', error);
        return 'No relevant information found.';
      }

      if (!data || data.length === 0) {
        console.log('[Retriever] No results found for query');
        return 'No relevant information found in the knowledge base.';
      }

      console.log(`[Retriever] Found ${data.length} results`);
      console.log('[Retriever] First result raw data:', JSON.stringify(data[0], null, 2));

      let rows = data;
      const isDiscountQuery = /discount|promo code|coupon|promo|code/i.test(query);
      if (isDiscountQuery) {
        const discountRows = data.filter((item: any) => {
          const text = `${item.content_chunk || ''} ${(item.metadata?.title || '')} ${(item.metadata?.topic || '')} ${(item.source_name || '')}`.toLowerCase();
          return (
            text.includes('discount') ||
            text.includes('promo') ||
            text.includes('coupon') ||
            text.includes('code')
          );
        });

        if (discountRows.length > 0) {
          console.log('[Retriever] Using filtered discount-related rows:', discountRows.length);
          rows = discountRows;
        } else {
          console.log('[Retriever] No explicit discount rows found; using full result set');
        }
      }

      // Track sources if context is provided
      if (options?.context) {
        options.context.set(
          'sources',
          rows.map((item: any) => ({
            id: item.id,
            context_id: item.context_id,
            source_name: item.source_name,
            source_url: item.source_url,
            chunk_index: item.chunk_index,
            similarity: item.similarity,
          }))
        );
      }

      // Format and return results with source information from context_links
      const results = rows.map((item: any, index: number) => {
        // Use source_name from context_links table, fallback to metadata or 'Knowledge Base'
        const sourceName = item.source_name || item.metadata?.title || item.metadata?.topic || 'Knowledge Base';
        const sourceUrl = item.source_url || '';
        
        // Include URL in a very explicit format for AI to extract
        const sourceInfo = sourceUrl 
          ? `[Source ${index + 1}: ${sourceName}]\nSOURCE_URL: ${sourceUrl}\nChunk #${item.chunk_index}, Similarity: ${(item.similarity * 100).toFixed(1)}%`
          : `[Source ${index + 1}: ${sourceName}]\nChunk #${item.chunk_index}, Similarity: ${(item.similarity * 100).toFixed(1)}%`;
        
        console.log(`[Retriever] Source ${index + 1}: ${sourceName} | URL: ${sourceUrl}`);
        return `${sourceInfo}\n${item.content_chunk}`;
      });

      const formattedResults = results.join('\n\n---\n\n');
      console.log('[Retriever] Returning formatted context with', results.length, 'sources');
      return formattedResults;
    } catch (error) {
      console.error('Error in retriever:', error);
      return 'An error occurred while searching the knowledge base.';
    }
  }
}
