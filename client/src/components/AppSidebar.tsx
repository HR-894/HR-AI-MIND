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
    <Sidebar className="border-r-2 border-indigo-200/50 dark:border-indigo-700/60 bg-gradient-to-b from-white via-indigo-50/30 to-purple-50/40 dark:from-slate-800 dark:via-indigo-900/40 dark:to-purple-900/30">
      <SidebarHeader className="p-4 border-b-2 border-indigo-100/60 dark:border-indigo-700/60 bg-gradient-to-r from-white/80 via-indigo-50/60 to-purple-50/60 dark:from-slate-700/90 dark:via-indigo-800/90 dark:to-purple-800/90 backdrop-blur-sm">
        <Button
          onClick={onNewSession}
          className="w-full justify-start gap-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 dark:hover:from-indigo-500 dark:hover:via-purple-500 dark:hover:to-pink-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] font-semibold"
          data-testid="button-new-chat"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </SidebarHeader>

      <SidebarContent className="bg-transparent">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-3 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-300 dark:to-purple-300 bg-clip-text text-transparent">
            Conversations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <ScrollArea className="h-[calc(100vh-200px)] px-2">
              <SidebarMenu className="space-y-2">
                {sortedSessions.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm mx-2 rounded-xl bg-gradient-to-br from-white/60 to-indigo-50/50 dark:from-slate-700/60 dark:to-indigo-800/50 border-2 border-dashed border-indigo-200/50 dark:border-indigo-600/60">
                    <div className="text-indigo-600/70 dark:text-indigo-300/80 font-medium">No conversations yet</div>
                  </div>
                ) : (
                  sortedSessions.map((session) => (
                    <SidebarMenuItem key={session.id}>
                      <div className="relative group rounded-xl transition-all duration-300 hover:shadow-lg isolate">
                        {editingId === session.id ? (
                          <div className="flex items-center gap-1 px-2 py-2 bg-gradient-to-r from-white via-blue-50 to-purple-50 dark:from-slate-700 dark:via-blue-900/60 dark:to-purple-900/60 border-2 border-blue-300 dark:border-blue-600 rounded-xl shadow-md">
                            <MessageSquare className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-300" />
                            <Input
                              ref={inputRef}
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, session.id)}
                              className="h-8 text-sm border-0 focus-visible:ring-2 focus-visible:ring-blue-400 bg-white/80 dark:bg-slate-800/80 text-gray-900 dark:text-gray-100"
                              placeholder="Chat title..."
                            />
                            <button
                              onClick={() => handleSaveEdit(session.id)}
                              className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-800/60 transition-all duration-200 hover:scale-110"
                              aria-label="Save title"
                            >
                              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-red-100 dark:hover:bg-red-800/60 transition-all duration-200 hover:scale-110"
                              aria-label="Cancel"
                            >
                              <X className="h-4 w-4 text-red-600 dark:text-red-300" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="relative overflow-visible">
                              <SidebarMenuButton
                                onClick={() => onSelectSession(session.id)}
                                className={cn(
                                  "w-full py-3 pl-4 pr-4 transition-all duration-300 hover:shadow-md rounded-xl",
                                  currentSessionId === session.id 
                                    ? "bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 dark:from-indigo-800/80 dark:via-purple-800/80 dark:to-pink-800/80 border-l-4 border-l-indigo-500 dark:border-l-indigo-300 shadow-lg font-semibold" 
                                    : "bg-white/70 dark:bg-slate-700/60 hover:bg-gradient-to-r hover:from-white hover:via-indigo-50/50 hover:to-purple-50/50 dark:hover:from-slate-700/80 dark:hover:via-indigo-800/60 dark:hover:to-purple-800/60 border-l-4 border-l-transparent hover:border-l-indigo-300 dark:hover:border-l-indigo-600"
                                )}
                                data-testid={`session-${session.id}`}
                              >
                                <MessageSquare className={cn(
                                  "h-4 w-4 shrink-0 transition-all duration-300",
                                  currentSessionId === session.id ? "text-indigo-600 dark:text-indigo-200 scale-110" : "text-gray-500 dark:text-gray-300 group-hover:text-indigo-500 dark:group-hover:text-indigo-300"
                                )} />
                                <span className={cn(
                                  "text-sm truncate block transition-all duration-200",
                                  currentSessionId === session.id ? "font-semibold text-indigo-900 dark:text-indigo-50" : "font-medium text-gray-700 dark:text-gray-200"
                                )}>
                                  {session.title}
                                </span>
                              </SidebarMenuButton>
                              
                              {/* Gradient Fade - Covers text on right side - ONLY ON HOVER */}
                              <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white via-white/80 to-transparent dark:from-slate-700 dark:via-slate-700/80 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none rounded-r-xl" />
                              
                              {/* Overlay Action Buttons - Float on top of text - ONLY ON HOVER */}
                              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 bg-gradient-to-r from-white/98 via-indigo-50/98 to-purple-50/98 dark:from-slate-800/98 dark:via-indigo-900/98 dark:to-purple-900/98 rounded-lg shadow-2xl border-2 border-indigo-300/90 dark:border-indigo-500/90 p-1 backdrop-blur-xl z-[100] scale-90 group-hover:scale-100 pointer-events-none group-hover:pointer-events-auto">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDownloadSession(session.id);
                                  }}
                                  className="h-7 w-7 flex items-center justify-center rounded-md bg-white/80 dark:bg-slate-700/80 hover:bg-gradient-to-br hover:from-emerald-100 hover:to-teal-100 dark:hover:from-emerald-800/70 dark:hover:to-teal-800/70 text-emerald-600 dark:text-emerald-300 transition-all duration-200 hover:scale-110 hover:shadow-md active:scale-95"
                                  data-testid={`button-download-session-${session.id}`}
                                  aria-label="Download chat"
                                  title="Download chat"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={(e) => handleStartEdit(session, e)}
                                  className="h-7 w-7 flex items-center justify-center rounded-md bg-white/80 dark:bg-slate-700/80 hover:bg-gradient-to-br hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-800/70 dark:hover:to-indigo-800/70 text-blue-600 dark:text-blue-300 transition-all duration-200 hover:scale-110 hover:shadow-md active:scale-95"
                                  data-testid={`button-edit-session-${session.id}`}
                                  aria-label="Rename session"
                                  title="Rename session"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteSession(session.id);
                                  }}
                                  className="h-7 w-7 flex items-center justify-center rounded-md bg-white/80 dark:bg-slate-700/80 hover:bg-gradient-to-br hover:from-red-100 hover:to-pink-100 dark:hover:from-red-800/70 dark:hover:to-pink-800/70 text-red-600 dark:text-red-300 transition-all duration-200 hover:scale-110 hover:shadow-md active:scale-95"
                                  data-testid={`button-delete-session-${session.id}`}
                                  aria-label="Delete session"
                                  title="Delete session"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
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
