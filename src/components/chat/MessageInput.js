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
  const [selectedFiles, setSelectedFiles] = useState([]); // Preview ảnh
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // Xử lý chọn file
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newFiles = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      size: file.size
    }));

    setSelectedFiles(prev => [...prev, ...newFiles]);
    e.target.value = '';
  };

  // Xóa ảnh preview
  const removeFile = (index) => {
    setSelectedFiles(prev => {
      const removed = prev[index];
      if (removed.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Gửi tin nhắn + ảnh
  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed && selectedFiles.length === 0) return;

    try {
      // Gửi ảnh trước (nếu có)
      if (selectedFiles.length > 0) {
        const files = selectedFiles.map(f => f.file);
        await onSendFile(files, trimmed);
        // Dọn dẹp preview
        selectedFiles.forEach(f => URL.revokeObjectURL(f.preview));
        setSelectedFiles([]);
      } else {
        await onSendMessage(trimmed);
      }

      setMessage('');
    } catch (err) {
      console.error('Gửi thất bại:', err);
    }
  };

  // Typing
  useEffect(() => {
    if (message && onTyping) onTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => onTyping && onTyping(false), 1000);
  }, [message, onTyping]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="message-input">
      {/* Preview ảnh đã chọn */}
      {selectedFiles.length > 0 && (
        <div className="image-preview-container">
          <div className="image-preview-grid">
            {selectedFiles.map((item, index) => (
              <div key={index} className="image-preview-item">
                <img src={item.preview} alt="preview" />
                <button
                  className="remove-image-btn"
                  onClick={() => removeFile(index)}
                  title="Xóa ảnh"
                >
                  <svg width="12" height="12" viewBox="0 0 352 512" aria-hidden="true" focusable="false">
                    <path fill="currentColor" d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.19 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.19 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"></path>
                  </svg>
                </button>
                <div className="image-name">{item.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="input-container">
        {/* Nút đính kèm */}
        <button
          className="btn btn-link action-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          title="Gửi ảnh"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path fill="currentColor" d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14h18zm-10-7l2.5 3 3.5-4.5L20 17H4l7-5z" />
          </svg>
        </button>

        {/* Input file ẩn */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {/* Ô nhập tin nhắn */}
        <textarea
          ref={textareaRef}
          className="message-textarea"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
        />

        {/* Nút gửi */}
        <button
          className="btn btn-primary send-btn"
          onClick={handleSend}
          disabled={disabled || (!message.trim() && selectedFiles.length === 0)}
          title="Gửi"
        >
          <svg width="16" height="16" viewBox="0 0 512 512" aria-hidden="true" focusable="false">
            <path fill="currentColor" d="M476 3L12 244c-18 9-18 34 0 43l104 52 52 104c9 18 34 18 43 0L509 36c18-9 18-34 0-43L476 3z"></path>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default MessageInput;