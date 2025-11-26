"use client";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { Download, Trash2, Plus, Sparkles, Search, Lightbulb, GraduationCap, Rocket, Pencil, Check, X } from "lucide-react";
import Image from "next/image";
import { useState, useEffect, forwardRef, useImperativeHandle, memo } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

interface SidebarProps {
  className?: string;
  activeConversationId?: string;
  onConversationSelect?: (conversationId: string) => void;
  onNewChat?: () => void;
  selectedPrompt?: string | null;
  onPromptSelect?: (prompt: string | null) => void;
  onEssayFeedbackStart?: () => void;
}

export interface SidebarRef {
  refresh: () => void;
}

const SidebarComponent = forwardRef<SidebarRef, SidebarProps>(({ className, activeConversationId, onConversationSelect, onNewChat, selectedPrompt, onPromptSelect, onEssayFeedbackStart }, ref) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [deleteConversationId, setDeleteConversationId] = useState<string | null>(null);

  const filteredConversations = conversations.filter(conv => 
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const quickActions = [
    { icon: Plus, label: "New Chat" },
    { icon: Trash2, label: "Clear" },
  ];

  const promptButtons = [
    {
      icon: Sparkles,
      label: "Essay feedback",
      accentClass:
        "border-[rgba(242,181,225,0.32)] bg-[linear-gradient(140deg,rgba(242,181,225,0.2),rgba(48,24,40,0.86))] hover:border-[rgba(242,181,225,0.48)]",
      iconClass: "text-[#f6d8ec]",
    },
    {
      icon: Lightbulb,
      label: "Volunteer Ideas",
      accentClass:
        "border-[rgba(191,222,243,0.34)] bg-[linear-gradient(140deg,rgba(191,222,243,0.2),rgba(24,32,44,0.86))] hover:border-[rgba(191,222,243,0.5)]",
      iconClass: "text-[#d6ecfa]",
    },
    {
      icon: GraduationCap,
      label: "School Info",
      accentClass:
        "border-[rgba(185,233,233,0.32)] bg-[linear-gradient(140deg,rgba(185,233,233,0.2),rgba(22,38,38,0.84))] hover:border-[rgba(185,233,233,0.48)]",
      iconClass: "text-[#d5f3f3]",
    },
    {
      icon: Rocket,
      label: "Interview Drill",
      accentClass:
        "border-[rgba(255,201,180,0.34)] bg-[linear-gradient(140deg,rgba(255,201,180,0.2),rgba(44,26,20,0.86))] hover:border-[rgba(255,201,180,0.5)]",
      iconClass: "text-[#ffdcca]",
    },
  ];

  // Expose refresh method to parent
  useImperativeHandle(ref, () => ({
    refresh: fetchConversations
  }));

  // Fetch conversations on mount (with small delay for iframe auth)
  useEffect(() => {
    const isInIframe = typeof window !== 'undefined' && typeof window.self !== 'undefined' && typeof window.top !== 'undefined' && window.self !== window.top;
    
    if (isInIframe) {
      // Wait a bit for session to be fully established in iframe
      const timer = setTimeout(() => {
        fetchConversations();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      fetchConversations();
    }
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await apiFetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      } else {
        console.error('Failed to fetch conversations:', response.status, response.statusText);
        // Try to read error message
        try {
          const errorText = await response.text();
          console.error('Error response:', errorText);
        } catch (e) {
          // Ignore if can't read response
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      // Only set loading to false on initial load
      if (isLoading) {
        setIsLoading(false);
      }
    }
  };

  const handleNewChat = () => {
    // Just reset to initial state, don't create conversation yet
    onNewChat?.();
  };

  const handleClearChat = () => {
    // Only allow clearing if there's an active conversation
    if (!activeConversationId) {
      return;
    }

    // Show confirmation dialog
    setShowClearDialog(true);
  };

  const confirmClearChat = async () => {
    if (!activeConversationId) return;

    try {
      // Delete the current conversation
      const response = await apiFetch(`/api/conversations/${activeConversationId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Remove from UI
        setConversations(prev => prev.filter(conv => conv.id !== activeConversationId));
        // Start new chat
        onNewChat?.();
        toast.success('Chat cleared', {
          description: 'Started a new conversation',
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('Error clearing conversation:', error);
      toast.error('Failed to clear chat', {
        description: 'Please try again',
        duration: 2000,
      });
    }
  };

  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConversationId(id);
  };

  const confirmDeleteConversation = async () => {
    if (!deleteConversationId) return;

    const id = deleteConversationId;
    
    // Optimistic update - remove from UI immediately
    setConversations(prev => prev.filter(conv => conv.id !== id));
    
    try {
      const response = await apiFetch(`/api/conversations/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        if (activeConversationId === id) {
          onNewChat?.();
        }
        toast.success('Conversation deleted', {
          description: 'The conversation has been removed',
          duration: 2000,
        });
      } else {
        // Revert on error
        fetchConversations();
        toast.error('Failed to delete conversation', {
          description: 'Please try again',
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      // Revert on error
      fetchConversations();
      toast.error('Failed to delete conversation', {
        description: 'Please try again',
        duration: 2000,
      });
    }
  };

  const handleRenameStart = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingId(id);
    setRenameValue(currentTitle);
  };

  const handleRenameSubmit = async (id: string) => {
    if (!renameValue.trim()) return;
    
    const oldTitle = conversations.find(c => c.id === id)?.title;
    
    // Optimistic update - update UI immediately
    setConversations(prev => 
      prev.map(conv => 
        conv.id === id ? { ...conv, title: renameValue } : conv
      )
    );
    setRenamingId(null);
    
    try {
      const response = await apiFetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: renameValue }),
      });
      if (!response.ok) {
        // Revert on error
        if (oldTitle) {
          setConversations(prev => 
            prev.map(conv => 
              conv.id === id ? { ...conv, title: oldTitle } : conv
            )
          );
        }
      }
    } catch (error) {
      console.error('Error renaming conversation:', error);
      // Revert on error
      if (oldTitle) {
        setConversations(prev => 
          prev.map(conv => 
            conv.id === id ? { ...conv, title: oldTitle } : conv
          )
        );
      }
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <aside
      className={cn(
        "bubble-skin-user grid h-full w-full min-h-0 grid-rows-[auto_auto_auto_minmax(0,1fr)_auto] overflow-hidden rounded-xl border border-[--dsg-edge] dsg-panel-gradient text-[--dsg-text]",
        className
      )}
      style={{ gridTemplateRows: "auto auto auto minmax(0,1fr) auto" }}
    >
      {/* Header - Fixed at top */}
      <div className="flex-shrink-0 p-4">
        <div className="flex items-center gap-3">
          <div className="sidebar-logo relative h-12 w-12 overflow-hidden rounded-full">
            <Image src="/logo.webp" alt="Dental Mentor AI" fill className="object-cover" priority />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-[--dsg-text]">Dental Mentor AI</h2>
            <p className="text-xs text-[--dsg-muted]">Personalized guidance for pre-dental success</p>
          </div>
        </div>
      </div>

      {/* Quick Actions - Fixed below header */}
      <div className="flex-shrink-0 px-4 pb-2">
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handleNewChat}
            size="sm"
            variant="secondary"
            className="flex items-center justify-center hover:opacity-90 cursor-pointer gap-2 rounded-lg border border-[--dsg-edge] dsg-panel-2-gradient text-[11px] font-medium text-[--dsg-text] hover:bg-[--dsg-panel-2]"
          >
            <Plus className="h-4 w-4 text-[--dsg-gold]" />
            New Chat
          </Button>
          <Button
            onClick={handleClearChat}
            size="sm"
            variant="secondary"
            disabled={!activeConversationId}
            className="flex items-center justify-center hover:opacity-90 cursor-pointer gap-2 rounded-lg border border-[--dsg-edge] dsg-panel-2-gradient text-[11px] font-medium text-[--dsg-text] hover:bg-[--dsg-panel-2] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-4 w-4 text-[--dsg-gold]" />
            Clear
          </Button>
        </div>
      </div>

      {/* Quick Prompts - Fixed below actions */}
      <div className="flex-shrink-0 px-4 pb-2">
        <div className="space-y-2 flex flex-col overflow-hidden rounded-2xl border border-[--dsg-edge] dsg-panel-2-gradient p-3 shadow-sm">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[--dsg-muted]">Quick prompts</p>
          <div className="grid grid-cols-2 gap-1">
            {promptButtons.map(({ icon: Icon, label, accentClass, iconClass }) => {
              const isSelected = selectedPrompt === label;
              return (
                <Button
                  key={label}
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const newValue = isSelected ? null : label;
                    onPromptSelect?.(newValue);
                    
                    // Start new chat if Essay feedback is selected
                    if (newValue === 'Essay feedback') {
                      onNewChat?.();
                    }
                    
                    // Show toast notification
                    if (newValue) {
                      toast.success(`${label} mode activated`, {
                        description: "AI agent switched successfully",
                        duration: 2000,
                      });
                    } else {
                      toast.info("Agent mode deactivated", {
                        description: "Switched back to default mode",
                        duration: 2000,
                      });
                    }
                  }}
                  className={cn(
                    "relative flex items-center justify-center gap-2 rounded-md border px-2 text-xs font-medium text-[--dsg-text] transition-all duration-200 ease-out cursor-pointer",
                    "bg-[rgba(14,20,35,0.8)]/70 backdrop-blur-sm hover:scale-105 hover:brightness-110",
                    accentClass,
                    isSelected && "ring-2 ring-[#f6d43f] ring-offset-2 ring-offset-[--dsg-bg] shadow-lg shadow-[#f6d43f]/20 brightness-125"
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", iconClass)} />
                  {label}
                  {isSelected && (
                    <Check className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#f6d43f] text-black p-0.5 shadow-md" />
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chat History - Takes remaining space (row 4) with its own scroll */}
      <div className="min-h-0 h-[50%] px-4 pb-2 overflow-hidden">
        <div className="flex flex-col h-full min-h-0 overflow-hidden rounded-2xl border border-[--dsg-edge] dsg-panel-2-gradient shadow-sm">

          <div className="flex-shrink-0 border-b border-[--dsg-edge] bg-transparent px-3.5 py-2">
            <div className="flex items-center justify-between h-6">
              {isSearchVisible ? (
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chats..."
                  autoFocus
                  onBlur={() => !searchQuery && setIsSearchVisible(false)}
                  className="w-full bg-transparent border-none p-0 text-[13px] text-[--dsg-text] placeholder-[--dsg-muted] focus:outline-none focus:ring-0"
                />
              ) : (
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[--dsg-muted]">Chat history</p>
              )}
              <button 
                onClick={() => {
                  setIsSearchVisible(!isSearchVisible);
                  if (isSearchVisible) setSearchQuery("");
                }}
                className="hover:text-[--dsg-text] text-[--dsg-gold] transition-colors"
              >
                {isSearchVisible ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
              </button>
            </div>
          </div>
          
          {/* Scrollable history content */}
          <div className="flex-1 min-h-0 overflow-y-auto px-3.5 py-4 pr-2 scrollbar-themed">
            <div className="space-y-2 text-sm min-h-full">
                {filteredConversations.length === 0 && !isLoading ? (
                  <p className="text-center text-xs text-[--dsg-muted] py-4">
                    {searchQuery ? "No matches found" : "No conversations yet"}
                  </p>
                ) : (
                  filteredConversations.map((conversation) => {
                    const isActive = activeConversationId === conversation.id;
                    const isRenaming = renamingId === conversation.id;

                    return (
                      <div
                        key={conversation.id}
                        className={cn(
                          "group relative flex min-w-0 items-center gap-3 rounded-xl border border-[--dsg-edge] bg-[--dsg-panel] p-2 text-[--dsg-text] transition duration-200 ease-out",
                          "cursor-pointer hover:border-[--dsg-gold-25] hover:bg-[--dsg-bg] focus-within:border-[--dsg-gold-25] focus-within:bg-[--dsg-bg]",
                          isActive &&
                            "!border-[#f6d43f] bg-[--dsg-gold-06] shadow-sm"
                        )}
                        onClick={() => !isRenaming && onConversationSelect?.(conversation.id)}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="flex-1 min-w-0">
                          {isRenaming ? (
                            <input
                              type="text"
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onBlur={() => handleRenameSubmit(conversation.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameSubmit(conversation.id);
                                if (e.key === 'Escape') setRenamingId(null);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full bg-[--dsg-panel-2] border border-[--dsg-gold] rounded px-2 py-1 text-[13px] font-semibold focus:outline-none text-[--dsg-text]"
                              autoFocus
                            />
                          ) : (
                            <p className={cn("truncate text-[13px] font-semibold", isActive ? "text-[--dsg-gold]" : "text-[--dsg-text]")}>{conversation.title}</p>
                          )}
                          <p className="mt-1 text-[11px] text-[--dsg-muted]">{formatTimestamp(conversation.updated_at)}</p>
                        </div>

                        <div className="flex shrink-0 items-center gap-2 opacity-0 transition duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
                          <button
                            type="button"
                            onClick={(e) => handleRenameStart(conversation.id, conversation.title, e)}
                            className="flex h-6 w-6 items-center justify-center rounded-full border border-[--dsg-edge] bg-[--dsg-panel-2] text-[--dsg-muted] transition hover:border-purple-400/50 hover:text-purple-400 hover:bg-purple-400/10"
                            aria-label="Rename chat"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteConversation(conversation.id, e)}
                            className="flex h-6 w-6 items-center justify-center rounded-full border border-[--dsg-edge] bg-[--dsg-panel-2] text-[--dsg-muted] transition hover:border-red-400/50 hover:text-red-400 hover:bg-red-400/10"
                            aria-label="Delete chat"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Fixed at bottom */}
      <div className="flex-shrink-0 px-4 pb-4">
        <div className="rounded-2xl border border-[--dsg-edge] dsg-panel-2-gradient p-3.5 text-xs text-[--dsg-muted]">
          <p className="mt-1 leading-relaxed">
            <span className="font-semibold text-[--dsg-gold]">TIP</span> ~ Ask for a school list tailored to your GPA/DAT, state residency, and budget.
          </p>
        </div>
      </div>

      {/* Clear Chat Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showClearDialog}
        onClose={() => setShowClearDialog(false)}
        onConfirm={confirmClearChat}
        title="Clear Chat"
        description="Are you sure you want to clear this chat and start a new one? This conversation will be permanently deleted and cannot be recovered."
        confirmText="Clear Chat"
        cancelText="Cancel"
      />

      {/* Delete Conversation Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConversationId !== null}
        onClose={() => setDeleteConversationId(null)}
        onConfirm={confirmDeleteConversation}
        title="Delete Conversation"
        description="Are you sure you want to delete this conversation? This action cannot be undone and all messages will be permanently removed."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </aside>
  );
});

SidebarComponent.displayName = 'Sidebar';

export const Sidebar = memo(SidebarComponent);
