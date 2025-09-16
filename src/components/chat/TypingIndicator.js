import React from 'react';
import './Chat.css';

const TypingIndicator = ({ typingUsers, conversation }) => {
  if (!typingUsers || typingUsers.length === 0) {
    return null;
  }

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].userName} đang nhập...`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].userName} và ${typingUsers[1].userName} đang nhập...`;
    } else {
      return `${typingUsers[0].userName} và ${typingUsers.length - 1} người khác đang nhập...`;
    }
  };

  return (
    <div className="typing-indicator">
      <div className="typing-bubble">
        <div className="typing-dots">
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
        </div>
        <div className="typing-text">
          {getTypingText()}
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
