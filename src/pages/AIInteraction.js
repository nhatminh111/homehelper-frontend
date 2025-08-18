import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faRobot, 
  faPaperPlane, 
  faMicrophone,
  faTimes,
  faSearch,
  faLightbulb,
  faQuestion,
  faInfo,
  faThumbsUp,
  faThumbsDown,
  faCopy,
  faHistory,
  faCog,
  faUser,
  faComments,
  faBook,
  faTools,
  faCalendar,
  faDollarSign,
  faCreditCard
} from '@fortawesome/free-solid-svg-icons';

const AIInteraction = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: 'Hello! I\'m your AI cleaning assistant. How can I help you today? I can help you with booking services, finding taskers, cleaning tips, and more!',
      timestamp: new Date().toLocaleTimeString(),
      suggestions: ['Book a cleaning service', 'Find a tasker', 'Cleaning tips', 'Pricing information']
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const quickQuestions = [
    'How do I book a cleaning service?',
    'What are your pricing rates?',
    'How do I become a tasker?',
    'What cleaning services do you offer?',
    'How do I cancel a booking?',
    'What payment methods do you accept?'
  ];

  const handleSendMessage = (message) => {
    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      content: message,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        type: 'ai',
        content: getAIResponse(message),
        timestamp: new Date().toLocaleTimeString(),
        suggestions: ['More questions', 'Book now', 'View services']
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const getAIResponse = (message) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('book') || lowerMessage.includes('service')) {
      return 'To book a cleaning service, you can:\n1. Go to our "Find Cleaners" page\n2. Search for available taskers in your area\n3. Select a tasker and choose your preferred time\n4. Complete the booking process\n\nWould you like me to help you find available taskers?';
    } else if (lowerMessage.includes('price') || lowerMessage.includes('rate')) {
      return 'Our pricing varies based on the service type and tasker experience:\n• House Cleaning: $20-35/hour\n• Deep Cleaning: $25-45/hour\n• Kitchen Cleaning: $15-30/hour\n• Window Cleaning: $20-40/hour\n\nPrices may vary by location and tasker. Would you like to see detailed pricing?';
    } else if (lowerMessage.includes('tasker') || lowerMessage.includes('become')) {
      return 'To become a tasker:\n1. Click "Register as Tasker" on our website\n2. Fill out the application form\n3. Submit required documents\n4. Complete background check\n5. Start accepting jobs!\n\nWould you like me to guide you through the registration process?';
    } else if (lowerMessage.includes('cancel') || lowerMessage.includes('booking')) {
      return 'To cancel a booking:\n1. Go to your "My Tasks" page\n2. Find the booking you want to cancel\n3. Click "Cancel" and provide a reason\n4. Cancellation policies apply based on timing\n\nNeed help with a specific booking?';
    } else if (lowerMessage.includes('payment') || lowerMessage.includes('pay')) {
      return 'We accept multiple payment methods:\n• Credit/Debit Cards\n• Digital Wallets (PayPal, Apple Pay)\n• Bank Transfers\n• Cash (for some services)\n\nAll payments are secure and processed through our platform.';
    } else {
      return 'I\'m here to help! You can ask me about:\n• Booking cleaning services\n• Finding taskers\n• Pricing information\n• Becoming a tasker\n• Payment methods\n• Cleaning tips\n\nWhat would you like to know more about?';
    }
  };

  const handleSuggestionClick = (suggestion) => {
    handleSendMessage(suggestion);
  };

  const handleQuickQuestion = (question) => {
    handleSendMessage(question);
  };

  return (
    <div className="ai-interaction-container">
      {/* Header */}
      <div className="page-header bg-white shadow-sm">
        <div className="container">
          <div className="row align-items-center py-4">
            <div className="col-md-6">
              <h1 className="mb-0">
                <FontAwesomeIcon icon={faRobot} className="text-primary mr-2" />
                AI Assistant
              </h1>
              <p className="text-muted mb-0">Get instant help and answers to your questions</p>
            </div>
            <div className="col-md-6 text-right">
              <button className="btn btn-outline-primary mr-2">
                <FontAwesomeIcon icon={faHistory} className="mr-2" />
                Chat History
              </button>
              <button className="btn btn-outline-secondary">
                <FontAwesomeIcon icon={faCog} className="mr-2" />
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-4">
        <div className="row">
          {/* Left Column - Chat Interface */}
          <div className="col-lg-8">
            <div className="chat-container bg-white rounded shadow-sm">
              {/* Chat Header */}
              <div className="chat-header p-3 border-bottom">
                <div className="d-flex align-items-center">
                  <div className="ai-avatar mr-3">
                    <FontAwesomeIcon icon={faRobot} className="text-primary" />
                  </div>
                  <div>
                    <h6 className="mb-0">AI Cleaning Assistant</h6>
                    <small className="text-success">
                      <span className="status-dot"></span>
                      Online
                    </small>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="chat-messages p-3" style={{ height: '500px', overflowY: 'auto' }}>
                {messages.map((message) => (
                  <div key={message.id} className={`message ${message.type === 'user' ? 'user-message' : 'ai-message'} mb-3`}>
                    <div className="message-content">
                      <div className="message-bubble">
                        <p className="mb-2">{message.content}</p>
                        <small className="text-muted">{message.timestamp}</small>
                      </div>
                      
                      {message.suggestions && (
                        <div className="message-suggestions mt-2">
                          {message.suggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              className="btn btn-sm btn-outline-primary mr-2 mb-1"
                              onClick={() => handleSuggestionClick(suggestion)}
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {message.type === 'ai' && (
                        <div className="message-actions mt-2">
                          <button className="btn btn-sm btn-link p-0 mr-2">
                            <FontAwesomeIcon icon={faThumbsUp} className="text-success" />
                          </button>
                          <button className="btn btn-sm btn-link p-0 mr-2">
                            <FontAwesomeIcon icon={faThumbsDown} className="text-danger" />
                          </button>
                          <button className="btn btn-sm btn-link p-0">
                            <FontAwesomeIcon icon={faCopy} className="text-muted" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="message ai-message mb-3">
                    <div className="message-content">
                      <div className="message-bubble">
                        <div className="typing-indicator">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                        <small className="text-muted">AI is typing...</small>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="chat-input p-3 border-top">
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Type your message..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && inputMessage.trim()) {
                        handleSendMessage(inputMessage);
                      }
                    }}
                  />
                  <div className="input-group-append">
                    <button className="btn btn-outline-secondary">
                      <FontAwesomeIcon icon={faMicrophone} />
                    </button>
                    <button 
                      className="btn btn-primary"
                      onClick={() => inputMessage.trim() && handleSendMessage(inputMessage)}
                    >
                      <FontAwesomeIcon icon={faPaperPlane} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Quick Actions & Help */}
          <div className="col-lg-4">
            {/* Quick Questions */}
            <div className="quick-questions bg-white rounded shadow-sm p-4 mb-4">
              <h6 className="mb-3">
                <FontAwesomeIcon icon={faQuestion} className="mr-2" />
                Quick Questions
              </h6>
              <div className="quick-questions-list">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    className="btn btn-outline-secondary btn-sm btn-block text-left mb-2"
                    onClick={() => handleQuickQuestion(question)}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Features */}
            <div className="ai-features bg-white rounded shadow-sm p-4 mb-4">
              <h6 className="mb-3">
                <FontAwesomeIcon icon={faLightbulb} className="mr-2" />
                What I Can Help With
              </h6>
              <div className="feature-list">
                <div className="feature-item d-flex align-items-center mb-2">
                  <FontAwesomeIcon icon={faCalendar} className="text-primary mr-2" />
                  <span>Book cleaning services</span>
                </div>
                <div className="feature-item d-flex align-items-center mb-2">
                  <FontAwesomeIcon icon={faUser} className="text-primary mr-2" />
                  <span>Find taskers</span>
                </div>
                <div className="feature-item d-flex align-items-center mb-2">
                  <FontAwesomeIcon icon={faDollarSign} className="text-primary mr-2" />
                  <span>Pricing information</span>
                </div>
                <div className="feature-item d-flex align-items-center mb-2">
                  <FontAwesomeIcon icon={faTools} className="text-primary mr-2" />
                  <span>Cleaning tips</span>
                </div>
                <div className="feature-item d-flex align-items-center mb-2">
                  <FontAwesomeIcon icon={faCreditCard} className="text-primary mr-2" />
                  <span>Payment help</span>
                </div>
                <div className="feature-item d-flex align-items-center">
                  <FontAwesomeIcon icon={faBook} className="text-primary mr-2" />
                  <span>Service information</span>
                </div>
              </div>
            </div>

            {/* Help Resources */}
            <div className="help-resources bg-white rounded shadow-sm p-4">
              <h6 className="mb-3">
                <FontAwesomeIcon icon={faInfo} className="mr-2" />
                Help Resources
              </h6>
              <div className="resource-list">
                <a href="#" className="resource-item d-flex align-items-center mb-2 text-decoration-none">
                  <FontAwesomeIcon icon={faBook} className="text-primary mr-2" />
                  <span>User Guide</span>
                </a>
                <a href="#" className="resource-item d-flex align-items-center mb-2 text-decoration-none">
                  <FontAwesomeIcon icon={faComments} className="text-primary mr-2" />
                  <span>Contact Support</span>
                </a>
                <a href="#" className="resource-item d-flex align-items-center mb-2 text-decoration-none">
                  <FontAwesomeIcon icon={faQuestion} className="text-primary mr-2" />
                  <span>FAQ</span>
                </a>
                <a href="#" className="resource-item d-flex align-items-center text-decoration-none">
                  <FontAwesomeIcon icon={faTools} className="text-primary mr-2" />
                  <span>Troubleshooting</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .ai-interaction-container {
          background-color: #f8f9fa;
          min-height: 100vh;
        }
        
        .page-header {
          border-bottom: 1px solid #e9ecef;
        }
        
        .ai-avatar {
          width: 40px;
          height: 40px;
          background-color: #e3f2fd;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
        }
        
        .status-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          background-color: #28a745;
          border-radius: 50%;
          margin-right: 5px;
        }
        
        .message {
          display: flex;
          margin-bottom: 1rem;
        }
        
        .user-message {
          justify-content: flex-end;
        }
        
        .ai-message {
          justify-content: flex-start;
        }
        
        .message-content {
          max-width: 70%;
        }
        
        .message-bubble {
          padding: 12px 16px;
          border-radius: 18px;
          position: relative;
        }
        
        .user-message .message-bubble {
          background-color: #007bff;
          color: white;
        }
        
        .ai-message .message-bubble {
          background-color: #f8f9fa;
          border: 1px solid #e9ecef;
        }
        
        .message-suggestions {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }
        
        .message-actions {
          display: flex;
          gap: 10px;
        }
        
        .typing-indicator {
          display: flex;
          gap: 4px;
          margin-bottom: 8px;
        }
        
        .typing-indicator span {
          width: 8px;
          height: 8px;
          background-color: #6c757d;
          border-radius: 50%;
          animation: typing 1.4s infinite ease-in-out;
        }
        
        .typing-indicator span:nth-child(1) {
          animation-delay: -0.32s;
        }
        
        .typing-indicator span:nth-child(2) {
          animation-delay: -0.16s;
        }
        
        @keyframes typing {
          0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .feature-item,
        .resource-item {
          font-size: 0.9rem;
          color: #6c757d;
        }
        
        .resource-item:hover {
          color: #007bff;
        }
        
        .quick-questions-list .btn {
          font-size: 0.85rem;
          padding: 8px 12px;
        }
      `}</style>
    </div>
  );
};

export default AIInteraction;
