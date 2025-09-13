import React, { useState, useRef, useEffect } from 'react';
import './Chat.css';

const MessageInput = ({
  onSendMessage,
  onSendFile,
  onTyping,
  disabled = false,
  placeholder = 'Nhập tin nhắn...',
  maxLength = 2000
}) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState(null);
  
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // Handle typing detection
  useEffect(() => {
    if (isTyping && onTyping) {
      onTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        if (onTyping) {
          onTyping(false);
        }
      }, 1000);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isTyping, onTyping]);

  // Handle click outside emoji picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setMessage(value);
      setIsTyping(true);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled) return;

    try {
      await onSendMessage(trimmedMessage, replyToMessage?.message_id);
      setMessage('');
      setReplyToMessage(null);
      setIsTyping(false);
      if (onTyping) {
        onTyping(false);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    files.forEach(file => {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File quá lớn. Kích thước tối đa là 10MB.');
        return;
      }

      // Validate file type
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain', 'application/zip', 'application/x-rar-compressed'
      ];

      if (!allowedTypes.includes(file.type)) {
        alert('Loại file không được hỗ trợ.');
        return;
      }

      handleSendFile(file);
    });

    // Reset file input
    e.target.value = '';
    setShowFileMenu(false);
  };

  const handleSendFile = async (file) => {
    try {
      await onSendFile(file, message.trim() || '');
      setMessage('');
      setReplyToMessage(null);
    } catch (error) {
      console.error('Failed to send file:', error);
    }
  };

  const handleEmojiSelect = (emoji) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const handleImagePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let item of items) {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          handleSendFile(file);
        }
        break;
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      files.forEach(file => handleSendFile(file));
    }
  };

  const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
    '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
    '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
    '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
    '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠',
    '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨',
    '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥',
    '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧',
    '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
    '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑',
    '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻',
    '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸',
    '😹', '😻', '😼', '😽', '🙀', '😿', '😾'
  ];

  return (
    <div className="message-input">
      {/* Reply Preview */}
      {replyToMessage && (
        <div className="reply-preview">
          <div className="reply-content">
            <div className="reply-header">
              <i className="fas fa-reply"></i>
              <span>Trả lời {replyToMessage.sender?.name || 'Ai đó'}</span>
              <button
                className="btn-close btn-close-sm"
                onClick={() => setReplyToMessage(null)}
              ></button>
            </div>
            <div className="reply-message">
              {replyToMessage.content}
            </div>
          </div>
        </div>
      )}

      {/* Input Container */}
      <div 
        className="input-container"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* File Upload Button */}
        <div className="input-actions">
          <button
            className="btn btn-link action-btn"
            onClick={() => setShowFileMenu(!showFileMenu)}
            disabled={disabled}
            title="Đính kèm file"
          >
            <i className="fa-solid fa-paperclip"></i>
          </button>

          {/* File Menu */}
          {showFileMenu && (
            <div className="file-menu">
              <button
                className="file-menu-item"
                onClick={() => fileInputRef.current?.click()}
              >
                <i className="fas fa-image"></i>
                <span>Hình ảnh</span>
              </button>
              <button
                className="file-menu-item"
                onClick={() => fileInputRef.current?.click()}
              >
                <i className="fas fa-file"></i>
                <span>Tài liệu</span>
              </button>
              <button
                className="file-menu-item"
                onClick={() => fileInputRef.current?.click()}
              >
                <i className="fas fa-camera"></i>
                <span>Chụp ảnh</span>
              </button>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>

        {/* Text Input */}
        <div className="text-input-container">
          <textarea
            ref={textareaRef}
            className="message-textarea"
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            onPaste={handleImagePaste}
            placeholder='Nhập tin nhắn...'
            disabled={disabled}
            rows={1}
            maxLength={maxLength}
          />
          
          {/* Character Count */}
          {message.length > maxLength * 0.8 && (
            <div className="character-count">
              {message.length}/{maxLength}
            </div>
          )}
        </div>

        {/* Emoji Button */}
        <div className="input-actions">
          <button
            className="btn btn-link action-btn"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={disabled}
            title="Emoji"
          >
            <i className="fa-regular fa-face-smile"></i>
          </button>

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div ref={emojiPickerRef} className="emoji-picker">
              <div className="emoji-grid">
                {emojis.map((emoji, index) => (
                  <button
                    key={index}
                    className="emoji-item"
                    onClick={() => handleEmojiSelect(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Send Button */}
        <div className="input-actions">
          <button
            className="btn btn-primary send-btn"
            onClick={handleSendMessage}
            disabled={!message.trim() || disabled}
            title="Gửi tin nhắn"
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
