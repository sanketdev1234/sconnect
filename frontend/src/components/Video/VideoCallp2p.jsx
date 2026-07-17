// src/components/Video/VideoCall.jsx
import React, { useEffect, useRef, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserContext } from '../usercontext';
import { io } from 'socket.io-client';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  ArrowLeft, Mic, MicOff, Video, VideoOff,
  PhoneOff, Users, AlertCircle, Loader2, Hash
} from 'lucide-react';

// ── STUN servers — free Google STUN, handles NAT traversal for P2P
// These tell each peer what its public IP address is
// If both peers are on the same network, connection works without STUN
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ]
};

// Socket.IO must connect DIRECTLY to Render (WebSockets can't go through Vercel rewrites)
// Set VITE_SOCKET_URL=https://your-app.onrender.com in Vercel environment variables
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8080';

export default function VideoCallp2p() {
  const { joinid } = useParams();
  const navigate = useNavigate();
  const { curruser } = useContext(UserContext);

  // ── Refs ─────────────────────────────────────────────────────────────
  const localVideoRef   = useRef(null);   // your own video element
  const remoteVideoRef  = useRef(null);   // remote peer's video element
  const peerConnection  = useRef(null);   // RTCPeerConnection instance
  const localStream     = useRef(null);   // your camera/mic stream
  const socketRef       = useRef(null);   // socket for signaling only

  // ── State ─────────────────────────────────────────────────────────────
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState('');
  const [connected, setConnected]           = useState(false); // P2P established
  const [remoteJoined, setRemoteJoined]     = useState(false); // remote peer present
  const [audioEnabled, setAudioEnabled]     = useState(true);
  const [videoEnabled, setVideoEnabled]     = useState(true);
  const [participantCount, setParticipantCount] = useState(1);

  // ── Create RTCPeerConnection ──────────────────────────────────────────
  const createPeerConnection = (targetSocketId) => {
    console.log("Creating peer connection to", targetSocketId);

    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add our local tracks to the connection so remote can see/hear us
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => {
        pc.addTrack(track, localStream.current);
      });
    }

    // When we receive remote media tracks — attach to remote video element
    pc.ontrack = (event) => {
      console.log("Received remote track", event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
      setConnected(true);
      setLoading(false);
      toast.success('Connected to peer!');
    };

    // When ICE candidates are found — send them to the remote peer via signaling
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Sending ICE candidate");
        socketRef.current.emit("webrtc-ice-candidate", {
          candidate: event.candidate,
          targetSocketId,
          joinid
        });
      }
    };

    // Connection state changes
    pc.onconnectionstatechange = () => {
      console.log("Connection state:", pc.connectionState);
      if (pc.connectionState === 'connected') {
        setConnected(true);
        setLoading(false);
      }
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setConnected(false);
        toast.error('Peer disconnected');
      }
    };

    // ICE connection state
    pc.oniceconnectionstatechange = () => {
      console.log("ICE state:", pc.iceConnectionState);
    };

    peerConnection.current = pc;
    return pc;
  };

  // ── Main setup ────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        // Step 1: Get local camera and microphone
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

        localStream.current = stream;

        // Show our own video immediately (mirrored, muted — no echo)
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        if (!mounted) return;

        // Step 2: Connect socket for signaling (not for media)
        const socket = io(SOCKET_URL, {
          withCredentials: true,
          autoConnect: true,
          transports: ["polling", "websocket"],  // Start with polling, upgrade to WS
        });
        socketRef.current = socket;

        socket.on('connect', () => {
          console.log("Signaling socket connected:", socket.id);

          // Announce we joined this video room
          // Existing peers will send us an offer
          socket.emit("webrtc-join-room", {
            joinid,
            displayname: curruser?.display_name || 'Guest'
          });

          setLoading(false);
        });

        // ── Someone new joined — WE are the existing peer so WE send offer
        socket.on("webrtc-new-peer", async ({ fromSocketId, displayname }) => {
          console.log("New peer joined:", displayname, fromSocketId);
          setRemoteJoined(true);
          setParticipantCount(2);
          setLoading(true); // connecting...
          toast.info(`${displayname} joined the call`);

          const pc = createPeerConnection(fromSocketId);

          // Create offer — SDP contains our codec preferences and media info
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
          });

          // Set as our local description
          await pc.setLocalDescription(offer);

          // Send offer to the new peer via signaling server
          socket.emit("webrtc-offer", {
            offer,
            joinid,
            targetSocketId: fromSocketId
          });
        });

        // ── We received an offer from an existing peer — send back answer
        socket.on("webrtc-offer", async ({ offer, fromSocketId }) => {
          console.log("Received offer from:", fromSocketId);
          setRemoteJoined(true);
          setParticipantCount(2);
          setLoading(true);

          const pc = createPeerConnection(fromSocketId);

          // Set their offer as remote description
          await pc.setRemoteDescription(new RTCSessionDescription(offer));

          // Create answer
          const answer = await pc.createAnswer();

          // Set as our local description
          await pc.setLocalDescription(answer);

          // Send answer back to the offerer
          socket.emit("webrtc-answer", {
            answer,
            targetSocketId: fromSocketId
          });
        });

        // ── We received an answer to our offer
        socket.on("webrtc-answer", async ({ answer }) => {
          console.log("Received answer");
          if (peerConnection.current) {
            await peerConnection.current.setRemoteDescription(
              new RTCSessionDescription(answer)
            );
          }
        });

        // ── ICE candidate received — add to peer connection
        socket.on("webrtc-ice-candidate", async ({ candidate }) => {
          console.log("Received ICE candidate");
          try {
            if (peerConnection.current && candidate) {
              await peerConnection.current.addIceCandidate(
                new RTCIceCandidate(candidate)
              );
            }
          } catch (err) {
            console.error("Error adding ICE candidate:", err);
          }
        });

        // ── Remote peer left
        socket.on("webrtc-peer-left", () => {
          console.log("Remote peer left");
          setConnected(false);
          setRemoteJoined(false);
          setParticipantCount(1);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
          }
          toast.info('Peer left the call');
        });

        socket.on('connect_error', (err) => {
          console.error("Socket connection error:", err);
          setError('Could not connect to signaling server. Please try again.');
          setLoading(false);
        });

      } catch (err) {
        console.error("VideoCall init error:", err);
        if (!mounted) return;

        if (err.name === 'NotAllowedError') {
          setError('Camera or microphone permission denied. Please allow access and try again.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera or microphone found on this device.');
        } else {
          setError('Failed to start video call. Please check your camera and try again.');
        }
        setLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
      // Cleanup on unmount
      if (localStream.current) {
        localStream.current.getTracks().forEach(track => track.stop());
      }
      if (peerConnection.current) {
        peerConnection.current.close();
      }
      if (socketRef.current) {
        socketRef.current.emit("webrtc-leave", { joinid });
        socketRef.current.disconnect();
      }
    };
  }, [joinid, curruser]);

  // ── Toggle audio ──────────────────────────────────────────────────────
  const toggleAudio = () => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  // ── Toggle video ──────────────────────────────────────────────────────
  const toggleVideo = () => {
    if (localStream.current) {
      const videoTrack = localStream.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  // ── Leave call ────────────────────────────────────────────────────────
  const handleLeave = () => {
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
    }
    if (peerConnection.current) {
      peerConnection.current.close();
    }
    if (socketRef.current) {
      socketRef.current.emit("webrtc-leave", { joinid });
      socketRef.current.disconnect();
    }
    navigate('/dashboard');
  };

  // ── Error state ───────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 border border-red-500 rounded-xl p-10 text-center max-w-md">
          <AlertCircle size={32} className="text-red-400 mx-auto mb-4" />
          <p className="text-sm font-semibold text-white mb-1">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-5 px-4 py-2 bg-gray-700 text-white text-xs font-semibold rounded-lg hover:bg-gray-600 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Top bar */}
      <div className="flex-shrink-0 bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleLeave}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="text-sm font-bold text-white">Video Call</p>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Hash size={10} />
              <span className="font-mono">{joinid}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Connection status */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-800 rounded-lg">
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-500' : remoteJoined ? 'bg-amber-400 animate-pulse' : 'bg-gray-500'}`} />
            <span className="text-xs text-gray-400">
              {connected ? 'Connected' : remoteJoined ? 'Connecting...' : 'Waiting for peer'}
            </span>
          </div>
          <span className="text-xs text-gray-400 px-2 py-1 bg-gray-800 rounded-lg flex items-center gap-1">
            <Users size={11} />
            {participantCount}
          </span>
        </div>
      </div>

      {/* Video area */}
      <div className="flex-1 relative bg-black overflow-hidden">

        {/* Remote video — full screen */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Waiting overlay — shown when no remote peer yet */}
        {!connected && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
            {loading ? (
              <>
                <Loader2 size={32} className="text-white animate-spin mb-3" />
                <p className="text-sm text-gray-300">
                  {remoteJoined ? 'Establishing connection...' : 'Waiting for someone to join...'}
                </p>
                <p className="text-xs text-gray-500 mt-1 font-mono">{joinid}</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mb-3">
                  <Users size={24} className="text-gray-400" />
                </div>
                <p className="text-sm text-gray-300">Waiting for peer to join...</p>
                <p className="text-xs text-gray-500 mt-1">Share the meeting ID: <span className="font-mono text-white">{joinid}</span></p>
              </>
            )}
          </div>
        )}

        {/* Local video — picture in picture, bottom right */}
        <div className="absolute bottom-24 right-4 w-32 h-24 sm:w-40 sm:h-28 rounded-xl overflow-hidden border-2 border-gray-700 shadow-lg bg-gray-800">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted   // muted to prevent echo of your own audio
            className="w-full h-full object-cover scale-x-[-1]" // mirror effect
          />
          {!videoEnabled && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <VideoOff size={20} className="text-gray-400" />
            </div>
          )}
          <p className="absolute bottom-1 left-1 text-xs text-white bg-black/50 px-1 rounded">
            You
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex-shrink-0 bg-gray-900 border-t border-gray-800 px-4 py-4 flex items-center justify-center gap-4">

        {/* Mute/Unmute */}
        <button
          onClick={toggleAudio}
          className={`flex flex-col items-center gap-1 p-3 rounded-full transition-colors ${
            audioEnabled
              ? 'bg-gray-700 text-white hover:bg-gray-600'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
          title={audioEnabled ? 'Mute' : 'Unmute'}
        >
          {audioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
        </button>

        {/* End call */}
        <button
          onClick={handleLeave}
          className="flex flex-col items-center gap-1 p-4 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
          title="Leave call"
        >
          <PhoneOff size={22} />
        </button>

        {/* Camera on/off */}
        <button
          onClick={toggleVideo}
          className={`flex flex-col items-center gap-1 p-3 rounded-full transition-colors ${
            videoEnabled
              ? 'bg-gray-700 text-white hover:bg-gray-600'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
          title={videoEnabled ? 'Stop video' : 'Start video'}
        >
          {videoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
        </button>
      </div>
    </div>
  );
}