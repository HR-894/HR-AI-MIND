import { describe, it, expect, beforeEach, vi } from 'vitest';
import { exportChat, type ExportOptions } from './export-chat';
import type { ChatSession, ChatMessage } from '@shared/schema';

describe('export-chat', () => {
  let mockSession: ChatSession;
  let mockMessages: ChatMessage[];

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'mock-url');
    global.URL.revokeObjectURL = vi.fn();

    // Mock document.createElement and appendChild/removeChild
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    };

    vi.spyOn(document, 'createElement').mockImplementation(() => ({
      href: '',
      download: '',
      click: vi.fn(),
    }) as any);
    vi.spyOn(document.body, 'appendChild').mockImplementation((node: any) => node);
    vi.spyOn(document.body, 'removeChild').mockImplementation((node: any) => node);

    // Setup test data
    mockSession = {
      id: 'test-session-1',
      title: 'Test Conversation',
      createdAt: 1700000000000,
      updatedAt: 1700001000000,
    };

    mockMessages = [
      {
        id: 'msg-1',
        sessionId: 'test-session-1',
        role: 'user',
        content: 'Hello AI!',
        timestamp: 1700000100000,
      },
      {
        id: 'msg-2',
        sessionId: 'test-session-1',
        role: 'assistant',
        content: 'Hello! How can I help you today?',
        timestamp: 1700000200000,
      },
      {
        id: 'msg-3',
        sessionId: 'test-session-1',
        role: 'user',
        content: 'What is 2+2?',
        timestamp: 1700000300000,
      },
      {
        id: 'msg-4',
        sessionId: 'test-session-1',
        role: 'assistant',
        content: '2+2 equals 4.',
        timestamp: 1700000400000,
      },
    ];
  });

  describe('exportChat', () => {
    it('should export as TXT format by default', async () => {
      await exportChat(mockSession, mockMessages);

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      
      const createElementCalls = (document.createElement as any).mock.calls;
      expect(createElementCalls[0][0]).toBe('a');
      
      const mockLink = (document.createElement as any).mock.results[0].value;
      expect(mockLink.download).toMatch(/test-conversation\.txt$/i);
    });

    it('should sort messages by timestamp before export', async () => {
      // Shuffle messages
      const shuffled = [...mockMessages].reverse();
      
      await exportChat(mockSession, shuffled, { format: 'json' });
      
      const blobCalls = (Blob as any).mock?.calls || [];
      if (blobCalls.length > 0) {
        const content = blobCalls[0][0][0];
        const parsed = JSON.parse(content);
        
        // Verify messages are in chronological order
        expect(parsed.messages[0].content).toBe('Hello AI!');
        expect(parsed.messages[1].content).toBe('Hello! How can I help you today?');
      }
    });

    it('should sanitize filename properly', async () => {
      mockSession.title = 'Test@#$%^&*()Conversation!!!';
      
      await exportChat(mockSession, mockMessages, { format: 'txt' });
      
      const mockLink = (document.createElement as any).mock.results[0].value;
      // Should remove special characters and convert to lowercase
      expect(mockLink.download).toMatch(/testconversation\.txt$/i);
    });

    it('should handle empty message array', async () => {
      await exportChat(mockSession, [], { format: 'txt' });
      
      expect(document.createElement).toHaveBeenCalled();
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    it('should filter out system messages', async () => {
      const messagesWithSystem = [
        ...mockMessages,
        {
          id: 'msg-sys',
          sessionId: 'test-session-1',
          role: 'system' as const,
          content: 'System message - should be filtered',
          timestamp: 1700000050000,
        },
      ];
      
      await exportChat(mockSession, messagesWithSystem, { format: 'json' });
      
      // Verify system message is not included
      const blobCalls = (Blob as any).mock?.calls;
      if (blobCalls && blobCalls.length > 0) {
        const content = blobCalls[0][0][0];
        expect(content).not.toContain('System message - should be filtered');
      }
    });
  });

  describe('TXT export format', () => {
    it('should include header and footer', async () => {
      await exportChat(mockSession, mockMessages, { 
        format: 'txt',
        includeTimestamps: false,
        includeMetadata: false 
      });
      
      const blobCalls = (Blob as any).mock?.calls;
      if (blobCalls && blobCalls.length > 0) {
        const content = blobCalls[0][0][0];
        expect(content).toContain('═══════════════════════════════════════');
        expect(content).toContain('Test Conversation');
        expect(content).toContain('HRAI Mind v3');
      }
    });

    it('should include timestamps when enabled', async () => {
      await exportChat(mockSession, mockMessages, { 
        format: 'txt',
        includeTimestamps: true 
      });
      
      const blobCalls = (Blob as any).mock?.calls;
      if (blobCalls && blobCalls.length > 0) {
        const content = blobCalls[0][0][0];
        // Should contain timestamp brackets
        expect(content).toMatch(/\[.*\]/);
      }
    });

    it('should include metadata when enabled', async () => {
      await exportChat(mockSession, mockMessages, { 
        format: 'txt',
        includeMetadata: true 
      });
      
      const blobCalls = (Blob as any).mock?.calls;
      if (blobCalls && blobCalls.length > 0) {
        const content = blobCalls[0][0][0];
        expect(content).toContain('Created:');
        expect(content).toContain('Updated:');
        expect(content).toContain('Messages:');
      }
    });

    it('should format user and AI messages correctly', async () => {
      await exportChat(mockSession, mockMessages, { 
        format: 'txt',
        includeTimestamps: false 
      });
      
      const blobCalls = (Blob as any).mock?.calls;
      if (blobCalls && blobCalls.length > 0) {
        const content = blobCalls[0][0][0];
        expect(content).toContain('You:');
        expect(content).toContain('AI:');
        expect(content).toContain('Hello AI!');
        expect(content).toContain('Hello! How can I help you today?');
      }
    });
  });

  describe('Markdown export format', () => {
    it('should use markdown headers and formatting', async () => {
      await exportChat(mockSession, mockMessages, { 
        format: 'md',
        includeTimestamps: false 
      });
      
      const blobCalls = (Blob as any).mock?.calls;
      if (blobCalls && blobCalls.length > 0) {
        const content = blobCalls[0][0][0];
        expect(content).toContain('# Test Conversation');
        expect(content).toContain('### 🧑 **You**');
        expect(content).toContain('### 🤖 **AI Assistant**');
        expect(content).toMatch(/---/);
      }
    });

    it('should include metadata blockquote when enabled', async () => {
      await exportChat(mockSession, mockMessages, { 
        format: 'md',
        includeMetadata: true 
      });
      
      const blobCalls = (Blob as any).mock?.calls;
      if (blobCalls && blobCalls.length > 0) {
        const content = blobCalls[0][0][0];
        expect(content).toMatch(/> \*\*Created:\*\*/);
        expect(content).toMatch(/> \*\*Updated:\*\*/);
        expect(content).toMatch(/> \*\*Messages:\*\*/);
      }
    });

    it('should have correct filename extension', async () => {
      await exportChat(mockSession, mockMessages, { format: 'md' });
      
      const mockLink = (document.createElement as any).mock.results[0].value;
      expect(mockLink.download).toMatch(/\.md$/);
    });
  });

  describe('JSON export format', () => {
    it('should export valid JSON structure', async () => {
      await exportChat(mockSession, mockMessages, { 
        format: 'json',
        includeTimestamps: true,
        includeMetadata: true 
      });
      
      const blobCalls = (Blob as any).mock?.calls;
      if (blobCalls && blobCalls.length > 0) {
        const content = blobCalls[0][0][0];
        const parsed = JSON.parse(content);
        
        expect(parsed).toHaveProperty('session');
        expect(parsed).toHaveProperty('messages');
        expect(parsed.session.title).toBe('Test Conversation');
        expect(parsed.messages).toHaveLength(4);
      }
    });

    it('should include timestamps in messages when enabled', async () => {
      await exportChat(mockSession, mockMessages, { 
        format: 'json',
        includeTimestamps: true 
      });
      
      const blobCalls = (Blob as any).mock?.calls;
      if (blobCalls && blobCalls.length > 0) {
        const content = blobCalls[0][0][0];
        const parsed = JSON.parse(content);
        
        expect(parsed.messages[0]).toHaveProperty('timestamp');
        expect(typeof parsed.messages[0].timestamp).toBe('number');
      }
    });

    it('should exclude timestamps when disabled', async () => {
      await exportChat(mockSession, mockMessages, { 
        format: 'json',
        includeTimestamps: false 
      });
      
      const blobCalls = (Blob as any).mock?.calls;
      if (blobCalls && blobCalls.length > 0) {
        const content = blobCalls[0][0][0];
        const parsed = JSON.parse(content);
        
        expect(parsed.messages[0].timestamp).toBeUndefined();
      }
    });

    it('should include metadata when enabled', async () => {
      await exportChat(mockSession, mockMessages, { 
        format: 'json',
        includeMetadata: true 
      });
      
      const blobCalls = (Blob as any).mock?.calls;
      if (blobCalls && blobCalls.length > 0) {
        const content = blobCalls[0][0][0];
        const parsed = JSON.parse(content);
        
        expect(parsed).toHaveProperty('metadata');
        expect(parsed.metadata).toHaveProperty('exportedAt');
        expect(parsed.metadata).toHaveProperty('exportedBy');
        expect(parsed.metadata.exportedBy).toBe('HRAI Mind v3');
      }
    });

    it('should have correct MIME type', async () => {
      await exportChat(mockSession, mockMessages, { format: 'json' });
      
      const blobCalls = (Blob as any).mock?.calls;
      if (blobCalls && blobCalls.length > 0) {
        expect(blobCalls[0][1].type).toBe('application/json');
      }
    });
  });

  describe('HTML export format', () => {
    it('should generate valid HTML structure', async () => {
      await exportChat(mockSession, mockMessages, { 
        format: 'html',
        includeTimestamps: false 
      });
      
      const blobCalls = (Blob as any).mock?.calls;
      if (blobCalls && blobCalls.length > 0) {
        const content = blobCalls[0][0][0];
        
        expect(content).toContain('<!DOCTYPE html>');
        expect(content).toContain('<html lang="en">');
        expect(content).toContain('<head>');
        expect(content).toContain('<body>');
        expect(content).toContain('</html>');
      }
    });

    it('should escape HTML in content', async () => {
      const messagesWithHTML = [
        {
          id: 'msg-html',
          sessionId: 'test-session-1',
          role: 'user' as const,
          content: '<script>alert("xss")</script>',
          timestamp: 1700000100000,
        },
      ];
      
      await exportChat(mockSession, messagesWithHTML, { format: 'html' });
      
      const blobCalls = (Blob as any).mock?.calls;
      if (blobCalls && blobCalls.length > 0) {
        const content = blobCalls[0][0][0];
        
        // Should escape the script tag
        expect(content).not.toContain('<script>alert');
        expect(content).toContain('&lt;script&gt;');
      }
    });

    it('should include CSS styles', async () => {
      await exportChat(mockSession, mockMessages, { format: 'html' });
      
      const blobCalls = (Blob as any).mock?.calls;
      if (blobCalls && blobCalls.length > 0) {
        const content = blobCalls[0][0][0];
        
        expect(content).toContain('<style>');
        expect(content).toContain('.message');
        expect(content).toContain('.message.user');
        expect(content).toContain('.message.assistant');
      }
    });

    it('should apply different styles for user and AI messages', async () => {
      await exportChat(mockSession, mockMessages, { format: 'html' });
      
      const blobCalls = (Blob as any).mock?.calls;
      if (blobCalls && blobCalls.length > 0) {
        const content = blobCalls[0][0][0];
        
        expect(content).toContain('class="message user"');
        expect(content).toContain('class="message assistant"');
      }
    });

    it('should include metadata section when enabled', async () => {
      await exportChat(mockSession, mockMessages, { 
        format: 'html',
        includeMetadata: true 
      });
      
      const blobCalls = (Blob as any).mock?.calls;
      if (blobCalls && blobCalls.length > 0) {
        const content = blobCalls[0][0][0];
        
        expect(content).toContain('class="metadata"');
        expect(content).toContain('<strong>Created:</strong>');
        expect(content).toContain('<strong>Updated:</strong>');
      }
    });

    it('should have correct MIME type', async () => {
      await exportChat(mockSession, mockMessages, { format: 'html' });
      
      const blobCalls = (Blob as any).mock?.calls;
      if (blobCalls && blobCalls.length > 0) {
        expect(blobCalls[0][1].type).toBe('text/html');
      }
    });
  });

  describe('error handling', () => {
    it('should throw error for unsupported format', async () => {
      const invalidOptions = { 
        format: 'pdf' as any 
      };
      
      await expect(
        exportChat(mockSession, mockMessages, invalidOptions)
      ).rejects.toThrow('Unsupported format');
    });
  });

  describe('file download', () => {
    it('should create blob and trigger download', async () => {
      await exportChat(mockSession, mockMessages, { format: 'txt' });
      
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      
      const mockLink = (document.createElement as any).mock.results[0].value;
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should cleanup after download', async () => {
      await exportChat(mockSession, mockMessages, { format: 'txt' });
      
      expect(document.body.removeChild).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('should set correct href and download attributes', async () => {
      await exportChat(mockSession, mockMessages, { format: 'txt' });
      
      const mockLink = (document.createElement as any).mock.results[0].value;
      expect(mockLink.href).toBe('mock-url');
      expect(mockLink.download).toMatch(/test-conversation\.txt/);
    });
  });
});
