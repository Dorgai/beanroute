import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { FiMessageSquare, FiX, FiSend, FiEye } from 'react-icons/fi';

export default function MessageBoard() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      fetchUsers();
      // Remove scrollToBottom() to stay at top showing latest messages
    }
  }, [isOpen]);

  useEffect(() => {
    fetchUnreadCount();
    // Poll for new messages every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/messages');
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users/basic');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/messages/unread-count');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newMessage }),
      });

      if (response.ok) {
        setNewMessage('');
        fetchMessages();
        fetchUnreadCount();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId) => {
    try {
      await fetch(`/api/messages/${messageId}/read`, {
        method: 'POST',
      });
      fetchMessages(); // Refresh messages to update read status
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const markAllDisplayedAsRead = async () => {
    try {
      // Get all unread message IDs from currently displayed messages
      const unreadMessageIds = messages
        .filter(message => isMessageUnread(message))
        .map(message => message.id);

      // Mark each unread message as read
      const markPromises = unreadMessageIds.map(messageId =>
        fetch(`/api/messages/${messageId}/read`, {
          method: 'POST',
        })
      );

      await Promise.all(markPromises);
      
      // Refresh data after marking all as read
      fetchMessages();
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking all messages as read:', error);
    }
  };

  const handleCloseChat = () => {
    // Mark all displayed messages as read before closing
    markAllDisplayedAsRead();
    setIsOpen(false);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const isMessageUnread = (message) => {
    return !message.reads.some(read => read.userId === user?.id);
  };

  const getReadByUsers = (message) => {
    return message.reads.map(read => {
      const readUser = users.find(u => u.id === read.userId);
      return {
        username: readUser?.username || 'Unknown',
        readAt: read.readAt
      };
    });
  };

  return (
    <>
      {/* Message Board Toggle Button */}
      <div className="fixed right-4 top-20 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200"
          title="Message Board"
        >
          <FiMessageSquare className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Message Board Sidebar */}
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={handleCloseChat}
          />
          
          {/* Sidebar */}
          <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Message Board</h2>
              <button
                onClick={handleCloseChat}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No messages yet
                </div>
              ) : (
                messages.map((message) => {
                  const isUnread = isMessageUnread(message);
                  const readByUsers = getReadByUsers(message);
                  
                  return (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                        isUnread 
                          ? 'bg-blue-50 border-blue-200 font-semibold hover:bg-blue-100' 
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                      onClick={() => isUnread && markAsRead(message.id)}
                      title={isUnread ? "Click to mark as read" : "Already read"}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          {message.sender.username}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(message.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap mb-3">
                        {message.content}
                      </p>
                      
                      {/* Read Status */}
                      <div className="text-xs text-gray-500 border-t pt-2">
                        <div className="flex items-center gap-1 mb-1">
                          <FiEye className="w-3 h-3" />
                          <span>Read by:</span>
                        </div>
                        {readByUsers.length > 0 ? (
                          <div className="ml-4">
                            {readByUsers.map((readUser, index) => (
                              <div key={index} className="text-xs">
                                {readUser.username} ({formatTimestamp(readUser.readAt)})
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="ml-4 text-xs text-gray-400">No one yet</div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message... Use @username to mention someone"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !newMessage.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <FiSend className="w-4 h-4" />
                </button>
              </form>
              <p className="text-xs text-gray-500 mt-2">
                All users can see all messages
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 