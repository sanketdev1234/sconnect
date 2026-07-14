// src/components/Chat/ScoketChat.jsx
import React, {
  useState, useEffect, useRef, useContext, useCallback
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserContext } from '../usercontext';
import axios from 'axios';
import { io } from 'socket.io-client';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  Send, Pencil, Trash2, X, Check,
  Users, ArrowLeft, Loader2, AlertCircle,
  Hash, RefreshCw, MessageSquare , Clock
} from 'lucide-react';
import { Video } from 'lucide-react';

// ── Socket singleton — one connection for the whole session ──────────────────
// Created outside component so it persists across re-renders
const url=import.meta.env.VITE_API_URL || 'http://localhost:8080'
const socket = io(url, {
  withCredentials: true,
  autoConnect: true,
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatTime = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ user, size = 'sm' }) {
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm' };
  if (user?.profile_picture?.url) {
    return (
      <img
        src={user.profile_picture.url}
        alt={user.display_name}
        className={`${sizes[size]} rounded-full object-cover border border-gray-200 flex-shrink-0`}
      />
    );
  }
  return (
    <div className={`${sizes[size]} rounded-full bg-gray-700 text-white flex items-center justify-center font-semibold flex-shrink-0`}>
      {user?.display_name?.charAt(0).toUpperCase() || '?'}
    </div>
  );
}

// ── Message Bubble ────────────────────────────────────────────────────────────

