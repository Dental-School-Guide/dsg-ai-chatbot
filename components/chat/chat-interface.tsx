'use client'

import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from './chat-message';
import { ChatComposer } from './chat-composer';
import { EssayUpload } from '../essay-upload';
import { apiFetch } from '@/lib/api-client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  conversationId?: string;
  onConversationCreated?: (conversationId: string) => void;
  onConversationTitleUpdated?: () => void;
  agentMode?: string | null;
  onAgentModeChange?: (mode: string | null) => void;
}

// Helper function to get initial message based on agent mode
const getInitialMessage = (mode: string | null | undefined): string => {
  switch (mode) {
    case 'Interview Drill':
      return "Ready to practice your dental school interview? Share the school name you're interviewing for, and I'll help you prepare with common interview questions and expert tips!";
    case 'School Info':
      return "Looking for information about dental schools? Tell me which school you're interested in, and I'll provide detailed insights about their programs, requirements, and more!";
    case 'Essay feedback':
      return "Let's perfect your dental school personal statement! Upload or paste your essay, and I'll provide comprehensive feedback to make it shine.";
    default:
      return "Let's get you into dental school! How can I help you today?";
  }
};

export function ChatInterface({ conversationId, onConversationCreated, onConversationTitleUpdated, agentMode, onAgentModeChange }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: getInitialMessage(null),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(conversationId);
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [showEssayUpload, setShowEssayUpload] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Show essay upload when in Essay feedback mode and conversation just started
  useEffect(() => {
    if (agentMode === 'Essay feedback' && userMessageCount === 0) {
      setShowEssayUpload(true);
    } else {
      setShowEssayUpload(false);
    }
  }, [agentMode, userMessageCount]);

  // Load conversation when conversationId changes
  useEffect(() => {
    if (conversationId && conversationId !== currentConversationId) {
      loadConversation(conversationId);
    } else if (!conversationId) {
      // New chat - reset to initial state
      setMessages([
        {
          role: 'assistant',
          content: getInitialMessage(agentMode),
        },
      ]);
      setCurrentConversationId(undefined);
      setUserMessageCount(0);
    }
  }, [conversationId]);

  const loadConversation = async (convId: string) => {
    try {
      setIsLoading(true);
      const response = await apiFetch(`/api/conversations/${convId}`);
      if (response.ok) {
        const data = await response.json();
        // Convert Voltage message format to our format
        const loadedMessages: Message[] = data.messages.map((msg: any) => ({
          role: msg.role,
          content: msg.parts?.[0]?.text || msg.parts?.[0]?.content || '',
        }));
        
        // Filter out any initial welcome messages if they were accidentally saved
        const initialMessages = [
          "Let's get you into dental school! How can I help you today?",
          "Ready to practice your dental school interview? Share the school name you're interviewing for, and I'll help you prepare with common interview questions and expert tips!",
          "Looking for information about dental schools? Tell me which school you're interested in, and I'll provide detailed insights about their programs, requirements, and more!",
          "Let's perfect your dental school personal statement! Upload or paste your essay, and I'll provide comprehensive feedback to make it shine."
        ];
        const filteredMessages = loadedMessages.filter(msg => 
          !(msg.role === 'assistant' && initialMessages.includes(msg.content))
        );
        
        // Always prepend the appropriate initial message for UI display only
        const messagesWithWelcome = [
          {
            role: 'assistant' as const,
            content: getInitialMessage(agentMode),
          },
          ...filteredMessages
        ];
        
        setMessages(messagesWithWelcome);
        setCurrentConversationId(convId);
        // Count user messages in loaded conversation (excluding the initial message)
        const userMsgCount = filteredMessages.filter(msg => msg.role === 'user').length;
        setUserMessageCount(userMsgCount);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEssaySubmit = async (essayText: string) => {
    // Format the essay submission as a message
    const message = `Please analyze my dental school personal statement:\n\n${essayText}`;
    await handleSendMessage(message);
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = { role: 'user', content };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Generate conversation ID if needed (Voltagent will create it)
      let convId = currentConversationId;
      if (!convId) {
        convId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setCurrentConversationId(convId);
      }

      // Only send the new user message - Voltagent will load conversation history from memory
      const apiMessages = [{ role: 'user' as const, content: userMessage.content }];

      // Call the chat API
      const response = await apiFetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          messages: apiMessages,
          conversationId: convId,
          agentMode: agentMode, // Pass the selected agent mode
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      // Add empty assistant message that we'll update
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === 'text') {
                  assistantMessage += data.content;
                  // Update the last message (assistant's message)
                  setMessages((prev) => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                      role: 'assistant',
                      content: assistantMessage,
                    };
                    return newMessages;
                  });
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      // Update user message count and notify parent
      const newUserMessageCount = userMessageCount + 1;
      setUserMessageCount(newUserMessageCount);
      
      // Notify parent about new conversation on first message
      if (newUserMessageCount === 1 && convId) {
        onConversationCreated?.(convId);
      }
      
      // Auto-generate title after second user message
      if (newUserMessageCount === 2 && convId) {
        // Generate title in background
        apiFetch(`/api/conversations/${convId}/generate-title`, {
          method: 'POST',
        }).then(response => {
          if (response.ok) {
            onConversationTitleUpdated?.();
          }
        }).catch(err => {
          console.error('Error generating title:', err);
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4 flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[--dsg-edge] dsg-chat-bg p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div className="flex-1 overflow-y-auto space-y-5 pr-2 scrollbar-themed">
          {/* Show Essay Upload if in Essay feedback mode and no messages yet */}
          {showEssayUpload && (
            <div className="space-y-4">
              <ChatMessage role="assistant">
                <p className="text-[--text]">
                  👋 Hi! I'm ready to provide detailed feedback on your dental school personal statement.
                  Upload your essay or paste it below, and I'll analyze it using our comprehensive rubric.
                </p>
              </ChatMessage>
              <EssayUpload onEssaySubmit={handleEssaySubmit} isLoading={isLoading} />
            </div>
          )}

          {/* Regular chat messages */}
          {!showEssayUpload && messages.map((message, index) => (
            <ChatMessage
              key={index}
              role={message.role}
              title={index === 0 ? 'Welcome to Dental Mentor AI' : undefined}
              content={message.content}
            />
          ))}
          
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <ChatMessage role="assistant">
              <p className="text-[--text-dim]">
                {agentMode === 'Essay feedback' ? 'Analyzing your essay...' 
                 : agentMode === 'Interview Drill' ? 'Preparing interview questions...'
                 : agentMode === 'School Info' ? 'Searching school information...'
                 : 'Thinking...'}
              </p>
            </ChatMessage>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {!showEssayUpload && (
        <ChatComposer 
          className="mt-4" 
          onSend={handleSendMessage} 
          isLoading={isLoading}
          agentMode={agentMode}
          onAgentModeChange={onAgentModeChange}
        />
      )}
    </div>
  );
}
