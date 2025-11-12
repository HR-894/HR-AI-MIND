import { Plus, MessageSquare, Trash2, Edit2, Check, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ChatSession } from "@shared/schema";
import { useState, useRef, useEffect } from "react";

interface AppSidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onDownloadSession: (id: string) => void;
}

export function AppSidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onRenameSession,
  onDownloadSession,
}: AppSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const sortedSessions = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const handleStartEdit = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveEdit = (id: string) => {
    if (editTitle.trim() && editTitle !== sessions.find(s => s.id === id)?.title) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter") {
      handleSaveEdit(id);
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  return (
    <Sidebar className="border-r border-border/50 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <SidebarHeader className="p-4 border-b border-border/50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <Button
          onClick={onNewSession}
          className="w-full justify-start gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
          data-testid="button-new-chat"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </SidebarHeader>

      <SidebarContent className="bg-transparent">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Conversations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <ScrollArea className="h-[calc(100vh-200px)] px-2">
              <SidebarMenu className="space-y-1">
                {sortedSessions.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground bg-white/30 dark:bg-gray-800/30 rounded-lg border border-dashed border-border/50">
                    No conversations yet
                  </div>
                ) : (
                  sortedSessions.map((session) => (
                    <SidebarMenuItem key={session.id}>
                      <div className="relative group rounded-lg overflow-hidden transition-all hover:shadow-md">
                        {editingId === session.id ? (
                          <div className="flex items-center gap-1 px-2 py-2 bg-white dark:bg-gray-800 border border-border rounded-lg">
                            <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <Input
                              ref={inputRef}
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, session.id)}
                              className="h-8 text-sm border-0 focus-visible:ring-1"
                              placeholder="Chat title..."
                            />
                            <button
                              onClick={() => handleSaveEdit(session.id)}
                              className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                              aria-label="Save title"
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                              aria-label="Cancel"
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <SidebarMenuButton
                              onClick={() => onSelectSession(session.id)}
                              className={cn(
                                "w-full py-3 px-4 transition-all hover:shadow-sm",
                                currentSessionId === session.id 
                                  ? "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 border-l-4 border-l-blue-500 shadow-md" 
                                  : "bg-white/50 dark:bg-gray-800/30 hover:bg-white dark:hover:bg-gray-800/50 border-l-4 border-l-transparent"
                              )}
                              data-testid={`session-${session.id}`}
                            >
                              <MessageSquare className={cn(
                                "h-4 w-4 shrink-0",
                                currentSessionId === session.id && "text-blue-600"
                              )} />
                              <span className="text-sm font-medium truncate flex-1">
                                {session.title}
                              </span>
                            </SidebarMenuButton>
                            
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-border/50 p-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDownloadSession(session.id);
                                }}
                                className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 transition-colors"
                                data-testid={`button-download-session-${session.id}`}
                                aria-label="Download chat"
                                title="Download chat"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={(e) => handleStartEdit(session, e)}
                                className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 transition-colors"
                                data-testid={`button-edit-session-${session.id}`}
                                aria-label="Rename session"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteSession(session.id);
                                }}
                                className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 transition-colors"
                                data-testid={`button-delete-session-${session.id}`}
                                aria-label="Delete session"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
