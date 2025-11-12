import type { ChatMessage, ChatSession } from "@shared/schema";

export interface ExportOptions {
  format: "txt" | "md" | "json" | "html";
  includeTimestamps?: boolean;
  includeMetadata?: boolean;
}

export async function exportChat(
  session: ChatSession,
  messages: ChatMessage[],
  options: ExportOptions = { format: "txt", includeTimestamps: true }
): Promise<void> {
  const sortedMessages = [...messages].sort((a, b) => a.timestamp - b.timestamp);
  
  let content: string;
  let filename: string;
  let mimeType: string;

  switch (options.format) {
    case "txt":
      content = exportAsTxt(session, sortedMessages, options);
      filename = `${sanitizeFilename(session.title)}.txt`;
      mimeType = "text/plain";
      break;
    
    case "md":
      content = exportAsMarkdown(session, sortedMessages, options);
      filename = `${sanitizeFilename(session.title)}.md`;
      mimeType = "text/markdown";
      break;
    
    case "json":
      content = exportAsJson(session, sortedMessages, options);
      filename = `${sanitizeFilename(session.title)}.json`;
      mimeType = "application/json";
      break;
    
    case "html":
      content = exportAsHtml(session, sortedMessages, options);
      filename = `${sanitizeFilename(session.title)}.html`;
      mimeType = "text/html";
      break;
    
    default:
      throw new Error(`Unsupported format: ${options.format}`);
  }

  // Create and download file
  downloadFile(content, filename, mimeType);
}

function exportAsTxt(
  session: ChatSession,
  messages: ChatMessage[],
  options: ExportOptions
): string {
  let content = "";
  
  // Header
  content += `═══════════════════════════════════════\n`;
  content += `   ${session.title}\n`;
  content += `═══════════════════════════════════════\n\n`;
  
  if (options.includeMetadata) {
    content += `Created: ${new Date(session.createdAt).toLocaleString()}\n`;
    content += `Updated: ${new Date(session.updatedAt).toLocaleString()}\n`;
    content += `Messages: ${messages.length}\n\n`;
    content += `───────────────────────────────────────\n\n`;
  }
  
  // Messages
  messages.forEach((msg) => {
    if (msg.role === "system") return; // Skip system messages
    
    const role = msg.role === "user" ? "You" : "AI";
    content += `${role}`;
    
    if (options.includeTimestamps) {
      const time = new Date(msg.timestamp).toLocaleTimeString();
      content += ` [${time}]`;
    }
    
    content += `:\n${msg.content}\n\n`;
  });
  
  // Footer
  content += `───────────────────────────────────────\n`;
  content += `Exported from HRAI Mind v3\n`;
  content += `${new Date().toLocaleString()}\n`;
  
  return content;
}

function exportAsMarkdown(
  session: ChatSession,
  messages: ChatMessage[],
  options: ExportOptions
): string {
  let content = "";
  
  // Header
  content += `# ${session.title}\n\n`;
  
  if (options.includeMetadata) {
    content += `> **Created:** ${new Date(session.createdAt).toLocaleString()}  \n`;
    content += `> **Updated:** ${new Date(session.updatedAt).toLocaleString()}  \n`;
    content += `> **Messages:** ${messages.length}\n\n`;
    content += `---\n\n`;
  }
  
  // Messages
  messages.forEach((msg, index) => {
    if (msg.role === "system") return;
    
    const role = msg.role === "user" ? "🧑 **You**" : "🤖 **AI Assistant**";
    
    content += `### ${role}`;
    
    if (options.includeTimestamps) {
      const time = new Date(msg.timestamp).toLocaleString();
      content += ` _${time}_`;
    }
    
    content += `\n\n`;
    content += `${msg.content}\n\n`;
    
    if (index < messages.length - 1) {
      content += `---\n\n`;
    }
  });
  
  // Footer
  content += `\n---\n\n`;
  content += `_Exported from HRAI Mind v3 on ${new Date().toLocaleString()}_\n`;
  
  return content;
}

function exportAsJson(
  session: ChatSession,
  messages: ChatMessage[],
  options: ExportOptions
): string {
  const exportData = {
    session: {
      title: session.title,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    },
    messages: messages
      .filter(msg => msg.role !== "system")
      .map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: options.includeTimestamps ? msg.timestamp : undefined,
      })),
    metadata: options.includeMetadata ? {
      exportedAt: Date.now(),
      exportedBy: "HRAI Mind v3",
      messageCount: messages.length,
    } : undefined,
  };
  
  return JSON.stringify(exportData, null, 2);
}

function exportAsHtml(
  session: ChatSession,
  messages: ChatMessage[],
  options: ExportOptions
): string {
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(session.title)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }
    .container {
      background: white;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 {
      color: #667eea;
      margin-bottom: 24px;
      font-size: 32px;
      border-bottom: 3px solid #667eea;
      padding-bottom: 12px;
    }
    .metadata {
      background: #f8f9fa;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 24px;
      font-size: 14px;
      color: #666;
    }
    .message {
      margin-bottom: 24px;
      padding: 16px;
      border-radius: 12px;
      animation: fadeIn 0.3s ease-in;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .message.user {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      margin-left: 10%;
    }
    .message.assistant {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      margin-right: 10%;
    }
    .message-header {
      font-weight: 600;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .message.user .message-header { color: rgba(255,255,255,0.9); }
    .message.assistant .message-header { color: #667eea; }
    .timestamp {
      font-size: 12px;
      opacity: 0.7;
      margin-left: auto;
    }
    .message-content {
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #e9ecef;
      text-align: center;
      font-size: 14px;
      color: #666;
    }
    code {
      background: #f1f3f5;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${escapeHtml(session.title)}</h1>
`;

  if (options.includeMetadata) {
    html += `    <div class="metadata">
      <div><strong>Created:</strong> ${new Date(session.createdAt).toLocaleString()}</div>
      <div><strong>Updated:</strong> ${new Date(session.updatedAt).toLocaleString()}</div>
      <div><strong>Messages:</strong> ${messages.length}</div>
    </div>
`;
  }

  messages.forEach((msg) => {
    if (msg.role === "system") return;
    
    const roleLabel = msg.role === "user" ? "🧑 You" : "🤖 AI Assistant";
    const roleClass = msg.role === "user" ? "user" : "assistant";
    
    html += `    <div class="message ${roleClass}">
      <div class="message-header">
        <span>${roleLabel}</span>`;
    
    if (options.includeTimestamps) {
      html += `
        <span class="timestamp">${new Date(msg.timestamp).toLocaleString()}</span>`;
    }
    
    html += `
      </div>
      <div class="message-content">${escapeHtml(msg.content)}</div>
    </div>
`;
  });

  html += `    <div class="footer">
      Exported from <strong>HRAI Mind v3</strong><br>
      ${new Date().toLocaleString()}
    </div>
  </div>
</body>
</html>`;

  return html;
}

function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9\s\-_]/gi, "")
    .replace(/\s+/g, "-")
    .toLowerCase()
    .substring(0, 100);
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
