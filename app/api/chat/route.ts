import { createDentalMentorAgent } from '@/lib/ai/agent';
import { createSchoolInfoAgent } from '@/lib/ai/school-info-agent';
import { createEssayFeedbackAgent } from '@/lib/ai/essay-feedback-agent';
import { createInterviewDrillAgent } from '@/lib/ai/interview-drill-agent';
import { createVolunteerAgent } from '@/lib/ai/volunteer-agent';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

function inferAgentModeFromMessage(content: string): string | null {
  const text = content.toLowerCase();

  // Essay-related queries
  if (
    text.includes('personal statement') ||
    text.includes('personal essay') ||
    text.includes('ps for dental') ||
    text.includes('edit my essay') ||
    text.includes('review my essay')
  ) {
    return 'Essay feedback';
  }

  // Interview-related queries
  if (
    text.includes('mock interview') ||
    text.includes('mmi') ||
    (text.includes('interview') && (text.includes('practice') || text.includes('prep') || text.includes('question')))
  ) {
    return 'Interview Drill';
  }

  // Volunteer-related queries
  if (
    text.includes('volunteer') ||
    text.includes('volunteering') ||
    text.includes('community service') ||
    text.includes('service hours')
  ) {
    return 'Volunteer Ideas';
  }

  // School info-related queries
  const schoolKeywords = [
    'gpa',
    'dat',
    'prereq',
    'prerequisite',
    'requirements',
    'requirement',
    'acceptance rate',
    'class size',
    'tuition',
    'deadline',
    'application deadline',
    'stats',
    'statistics',
    'average dat',
    'average gpa',
  ];

  if (schoolKeywords.some((kw) => text.includes(kw))) {
    return 'School Info';
  }

  return null;
}

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    // Verify authentication - check both cookies and Authorization header
    const authHeader = req.headers.get('authorization');
    let user;
    let supabase;
    
    if (authHeader?.startsWith('Bearer ')) {
      // For iframe context with localStorage, use service client with access token
      const token = authHeader.substring(7);
      supabase = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        }
      );
      const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(token);
      
      if (tokenError || !tokenUser) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      user = tokenUser;
    } else {
      // For normal context with cookies
      supabase = await createClient();
      const { data: { user: cookieUser }, error: authError } = await supabase.auth.getUser();

      if (authError || !cookieUser) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      user = cookieUser;
    }

    const body = await req.json();
    const { messages, conversationId } = body;
    let agentMode = body.agentMode as string | null | undefined;

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Infer agent mode from latest user message when not explicitly provided
    const lastMessage = Array.isArray(messages) && messages.length > 0 ? messages[messages.length - 1] : null;
    if (!agentMode && lastMessage?.role === 'user' && typeof lastMessage.content === 'string') {
      const inferred = inferAgentModeFromMessage(lastMessage.content);
      if (inferred) {
        agentMode = inferred;
        console.log('[Chat API] Inferred agent mode from message:', agentMode);
      }
    }

    // Create the appropriate agent based on mode
    console.log('[Chat API] Agent mode:', agentMode);
    let agent;
    if (agentMode === 'School Info') {
      agent = createSchoolInfoAgent();
    } else if (agentMode === 'Essay feedback') {
      agent = createEssayFeedbackAgent();
    } else if (agentMode === 'Interview Drill') {
      agent = createInterviewDrillAgent();
    } else if (agentMode === 'Volunteer Ideas') {
      agent = createVolunteerAgent();
    } else {
      agent = createDentalMentorAgent();
    }

    // Load conversation history manually for all modes (now that main agent doesn't have auto-memory)
    let messagesToSend = messages;
    if (conversationId) {
      try {
        console.log('[Chat API] Loading history for conversation:', conversationId);
        // Load conversation history from database (Voltagent V2 format)
        const { data: historyMessages, error: historyError } = await supabase
          .from('voltagent_memory_messages')
          .select('role, parts')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (historyError) {
          console.error('[Chat API] Error loading history:', historyError);
        }

        if (historyMessages && historyMessages.length > 0) {
          // Convert V2 format (parts array) to simple content format for the agent
          const formattedHistory = historyMessages.map((msg: any) => ({
            role: msg.role,
            content: msg.parts?.[0]?.text || '', // Extract text from first part
          }));

          // Filter out any initial welcome messages if they were accidentally saved
          const initialMessages = [
            "Let's get you into dental school! How can I help you today?",
            "Ready to practice your dental school interview? Share the school name you're interviewing for, and I'll help you prepare with common interview questions and expert tips!",
            "Looking for information about dental schools? Tell me which school you're interested in, and I'll provide detailed insights about their programs, requirements, and more!",
            "Let's perfect your dental school personal statement! Upload or paste your essay, and I'll provide comprehensive feedback to make it shine."
          ];
          const filteredHistory = formattedHistory.filter((msg: any) => 
            !(msg.role === 'assistant' && initialMessages.includes(msg.content))
          );

          // Add a system reminder about the conversation context
          const contextReminder = {
            role: 'system' as const,
            content: agentMode === 'School Info' 
              ? `CONVERSATION CONTEXT: The user has been discussing specific schools in this conversation. Review the previous messages carefully to understand which school they are referring to. If they ask a follow-up question without mentioning a school name, extract the school name from the previous messages and use it in your search.`
              : `CONVERSATION CONTEXT: This is a continuation of an ongoing conversation. Review the previous messages to understand the context and provide relevant follow-up responses.`
          };
          
          // Combine: context reminder + history + new message
          messagesToSend = [contextReminder, ...filteredHistory, ...messages];
          console.log('[Chat API] Loaded', filteredHistory.length, 'history messages for', agentMode || 'regular', 'mode');
          console.log('[Chat API] Full conversation:', filteredHistory.map((m: any) => `${m.role}: ${m.content.substring(0, 80)}...`));
        } else {
          console.log('[Chat API] No history found for this conversation');
        }
      } catch (error) {
        console.error('[Chat API] Error loading history:', error);
        // Continue with just the new message if history load fails
      }
    }

    // Get streaming response from agent with memory context
    const result = await agent.streamText(messagesToSend, {
      userId: user.id,
      conversationId: conversationId || `conv_${Date.now()}`,
    });

    // Create a streaming response
    const encoder = new TextEncoder();
    const contextIds = new Set<string>();
    let fullAssistantMessage = '';
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.fullStream) {
            // Handle different chunk types
            if (chunk.type === 'text-delta') {
              fullAssistantMessage += chunk.text;
              const data = JSON.stringify({ 
                type: 'text', 
                content: chunk.text 
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            } else if (chunk.type === 'finish') {
              // Collect context_ids from the result context if available
              const sources = result.context?.get('sources') as any[] | undefined;
              console.log('[Chat API] Sources from context:', sources);
              
              if (sources && Array.isArray(sources)) {
                sources.forEach((source: any) => {
                  if (source.context_id) {
                    contextIds.add(source.context_id);
                  }
                });
              }

              console.log('[Chat API] Collected context_ids:', Array.from(contextIds));

              // Fetch source information from context_links
              let sourcesText = '';
              if (contextIds.size > 0) {
                const { data: contextLinks, error: linksError } = await supabase
                  .from('context_links')
                  .select('id, context_name, link')
                  .in('id', Array.from(contextIds));

                console.log('[Chat API] Fetched context_links:', contextLinks);
                if (linksError) console.error('[Chat API] Error fetching links:', linksError);

                if (contextLinks && contextLinks.length > 0) {
                  // Format sources section
                  sourcesText = '\n\n---\n\n**📚 Sources:**\n' + 
                    contextLinks.map(link => `- [${link.context_name}](${link.link})`).join('\n');
                  
                  console.log('[Chat API] Appending sources:', sourcesText);
                  
                  // Append sources to full message for saving
                  fullAssistantMessage += sourcesText;
                  
                  // Send sources as text
                  const sourcesData = JSON.stringify({ 
                    type: 'text', 
                    content: sourcesText 
                  });
                  controller.enqueue(encoder.encode(`data: ${sourcesData}\n\n`));
                }
              }

              // Update the saved message with sources for main agent (if sources were added)
              if (!agentMode && conversationId && sourcesText) {
                try {
                  console.log('[Chat API] Updating main agent message with sources');
                  
                  // Create service role client to bypass RLS
                  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
                  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
                  
                  if (!supabaseUrl || !serviceRoleKey) {
                    console.error('[Chat API] Missing Supabase credentials for update');
                  } else {
                    const serviceSupabase = createServiceClient(supabaseUrl, serviceRoleKey);
                    
                    // Wait a bit to ensure Voltagent has saved the message
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    // Find the most recent assistant message in this conversation
                    const { data: recentMessages, error: fetchError } = await serviceSupabase
                      .from('voltagent_memory_messages')
                      .select('message_id, parts')
                      .eq('conversation_id', conversationId)
                      .eq('role', 'assistant')
                      .order('created_at', { ascending: false })
                      .limit(1);

                    if (fetchError) {
                      console.error('[Chat API] Error fetching message:', fetchError);
                    } else if (recentMessages && recentMessages.length > 0) {
                      const messageToUpdate = recentMessages[0];
                      const currentText = messageToUpdate.parts?.[0]?.text || '';
                      
                      console.log('[Chat API] Current message length:', currentText.length);
                      console.log('[Chat API] Sources to append:', sourcesText.substring(0, 100));
                      
                      // Only update if sources aren't already there
                      if (!currentText.includes('📚 Sources:')) {
                        const updatedParts = [{ type: 'text', text: currentText + sourcesText }];
                        
                        const { error: updateError } = await serviceSupabase
                          .from('voltagent_memory_messages')
                          .update({ parts: updatedParts })
                          .eq('message_id', messageToUpdate.message_id);

                        if (updateError) {
                          console.error('[Chat API] Error updating message with sources:', updateError);
                        } else {
                          console.log('[Chat API] Successfully updated main agent message with sources');
                        }
                      } else {
                        console.log('[Chat API] Sources already present in message');
                      }
                    } else {
                      console.log('[Chat API] No recent assistant message found to update');
                    }
                  }
                } catch (updateError) {
                  console.error('[Chat API] Error in update process:', updateError);
                }
              }

              // Save messages to database for all modes (now that main agent doesn't have auto-memory)
              if (conversationId) {
                try {
                  // First, ensure conversation exists
                  const { data: existingConv } = await supabase
                    .from('voltagent_memory_conversations')
                    .select('id')
                    .eq('id', conversationId)
                    .single();

                  if (!existingConv) {
                    // Create conversation if it doesn't exist
                    console.log('[Chat API] Creating conversation:', conversationId);
                    const { error: convError } = await supabase
                      .from('voltagent_memory_conversations')
                      .insert({
                        id: conversationId,
                        resource_id: user.id, // Use user_id as resource_id
                        user_id: user.id,
                        title: agentMode === 'Essay feedback' ? 'Essay Feedback' 
                             : agentMode === 'Interview Drill' ? 'Interview Practice'
                             : agentMode === 'Volunteer Ideas' ? 'Volunteer Ideas'
                             : agentMode === 'School Info' ? 'School Info Chat'
                             : 'Chat with Eden',
                        metadata: { agentMode: agentMode || 'regular' }, // Store agent mode in metadata
                      });
                    
                    if (convError) {
                      console.error('[Chat API] Error creating conversation:', convError);
                    }
                  }

                  // Save user message (using Voltagent V2 format)
                  const userMessage = messages[0]; // The new user message
                  const userMessageId = `msg_${Date.now()}_user`;
                  const { error: userMsgError } = await supabase
                    .from('voltagent_memory_messages')
                    .insert({
                      conversation_id: conversationId,
                      message_id: userMessageId,
                      role: userMessage.role,
                      parts: [{ type: 'text', text: userMessage.content }], // V2 format uses parts array
                      user_id: user.id,
                      metadata: {},
                      format_version: 2,
                    });

                  if (userMsgError) {
                    console.error('[Chat API] Error saving user message:', userMsgError);
                  }

                  // Save assistant message (using Voltagent V2 format)
                  const assistantMessageId = `msg_${Date.now()}_assistant`;
                  const { error: assistantMsgError } = await supabase
                    .from('voltagent_memory_messages')
                    .insert({
                      conversation_id: conversationId,
                      message_id: assistantMessageId,
                      role: 'assistant',
                      parts: [{ type: 'text', text: fullAssistantMessage }], // V2 format uses parts array
                      user_id: user.id,
                      metadata: {},
                      format_version: 2,
                    });

                  if (assistantMsgError) {
                    console.error('[Chat API] Error saving assistant message:', assistantMsgError);
                  } else {
                    console.log(`[Chat API] Successfully saved messages to database (mode: ${agentMode || 'regular'})`);
                  }
                } catch (saveError) {
                  console.error('[Chat API] Error in save process:', saveError);
                }
              }

              const data = JSON.stringify({ 
                type: 'finish',
                usage: chunk.totalUsage,
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'An error occurred while processing your request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
