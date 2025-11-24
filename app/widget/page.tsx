"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sidebar, SidebarRef } from "@/components/sidebar";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatInterface } from "@/components/chat/chat-interface";

export default function WidgetPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sidebarRef = useRef<SidebarRef>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>();
  const [agentMode, setAgentMode] = useState<string | null>(null);

  const handleAgentModeChange = (mode: string | null) => {
    setAgentMode(mode);
    // Start new chat when Essay feedback is selected
    if (mode === 'Essay feedback') {
      handleNewChat();
    }
  };

  // Load conversation from URL on mount
  useEffect(() => {
    const convId = searchParams.get('c');
    if (convId) {
      setActiveConversationId(convId);
    }
  }, [searchParams]);

  const handleConversationSelect = (conversationId: string) => {
    setActiveConversationId(conversationId);
    // Update URL with conversation ID
    router.push(`/widget?c=${conversationId}`);
  };

  const handleNewChat = () => {
    setActiveConversationId(undefined);
    // Clear URL parameter
    router.push('/widget');
  };

  const handleConversationCreated = (conversationId: string) => {
    setActiveConversationId(conversationId);
    // Update URL with new conversation ID
    router.push(`/widget?c=${conversationId}`);
    // Refresh sidebar to show new conversation
    sidebarRef.current?.refresh();
  };

  const handleConversationTitleUpdated = () => {
    // Refresh sidebar to show updated title
    sidebarRef.current?.refresh();
  };

  return (
    <div className="h-screen w-full overflow-hidden text-[--dsg-text] p-2 md:p-4">
      <div className=" dsg-outer-frame-bg border flex h-full w-full gap-4 rounded-3xl p-[1px] shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)]">
        <div className="flex h-full w-full gap-4 rounded-3xl bg-[--dsg-bg-alt] p-2 backdrop-blur-sm">
          <Sidebar 
            ref={sidebarRef}
            className="hidden h-full w-[300px] shrink-0 md:block"
            activeConversationId={activeConversationId}
            onConversationSelect={handleConversationSelect}
            onNewChat={handleNewChat}
            selectedPrompt={agentMode}
            onPromptSelect={handleAgentModeChange}
          />

          <main className="flex h-full flex-1 flex-col overflow-hidden rounded-2xl relative">
            <ChatHeader className="mb-1"/>
            <ChatInterface 
              conversationId={activeConversationId}
              onConversationCreated={handleConversationCreated}
              onConversationTitleUpdated={handleConversationTitleUpdated}
              agentMode={agentMode}
              onAgentModeChange={handleAgentModeChange}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