function MessageBubble({
  msg, isOwn, onEdit, onDelete,
  editingId, editContent, setEditContent, onSaveEdit, onCancelEdit,
  deleteLoading
}) {
  const isEditing = editingId === msg.chatid;

  return (
    <div className={`flex gap-2 group ${isOwn ? 'flex-row-reverse' : ''}`}>

      {/* Avatar */}
      <div className="flex-shrink-0 mt-1">
        <Avatar user={msg.user} size="sm" />
      </div>

      {/* Content */}
      <div className={`max-w-xs sm:max-w-sm flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>

        {/* Sender name — only for others */}
        {!isOwn && (
          <p className="text-xs text-gray-400 mb-1 ml-1">
            {msg.displayname}
          </p>
        )}

        {/* Edit mode */}
        {isOwn && isEditing ? (
          <div className="w-full min-w-[200px]">
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              rows={2}
              autoFocus
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl outline-none focus:border-gray-500 resize-none bg-white"
            />
            <div className="flex gap-1.5 mt-1.5 justify-end">
              <button
                onClick={onCancelEdit}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X size={11} />
                Cancel
              </button>
              <button
                onClick={() => onSaveEdit(msg)}
                disabled={!editContent.trim()}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 transition-colors"
              >
                <Check size={11} />
                Save
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Message bubble */}
            <div className={`relative px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
              isOwn
                ? 'bg-gray-900 text-white rounded-tr-sm'
                : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
            }`}>
              {msg.Content}

              {/* Edited label */}
              {msg.isEdited && (
                <span className={`text-xs ml-1.5 ${isOwn ? 'text-gray-400' : 'text-gray-400'}`}>
                  (edited)
                </span>
              )}
            </div>

            {/* Timestamp + actions row */}
            <div className={`flex items-center gap-2 mt-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
              <span className="text-xs text-gray-400">
                {formatTime(msg.createdAt)}
              </span>

              {/* Own message actions — visible on hover */}
              {isOwn && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEdit(msg)}
                    className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                    title="Edit message"
                  >
                    <Pencil size={11} />
                  </button>
                  <button
                    onClick={() => onDelete(msg)}
                    disabled={deleteLoading === msg.chatid}
                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                    title="Delete message"
                  >
                    {deleteLoading === msg.chatid
                      ? <Loader2 size={11} className="animate-spin" />
                      : <Trash2 size={11} />
                    }
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Chat Component ───────────────────────────────────────────────────────

export default function ScoketChat() {
  const { meetid, joinid } = useParams();
  const navigate = useNavigate();
  const { curruser } = useContext(UserContext);

  // ── Core state ──────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showOnlinePanel, setShowOnlinePanel] = useState(false);

  // ── Connection state ────────────────────────────────────────────────────────
  const [socketConnected, setSocketConnected] = useState(socket.connected);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [sendLoading, setSendLoading] = useState(false);

  // ── Edit / Delete state ─────────────────────────────────────────────────────
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(null);

  // ── Refs ────────────────────────────────────────────────────────────────────
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const messagesRef = useRef(messages); // keep messages in sync for socket callbacks
  messagesRef.current = messages;

  // for auto end meetings
const [meetingInfo, setMeetingInfo] = useState(null);
const [timeRemaining, setTimeRemaining] = useState(null);
const [warningShown, setWarningShown] = useState(false);

  // ── Scroll to bottom ────────────────────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ── Fetch existing chats on mount ───────────────────────────────────────────

  // Backend: POST /meeting/:meetid/chat/new → save to DB
  // Backend: All chats are embedded in meeting.Chats
  // Fetch via meeting detail — GET /meeting/:meetid/detail
  // But we use the getmeetdetail which requires iscorrect_owner
  // So instead we use the individual chat read as needed
  // For initial load we re-use the meeting detail endpoint if user is host
  // or load chats via the chat all endpoint

  // Backend: GET /meeting/:meetid/chat/all
  // Middleware: iscorrect_owner (only host can use this)
  // Returns: plain string with chats
  // Better: use meetdetail which populates Chats with Authors

  // Since any participant (not just host) needs to see chat history
  // we load it from meeting detail — only works for host
  // For non-host participants, we load from socket history (server emits on join)
  // Workaround: fetch meeting detail to get populated Chats — fallback gracefully

  const fetchChatHistory = async () => {
    setFetchLoading(true);
    setFetchError('');
    try {
      const res = await axios.get(
        `/meeting/${meetid}/detail`,
        { withCredentials: true }
      );

      const meetData = res.data;
      if (meetData?.Chats) {
        const formatted = meetData.Chats.map(c => ({
          chatid: c._id?.toString(),
          Content: c.Content,
          displayname: c.Author?.display_name || 'Unknown',
          user: c.Author,
          joinid: joinid,
          isOwn: c.Author?._id?.toString() === curruser?._id?.toString(),
          createdAt: c.createdAt || new Date().toISOString(),
          isEdited: false,
        }));
        setMessages(formatted);
      }
    } catch (err) {
      // Non-host participants won't have access — that's OK
      // They'll still get live messages via socket
      if (err.response?.status !== 403) {
        setFetchError('Could not load chat history. Live messages will still work.');
      }
      // 403 = not host, silently continue — they'll see live messages
    } finally {
      setFetchLoading(false);
    }
  };

  // ── Socket setup ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!curruser || !joinid) return;

    // Track connection status
    const onConnect = () => {
      setSocketConnected(true);
      // Rejoin rooms after reconnection
      // Socket event: 'Rejoin Meetings' → server rejoins user to their rooms
      socket.emit('Rejoin Meetings', {
        displayname: curruser.display_name,
      });
    };

    const onDisconnect = () => {
      setSocketConnected(false);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // Socket event: 'Join Meeting' → server joins the socket room
    // Server emits 'Online Users' to room on join
    socket.emit('Join Meeting', {
      displayname: curruser.display_name,
      joinid: joinid,
    });

    // Socket event: 'Chat Msg' — new message received from any user in room
    // Payload: { chatid, Content, displayname, user, joinid, createdAt }
    const onChatMsg = (msg) => {
      setMessages(prev => {
        // Avoid duplicate if we added optimistically
        const exists = prev.some(m => m.chatid === msg.chatid);
        if (exists) return prev;
        return [...prev, { ...msg, isEdited: false }];
      });
    };

    // Socket event: 'Online Users' — array of display names in room
    const onOnlineUsers = (users) => {
      setOnlineUsers(Array.isArray(users) ? users : []);
    };

    // Socket event: 'New Notification' — someone sent a message
    // Payload: { joinid, notification, from }
    const onNewNotification = ({ from, notification }) => {
      // Only show toast if the message is not from ourselves
      if (from !== curruser.display_name) {
        toast.info(`${from}: ${notification}`, {
          position: 'bottom-right',
          autoClose: 2000,
          toastId: `notif-${from}`, // deduplicate rapid notifications
        });
      }
    };

    // Socket event: 'Edit Msg' — a message was edited
    // Payload: { chatid, Content, joinid, displayname }
    const onEditMsg = (msg) => {
      setMessages(prev =>
        prev.map(m =>
          m.chatid === msg.chatid
            ? { ...m, Content: msg.Content, isEdited: true }
            : m
        )
      );
    };

    // Socket event: 'Delete Msg' — a message was deleted
    // Payload: { chatid, joinid }
    const onDeleteMsg = (msg) => {
      setMessages(prev => prev.filter(m => m.chatid !== msg.chatid));
    };

    socket.on('Chat Msg', onChatMsg);
    socket.on('Online Users', onOnlineUsers);
    socket.on('New Notification', onNewNotification);
    socket.on('Edit Msg', onEditMsg);
    socket.on('Delete Msg', onDeleteMsg);

    // Fetch history after joining
    fetchChatHistory();

    // Focus input
    setTimeout(() => inputRef.current?.focus(), 300);

    return () => {
      // Clean up listeners on unmount
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('Chat Msg', onChatMsg);
      socket.off('Online Users', onOnlineUsers);
      socket.off('New Notification', onNewNotification);
      socket.off('Edit Msg', onEditMsg);
      socket.off('Delete Msg', onDeleteMsg);

      // Socket event: 'Leave Meet' → server removes user from room
      // Server emits 'Online Users' to room with updated list
      socket.emit('Leave Meet', {
        displayname: curruser.display_name,
        joinid: joinid,
      });
    };
  }, [curruser, joinid, meetid]);



// Fetch meeting info on mount (StartAt, EndAt)
useEffect(() => {
  const fetchMeetingInfo = async () => {
    try {
      const res = await axios.get(`/meeting/${meetid}/detail`, { withCredentials: true });
      setMeetingInfo(res.data);
    } catch {
      // Non-host users get 403 — fall back gracefully, no timer shown
    }
  };
  fetchMeetingInfo();
}, [meetid]);

// Countdown timer — ticks every second
useEffect(() => {
  if (!meetingInfo?.EndAt) return;

  const interval = setInterval(() => {
    const end = new Date(meetingInfo.EndAt);
    const now = new Date();
    const diffMs = end - now;

    if (diffMs <= 0) {
      setTimeRemaining(0);
      clearInterval(interval);
      return;
    }

    setTimeRemaining(diffMs);

    // Show 5-minute warning once
    if (diffMs <= 5 * 60 * 1000 && !warningShown) {
      toast.warning('Meeting ends in 5 minutes', {
        position: 'top-center',
        autoClose: 5000,
      });
      setWarningShown(true);
    }
  }, 1000);

  return () => clearInterval(interval);
}, [meetingInfo, warningShown]);

// Listen for server-pushed end event
useEffect(() => {
  const onMeetingEnded = ({ joinid: endedJoinId }) => {
    if (endedJoinId === joinid) {
      toast.error('This meeting has ended', { position: 'top-center', autoClose: 4000 });
      setTimeout(() => navigate('/dashboard'), 2500);
    }
  };
  socket.on('Meeting Ended', onMeetingEnded);
  return () => socket.off('Meeting Ended', onMeetingEnded);
}, [joinid, navigate]);

// Format remaining time as MM:SS or HH:MM:SS
const formatTimeRemaining = (ms) => {
  if (ms === null) return null;
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

  // ── Send Message ─────────────────────────────────────────────────────────────

  // Backend: POST /meeting/:meetid/chat/new
  // Body: { Content }
  // Returns: new chat object { _id, Content, Author, Meet, createdAt }
  const handleSend = async (e) => {
    e?.preventDefault();
    const content = newMessage.trim();
    if (!content || sendLoading) return;

    setSendLoading(true);
    setNewMessage('');

    try {
      // 1. Save to DB first — get back the _id
      const res = await axios.post(
        `/meeting/${meetid}/chat/new`,
        { Content: content },
        { withCredentials: true }
      );

      const savedChat = res.data;
      const chatid = savedChat?._id?.toString();

      if (!chatid) {
        toast.error('Message could not be saved. Please try again.');
        setNewMessage(content); // restore
        return;
      }

      // 2. Emit via socket so all room members get it in real time
      // Socket event: 'Chat Msg' → server broadcasts to room
      const msgPayload = {
        chatid,
        Content: content,
        displayname: curruser.display_name,
        user: curruser,
        joinid,
        createdAt: savedChat.createdAt || new Date().toISOString(),
      };

      socket.emit('Chat Msg', msgPayload);
      // Sender also receives via the socket broadcast — handled in onChatMsg
      // But to avoid latency we add optimistically here
      // (onChatMsg checks for duplicate chatid so no double add)
      setMessages(prev => [...prev, { ...msgPayload, isEdited: false }]);

    } catch (err) {
      setNewMessage(content); // restore message on error
      if (err.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
      } else {
        toast.error('Failed to send message. Please try again.');
      }
    } finally {
      setSendLoading(false);
      inputRef.current?.focus();
    }
  };

  // Handle Enter key — Shift+Enter = new line, Enter = send
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Edit Message ─────────────────────────────────────────────────────────────

  const startEdit = (msg) => {
    setEditingId(msg.chatid);
    setEditContent(msg.Content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  // Backend: PATCH /meeting/:meetid/chat/:chatid/edit
  // Middleware: isPossible (checks isEnded + chat author)
  // Body: { Content }
  // Returns: updated chat object
  // Note: backend returns plain text if meeting is ended or not author
  const handleSaveEdit = async (msg) => {
    const content = editContent.trim();
    if (!content || content === msg.Content) {
      cancelEdit();
      return;
    }

    try {
      const res = await axios.patch(
        `/meeting/${meetid}/chat/${msg.chatid}/edit`,
        { Content: content },
        { withCredentials: true }
      );

      // Backend returns the updated chat object
      const updated = res.data;

      // Check for backend string responses (isPossible rejection)
      if (typeof updated === 'string') {
        if (updated.includes('ended')) {
          toast.error('Cannot edit — this meeting has ended.');
        } else if (updated.includes('Author')) {
          toast.error('You can only edit your own messages.');
        } else {
          toast.error('Edit failed. Please try again.');
        }
        cancelEdit();
        return;
      }

      // Emit via socket so all room members see the edit
      // Socket event: 'Edit Msg' → server broadcasts to room
      const editPayload = {
        chatid: msg.chatid,
        Content: content,
        joinid,
        displayname: curruser.display_name,
      };
      socket.emit('Edit Msg', editPayload);

      // Update locally immediately
      setMessages(prev =>
        prev.map(m =>
          m.chatid === msg.chatid
            ? { ...m, Content: content, isEdited: true }
            : m
        )
      );

      cancelEdit();

    } catch (err) {
      if (err.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
      } else {
        toast.error('Failed to edit message.');
      }
      cancelEdit();
    }
  };

  // ── Delete Message ────────────────────────────────────────────────────────────

  // Backend: DELETE /meeting/:meetid/chat/:chatid/delete
  // Middleware: isPossible (checks isEnded + chat author)
  // Returns: "chat deleted successfully" (plain text)
  // Note: "chat modification only possible during meeting time!" if ended
  const handleDelete = async (msg) => {
    if (!window.confirm('Delete this message?')) return;
    setDeleteLoading(msg.chatid);

    try {
      const res = await axios.delete(
        `/meeting/${meetid}/chat/${msg.chatid}/delete`,
        { withCredentials: true }
      );

      // Check for backend string responses
      if (typeof res.data === 'string' && res.data.includes('ended')) {
        toast.error('Cannot delete — this meeting has ended.');
        setDeleteLoading(null);
        return;
      }
      if (typeof res.data === 'string' && res.data.includes('Author')) {
        toast.error('You can only delete your own messages.');
        setDeleteLoading(null);
        return;
      }

      // Emit socket event so all room members see deletion
      // Socket event: 'Delete Msg' → server broadcasts to room
      socket.emit('Delete Msg', {
        chatid: msg.chatid,
        joinid,
      });

      // Remove locally
      setMessages(prev => prev.filter(m => m.chatid !== msg.chatid));

    } catch (err) {
      toast.error('Failed to delete message.');
    } finally {
      setDeleteLoading(null);
    }
  };

  // ── Leave Meeting ─────────────────────────────────────────────────────────────

  const handleLeave = () => {
    socket.emit('Leave Meet', {
      displayname: curruser.display_name,
      joinid,
    });
    navigate('/dashboard');
  };


  // ── End Meeting Now (host only) ──────────────────────────────────────────────

const isHost = meetingInfo?.Hosted_by?._id?.toString() === curruser?._id?.toString();

const handleEndNow = async () => {
  if (!window.confirm('End this meeting for everyone now?')) return;
  try {
    await axios.patch(`/meeting/${meetid}/end`, {}, { withCredentials: true });
    socket.emit('Meeting Ended', { joinid, meetid });
    toast.success('Meeting ended');
    setTimeout(() => navigate('/dashboard'), 1000);
  } catch {
    toast.error('Failed to end meeting');
  }
};

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
      />

      {/* ── Top Bar ── */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={handleLeave}
            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Leave meeting"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
              <MessageSquare size={14} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-gray-900">
                  Meeting Chat
                </p>
                {/* Socket connection indicator */}
                <div className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    socketConnected ? 'bg-green-500' : 'bg-red-400'
                  }`} />
                  <span className="text-xs text-gray-400">
                    {socketConnected ? 'Connected' : 'Reconnecting...'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Hash size={10} />
                <span className="font-mono">{joinid}</span>
              </div>
            </div>
          </div>

          {timeRemaining !== null && (
      <div className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg ${
    timeRemaining <= 5 * 60 * 1000
      ? 'bg-red-50 text-red-600 border border-red-200'
      : 'bg-gray-100 text-gray-600'
  }`}>
    <Clock size={12} />
    {timeRemaining === 0 ? 'Ended' : formatTimeRemaining(timeRemaining)}
  </div>
)}

        </div>

        {/* Right side — online users toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOnlinePanel(p => !p)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              showOnlinePanel
                ? 'bg-gray-900 text-white border-gray-900'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Users size={13} />
            {onlineUsers.length}
          </button>
           

           {isHost && (
  <button
    onClick={handleEndNow}
    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
  >
    End Meeting
  </button>
)} 


          <button
            onClick={handleLeave}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            Leave
          </button>
        </div>

        <button
  onClick={() => navigate(`/videocall/${joinid}`)}
  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
>
  <Video size={13} />
  Start Video 
</button>


        <button
  onClick={() => navigate(`/videocall/p2p/${joinid}`)}
  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
>
  <Video size={13} />
  Start Video p2p(max 2 size)
</button>

      </div>

      {/* ── Body: chat + optional online panel ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Messages Area ── */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Loading / error state */}
          {fetchLoading && (
            <div className="flex items-center justify-center gap-2 py-3 bg-blue-50 border-b border-blue-100">
              <Loader2 size={13} className="animate-spin text-blue-500" />
              <span className="text-xs text-blue-600">Loading chat history...</span>
            </div>
          )}

          {fetchError && (
            <div className="flex items-center justify-between gap-2 px-4 py-2 bg-amber-50 border-b border-amber-100">
              <div className="flex items-center gap-2">
                <AlertCircle size={13} className="text-amber-500 flex-shrink-0" />
                <span className="text-xs text-amber-700">{fetchError}</span>
              </div>
              <button
                onClick={fetchChatHistory}
                className="flex items-center gap-1 text-xs text-amber-700 font-semibold hover:underline flex-shrink-0"
              >
                <RefreshCw size={11} />
                Retry
              </button>
            </div>
          )}

          {/* Messages scroll area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!fetchLoading && messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <MessageSquare size={20} className="text-gray-400" />
                </div>
                <p className="text-sm font-semibold text-gray-600 mb-1">
                  No messages yet
                </p>
                <p className="text-xs text-gray-400">
                  Be the first to say something
                </p>
              </div>
            ) : (
              messages.map((msg, i) => {
                const isOwn =
                  msg.displayname === curruser?.display_name ||
                  msg.user?._id?.toString() === curruser?._id?.toString();

                // Show date separator when day changes
                const showDateSep = i === 0 || (
                  msg.createdAt &&
                  messages[i - 1]?.createdAt &&
                  new Date(msg.createdAt).toDateString() !==
                  new Date(messages[i - 1].createdAt).toDateString()
                );

                return (
                  <React.Fragment key={msg.chatid || i}>
                    {showDateSep && msg.createdAt && (
                      <div className="flex items-center gap-3 my-2">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-xs text-gray-400 font-medium px-2">
                          {new Date(msg.createdAt).toLocaleDateString('en-IN', {
                            weekday: 'short', day: 'numeric', month: 'short'
                          })}
                        </span>
                        <div className="flex-1 h-px bg-gray-200" />
                      </div>
                    )}
                    <MessageBubble
                      msg={msg}
                      isOwn={isOwn}
                      onEdit={startEdit}
                      onDelete={handleDelete}
                      editingId={editingId}
                      editContent={editContent}
                      setEditContent={setEditContent}
                      onSaveEdit={handleSaveEdit}
                      onCancelEdit={cancelEdit}
                      deleteLoading={deleteLoading}
                    />
                  </React.Fragment>
                );
              })
            )}
            {/* Scroll anchor */}
            <div ref={bottomRef} />
          </div>

          {/* ── Input Bar ── */}
          <div className="flex-shrink-0 border-t border-gray-200 bg-white p-3">
            <form onSubmit={handleSend} className="flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                  rows={1}
                  maxLength={2000}
                  disabled={sendLoading || !socketConnected}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl outline-none focus:border-gray-500 resize-none transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed max-h-32 overflow-y-auto"
                  style={{ minHeight: '42px' }}
                  onInput={e => {
                    // Auto-resize textarea
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
                  }}
                />
                {newMessage.length > 1800 && (
                  <p className={`absolute -top-5 right-1 text-xs ${
                    newMessage.length > 2000 ? 'text-red-500' : 'text-amber-500'
                  }`}>
                    {newMessage.length}/2000
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={!newMessage.trim() || sendLoading || !socketConnected}
                className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-gray-900 text-white rounded-xl hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                title="Send message (Enter)"
              >
                {sendLoading
                  ? <Loader2 size={16} className="animate-spin" />
                  : <Send size={16} />
                }
              </button>
            </form>

            {/* Offline warning */}
            {!socketConnected && (
              <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                <AlertCircle size={11} />
                Disconnected — attempting to reconnect...
              </p>
            )}
          </div>
        </div>

        {/* ── Online Users Panel ── */}
        {showOnlinePanel && (
          <div className="w-56 flex-shrink-0 border-l border-gray-200 bg-white flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-widest">
                Online Now
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {onlineUsers.length} in this room
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {onlineUsers.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">
                  No one online
                </p>
              ) : (
                onlineUsers.map(name => (
                  <div key={name} className="flex items-center gap-2.5">
                    <div className="relative flex-shrink-0">
                      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">
                        {name?.charAt(0).toUpperCase()}
                      </div>
                      {/* Online dot */}
                      <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-800 truncate">
                        {name}
                        {name === curruser?.display_name && (
                          <span className="ml-1 text-gray-400">(you)</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}