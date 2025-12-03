import React, { useState, useRef, useEffect, useCallback } from 'react';
import './ChatBot.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Xin chào! 👋 Tôi là trợ lý AI của HomeHelper. Tôi có thể giúp bạn tìm hiểu về dịch vụ dọn dẹp, cách đặt lịch, hoặc bất kỳ thắc mắc nào. Bạn cần hỗ trợ gì ạ?',
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async () => {
    const message = inputValue.trim();
    
    if (!message || isLoading) return;

    // Validate message length
    if (message.length > 1000) {
      setError('Tin nhắn quá dài (tối đa 1000 ký tự)');
      return;
    }

    setError(null);
    setInputValue('');
    
    // Add user message to chat
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Prepare conversation history (exclude the initial greeting)
      const conversationHistory = messages
        .slice(1) // Skip initial greeting
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      const response = await fetch(`${API_BASE_URL}/chatbot/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationHistory
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra');
      }

      // Add AI response to chat
      const aiMessage = {
        role: 'assistant',
        content: data.data.message,
        timestamp: data.data.timestamp
      };
      setMessages(prev => [...prev, aiMessage]);

    } catch (err) {
      console.error('Chatbot error:', err);
      setError(err.message || 'Không thể kết nối. Vui lòng thử lại.');
      
      // Add error message to chat
      const errorMessage = {
        role: 'assistant',
        content: '❌ ' + (err.message || 'Xin lỗi, tôi không thể trả lời lúc này. Vui lòng thử lại sau.'),
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Xin chào! 👋 Tôi là trợ lý AI của HomeHelper. Tôi có thể giúp bạn tìm hiểu về dịch vụ dọn dẹp, cách đặt lịch, hoặc bất kỳ thắc mắc nào. Bạn cần hỗ trợ gì ạ?',
        timestamp: new Date().toISOString()
      }
    ]);
    setError(null);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Quick actions
  const quickActions = [
    { label: '📋 Dịch vụ', message: 'Các dịch vụ của HomeHelper là gì?' },
    { label: '📅 Đặt lịch', message: 'Làm sao để đặt lịch dịch vụ?' },
    { label: '💰 Giá cả', message: 'Giá dịch vụ như thế nào?' },
    { label: '👨‍🔧 Tasker', message: 'Làm sao để trở thành Tasker?' },
  ];

  const handleQuickAction = (message) => {
    setInputValue(message);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="chatbot-container">
      {/* Toggle Button */}
      <button 
        className={`chatbot-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Đóng chat' : 'Mở chat hỗ trợ'}
      >
        {isOpen ? (
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
            <circle cx="12" cy="10" r="1.5"/>
            <circle cx="8" cy="10" r="1.5"/>
            <circle cx="16" cy="10" r="1.5"/>
          </svg>
        )}
        {!isOpen && (
          <span className="chatbot-badge">AI</span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">
                <span>🤖</span>
              </div>
              <div>
                <h4>HomeHelper AI</h4>
                <span className="chatbot-status">
                  <span className="status-dot"></span>
                  Đang hoạt động
                </span>
              </div>
            </div>
            <div className="chatbot-header-actions">
              <button 
                onClick={clearChat} 
                className="chatbot-clear-btn"
                title="Xóa cuộc trò chuyện"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
              </button>
              <button 
                onClick={() => setIsOpen(false)} 
                className="chatbot-close-btn"
                title="Đóng"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`chatbot-message ${msg.role === 'user' ? 'user' : 'assistant'} ${msg.isError ? 'error' : ''}`}
              >
                {msg.role === 'assistant' && (
                  <div className="message-avatar">🤖</div>
                )}
                <div className="message-content">
                  <p>{msg.content}</p>
                  <span className="message-time">{formatTime(msg.timestamp)}</span>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="chatbot-message assistant">
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

          {/* Quick Actions */}
          {messages.length <= 2 && (
            <div className="chatbot-quick-actions">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action.message)}
                  className="quick-action-btn"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="chatbot-error">
              {error}
            </div>
          )}

          {/* Input */}
          <div className="chatbot-input-container">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập tin nhắn..."
              disabled={isLoading}
              maxLength={1000}
            />
            <button 
              onClick={sendMessage} 
              disabled={!inputValue.trim() || isLoading}
              className="send-btn"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>

          {/* Footer */}
          <div className="chatbot-footer">
            Powered by Gemini AI
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;


