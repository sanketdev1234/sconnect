if (process.env.NODE_ENV !== "production") {
require("dotenv").config({path:require("path").resolve(__dirname,"../.env")});
}
// Controller/SockeioController.js
const { Server } = require('socket.io');
const cors = require("cors");

// ✅ Track online users PER ROOM, not globally
// Structure: Map<joinid, Map<socketId, displayname>>
const roomUsers = new Map();

// Keep this — used for "Rejoin Meetings" after reconnect
const userrooms = new Map();

let ioInstance = null;

module.exports.SocketController = (server) => {
  const io = new Server(server, {
    cors: {
      origin: [process.env.CLIENT_URL || "http://localhost:5173"],
      credentials: true,
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE"]
    },
    connectionStateRecovery: {}  // browser close karke rejoin kiya within 2 min toh sare char preserve rahege and rejoin hojauga and same socket id ke sath , agar refresh kiya toh sare reload hoga chat preserve nahi rahege and new socketid se join hoega
  });
  ioInstance = io;

  // Helper — get unique display names currently in a room
  const getOnlineUsersInRoom = (joinid) => {
    const room = roomUsers.get(joinid);
    if (!room) return [];
    return Array.from(new Set(room.values()));
  };

  // Helper — broadcast updated online list to a specific room
  const broadcastOnlineUsers = (joinid) => {
    io.to(joinid).emit('Online Users', getOnlineUsersInRoom(joinid));
  };

  // Helper — remove this socket from a room's online tracking
  const removeSocketFromRoom = (socketId, joinid) => {
    const room = roomUsers.get(joinid);
    if (room) {
      room.delete(socketId);
      if (room.size === 0) {
        roomUsers.delete(joinid);
      }
    }
  };

  io.on("connection", (socket) => {
    console.log("A user connected ", socket.id);

    // Track which rooms THIS socket has joined — needed for disconnect cleanup
    socket.data.joinedRooms = new Set();
    socket.data.displayname = null;

    // ── Chat message ──
    socket.on('Chat Msg', (msg) => {
      // Broadcast msg to all users in the meeting (including sender)
      io.to(msg.joinid).emit('Chat Msg', msg);
      // Broadcast a notification to all users in the meeting except the sender
      socket.broadcast.to(msg.joinid).emit('New Notification', {
        joinid: msg.joinid,
        notification: 'New message received',
        from: msg.displayname
      });
    });

    // Listen for edit message event
    socket.on('Edit Msg', (msg) => {
      io.to(msg.joinid).emit('Edit Msg', msg);
    });

    // Listen for deleted messages
    socket.on('Delete Msg', (msg) => {
      io.to(msg.joinid).emit('Delete Msg', msg);
    });

    // ── Join meeting room ──
    socket.on('Join Meeting', ({ displayname, joinid }) => {
      socket.join(joinid);
      socket.data.displayname = displayname;
      socket.data.joinedRooms.add(joinid);

      // Track for reconnect support
      if (!userrooms.has(displayname)) userrooms.set(displayname, new Set());
      userrooms.get(displayname).add(joinid);

      // ✅ Track per-room, keyed by socket.id (not displayname) — this is the fix
      if (!roomUsers.has(joinid)) {
        roomUsers.set(joinid, new Map());
      }
      roomUsers.get(joinid).set(socket.id, displayname);

      console.log(`user ${displayname} joined the meeting of joining id ${joinid}`);
      broadcastOnlineUsers(joinid);
    });

    // ── Leave meeting room (explicit, via UI button) ──
    socket.on('Leave Meet', ({ displayname, joinid }) => {
      socket.leave(joinid);

      if (userrooms.has(displayname)) userrooms.get(displayname).delete(joinid);
      removeSocketFromRoom(socket.id, joinid);
      socket.data.joinedRooms.delete(joinid);

      console.log(`User ${displayname} left meeting ${joinid}`);
      broadcastOnlineUsers(joinid);
    });

    // ── Rejoin after reconnect ──
    socket.on('Rejoin Meetings', ({ displayname }) => {
      const rooms = userrooms.get(displayname);
      if (rooms) {
        rooms.forEach(joinid => {
          socket.join(joinid);
          socket.data.joinedRooms.add(joinid);
          socket.data.displayname = displayname;

          if (!roomUsers.has(joinid)) {
            roomUsers.set(joinid, new Map());
          }
          roomUsers.get(joinid).set(socket.id, displayname);

          broadcastOnlineUsers(joinid);
          console.log(`user ${displayname} rejoined meeting ${joinid}`);
        });
      }
    });

    // ✅ NEW — Host ends the meeting, server relays to ALL clients in the room
    socket.on('Meeting Ended', ({ joinid, meetid }) => {
      console.log(`Meeting ${joinid} ended — notifying all participants`);
      io.to(joinid).emit('Meeting Ended', { joinid, meetid });
    });

    // ✅ NEW — Handles tab close, refresh, network drop, crash
    // This is the critical fix — 'Leave Meet' alone never catches these cases
    socket.on('disconnect', () => {
      const displayname = socket.data.displayname;
      console.log(`Socket disconnected: ${socket.id} (${displayname || 'unknown'})`);

      // Remove this socket from every room it was tracked in
      socket.data.joinedRooms.forEach(joinid => {
        removeSocketFromRoom(socket.id, joinid);
        broadcastOnlineUsers(joinid);
      });

        // ✅ add this — notify webrtc peer on any disconnect, not just explicit leave
  if (socket.data.webrtcRoom) {
    socket.to(socket.data.webrtcRoom).emit("webrtc-peer-left", {
      fromSocketId: socket.id
    });
  }

  
    });


    // WebRTC Signaling Events
// These just relay messages between two peers in the same room
// Backend never touches the actual media — just passes SDP and ICE candidates

socket.on("webrtc-offer", ({ offer, joinid, targetSocketId }) => {
  // Relay offer from caller to the specific target peer
  console.log(`WebRTC offer from ${socket.id} to ${targetSocketId}`);
  socket.to(targetSocketId).emit("webrtc-offer", {
    offer,
    fromSocketId: socket.id,
    joinid
  });
});

socket.on("webrtc-answer", ({ answer, targetSocketId }) => {
  // Relay answer back to the caller
  console.log(`WebRTC answer from ${socket.id} to ${targetSocketId}`);
  socket.to(targetSocketId).emit("webrtc-answer", {
    answer,
    fromSocketId: socket.id
  });
});

socket.on("webrtc-ice-candidate", ({ candidate, targetSocketId }) => {
  // Relay ICE candidates between peers
  socket.to(targetSocketId).emit("webrtc-ice-candidate", {
    candidate,
    fromSocketId: socket.id
  });
});

socket.on("webrtc-join-room", ({ joinid, displayname }) => {
  // Notify existing users in room that a new peer wants to connect
  // They will initiate the offer
   socket.join(joinid); // ✅ add this
  socket.data.webrtcRoom = joinid; // track for cleanup below
 
  console.log(`${displayname} joining WebRTC room ${joinid}`);
  socket.to(joinid).emit("webrtc-new-peer", {
    fromSocketId: socket.id,
    displayname
  });
});

socket.on("webrtc-leave", ({ joinid }) => {
  socket.to(joinid).emit("webrtc-peer-left", {
    fromSocketId: socket.id
  });
});

  });

  return io;
};

module.exports.getIo = () => ioInstance;