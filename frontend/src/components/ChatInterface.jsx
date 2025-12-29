import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Loader, Bot, User, AlertCircle } from 'lucide-react';
import './ChatInterface.css';

const EXAMPLE_QUESTIONS = [
  "How many S2_V1 scooters can we build right now?",
  "Which materials are running low on stock?",
  "What's our current inventory value?",
  "Show me supplier performance",
  "What are the critical alerts I should know about?",
  "Calculate build capacity for all scooter models",
  "Which materials need reordering?",
  "Show me stockout risks for the next 30 days",
];

function ChatInterface() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm Hugo, your AI procurement assistant for Voltway Electric Scooters. I can help you with:\n\n• Inventory analysis and stock levels\n• Build capacity calculations\n• Supplier performance tracking\n• Reorder recommendations\n• Risk assessment and alerts\n\nWhat would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/chat', {
        question: input.trim()
      });

      const assistantMessage = {
        role: 'assistant',
        content: response.data.answer,
        data: response.data.data,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      let errorContent = 'Sorry, I encountered an error processing your request. ';
      
      if (error.response) {
        errorContent += `Server error: ${error.response.status}. `;
        if (error.response.data?.detail) {
          errorContent += error.response.data.detail;
        }
      } else if (error.request) {
        errorContent += 'Unable to connect to the server. Please make sure the backend is running.';
      } else {
        errorContent += error.message;
      }

      const errorMessage = {
        role: 'assistant',
        content: errorContent,
        timestamp: new Date(),
        error: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setError(errorContent);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleExampleClick = (question) => {
    setInput(question);
  };

  const formatMessageContent = (content) => {
    // Split content by newlines and format
    return content.split('\n').map((line, i) => {
      // Check if line starts with bullet point
      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        return <li key={i}>{line.replace(/^[•-]\s*/, '')}</li>;
      }
      // Check if line looks like a header (ends with :)
      if (line.trim().endsWith(':') && line.length < 50) {
        return <strong key={i}>{line}<br/></strong>;
      }
      return line ? <span key={i}>{line}<br/></span> : <br key={i}/>;
    });
  };

  const renderDataPreview = (data) => {
    if (!data) return null;

    // Create a simplified preview of the data
    const preview = {};
    let itemCount = 0;

    for (const [key, value] of Object.entries(data)) {
      if (itemCount >= 5) break; // Limit preview items
      
      if (Array.isArray(value)) {
        preview[key] = `Array (${value.length} items)`;
      } else if (typeof value === 'object' && value !== null) {
        preview[key] = 'Object {...}';
      } else {
        preview[key] = value;
      }
      itemCount++;
    }

    return preview;
  };

  return (
    <div className="chat-interface">
      <div className="chat-container">
        <div className="messages">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.role} ${message.error ? 'error' : ''}`}>
              <div className="message-avatar">
                {message.role === 'user' ? (
                  <User size={20} />
                ) : message.error ? (
                  <AlertCircle size={20} />
                ) : (
                  <Bot size={20} />
                )}
              </div>
              <div className="message-content">
                <div className="message-text">
                  {formatMessageContent(message.content)}
                </div>
                {message.data && (
                  <div className="message-data">
                    <details>
                      <summary>📊 View Data ({Object.keys(message.data).length} items)</summary>
                      <div className="data-preview">
                        <pre>{JSON.stringify(renderDataPreview(message.data), null, 2)}</pre>
                      </div>
                      <details className="data-full">
                        <summary>Show Full Data</summary>
                        <pre>{JSON.stringify(message.data, null, 2)}</pre>
                      </details>
                    </details>
                  </div>
                )}
                <div className="message-time">
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="message assistant">
              <div className="message-avatar">
                <Bot size={20} />
              </div>
              <div className="message-content">
                <div className="typing-indicator">
                  <Loader className="spinner" size={16} />
                  <span>Hugo is analyzing your request...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {messages.length === 1 && !loading && (
          <div className="examples">
            <p className="examples-title">💡 Try asking Hugo:</p>
            <div className="examples-grid">
              {EXAMPLE_QUESTIONS.map((question, index) => (
                <button
                  key={index}
                  className="example-button"
                  onClick={() => handleExampleClick(question)}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="input-container">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask Hugo anything about inventory, suppliers, build capacity..."
            rows={1}
            disabled={loading}
            className={error ? 'error' : ''}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="send-button"
            title="Send message (Enter)"
          >
            {loading ? <Loader className="spinner" size={20} /> : <Send size={20} />}
          </button>
        </div>

        {error && (
          <div className="error-banner">
            <AlertCircle size={16} />
            <span>Connection issue. Make sure backend is running at http://localhost:8000</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatInterface;