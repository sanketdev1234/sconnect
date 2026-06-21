// src/components/Video/VideoCall.jsx
import React, { useEffect, useRef, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserContext } from '../usercontext';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  ArrowLeft, MessageSquare, AlertCircle, Loader2, Hash, RefreshCw
} from 'lucide-react';

export default function VideoCall() {
  const { joinid } = useParams();
  const navigate = useNavigate();
  const { curruser } = useContext(UserContext);

  const jitsiContainerRef = useRef(null);
  const apiRef = useRef(null);
  const timeoutRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [participantCount, setParticipantCount] = useState(1);
  const [retryKey, setRetryKey] = useState(0);

  const loadJitsiScript = () => {
    return new Promise((resolve, reject) => {
      if (window.JitsiMeetExternalAPI) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Failed to load Jitsi script'));
      document.body.appendChild(script);
    });
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');

    const initJitsi = async () => {
      try {
        await loadJitsiScript();
        if (!mounted) return;

        const roomName = `SConnect-${joinid}`;
        const domain = 'meet.jit.si';

        const options = {
          roomName,
          width: '100%',
          height: '100%',
          parentNode: jitsiContainerRef.current,
          userInfo: {
            displayName: curruser?.display_name || 'Guest',
            email: curruser?.email || '',
          },
          configOverwrite: {
  startWithAudioMuted: false,
  startWithVideoMuted: false,
  disableDeepLinking: true,
  // ✅ NEW — skip the "waiting for moderator" lobby entirely
  enableLobby: false,
  enableClosePage: false,
  prejoinConfig: {
    enabled: true, // keep prejoin (your choice earlier)
  },
},
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'closedcaptions', 'desktop',
              'fullscreen', 'fodeviceselection', 'hangup', 'chat',
              'settings', 'raisehand', 'videoquality', 'tileview',
              'select-background', 'mute-everyone'
            ],
          },
        };

        const api = new window.JitsiMeetExternalAPI(domain, options);
        apiRef.current = api;

        // ✅ Now that prejoin is shown, "loading" should clear as soon as
        // Jitsi has rendered the prejoin screen itself — not wait for full join
        api.addEventListener('videoConferenceJoined', () => {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setLoading(false);
          toast.success('Joined the video call');
        });

        // ✅ Fires once Jitsi's UI (including prejoin screen) is rendered and ready
        // This is the correct event to clear our spinner on, since prejoin
        // requires user interaction before videoConferenceJoined fires
        api.addEventListener('videoConferenceJoined', () => {
          setLoading(false);
        });

        // Clear loading once the iframe itself has rendered the prejoin UI
        // 'participantRoleChanged' isn't reliable for this — use a short
        // fixed delay instead, since Jitsi's iframe renders almost instantly
        // once the script + room handshake succeeds (confirmed by your test)
        const prejoinRenderTimer = setTimeout(() => {
          if (mounted) setLoading(false);
        }, 3000);

        timeoutRef.current = setTimeout(() => {
          if (mounted && loading) {
            setError(
              'Connection is taking too long. Please try again or refresh the page.'
            );
            setLoading(false);
          }
        }, 200000);

        api.addEventListener('connectionFailed', () => {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          clearTimeout(prejoinRenderTimer);
          setError('Could not connect to the video server. Please check your network connection.');
          setLoading(false);
        });

        api.addEventListener('participantJoined', () => {
          setParticipantCount(prev => prev + 1);
          toast.info('A participant joined the call', { autoClose: 2000 });
        });

        api.addEventListener('participantLeft', () => {
          setParticipantCount(prev => Math.max(1, prev - 1));
        });

        api.addEventListener('readyToClose', () => {
          navigate('/dashboard');
        });

        api.addEventListener('videoConferenceLeft', () => {
          navigate('/dashboard');
        });

        return () => {
          clearTimeout(prejoinRenderTimer);
        };

      } catch (err) {
        console.error(err);
        if (mounted) {
          setError('Failed to load video call script. Please check your connection.');
          setLoading(false);
        }
      }
    };

    initJitsi();

    return () => {
      mounted = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, [joinid, curruser, retryKey]);

  const handleLeave = () => {
    if (apiRef.current) {
      apiRef.current.executeCommand('hangup');
    }
    navigate('/dashboard');
  };

  const handleRetry = () => {
    setError('');
    setLoading(true);
    setRetryKey(prev => prev + 1);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white border border-red-200 rounded-xl p-10 text-center max-w-md">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={22} className="text-red-400" />
          </div>
          <p className="text-sm font-semibold text-gray-700 mb-1">{error}</p>
          <div className="flex items-center justify-center gap-3 mt-5">
            <button
              onClick={handleRetry}
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 transition-colors"
            >
              <RefreshCw size={13} />
              Try Again
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

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
          <span className="text-xs text-gray-400 px-2 py-1 bg-gray-800 rounded-lg">
            {participantCount} {participantCount === 1 ? 'participant' : 'participants'}
          </span>
          <button
            onClick={() => navigate(`/ongoingmeet/${joinid}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <MessageSquare size={13} />
            Chat
          </button>
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-900">
          <Loader2 size={32} className="text-white animate-spin mb-3" />
          <p className="text-sm text-gray-300">Loading video call...</p>
        </div>
      )}

      <div ref={jitsiContainerRef} className="flex-1" />
    </div>
  );
}