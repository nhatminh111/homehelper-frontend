import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import './Chat.css';

const ChatHeader = ({
  conversation,
  onBack,
  onMenuClick,
  isUserOnline
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const { user } = useAuth();
  const currentUserId = user?.user_id || user?.userId;

  const getOtherParticipant = () => {
    if (conversation.type !== 'direct') return null;
    if (!conversation.participants || conversation.participants.length === 0) return null;
    // pick the participant that is not the current user
    return conversation.participants.find(p => p.user_id !== currentUserId) || conversation.participants[0];
  };

  const getConversationTitle = () => {
    if (conversation.title) return conversation.title;
    
    if (conversation.type === 'direct' && conversation.participants?.length > 0) {
      const other = getOtherParticipant();
      return other?.name || other?.email;
    }
    
    if (conversation.participants?.length > 0) {
      const names = conversation.participants
        .slice(0, 3)
        .map(p => p.name || p.email)
        .join(', ');
      return conversation.participants.length > 3 
        ? `${names} và ${conversation.participants.length - 3} người khác`
        : names;
    }
    
    return 'Cuộc trò chuyện';
  };

  const getConversationSubtitle = () => {
    if (conversation.type === 'direct' && conversation.participants?.length > 0) {
      const participant = getOtherParticipant();
      const isOnline = isUserOnline ? isUserOnline(participant.user_id) : false;
      return isOnline ? 'Đang hoạt động' : 'Không hoạt động';
    }
    
    if (conversation.type === 'group') {
      const participantCount = conversation.participants?.length || 0;
      return `${participantCount} thành viên`;
    }
    
    return '';
  };

  const getConversationAvatar = () => {
    if (conversation.type === 'direct' && conversation.participants?.length > 0) {
      const other = getOtherParticipant();
      return other?.avatar;
    }
    return null;
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatLastSeen = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return formatDistanceToNow(date, { 
      addSuffix: true, 
      locale: vi 
    });
  };

  const handleDropdownToggle = () => {
    setShowDropdown(!showDropdown);
  };

  const handleDropdownClose = () => {
    setShowDropdown(false);
  };

  const handleCall = (type) => {
    // TODO: Implement call functionality
    console.log(`Starting ${type} call with conversation:`, conversation.conversation_id);
    handleDropdownClose();
  };

  const handleSearchMessages = () => {
    // TODO: Implement message search
    console.log('Search messages in conversation:', conversation.conversation_id);
    handleDropdownClose();
  };

  const handleViewProfile = () => {
    // TODO: Implement view profile
    if (conversation.type === 'direct' && conversation.participants?.length > 0) {
      const other = getOtherParticipant();
      console.log('View profile:', other?.user_id);
    }
    handleDropdownClose();
  };

  const handleConversationInfo = () => {
    // TODO: Implement conversation info modal
    console.log('Show conversation info:', conversation.conversation_id);
    handleDropdownClose();
  };

  const handleMuteConversation = () => {
    // TODO: Implement mute functionality
    console.log('Mute conversation:', conversation.conversation_id);
    handleDropdownClose();
  };

  const handleArchiveConversation = () => {
    // TODO: Implement archive functionality
    console.log('Archive conversation:', conversation.conversation_id);
    handleDropdownClose();
  };

  const handleDeleteConversation = () => {
    // TODO: Implement delete functionality
    if (window.confirm('Bạn có chắc chắn muốn xóa cuộc trò chuyện này?')) {
      console.log('Delete conversation:', conversation.conversation_id);
    }
    handleDropdownClose();
  };

  return (
    <div className="chat-header">
      <div className="chat-header-content">
        {/* Back Button (Mobile) */}
        <button
          className="btn btn-link chat-back-btn d-md-none"
          onClick={onBack}
          title="Quay lại danh sách"
        >
          <i className="fas fa-arrow-left"></i>
        </button>

        {/* Menu Button (Mobile) */}
        <button
          className="btn btn-link chat-menu-btn d-md-none"
          onClick={onMenuClick}
          title="Menu"
        >
          <i className="fas fa-bars"></i>
        </button>

        {/* Avatar */}
        <div className="chat-avatar">
          {getConversationAvatar() ? (
            <img
              src={getConversationAvatar()}
              alt={getConversationTitle()}
              className="chat-avatar-img"
            />
          ) : conversation.type === 'group' ? (
            <div className="chat-avatar-group">
              <i className="fas fa-users"></i>
            </div>
          ) : (
            <div className="chat-avatar-initials">
              {getInitials(getConversationTitle())}
            </div>
          )}
          
          {/* Online Status for Direct Messages */}
          {conversation.type === 'direct' && conversation.participants?.length > 0 && (
            <div className={`chat-status ${(() => { const other = getOtherParticipant(); return isUserOnline && other ? (isUserOnline(other.user_id) ? 'online' : 'offline') : 'offline'; })()}`}></div>
          )}
        </div>

        {/* Conversation Info */}
        <div className="chat-info">
          <div className="chat-title">
            <h6 className="chat-title-text">{getConversationTitle()}</h6>
            {conversation.type === 'group' && (
              <span className="chat-type-badge">
                <i className="fas fa-users"></i>
              </span>
            )}
          </div>
          <div className="chat-subtitle">
            <span className="chat-subtitle-text">{getConversationSubtitle()}</span>
            {conversation.type === 'direct' && conversation.participants?.length > 0 && (
              <span className="chat-last-seen">
                {(() => { const other = getOtherParticipant(); return (!isUserOnline || !other || !isUserOnline(other.user_id)) 
                  ? `Hoạt động ${formatLastSeen(other?.last_seen)}`
                  : ''
                })()}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="chat-actions">
          {/* Call Buttons */}
          <div className="chat-call-actions">
            <button
              className="btn btn-link chat-action-btn"
              onClick={() => handleCall('voice')}
              title="Gọi thoại"
            >
              <i className="fas fa-phone"></i>
            </button>
            <button
              className="btn btn-link chat-action-btn"
              onClick={() => handleCall('video')}
              title="Gọi video"
            >
              <i className="fas fa-video"></i>
            </button>
          </div>

          {/* More Actions Dropdown */}
          <div className="chat-more-actions">
            <button
              className="btn btn-link chat-action-btn"
              onClick={handleDropdownToggle}
              title="Thêm tùy chọn"
            >
              <i className="fas fa-ellipsis-v"></i>
            </button>

            {showDropdown && (
              <>
                <div className="dropdown-backdrop" onClick={handleDropdownClose}></div>
                <div className="dropdown-menu show chat-dropdown">
                  <button
                    className="dropdown-item"
                    onClick={handleSearchMessages}
                  >
                    <i className="fas fa-search me-2"></i>
                    Tìm kiếm tin nhắn
                  </button>
                  
                  {conversation.type === 'direct' && (
                    <button
                      className="dropdown-item"
                      onClick={handleViewProfile}
                    >
                      <i className="fas fa-user me-2"></i>
                      Xem trang cá nhân
                    </button>
                  )}
                  
                  <button
                    className="dropdown-item"
                    onClick={handleConversationInfo}
                  >
                    <i className="fas fa-info-circle me-2"></i>
                    Thông tin cuộc trò chuyện
                  </button>
                  
                  <div className="dropdown-divider"></div>
                  
                  <button
                    className="dropdown-item"
                    onClick={handleMuteConversation}
                  >
                    <i className="fas fa-bell-slash me-2"></i>
                    Tắt thông báo
                  </button>
                  
                  <button
                    className="dropdown-item"
                    onClick={handleArchiveConversation}
                  >
                    <i className="fas fa-archive me-2"></i>
                    Lưu trữ
                  </button>
                  
                  <div className="dropdown-divider"></div>
                  
                  <button
                    className="dropdown-item text-danger"
                    onClick={handleDeleteConversation}
                  >
                    <i className="fas fa-trash me-2"></i>
                    Xóa cuộc trò chuyện
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
