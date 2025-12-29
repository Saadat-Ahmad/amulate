import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Loader, Bot, User, Lightbulb, Package } from 'lucide-react';
import './HugoAI.css';

const EXAMPLE_QUESTIONS = [
  "How many S2_V1 scooters can we build right now?",
  "Which materials are running low on stock?",
  "What's our current inventory value?",
  "Show me supplier performance",
  "What are the critical alerts?",
  "Calculate build capacity for all models",
  "Which parts need reordering?",
  "Show me stockout risks for the next 30 days"
];

function HugoAI() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm Hugo, your AI procurement assistant for Voltway Electric Scooters. I can help you with:\n\n• Inventory analysis and stock levels\n• Build capacity calculations\n• Supplier performance tracking\n• Reorder recommendations\n• Risk assessment and alerts\n\nWhat would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      console.error('Error:', error);
      
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please ensure the backend is running on http://localhost:8000',
        timestamp: new Date(),
        error: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
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

  return (
    <div className="hugo-ai-page">
      <div className="page-header">
        <div>
          <h1>
            <Bot size={28} />
            Hugo AI Assistant
          </h1>
          <p>Ask me anything about your procurement operations</p>
        </div>
      </div>

      <div className="chat-container">
        <div className="messages">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.role} ${message.error ? 'error' : ''}`}>
              <div className="message-avatar">
                {message.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className="message-content">
                <div className="message-text">
                  {message.content.split('\n').map((line, i) => {
                    if (line.startsWith('•')) {
                      return <li key={i}>{line.replace('•', '').trim()}</li>;
                    }
                    return line ? <span key={i}>{line}<br/></span> : <br key={i}/>;
                  })}
                </div>
                {message.data && (
                  <div className="message-data">
                    <details>
                      <summary>
                        <Package size={14} />
                        View Data ({Object.keys(message.data).length} items)
                      </summary>
                      <pre>{JSON.stringify(message.data, null, 2)}</pre>
                    </details>
                  </div>
                )}
                <div className="message-time">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                  <span>Hugo is analyzing...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {messages.length === 1 && !loading && (
          <div className="examples">
            <p className="examples-title">
              <Lightbulb size={16} />
              Try asking Hugo:
            </p>
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
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="send-button"
          >
            {loading ? <Loader className="spinner" size={20} /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default HugoAI;