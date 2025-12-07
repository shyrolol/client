import { useEffect, useRef, useState, useCallback } from "react";
import SimplePeer from "simple-peer";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";

type ConnectionQuality = "excellent" | "good" | "fair" | "poor";

interface VoiceParticipantPayload {
  socketId: string;
  userId: string;
  displayName: string;
  avatar?: string | null;
}

interface PeerData extends VoiceParticipantPayload {
  peer: SimplePeer.Instance;
  audioStream?: MediaStream;
  isSpeaking?: boolean;
}

interface ScreenShareState {
  userId: string;
  displayName: string;
  stream: MediaStream;
}

export const useVoice = (channelId: string | null) => {
  const { socket } = useSocket();
  const { user } = useAuth();

  const [peers, setPeers] = useState<PeerData[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const [connectionQuality, setConnectionQuality] =
    useState<ConnectionQuality>("excellent");
  const [screenShare, setScreenShare] = useState<ScreenShareState | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const peersRef = useRef<PeerData[]>([]);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioElementsRef = useRef<{ [key: string]: HTMLAudioElement }>({});
  const screenStreamRef = useRef<MediaStream | null>(null);
  const pingIntervalRef = useRef<number | null>(null);

  const getUserSettings = useCallback(() => {
    return (user as any) || {};
  }, [user]);

  const updatePeers = (newPeers: PeerData[]) => {
    peersRef.current = newPeers;
    setPeers(newPeers);
  };

  const mapLatencyToQuality = (value: number): ConnectionQuality => {
    if (value <= 70) return "excellent";
    if (value <= 130) return "good";
    if (value <= 220) return "fair";
    return "poor";
  };

  // Sound Effects
  const playSound = (type: 'join' | 'leave' | 'mute' | 'deafen') => {
    const sounds = {
      join: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
      leave: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3',
      mute: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
      deafen: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'
    };
    const audio = new Audio(sounds[type]);
    audio.volume = 0.4;
    audio.play().catch(e => console.log('Audio play failed', e));
  };

  const getAudioConstraints = useCallback(async () => {
    const userSettings = getUserSettings();
    const constraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: { exact: true },
        noiseSuppression: { exact: true },
        autoGainControl: true,
        sampleRate: 48000,
        googEchoCancellation: true,
        googExperimentalEchoCancellation: true,
        googAutoGainControl: true,
        googNoiseSuppress: true,
        googHighpassFilter: true,
        googEchoCancellation2: true,
        googAutoGainControl2: true,
        googNoiseSuppression2: true,
      } as any,
    };

    if (userSettings?.inputDevice) {
      (constraints.audio as any).deviceId = {
        exact: userSettings.inputDevice,
      };
    }

    return constraints;
  }, [getUserSettings]);

  const applyOutputDevice = useCallback((deviceId: string | null) => {
    if (!deviceId) return;

      Object.values(audioElementsRef.current).forEach((audio) => {
        if ((audio as any).setSinkId) {
          (audio as any).setSinkId(deviceId).catch(() => {});
        }
      });
  }, []);

  const applyVolume = useCallback((volume: number) => {
    Object.values(audioElementsRef.current).forEach((audio) => {
      audio.volume = volume / 100;
    });
  }, []);

  const applyInputVolume = useCallback((volume: number) => {
    if (localStreamRef.current && gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume / 100;
    }
  }, []);

  useEffect(() => {
    const userSettings = getUserSettings();
    if (userSettings) {
      if (userSettings.outputDevice) applyOutputDevice(userSettings.outputDevice);
      if (userSettings.outputVolume !== undefined)
        applyVolume(userSettings.outputVolume);
      if (userSettings.inputVolume !== undefined)
        applyInputVolume(userSettings.inputVolume);
    }
  }, [
    user,
    getUserSettings,
    applyOutputDevice,
    applyVolume,
    applyInputVolume,
  ]);

  const remoteAudioContextsRef = useRef<{ [key: string]: AudioContext }>({});
  const remoteAnimationFramesRef = useRef<{ [key: string]: number }>({});

  const setupRemoteAudioAnalysis = (stream: MediaStream, socketId: string) => {
    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      remoteAudioContextsRef.current[socketId] = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkAudioLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const average =
          dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const speakingThreshold = 16;

        const isSpeakingNow = average > speakingThreshold;

        updatePeers(
          peersRef.current.map((peer) =>
            peer.socketId === socketId
              ? { ...peer, isSpeaking: isSpeakingNow }
              : peer
          )
        );
        remoteAnimationFramesRef.current[socketId] = requestAnimationFrame(checkAudioLevel);
      };

      checkAudioLevel();
    } catch (error) {
      
    }
  };

  const setupAudioAnalysis = (stream: MediaStream) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }

    const audioContext = audioContextRef.current;
    const userSettings = getUserSettings();

    if (!gainNodeRef.current) {
      gainNodeRef.current = audioContext.createGain();
    }
    gainNodeRef.current!.gain.value =
      (userSettings?.inputVolume ?? 100) / 100;

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(gainNodeRef.current);
    gainNodeRef.current!.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const checkAudioLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      const average =
        dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      setIsSpeaking(average > 18);
      animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
    };
    checkAudioLevel();
  };

  const attachAudioStream = (
    participant: VoiceParticipantPayload,
    remoteStream: MediaStream
  ) => {
    const userSettings = getUserSettings();
    const audio = new Audio();
    audio.srcObject = remoteStream;
    audio.autoplay = true;
    audio.volume = (userSettings?.outputVolume ?? 100) / 100;
    audio.muted = isDeafened;

    if (userSettings?.outputDevice && (audio as any).setSinkId) {
      (audio as any).setSinkId(userSettings.outputDevice).catch(() => {});
    }

    audioElementsRef.current[participant.socketId] = audio;
    setupRemoteAudioAnalysis(remoteStream, participant.socketId);

    updatePeers(
      peersRef.current.map((peer) =>
        peer.socketId === participant.socketId
          ? { ...peer, audioStream: remoteStream }
          : peer
      )
    );
  };

  const removePeer = (socketId: string) => {
    if (audioElementsRef.current[socketId]) {
      audioElementsRef.current[socketId].pause();
      audioElementsRef.current[socketId].srcObject = null;
      delete audioElementsRef.current[socketId];
    }

    if (remoteAudioContextsRef.current[socketId]) {
      remoteAudioContextsRef.current[socketId].close();
      delete remoteAudioContextsRef.current[socketId];
    }

    if (remoteAnimationFramesRef.current[socketId]) {
      cancelAnimationFrame(remoteAnimationFramesRef.current[socketId]);
      delete remoteAnimationFramesRef.current[socketId];
    }

    updatePeers(peersRef.current.filter((peer) => peer.socketId !== socketId));
    setScreenShare((prev) =>
      prev && prev.userId === socketId ? null : prev
    );
  };

  const createPeer = (
    participant: VoiceParticipantPayload,
    initiator: boolean,
    stream: MediaStream
  ) => {
    const peer = new SimplePeer({
      initiator,
      trickle: false,
      stream,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      },
    });

    if (screenStreamRef.current) {
      peer.addStream(screenStreamRef.current);
    }

    peer.on('signal', (signal) => {
      socket?.emit('voice_signal', {
        to: participant.socketId,
        signal,
      });
    });

    peer.on('stream', (remoteStream) => {
      if (remoteStream.getVideoTracks().length > 0) {
        remoteStream.getVideoTracks().forEach((track) => {
          track.onended = () => {
            setScreenShare((prev) =>
              prev?.userId === participant.userId ? null : prev
            );
          };
        });
        setScreenShare({
          userId: participant.userId,
          displayName: participant.displayName,
          stream: remoteStream,
        });
      } else {
        attachAudioStream(participant, remoteStream);
      }
    });

    peer.on('error', () => {
      
    });

    peer.on('close', () => {
      removePeer(participant.socketId);
    });

    return peer;
  };

  const joinVoice = useCallback(async () => {
    if (!channelId) return;
    if (!socket) {
      alert('⚠️ Connection not established. Please refresh the page.');
      return;
    }
    if (!socket.connected) {
      alert('⚠️ Connection not ready. Please wait a moment and try again.');
      return;
    }
    if (!user) {
      alert('⚠️ Please log in first.');
      return;
    }

    try {
      const constraints = await getAudioConstraints();
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);
      setupAudioAnalysis(stream);
      playSound('join');

      const handleVoiceUsers = (userInVoice: VoiceParticipantPayload[]) => {
        const media = localStreamRef.current;
        if (!media) return;

        const newPeers: PeerData[] = [];
        userInVoice.forEach((participant) => {
          if (peersRef.current.some((p) => p.socketId === participant.socketId))
            return;

          const peer = createPeer(participant, true, media);
          newPeers.push({ ...participant, peer });
        });

        if (newPeers.length) {
          updatePeers([...peersRef.current, ...newPeers]);
        }
      };

      const handleVoiceSignal = (data: {
        signal: SimplePeer.SignalData;
        from: string;
        userId: string;
        displayName?: string;
        avatar?: string | null;
      }) => {
        const media = localStreamRef.current;
        if (!media) return;

        const participant: VoiceParticipantPayload = {
          socketId: data.from,
          userId: data.userId,
          displayName: data.displayName || 'Participant',
          avatar: data.avatar,
        };

        const existingPeer = peersRef.current.find(
          (p) => p.socketId === data.from
        );

        if (existingPeer) {
          existingPeer.peer.signal(data.signal);
          updatePeers(
            peersRef.current.map((peer) =>
              peer.socketId === data.from
                ? { ...peer, displayName: participant.displayName, avatar: participant.avatar }
                : peer
            )
          );
        } else {
          const peer = createPeer(participant, false, media);
          peer.signal(data.signal);
          updatePeers([...peersRef.current, { ...participant, peer }]);
        }
      };

      const handleVoiceUserJoined = (payload: {
        socketId: string;
        userId: string;
        displayName?: string;
        avatar?: string | null;
      }) => {
        const media = localStreamRef.current;
        if (!media) return;
        if (payload.socketId === socket.id) return;
        if (peersRef.current.some((p) => p.socketId === payload.socketId)) return;

        const participant: VoiceParticipantPayload = {
          socketId: payload.socketId,
          userId: payload.userId,
          displayName: payload.displayName || 'Unknown',
          avatar: payload.avatar,
        };

        const peer = createPeer(participant, false, media);
        updatePeers([...peersRef.current, { ...participant, peer }]);
      };

      const handleVoiceUserLeft = (payload: {
        socketId: string;
        userId: string;
      }) => {
        const peer = peersRef.current.find(
          (p) => p.socketId === payload.socketId
        );
        if (peer) {
          peer.peer.destroy();
        }
        removePeer(payload.socketId);
      };

      socket.on('voice_users', handleVoiceUsers);
      socket.on('voice_signal', handleVoiceSignal);
      socket.on('voice_user_joined', handleVoiceUserJoined);
      socket.on('voice_user_left', handleVoiceUserLeft);
      socket.on('user_left_voice', handleVoiceUserLeft);

      socket.emit('join_voice', { channelId, userId: user.id });

      return () => {
        socket.off('voice_users', handleVoiceUsers);
        socket.off('voice_signal', handleVoiceSignal);
        socket.off('voice_user_left', handleVoiceUserLeft);
        socket.off('user_left_voice', handleVoiceUserLeft);
      };
    } catch (error) {
      alert('Failed to access microphone. Please check your permissions.');
    }
  }, [channelId, socket, user, getAudioConstraints, getUserSettings]);

  const leaveVoice = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
      playSound('leave');
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    setScreenShare(null);
    setIsScreenSharing(false);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    gainNodeRef.current = null;
    analyserRef.current = null;

    Object.values(remoteAudioContextsRef.current).forEach((ctx) => {
      ctx.close();
    });
    remoteAudioContextsRef.current = {};

    Object.values(remoteAnimationFramesRef.current).forEach((frameId) => {
      cancelAnimationFrame(frameId);
    });
    remoteAnimationFramesRef.current = {};

    Object.values(audioElementsRef.current).forEach((audio) => {
      audio.pause();
      audio.srcObject = null;
    });
    audioElementsRef.current = {};

    peersRef.current.forEach((p) => p.peer.destroy());
    updatePeers([]);

    if (channelId && socket) {
      socket.emit('leave_voice', { channelId });
      socket.off('voice_users');
      socket.off('voice_signal');
      socket.off('voice_user_left');
      socket.off('user_left_voice');
    }
  }, [channelId, socket]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        playSound('mute');
        if (socket) {
          socket.emit("voice_state_update", {
            channelId,
            isMuted: !audioTrack.enabled,
            isDeafened,
          });
        }
      }
    }
  }, [channelId, socket, isDeafened]);

  const toggleDeafen = useCallback(() => {
    setIsDeafened((prev) => {
      const nextState = !prev;
      Object.values(audioElementsRef.current).forEach((audio) => {
        audio.muted = nextState;
      });
      playSound('deafen');
      if (socket) {
        socket.emit("voice_state_update", {
          channelId,
          isMuted: isMuted || nextState,
          isDeafened: nextState,
        });
      }
      return nextState;
    });
  }, [channelId, socket, isMuted]);

  const stopScreenShare = useCallback(() => {
    if (!screenStreamRef.current) return;

    const currentStream = screenStreamRef.current;

    try {
      if (socket && channelId) {
        socket.emit('stop_screen_share', { channelId });
      }

      currentStream.getTracks().forEach((track) => {
        track.stop();
      });

      setTimeout(() => {
        peersRef.current.forEach((peer) => {
          try {
            if (peer.peer && !peer.peer.destroyed) {
              peer.peer.removeStream(currentStream);
            }
          } catch (error) {
            
          }
        });
      }, 50);

      screenStreamRef.current = null;
      setIsScreenSharing(false);

      setScreenShare((prev) => {
        if (prev && prev.userId === (user?.id || 'local')) {
          return null;
        }
        return prev;
      });
    } catch (error) {
      screenStreamRef.current = null;
      setIsScreenSharing(false);
    }
  }, [user, socket, channelId]);

  const startScreenShare = useCallback(async () => {
    if (isScreenSharing) return;
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: { ideal: 30 },
        },
      });
      screenStreamRef.current = stream;
      peersRef.current.forEach((peer) => peer.peer.addStream(stream));
      setScreenShare({
        userId: user?.id || "local",
        displayName: user?.displayName || "You",
        stream,
      });
      setIsScreenSharing(true);
      
      stream.getVideoTracks().forEach((track) => {
        track.onended = () => {
          stopScreenShare();
        };
      });
    } catch (error) {
      
    }
  }, [isScreenSharing, user, stopScreenShare]);

  useEffect(() => {
    return () => {
      leaveVoice();
    };
  }, [leaveVoice]);

  const sendPing = useCallback(() => {
    if (!socket) return;
    socket.emit("voice_ping", Date.now());
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    const handlePong = (payload: { sentAt: number }) => {
      const rtt = Date.now() - payload.sentAt;
      setLatency(rtt);
      setConnectionQuality(mapLatencyToQuality(rtt));
    };

    socket.on('voice_pong', handlePong);
    sendPing();
    pingIntervalRef.current = window.setInterval(sendPing, 5000);

    return () => {
      socket.off('voice_pong', handlePong);
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
    };
  }, [socket, sendPing]);

  return {
    joinVoice,
    leaveVoice,
    peers,
    localStream,
    isMuted,
    isDeafened,
    isSpeaking,
    latency,
    connectionQuality,
    toggleMute,
    toggleDeafen,
    startScreenShare,
    stopScreenShare,
    isScreenSharing,
    screenShare,
  };
};
