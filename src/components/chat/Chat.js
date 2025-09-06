import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useChat } from '../../hooks/useChat';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import ChatHeader from './ChatHeader';
import './Chat.css';

const Chat = ({ initialConversationId = null }) => {
  const {
    conversations,
    currentConversation,
    messages,
    loading,
    error,
    hasMoreMessages,
    typingUsers,
    sendingMessage,
    isConnected,
    loadConversations,
    loadMoreMessages,
    sendTextMessage,
    sendFileMessage,
    updateMessage,
    deleteMessage,
    markAsRead,
    handleTyping,
    switchConversation,
    createConversation,
    scrollToBottom,
    messagesEndRef,
    getTypingUsers,
    isUserOnline
  } = useChat(initialConversationId);
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { isConnected: socketConnected } = useSocket();
  // Auto-select conversation when initialConversationId is provided/changes
  useEffect(() => {
    const convId = initialConversationId && !Number.isNaN(parseInt(initialConversationId, 10))
      ? parseInt(initialConversationId, 10)
      : null;
    if (!convId) return;

    const authed = (typeof isAuthenticated === 'function') ? isAuthenticated() : !!isAuthenticated;
    if (authLoading) return; // wait until auth resolved

    // Try switching as soon as auth resolved; socket join is queued if not connected yet
    if (authed) {
      handleConversationSelect(convId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialConversationId, authLoading, isAuthenticated, socketConnected]);

  const [showConversationList, setShowConversationList] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);

  // Handle window resize for mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setShowConversationList(false);
      } else {
        setShowConversationList(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      conv.title?.toLowerCase().includes(query) ||
      conv.participants?.some(p => 
        p.name?.toLowerCase().includes(query) ||
        p.email?.toLowerCase().includes(query)
      )
    );
  });

  const handleSendMessage = async (content, replyToMessageId = null) => {
    try {
      await sendTextMessage(content, replyToMessageId);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleSendFile = async (file, content = '') => {
    try {
      await sendFileMessage(file, content);
    } catch (error) {
      console.error('Failed to send file:', error);
    }
  };

  const handleConversationSelect = async (conversationId) => {
    if (!conversationId || Number.isNaN(parseInt(conversationId, 10))) return;
    try {
      await switchConversation(conversationId);
      // Sync URL so auto-switch effect won't jump back to the old one
      navigate(`/chat?conversationId=${conversationId}`);
      if (window.innerWidth < 768) {
        setShowConversationList(false);
      }
    } catch (error) {
      console.error('Failed to switch conversation:', error);
    }
  };

  const handleCreateConversation = async (type, participants, title = null) => {
    try {
      const conversation = await createConversation(type, participants, title);
      await switchConversation(conversation.conversation_id);
      navigate(`/chat?conversationId=${conversation.conversation_id}`);
      setShowNewConversationModal(false);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleBackToConversations = () => {
    setShowConversationList(true);
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="chat-container">
        <div className="chat-loading">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Đang tải cuộc trò chuyện...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">

      {/* Error Display */}
      {error && (
        <div className="chat-error">
          <div className="alert alert-danger" role="alert">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
          </div>
        </div>
      )}

      <div className="chat-layout">
        {/* Conversation List Sidebar */}
        {showConversationList && (
          <div className="conversation-sidebar">
            <ConversationList
              conversations={filteredConversations}
              currentConversation={currentConversation}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onConversationSelect={handleConversationSelect}
              onCreateConversation={() => setShowNewConversationModal(true)}
              onRefresh={loadConversations}
              loading={loading}
            />
          </div>
        )}

        {/* Chat Window */}
        <div className="chat-main">
          {currentConversation ? (
            <>
              <ChatHeader
                conversation={currentConversation}
                onBack={handleBackToConversations}
                onMenuClick={() => setShowConversationList(!showConversationList)}
                isUserOnline={isUserOnline}
              />
              <ChatWindow
                conversation={currentConversation}
                messages={messages}
                typingUsers={getTypingUsers()}
                sendingMessage={sendingMessage}
                hasMoreMessages={hasMoreMessages}
                onSendMessage={handleSendMessage}
                onSendFile={handleSendFile}
                onUpdateMessage={updateMessage}
                onDeleteMessage={deleteMessage}
                onMarkAsRead={markAsRead}
                onTyping={handleTyping}
                onLoadMore={loadMoreMessages}
                scrollToBottom={scrollToBottom}
                messagesEndRef={messagesEndRef}
                isConnected={isConnected}
              />
            </>
          ) : (
            <div className="chat-welcome">
              <div className="welcome-content">
                <i className="fas fa-comments fa-3x text-muted mb-3"></i>
                <h3>Chào mừng đến với HomeHelper Chat</h3>
                <p>Chọn một cuộc trò chuyện để bắt đầu hoặc tạo cuộc trò chuyện mới</p>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowNewConversationModal(true)}
                >
                  <i className="fas fa-plus me-2"></i>
                  Tạo cuộc trò chuyện mới
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Conversation Modal */}
      {showNewConversationModal && (
        <NewConversationModal
          onClose={() => setShowNewConversationModal(false)}
          onCreate={handleCreateConversation}
        />
      )}
    </div>
  );
};

// New Conversation Modal Component
const NewConversationModal = ({ onClose, onCreate }) => {
  const [type, setType] = useState('direct');
  const [title, setTitle] = useState('');
  const [participants, setParticipants] = useState([]);
  const [searchUser, setSearchUser] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearchUsers = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const { default: userService } = await import('../../services/userService');
      const results = await userService.searchUsers(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Failed to search users:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddParticipant = (user) => {
    if (!participants.find(p => p.user_id === user.user_id)) {
      setParticipants([...participants, user]);
    }
    setSearchUser('');
    setSearchResults([]);
  };

  const handleRemoveParticipant = (userId) => {
    setParticipants(participants.filter(p => p.user_id !== userId));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (type === 'direct' && participants.length !== 1) {
      alert('Cuộc trò chuyện trực tiếp cần chính xác 1 người tham gia');
      return;
    }
    if (type === 'group' && participants.length < 1) {
      alert('Cuộc trò chuyện nhóm cần ít nhất 1 người tham gia');
      return;
    }
    if (type === 'group' && !title.trim()) {
      alert('Vui lòng nhập tên cuộc trò chuyện nhóm');
      return;
    }

    onCreate(type, participants.map(p => p.user_id), title.trim() || null);
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Tạo cuộc trò chuyện mới</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Conversation Type */}
              <div className="mb-3">
                <label className="form-label">Loại cuộc trò chuyện</label>
                <div className="btn-group w-100" role="group">
                  <input
                    type="radio"
                    className="btn-check"
                    name="type"
                    id="type-direct"
                    value="direct"
                    checked={type === 'direct'}
                    onChange={(e) => setType(e.target.value)}
                  />
                  <label className="btn btn-outline-primary" htmlFor="type-direct">
                    Trực tiếp
                  </label>
                  <input
                    type="radio"
                    className="btn-check"
                    name="type"
                    id="type-group"
                    value="group"
                    checked={type === 'group'}
                    onChange={(e) => setType(e.target.value)}
                  />
                  <label className="btn btn-outline-primary" htmlFor="type-group">
                    Nhóm
                  </label>
                </div>
              </div>

              {/* Group Title */}
              {type === 'group' && (
                <div className="mb-3">
                  <label htmlFor="title" className="form-label">Tên cuộc trò chuyện</label>
                  <input
                    type="text"
                    className="form-control"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Nhập tên cuộc trò chuyện"
                    required
                  />
                </div>
              )}

              {/* User Search */}
              <div className="mb-3">
                <label htmlFor="searchUser" className="form-label">
                  {type === 'direct' ? 'Chọn người để trò chuyện' : 'Thêm thành viên'}
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="searchUser"
                  value={searchUser}
                  onChange={(e) => {
                    setSearchUser(e.target.value);
                    handleSearchUsers(e.target.value);
                  }}
                  placeholder="Tìm kiếm người dùng..."
                />
                
                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="search-results">
                    {searchResults.map(user => (
                      <div
                        key={user.user_id}
                        className="search-result-item"
                        onClick={() => handleAddParticipant(user)}
                      >
                        <div className="user-avatar">
                          <img src={user.avatar || '/default-avatar.png'} alt={user.name} />
                        </div>
                        <div className="user-info">
                          <div className="user-name">{user.name}</div>
                          <div className="user-email">{user.email}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Participants */}
              {participants.length > 0 && (
                <div className="mb-3">
                  <label className="form-label">Thành viên đã chọn</label>
                  <div className="selected-participants">
                    {participants.map(participant => (
                      <div key={participant.user_id} className="participant-tag">
                        <img
                          src={participant.avatar || '/default-avatar.png'}
                          alt={participant.name}
                          className="participant-avatar"
                        />
                        <span className="participant-name">{participant.name}</span>
                        <button
                          type="button"
                          className="btn-close btn-close-white"
                          onClick={() => handleRemoveParticipant(participant.user_id)}
                        ></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={participants.length === 0}
              >
                Tạo cuộc trò chuyện
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
