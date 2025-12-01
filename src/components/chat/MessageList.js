import React, { useState } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import MessageItem from './MessageItem';
import './Chat.css';

const MessageList = ({
  messages,
  conversation,
  onUpdateMessage,
  onDeleteMessage
}) => {
  const [editingMessage, setEditingMessage] = useState(null);
  const [replyingToMessage, setReplyingToMessage] = useState(null);

  const buildMessageGroups = () => {
    const groups = [];
    let currentGroup = null;

    messages.forEach((msg, idx) => {
      const prev = idx > 0 ? messages[idx - 1] : null;
      const timeDiff = prev ? new Date(msg.created_at) - new Date(prev.created_at) : Infinity;

      const isImage = msg.message_type === 'image';
      const sameSender = prev && prev.sender_id === msg.sender_id;
      const veryCloseInTime = timeDiff < 2000; // dưới 2 giây → coi như gửi cùng lúc

      if (isImage && sameSender && veryCloseInTime && currentGroup?.isImageGroup) {
        // Tiếp tục nhóm ảnh
        currentGroup.messages.push(msg);
        currentGroup.lastMessage = msg;
      } else {
        // Kết thúc nhóm cũ (nếu có)
        if (currentGroup) groups.push(currentGroup);

        // Bắt đầu nhóm mới
        currentGroup = {
          representative: msg,
          messages: [msg],
          lastMessage: msg,
          isImageGroup: isImage
        };
      }
    });

    if (currentGroup) groups.push(currentGroup);
    return groups;
  };

  const messageGroups = buildMessageGroups();

  // Group theo ngày (giữ nguyên)
  const groupedByDate = messages.reduce((acc, msg) => {
    const dateKey = new Date(msg.created_at).toISOString().slice(0, 10);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(msg);
    return acc;
  }, {});

  const formatDateHeader = (dateString) => {
    const [y, m, d] = dateString.split('-');
    const date = new Date(Date.UTC(y, m - 1, d));
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (dateString === today) return 'Hôm nay';
    if (dateString === yesterday) return 'Hôm qua';
    return format(date, 'EEEE, dd/MM/yyyy', { locale: vi });
  };

  const shouldShowTimestamp = (current, prevGroup) => {
    if (!prevGroup) return true;
    return new Date(current.created_at) - new Date(prevGroup.lastMessage.created_at) > 5 * 60 * 1000;
  };

  const shouldShowAvatar = (current, nextGroup) => {
    if (!nextGroup) return true;
    const next = nextGroup.representative;
    return current.sender_id !== next.sender_id ||
           new Date(next.created_at) - new Date(current.created_at) > 5 * 60 * 1000;
  };

  const shouldShowSenderName = (current, prevGroup) => {
    if (!prevGroup) return true;
    const prev = prevGroup.representative;
    return current.sender_id !== prev.sender_id ||
           new Date(current.created_at) - new Date(prev.created_at) > 5 * 60 * 1000;
  };

  const handleEditMessage = (msg) => setEditingMessage(msg);
  const handleCancelEdit = () => setEditingMessage(null);
  const handleSaveEdit = async (id, content) => {
    await onUpdateMessage(id, content);
    setEditingMessage(null);
  };
  const handleDeleteMessage = async (id) => {
    if (window.confirm('Xóa tin nhắn này?')) await onDeleteMessage(id);
  };
  const handleReplyToMessage = (msg) => setReplyingToMessage(msg);
  const handleCancelReply = () => setReplyingToMessage(null);

  if (messages.length === 0) {
    return (
      <div className="message-list-empty">
        <div className="empty-content">
          <i className="fas fa-comments fa-3x text-muted mb-3"></i>
          <h5>Chưa có tin nhắn nào</h5>
          <p>Hãy bắt đầu cuộc trò chuyện!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="message-list">
      {Object.entries(groupedByDate).map(([dateKey, dateMsgs]) => (
        <div key={dateKey} className="message-date-group">
          <div className="date-header">
            <span className="date-text">{formatDateHeader(dateKey)}</span>
          </div>

          <div className="date-messages">
            {messageGroups
              .filter(g => dateMsgs.some(m => m.message_id === g.representative.message_id))
              .map((group, idx) => {
                const rep = group.representative;
                const prevGroup = idx > 0 ? messageGroups[idx - 1] : null;
                const nextGroup = messageGroups[idx + 1] || null;

                if (rep.message_type === 'system_ack') {
                  return (
                    <div key={rep.message_id} className="system-inline-pill fade-in">
                      Success Chốt giá thành công: <strong>
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
                          .format(Number(rep.system_ack.price || 0))}
                      </strong>
                      {rep.system_ack.unit ? ` / ${rep.system_ack.unit}` : null}
                    </div>
                  );
                }

                return (
                  <MessageItem
                    key={rep.message_id}
                    message={rep}
                    conversation={conversation}
                    groupedImages={group.isImageGroup ? group.messages : null}
                    showTimestamp={shouldShowTimestamp(rep, prevGroup)}
                    showAvatar={shouldShowAvatar(rep, nextGroup)}
                    showSenderName={shouldShowSenderName(rep, prevGroup)}
                    isEditing={editingMessage?.message_id === rep.message_id}
                    isReplying={replyingToMessage?.message_id === rep.message_id}
                    onEdit={handleEditMessage}
                    onCancelEdit={handleCancelEdit}
                    onSaveEdit={handleSaveEdit}
                    onDelete={handleDeleteMessage}
                    onReply={handleReplyToMessage}
                    onCancelReply={handleCancelReply}
                  />
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageList;