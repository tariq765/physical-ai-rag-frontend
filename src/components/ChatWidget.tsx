import React, { useState, useRef, useEffect } from 'react';
import '../css/chatkit.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Source {
  chapter: string;
  section: string;
  url: string;
  content: string;
  score: number;
}

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hi! Ask me anything about Physical AI & Humanoid Robotics 🤖',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [conversationId, setConversationId] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Text selection handler
  useEffect(() => {
    const handleTextSelection = () => {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();
      
      if (selectedText && selectedText.length > 10) {
        setSelectedText(selectedText);
      } else {
        setSelectedText(null);
      }
    };

    document.addEventListener('selectionchange', handleTextSelection);
    return () => document.removeEventListener('selectionchange', handleTextSelection);
  }, []);

  const sendMessage = async (messageContent: string) => {
    if (!messageContent.trim()) return;

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setSources([]);

    try {
      // Backend URL - Hugging Face Space URL
      const backendUrl = 'https://tariq761-physical-ai-rag-backend.hf.space';

      // Make the API call to REST API endpoint
      const response = await fetch(`${backendUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageContent,
          selected_text: selectedText || undefined,
          conversation_id: conversationId || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Debug: Log the response
      console.log('API Response:', result);

      // Parse REST API response
      const assistantResponse = result.response || result.answer || 'No response received';
      const newConversationId = result.conversation_id || conversationId;
      
      // Update conversation ID
      if (newConversationId) {
        setConversationId(newConversationId);
      }

      // Add assistant response
      const assistantMessage: Message = {
        role: 'assistant',
        content: typeof assistantResponse === 'string' ? assistantResponse : JSON.stringify(assistantResponse),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Handle sources if available
      if (result.sources && result.sources.length > 0) {
        setSources(result.sources.map((s: any) => ({
          chapter: s.chapter || 'Unknown',
          section: s.section || '',
          url: s.url || '',
          content: s.content || '',
          score: s.score || 0,
        })));
      }

      // Clear selected text after sending
      setSelectedText(null);
      window.getSelection()?.removeAllRanges();

    } catch (error) {
      console.error('Error sending message:', error);

      const errorMessage: Message = {
        role: 'assistant',
        content: `Sorry, I encountered an error. Please check:\n1. Hugging Face Space is running\n2. GROQ_API_KEY is set in Secrets\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSelectedTextQuestion = () => {
    if (selectedText) {
      sendMessage(`Explain this: "${selectedText}"`);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button className="chat-toggle" onClick={toggleChat} aria-label="Toggle chat">
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        )}
      </button>

      {/* Chat Widget */}
      {isOpen && (
        <div className="chat-widget">
          {/* Chat Header */}
          <div className="chat-header">
            <div className="chat-header-info">
              <h3>Physical AI Assistant</h3>
              <span className="chat-status">
                <span className="status-dot"></span>
                Online
              </span>
            </div>
          </div>

          {/* Selected Text Banner */}
          {selectedText && (
            <div className="selected-text-banner">
              <span className="selected-text-label">Selected text:</span>
              <p className="selected-text-preview">
                {selectedText.length > 80 
                  ? `${selectedText.substring(0, 80)}...` 
                  : selectedText}
              </p>
              <button 
                className="ask-selected-btn"
                onClick={handleSelectedTextQuestion}
                disabled={isLoading}
              >
                Ask about this
              </button>
              <button 
                className="clear-selection-btn"
                onClick={() => {
                  setSelectedText(null);
                  window.getSelection()?.removeAllRanges();
                }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Chat Messages */}
          <div className="chat-messages">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`message ${message.role}`}
              >
                <div className="message-avatar">
                  {message.role === 'assistant' ? '🤖' : '👤'}
                </div>
                <div className="message-content">
                  <div className="message-text">
                    {message.content.split('\n').map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                  <div className="message-time">
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="message assistant">
                <div className="message-avatar">🤖</div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Sources Section */}
          {sources.length > 0 && (
            <div className="chat-sources">
              <h4>Sources:</h4>
              <div className="sources-list">
                {sources.map((source, index) => (
                  <div key={index} className="source-item">
                    <strong>{source.chapter}</strong>
                    {source.section && <span> → {source.section}</span>}
                    <a 
                      href={source.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="source-link"
                    >
                      View section →
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chat Input */}
          <form className="chat-input-form" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              className="chat-input"
              placeholder="Ask about Physical AI..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <button 
              type="submit" 
              className="chat-send-btn"
              disabled={isLoading || !input.trim()}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
