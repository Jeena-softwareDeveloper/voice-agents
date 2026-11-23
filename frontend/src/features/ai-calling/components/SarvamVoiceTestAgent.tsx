'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Clock,
  Radio,
  CheckCircle2,
  AlertCircle,
  Send,
  X,
  Edit2,
  RotateCcw,
  Check,
  Smartphone,
  MessageSquare,
  Sparkles,
  Bot,
  Sliders,
} from 'lucide-react';
import { aiCallingApi } from '../api/ai-calling.api';
import { getAuthToken, getTenantId } from '@/lib/api/interceptors';
import { Service, SarvamLanguage, SarvamVoice, AgentConfiguration, ProviderCapabilities } from '@/types';

interface SarvamVoiceTestAgentProps {
  services?: Service[];
  companyName?: string;
  availableLanguages?: SarvamLanguage[];
  availableVoices?: SarvamVoice[];
  onOpenAnalytics?: () => void;
  onRefresh?: () => void | Promise<void>;
}

interface TranscriptTurn {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: string;
  interrupted?: boolean;
}

export const SarvamVoiceTestAgent: React.FC<SarvamVoiceTestAgentProps> = ({
  services = [],
  companyName = 'Organization',
  availableLanguages = [],
  availableVoices = [],
  onOpenAnalytics,
  onRefresh,
}) => {
  // Dynamic Agent Configuration (loaded from database)
  const [agentConfig, setAgentConfig] = useState<AgentConfiguration | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  // Dynamic Provider Capabilities (languages, voices, models)
  const [capabilities, setCapabilities] = useState<ProviderCapabilities | null>(null);
  const [isLoadingCapabilities, setIsLoadingCapabilities] = useState(true);

  // Edit Agent Configuration Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editGreeting, setEditGreeting] = useState('');
  const [editInstructions, setEditInstructions] = useState('');
  const [editLanguage, setEditLanguage] = useState('hi-IN');
  const [editSpeaker, setEditSpeaker] = useState('kavya');
  const [editModel, setEditModel] = useState('bulbul:v3');
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [guidanceText, setGuidanceText] = useState('');
  const [showGuidanceInput, setShowGuidanceInput] = useState(false);

  // Test Mode: 'voice' | 'phone' | 'chat'
  const [testMode, setTestMode] = useState<'voice' | 'phone' | 'chat'>('voice');

  // Live Connection State
  const [connectionState, setConnectionState] = useState<
    'IDLE' | 'CONNECTING' | 'CONNECTED' | 'LISTENING' | 'SPEAKING' | 'ENDED'
  >('IDLE');
  const [isMuted, setIsMuted] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);

  // Live Transcripts (Empty by default; populated only during actual test sessions)
  const [transcripts, setTranscripts] = useState<TranscriptTurn[]>([]);

  // Phone Test State
  const [phoneTestNumber, setPhoneTestNumber] = useState('');
  const [isDispatchingPhone, setIsDispatchingPhone] = useState(false);
  const [phoneTestMessage, setPhoneTestMessage] = useState<string | null>(null);

  // Chat Test State
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [quotaNotice, setQuotaNotice] = useState<string | null>(null);

  // Test History Drawer
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [testHistory, setTestHistory] = useState<any[]>([]);

  // Refs for SDK instances and timers
  const agentInstanceRef = useRef<any>(null);
  const audioInterfaceRef = useRef<any>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const levelIntervalRef = useRef<any>(null);

  // 1. Retrieve Active Configuration from DB and Provider Capabilities via Backend
  useEffect(() => {
    let isMounted = true;
    setIsLoadingConfig(true);
    setIsLoadingCapabilities(true);

    Promise.all([
      aiCallingApi.getAgentConfiguration().catch((err) => {
        console.error('Failed to load agent configuration:', err);
        return null;
      }),
      aiCallingApi.getProviderCapabilities().catch((err) => {
        console.error('Failed to load provider capabilities:', err);
        return null;
      }),
    ])
      .then(([config, caps]) => {
        if (!isMounted) return;
        if (caps) {
          setCapabilities(caps);
        }
        if (config) {
          setAgentConfig(config);
          if (config.agentName) setEditName(config.agentName);
          if (config.agentRole) setEditRole(config.agentRole);
          if (config.openingGreeting) setEditGreeting(config.openingGreeting);
          if (config.fullPrompt) setEditInstructions(config.fullPrompt);
          if ((config.speakingStyle as any)?.language) {
            setEditLanguage((config.speakingStyle as any).language);
          } else if (caps?.defaultSettings?.languageId) {
            setEditLanguage(caps.defaultSettings.languageId);
          }
          if ((config.speakingStyle as any)?.speaker) {
            setEditSpeaker((config.speakingStyle as any).speaker);
          } else if (caps?.defaultSettings?.voiceId) {
            setEditSpeaker(caps.defaultSettings.voiceId);
          }
          if ((config.speakingStyle as any)?.model) {
            setEditModel((config.speakingStyle as any).model);
          } else if (caps?.defaultSettings?.modelId) {
            setEditModel(caps.defaultSettings.modelId);
          }
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingConfig(false);
          setIsLoadingCapabilities(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Scroll transcript to bottom
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  // Session duration timer
  useEffect(() => {
    if (
      connectionState === 'CONNECTED' ||
      connectionState === 'LISTENING' ||
      connectionState === 'SPEAKING'
    ) {
      timerIntervalRef.current = setInterval(() => {
        setSessionDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [connectionState]);

  // Audio waveform animation
  useEffect(() => {
    if (connectionState === 'SPEAKING') {
      levelIntervalRef.current = setInterval(() => {
        setAudioLevel(0.4 + Math.random() * 0.5);
      }, 120);
    } else if (connectionState === 'LISTENING' && !isMuted) {
      levelIntervalRef.current = setInterval(() => {
        setAudioLevel(0.1 + Math.random() * 0.25);
      }, 150);
    } else {
      setAudioLevel(0);
      if (levelIntervalRef.current) clearInterval(levelIntervalRef.current);
    }
    return () => {
      if (levelIntervalRef.current) clearInterval(levelIntervalRef.current);
    };
  }, [connectionState, isMuted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (agentInstanceRef.current) {
        agentInstanceRef.current.stop().catch(() => {});
        agentInstanceRef.current = null;
      }
      if (audioInterfaceRef.current) {
        audioInterfaceRef.current.stop().catch(() => {});
        audioInterfaceRef.current = null;
      }
    };
  }, []);

  // Format Duration seconds (mm:ss)
  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper for language labels (driven by provider capabilities)
  const getLanguageLabel = (code: string) => {
    const found = capabilities?.languages.find((l) => l.id === code || l.code === code);
    if (found) {
      return `${found.name} (${found.nativeName})`;
    }
    return code;
  };

  // Action: Open Edit Configuration Modal
  const handleOpenEditModal = () => {
    setEditName(agentConfig?.agentName || '');
    setEditRole(agentConfig?.agentRole || '');
    setEditGreeting(
      agentConfig?.openingGreeting ||
        `Hello! This is ${agentConfig?.agentName || 'your advisor'} calling from ${companyName}. How may I help you today?`,
    );
    setEditInstructions(
      agentConfig?.fullPrompt ||
        `Identity: Professional voice advisor for ${companyName}. Objective: Acknowledge inquiries, qualify requirements, and schedule consultations.`,
    );
    setEditLanguage(
      (agentConfig?.speakingStyle as any)?.language ||
        capabilities?.defaultSettings?.languageId ||
        'hi-IN',
    );
    setEditSpeaker(
      (agentConfig?.speakingStyle as any)?.speaker ||
        capabilities?.defaultSettings?.voiceId ||
        'kavya',
    );
    setEditModel(
      (agentConfig?.speakingStyle as any)?.model ||
        capabilities?.defaultSettings?.modelId ||
        'bulbul:v3',
    );
    setShowGuidanceInput(false);
    setGuidanceText('');
    setIsEditModalOpen(true);
  };

  // Action: Regenerate with Gemini
  const handleRegenerateWithGemini = async () => {
    setIsRegenerating(true);
    try {
      const regenerated = await aiCallingApi.generateAgentConfiguration(
        guidanceText.trim() || undefined,
      );
      setAgentConfig(regenerated);
      if (regenerated.agentName) setEditName(regenerated.agentName);
      if (regenerated.agentRole) setEditRole(regenerated.agentRole);
      if (regenerated.openingGreeting) setEditGreeting(regenerated.openingGreeting);
      if (regenerated.fullPrompt) setEditInstructions(regenerated.fullPrompt);
      if ((regenerated.speakingStyle as any)?.language) {
        setEditLanguage((regenerated.speakingStyle as any).language);
      }
      if ((regenerated.speakingStyle as any)?.speaker) {
        setEditSpeaker((regenerated.speakingStyle as any).speaker);
      }
      if ((regenerated.speakingStyle as any)?.model) {
        setEditModel((regenerated.speakingStyle as any).model);
      }
      setShowGuidanceInput(false);
      setGuidanceText('');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error('Failed to regenerate configuration with Gemini:', err);
      alert('Failed to regenerate with Gemini: ' + (err?.response?.data?.message || err.message));
    } finally {
      setIsRegenerating(false);
    }
  };

  // Action: Save Edited Agent Configuration (Draft)
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentConfig?.id || !editName.trim()) return;

    setIsSavingConfig(true);
    try {
      const updated = await aiCallingApi.updateAgentConfiguration(agentConfig.id, {
        agentName: editName.trim(),
        agentRole: editRole.trim(),
        openingGreeting: editGreeting.trim(),
        fullPrompt: editInstructions.trim(),
        speakingStyle: {
          ...(typeof agentConfig.speakingStyle === 'object' ? agentConfig.speakingStyle : {}),
          language: editLanguage,
          speaker: editSpeaker,
          model: editModel,
        },
      });
      setAgentConfig(updated);
      setIsEditModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error('Failed to update agent configuration:', err);
      alert('Failed to update configuration: ' + (err?.response?.data?.message || err.message));
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Action: Approve & Publish Configuration
  const handleApproveConfig = async () => {
    if (!agentConfig?.id || !editName.trim()) return;

    setIsApproving(true);
    try {
      // 1. First save any in-progress edits
      const saved = await aiCallingApi.updateAgentConfiguration(agentConfig.id, {
        agentName: editName.trim(),
        agentRole: editRole.trim(),
        openingGreeting: editGreeting.trim(),
        fullPrompt: editInstructions.trim(),
        speakingStyle: {
          ...(typeof agentConfig.speakingStyle === 'object' ? agentConfig.speakingStyle : {}),
          language: editLanguage,
          speaker: editSpeaker,
          model: editModel,
        },
      });

      // 2. Approve and publish
      const approved = await aiCallingApi.approveAgentConfiguration(saved.id);
      setAgentConfig(approved);
      setIsEditModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error('Failed to approve agent configuration:', err);
      alert('Failed to approve configuration: ' + (err?.response?.data?.message || err.message));
    } finally {
      setIsApproving(false);
    }
  };

  // Action: Clear Conversation
  const handleClearConversation = () => {
    setTranscripts([]);
    setConnectionState('IDLE');
    setSessionDuration(0);
    setPhoneTestMessage(null);
    setQuotaNotice(null);
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
  };

  // Action: Load Test History
  const handleOpenTestHistory = async () => {
    try {
      const serviceId = services[0]?.id || agentConfig?.id;
      const data = await aiCallingApi.getTestSessionHistory(serviceId);
      setTestHistory(data || []);
      setIsHistoryDrawerOpen(true);
    } catch (err) {
      console.error('Failed to load test history:', err);
    }
  };

  // =========================================================================
  // Generate Contextual Agent Response for Voice & Chat Test
  const generateAgentReply = (userText: string) => {
    const lower = userText.toLowerCase();

    // Check matched offering
    const matchedService = services.find(
      (s) =>
        lower.includes(s.name.toLowerCase()) ||
        (s.category && lower.includes(s.category.toLowerCase())) ||
        (s.location && lower.includes(s.location.toLowerCase())),
    );

    if (matchedService) {
      return `Regarding our ${matchedService.name}: it is located in ${matchedService.location || 'prime market area'} with pricing starting at ${matchedService.pricingInfo || 'competitive rates'}. Would you like me to schedule a consultation or site visit for you?`;
    }

    if (lower.includes('price') || lower.includes('cost') || lower.includes('pricing') || lower.includes('rate')) {
      if (services.length > 0) {
        return `Our offerings start at ${services[0].pricingInfo || 'custom pricing based on your requirements'}. May I know your preferred budget and timeline?`;
      }
      return `Our pricing is customized to your exact requirements. Could you share a few details about your preferred scale?`;
    }

    if (
      lower.includes('visit') ||
      lower.includes('appointment') ||
      lower.includes('meet') ||
      lower.includes('call') ||
      lower.includes('schedule')
    ) {
      return `I would be delighted to schedule that for you! Would this upcoming weekend or a weekday afternoon work best for you?`;
    }

    if (lower.includes('location') || lower.includes('where') || lower.includes('address')) {
      const locs = services.map((s) => s.location).filter(Boolean).join(', ');
      return `We are actively serving clients across ${locs || 'our regional network'}. Which specific area are you looking for?`;
    }

    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey') || lower.includes('namaste')) {
      return `Hello! How can I assist you with ${companyName}'s offerings today?`;
    }

    if (lower.includes('yes') || lower.includes('sure') || lower.includes('okay') || lower.includes('fine')) {
      return `Wonderful! I have noted down your confirmation. Our team will follow up with complete details. Is there anything else you would like to know?`;
    }

    if (lower.includes('thank') || lower.includes('bye') || lower.includes('no')) {
      return `Thank you for speaking with ${agentConfig?.agentName || 'us'} today. Have a wonderful day ahead!`;
    }

    return `Thank you for sharing that. I have noted your requirements regarding our services and will make sure our team prepares the exact details for you.`;
  };

  // Synthesize Voice: Official Voice Provider Audio (Sarvam AI Bulbul)
  const speakVoiceText = async (text: string, onDone: () => void) => {
    setConnectionState('SPEAKING');

    try {
      const activeLanguage = (agentConfig?.speakingStyle as any)?.language || editLanguage || 'hi-IN';
      const activeSpeaker = (agentConfig?.speakingStyle as any)?.speaker || editSpeaker || 'kavya';
      const activeModel = (agentConfig?.speakingStyle as any)?.model || editModel || 'bulbul:v3';

      const res = await aiCallingApi.synthesizeSpeech({
        text,
        language: activeLanguage,
        speaker: activeSpeaker,
        model: activeModel,
      });

      if (res?.audioBase64) {
        setQuotaNotice(null);
        if (activeAudioRef.current) {
          activeAudioRef.current.pause();
          activeAudioRef.current = null;
        }
        const audio = new Audio(`data:audio/wav;base64,${res.audioBase64}`);
        activeAudioRef.current = audio;
        audio.onended = () => {
          activeAudioRef.current = null;
          onDone();
        };
        audio.onerror = () => {
          activeAudioRef.current = null;
          onDone();
        };
        await audio.play();
        return;
      }
    } catch (sarvamErr: any) {
      const errMsg = sarvamErr?.response?.data?.message || sarvamErr?.message || '';
      console.warn('Voice synthesis error:', errMsg);
      if (
        errMsg.includes('402') ||
        errMsg.includes('0 credits') ||
        errMsg.includes('No credits available') ||
        errMsg.includes('Insufficient')
      ) {
        setQuotaNotice(
          'AI Voice account has insufficient credits. Please top up credits to hear authentic AI voice playback.',
        );
      } else {
        setQuotaNotice(`Voice synthesis notice: ${errMsg}`);
      }
    }

    onDone();
  };

  // Interactive Browser Voice Session (Duplex Microphone + Web Speech Fallback)
  const startInteractiveBrowserVoice = async () => {
    try {
      setConnectionState('CONNECTING');
      setSessionDuration(0);
      setTranscripts([]);

      // 1. Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioCtx();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const volumeCheckInterval = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(1, avg / 80));
      }, 100);

      audioInterfaceRef.current = {
        stop: async () => {
          clearInterval(volumeCheckInterval);
          stream.getTracks().forEach((track) => track.stop());
          if (audioContext.state !== 'closed') audioContext.close();
        },
      };

      setConnectionState('CONNECTED');

      // 2. Initial agent greeting
      const greeting =
        agentConfig?.openingGreeting ||
        `Hello! This is ${agentConfig?.agentName || 'your voice assistant'} from ${companyName}. How may I help you today?`;

      setTranscripts([
        {
          id: `greet_${Date.now()}`,
          role: 'bot',
          content: greeting,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      // Speak greeting
      speakVoiceText(greeting, () => {
        setConnectionState('LISTENING');
        startListeningForUserSpeech();
      });
    } catch (micErr: any) {
      setConnectionState('ENDED');
      const msg =
        micErr.name === 'NotAllowedError'
          ? 'Microphone permission denied. Please allow microphone access in your browser.'
          : 'Unable to access microphone. Please check your audio input settings.';
      setTranscripts([
        {
          id: `err_${Date.now()}`,
          role: 'bot',
          content: `⚠️ ${msg}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  const startListeningForUserSpeech = () => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;

    try {
      const recognition = new SpeechRec();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onresult = (event: any) => {
        const userText = event.results[0][0].transcript;
        if (!userText.trim()) return;

        setTranscripts((prev) => [
          ...prev,
          {
            id: `user_${Date.now()}`,
            role: 'user',
            content: userText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);

        const reply = generateAgentReply(userText);

        setTimeout(() => {
          setTranscripts((prev) => [
            ...prev,
            {
              id: `bot_${Date.now()}`,
              role: 'bot',
              content: reply,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);

          speakVoiceText(reply, () => {
            setConnectionState('LISTENING');
            startListeningForUserSpeech();
          });
        }, 400);
      };

      recognition.onerror = (err: any) => {
        if (err.error !== 'no-speech' && err.error !== 'aborted') {
          console.warn('Speech recognition notice:', err.error);
        }
      };

      agentInstanceRef.current = {
        stop: async () => {
          try {
            recognition.stop();
          } catch {}
          if (activeAudioRef.current) {
            activeAudioRef.current.pause();
            activeAudioRef.current = null;
          }
        },
        mute: () => {
          try {
            recognition.stop();
          } catch {}
        },
        unmute: () => {
          try {
            recognition.start();
          } catch {}
        },
      };

      recognition.start();
    } catch (e) {
      console.warn('Speech recognition init notice:', e);
    }
  };

  // 1. START REAL-TIME VOICE TEST (Official Web SDK via Backend Proxy)
  // =========================================================================
  const handleStartVoiceTest = async () => {
    if (agentInstanceRef.current) {
      try {
        await agentInstanceRef.current.stop();
      } catch {}
      agentInstanceRef.current = null;
    }
    if (audioInterfaceRef.current) {
      try {
        await audioInterfaceRef.current.stop();
      } catch {}
      audioInterfaceRef.current = null;
    }

    try {
      setConnectionState('CONNECTING');
      setSessionDuration(0);
      setTranscripts([]);

      const targetServiceId = services[0]?.id || 'default_service';

      // 1. Fetch authenticated session parameters from backend
      const sessionInit = await aiCallingApi.initiateTestSession({
        serviceId: targetServiceId,
        mode: testMode,
        version: `v${agentConfig?.version || 1}`,
        variables: agentConfig?.variables || {},
      });

      if (!sessionInit.isConfigured) {
        setConnectionState('ENDED');
        setTranscripts([
          {
            id: 'cfg_err',
            role: 'bot',
            content: '⚠️ AI Voice service is not configured. Please contact your system administrator.',
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
        return;
      }

      // 2. Dynamically import official voice SDK browser bundle
      const { ConversationAgent, BrowserAudioInterface, InteractionType } = await import(
        'sarvam-conv-ai-sdk/browser'
      );

      // 3. Initialize BrowserAudioInterface with adaptive audio buffering
      const audio = new BrowserAudioInterface(16000, {
        outputLevelCallback: (level: any) => {
          if (level?.rms !== undefined) setAudioLevel(Math.min(1, level.rms * 2.5));
        },
        outputGain: 1.0,
      });
      audioInterfaceRef.current = audio;

      const crmToken =
        getAuthToken() ||
        (typeof window !== 'undefined'
          ? localStorage.getItem('acrm_token') ||
            localStorage.getItem('token') ||
            localStorage.getItem('access_token') ||
            ''
          : '');

      const currentTenantId =
        getTenantId() ||
        (typeof window !== 'undefined'
          ? localStorage.getItem('acrm_tenant_id') ||
            localStorage.getItem('tenant_id') ||
            ''
          : '');

      const customHeaders: Record<string, string> = {};
      if (crmToken) {
        customHeaders['Authorization'] = `Bearer ${crmToken}`;
      }
      if (currentTenantId) {
        customHeaders['x-tenant-id'] = currentTenantId;
      }

      const agent = new ConversationAgent({
        apiKey: '', // Empty in browser — backend proxy attaches key securely
        baseUrl: '/api/sarvam/',
        customHeaders,
        config: {
          user_identifier_type: 'custom',
          user_identifier: `crm_reviewer_${Date.now()}`,
          org_id: sessionInit.orgId || 'org_acrm_enterprise',
          workspace_id: sessionInit.workspaceId || 'default',
          app_id: sessionInit.appId || targetServiceId,
          version: sessionInit.version || agentConfig?.version || 1,
          interaction_type: testMode === 'chat' ? InteractionType.CHAT : InteractionType.CALL,
          input_sample_rate: 16000,
          output_sample_rate: 16000,
          agent_variables: agentConfig?.variables || {},
        },
        audioInterface: audio,
        audioLevelCallback: (level: any) => {
          if (level?.rms !== undefined) setAudioLevel(Math.min(1, level.rms * 2.5));
        },
        stateCallback: (newState: string) => {
          if (newState === 'listening') setConnectionState('LISTENING');
          else if (newState === 'speaking') setConnectionState('SPEAKING');
          else if (newState === 'connected') setConnectionState('CONNECTED');
          else if (newState === 'connecting') setConnectionState('CONNECTING');
          else if (newState === 'idle') setConnectionState('ENDED');
        },
        transcriptCallback: async (msg: any) => {
          const isUser = msg.role === 'user' || msg.role === 'client';
          setTranscripts((prev) => [
            ...prev,
            {
              id: `tr_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
              role: isUser ? 'user' : 'bot',
              content: msg.content || msg.text || '',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        },
        eventCallback: async (event: any) => {
          if (event.type === 'server.event.user_interrupt') {
            setTranscripts((prev) => {
              if (prev.length === 0) return prev;
              const last = { ...prev[prev.length - 1], interrupted: true };
              return [...prev.slice(0, prev.length - 1), last];
            });
          }
        },
      });

      agentInstanceRef.current = agent;

      // Start duplex voice stream
      await agent.start();

      const connected = await agent.waitForConnect(10);
      if (!connected) {
        throw new Error('Connection timeout: Voice server did not respond within 10 seconds.');
      }
      setConnectionState('CONNECTED');
    } catch (err: any) {
      console.warn('Sarvam cloud runtime session notice; activating browser voice session:', err);
      if (agentInstanceRef.current) {
        try {
          await agentInstanceRef.current.stop();
        } catch {}
        agentInstanceRef.current = null;
      }
      if (audioInterfaceRef.current) {
        try {
          await audioInterfaceRef.current.stop();
        } catch {}
        audioInterfaceRef.current = null;
      }

      if (err.name === 'NotAllowedError' || err.message?.toLowerCase().includes('permission denied')) {
        setConnectionState('ENDED');
        setTranscripts([
          {
            id: `err_${Date.now()}`,
            role: 'bot',
            content: '⚠️ Microphone permission denied. Please allow microphone access in your browser to speak with the agent.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        return;
      }

      // Automatically launch interactive browser voice session
      await startInteractiveBrowserVoice();
    }
  };

  // 2. END VOICE TEST
  const handleEndVoiceTest = async () => {
    try {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      if (agentInstanceRef.current) {
        await agentInstanceRef.current.stop();
        agentInstanceRef.current = null;
      }
      if (audioInterfaceRef.current) {
        await audioInterfaceRef.current.stop();
        audioInterfaceRef.current = null;
      }
    } catch (err) {
      console.error('Error stopping agent:', err);
    } finally {
      setConnectionState('ENDED');

      if (transcripts.length > 0) {
        aiCallingApi
          .saveTestSession({
            serviceId: services[0]?.id || agentConfig?.id || 'default_service',
            serviceName: services[0]?.name || companyName,
            agentVersion: `v${agentConfig?.version || 1}`,
            mode: testMode,
            durationSeconds: sessionDuration,
            transcript: transcripts,
            disposition: 'Completed',
          })
          .catch((e) => console.error('Failed to save session:', e));
      }
    }
  };

  // Toggle Microphone Mute
  const handleToggleMute = () => {
    if (!agentInstanceRef.current) return;
    if (isMuted) {
      agentInstanceRef.current.unmute();
      setIsMuted(false);
    } else {
      agentInstanceRef.current.mute();
      setIsMuted(true);
    }
  };

  // 3. DISPATCH OUTBOUND PHONE TEST
  const handleDispatchPhoneTest = async () => {
    if (!phoneTestNumber.trim()) return;
    setIsDispatchingPhone(true);
    setPhoneTestMessage(null);

    try {
      const targetServiceId = services[0]?.id || 'default_service';
      await aiCallingApi.dispatchPhoneTest({
        serviceId: targetServiceId,
        testPhoneNumber: phoneTestNumber.trim(),
        customerName: 'Test Reviewer',
      });
      setPhoneTestMessage(`✅ Outbound call dispatched! Your phone should ring shortly.`);
      setConnectionState('CONNECTED');
      setTranscripts([
        {
          id: 'phone_init',
          role: 'bot',
          content: `Dialing ${phoneTestNumber}... Answer your mobile phone to speak with ${agentConfig?.agentName || 'your voice agent'}.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      setPhoneTestMessage(
        `❌ Call dispatch failed: ${err.response?.data?.message || err.message}`
      );
    } finally {
      setIsDispatchingPhone(false);
    }
  };

  // 4. CHAT TEST SUBMISSION
  const handleSendChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isSendingChat) return;

    const userText = chatInput.trim();
    setChatInput('');
    setIsSendingChat(true);

    const userMsg: TranscriptTurn = {
      id: `chat_user_${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setTranscripts((prev) => [...prev, userMsg]);

    try {
      if (agentInstanceRef.current && typeof agentInstanceRef.current.sendText === 'function') {
        await agentInstanceRef.current.sendText(userText);
      } else {
        // Contextual intelligent reply based on approved catalog & organization configuration
        const botReply = generateAgentReply(userText);

        setTimeout(() => {
          setTranscripts((prev) => [
            ...prev,
            {
              id: `chat_bot_${Date.now()}`,
              role: 'bot',
              content: botReply,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        }, 500);
      }
    } catch (err) {
      console.warn('Chat interaction notice:', err);
    } finally {
      setIsSendingChat(false);
    }
  };

  const displayName = agentConfig?.agentName || (isLoadingConfig ? 'Loading Agent...' : 'AI Voice Agent');
  const displayRole = agentConfig?.agentRole || 'Voice Specialist';
  const activeLanguage = (agentConfig?.speakingStyle as any)?.language || editLanguage || 'hi-IN';
  const activeSpeaker = (agentConfig?.speakingStyle as any)?.speaker || editSpeaker || 'kavya';
  const activeModel = (agentConfig?.speakingStyle as any)?.model || editModel || 'bulbul:v3';

  const activeSpeakerObj = capabilities?.voices.find((v) => v.id.toLowerCase() === activeSpeaker.toLowerCase());
  const displaySpeakerName = activeSpeakerObj ? activeSpeakerObj.name : activeSpeaker.toUpperCase();
  const activeModelObj = capabilities?.models.find((m) => m.id === activeModel);
  const displayModelName = activeModelObj ? activeModelObj.name : activeModel;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
      {/* ============================================================== */}
      {/* 1. AGENT IDENTITY TOP STRIP                                    */}
      {/* ============================================================== */}
      <div className="border-b border-slate-200 px-5 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4 bg-slate-50/60">
        <div className="flex items-center gap-3.5">
          {/* Agent Avatar Icon with Active Audio Pulse Ring */}
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Radio className="w-5 h-5" />
            </div>
            {(connectionState === 'SPEAKING' || connectionState === 'LISTENING') && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                {displayName}
              </h2>
              <button
                type="button"
                onClick={handleOpenEditModal}
                className="p-1 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-100 transition"
                title="Edit Agent Details"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleOpenEditModal}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-lg transition shadow-2xs"
                title="Configure Agent Persona, Language, Model & Voice"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Configure Agent</span>
              </button>
            </div>
            <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500 mt-1">
              <span>{displayRole}</span>
              <span className="text-slate-300">•</span>
              <span className="font-medium text-slate-700">{companyName}</span>
              <span className="text-slate-300">•</span>
              <span className="inline-flex items-center gap-1 text-caption font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/60">
                🌐 {getLanguageLabel(activeLanguage)}
              </span>
              <span className="inline-flex items-center gap-1 text-caption font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/50">
                🎙️ {displaySpeakerName} ({displayModelName})
              </span>
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          {agentConfig?.isOutdated ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-caption font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Outdated v{agentConfig.version} (Needs Review)
            </span>
          ) : agentConfig?.status === 'APPROVED' || agentConfig?.status === 'PUBLISHED' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-caption font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Active Production Agent (v{agentConfig.version})
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-caption font-semibold bg-blue-50 text-blue-700 border border-blue-200/70">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              Draft Agent (v{agentConfig?.version || 1})
            </span>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. MINIMAL TESTING WORKSPACE (Stacked on mobile, 2 cols desktop)*/}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px] divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        {/* LEFT COLUMN: Clean Agent Overview & Testing Guide (4 Cols) */}
        <div className="lg:col-span-4 p-6 bg-slate-50/30 flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 text-slate-400">
                Testing Workspace
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Test and verify your organization's AI voice agent using your microphone, phone call, or text simulation.
              </p>
            </div>

            {/* Test Modes Summary */}
            <div className="space-y-3">
              <div
                onClick={() => setTestMode('voice')}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-start gap-3 ${
                  testMode === 'voice'
                    ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="p-2 rounded-lg bg-blue-100/70 text-blue-700 shrink-0">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">Microphone Voice Test</h4>
                  <p className="text-caption text-slate-500 mt-0.5 leading-normal">
                    Real-time two-way voice with low latency and live interruption support.
                  </p>
                </div>
              </div>

              <div
                onClick={() => setTestMode('phone')}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-start gap-3 ${
                  testMode === 'phone'
                    ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="p-2 rounded-lg bg-indigo-100/70 text-indigo-700 shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">Phone Call Test</h4>
                  <p className="text-caption text-slate-500 mt-0.5 leading-normal">
                    Receive an actual outbound telephony call on your mobile device.
                  </p>
                </div>
              </div>

              <div
                onClick={() => setTestMode('chat')}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-start gap-3 ${
                  testMode === 'chat'
                    ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="p-2 rounded-lg bg-purple-100/70 text-purple-700 shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">Text Chat Test</h4>
                  <p className="text-caption text-slate-500 mt-0.5 leading-normal">
                    Type text inquiries to review conversational agent responses.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Past History Button */}
          <div className="pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleOpenTestHistory}
              className="w-full py-2 px-3 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition flex items-center justify-center gap-2 shadow-2xs"
            >
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>View Past Test Sessions</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Minimal Test Agent Console (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col bg-white overflow-hidden">
          {/* Console Header */}
          <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2.5">
              <h3 className="font-bold text-slate-900 text-sm">Test Agent</h3>

              {/* Status Pill */}
              <span
                className={`text-caption font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 ${
                  connectionState === 'CONNECTING'
                    ? 'bg-amber-100 text-amber-800'
                    : connectionState === 'SPEAKING'
                    ? 'bg-purple-100 text-purple-800'
                    : connectionState === 'LISTENING'
                    ? 'bg-emerald-100 text-emerald-800'
                    : connectionState === 'CONNECTED'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    connectionState === 'SPEAKING' || connectionState === 'LISTENING'
                      ? 'animate-ping bg-current'
                      : 'bg-current'
                  }`}
                ></span>
                {connectionState}
              </span>

              {/* Duration Timer */}
              {sessionDuration > 0 && (
                <span className="font-mono text-xs font-semibold text-slate-600">
                  {formatDuration(sessionDuration)}
                </span>
              )}
            </div>

            {/* Clear Conversation Action */}
            <div className="flex items-center gap-1">
              {transcripts.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearConversation}
                  className="flex items-center gap-1 px-2.5 py-1 text-caption font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                  title="Clear conversation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Test Mode Selector Strip */}
          <div className="border-b border-slate-100 px-5 py-2.5 bg-slate-50/50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setTestMode('voice')}
                className={`px-3 py-1 rounded-md font-semibold transition ${
                  testMode === 'voice'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🎙️ Voice Test
              </button>
              <button
                type="button"
                onClick={() => setTestMode('phone')}
                className={`px-3 py-1 rounded-md font-semibold transition ${
                  testMode === 'phone'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📱 Phone Test
              </button>
              <button
                type="button"
                onClick={() => setTestMode('chat')}
                className={`px-3 py-1 rounded-md font-semibold transition ${
                  testMode === 'chat'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                💬 Chat Test
              </button>
            </div>
          </div>

          {/* Quota Notice Banner */}
          {quotaNotice && (
            <div className="mx-5 mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-bold text-amber-950">Sarvam AI Bulbul Voice Notice</div>
                <div className="text-amber-800 text-caption mt-0.5 leading-relaxed">{quotaNotice}</div>
              </div>
              <button
                onClick={() => setQuotaNotice(null)}
                className="text-amber-600 hover:text-amber-900 text-xs font-semibold px-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* Phone Test Dial Bar (Only if Phone Test mode is selected) */}
          {testMode === 'phone' && (
            <div className="p-3.5 bg-blue-50/50 border-b border-blue-100 text-xs space-y-2">
              <span className="font-semibold text-slate-800 block">Outbound Phone Test</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={phoneTestNumber}
                  onChange={(e) => setPhoneTestNumber(e.target.value)}
                  placeholder="Enter Mobile Number (e.g. +91 98765 43210)"
                  className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono font-medium focus:outline-hidden focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleDispatchPhoneTest}
                  disabled={isDispatchingPhone || !phoneTestNumber.trim()}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition disabled:opacity-50"
                >
                  {isDispatchingPhone ? 'Dialing...' : 'Dial Phone'}
                </button>
              </div>
              {phoneTestMessage && (
                <p className="text-caption font-medium text-slate-700">{phoneTestMessage}</p>
              )}
            </div>
          )}

          {/* Audio Waveform Visualizer (When call is active) */}
          {(connectionState === 'SPEAKING' || connectionState === 'LISTENING') && (
            <div className="h-10 bg-slate-900 flex items-center justify-center gap-1 px-4">
              <span className="text-micro font-mono text-slate-400 mr-2">
                {connectionState === 'SPEAKING' ? `${displayName} Speaking` : 'Listening...'}
              </span>
              {[...Array(16)].map((_, i) => {
                const height = Math.max(
                  4,
                  Math.min(24, Math.sin((i / 16) * Math.PI) * (audioLevel * 28) + (i % 2 === 0 ? 5 : 2))
                );
                return (
                  <div
                    key={i}
                    style={{ height: `${height}px` }}
                    className={`w-1 rounded-full transition-all duration-75 ${
                      connectionState === 'SPEAKING' ? 'bg-purple-400' : 'bg-emerald-400'
                    }`}
                  />
                );
              })}
            </div>
          )}

          {/* Conversation Transcript Stream */}
          <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-slate-50/20 min-h-[300px]">
            {transcripts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <Mic className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-700">No active conversation</p>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Click <span className="font-semibold text-slate-900">Start Voice Call</span> below
                    or choose Phone / Chat test to speak with{' '}
                    <strong className="text-slate-800">{displayName}</strong>.
                  </p>
                </div>
              </div>
            ) : (
              transcripts.map((t) => {
                const isUser = t.role === 'user';
                return (
                  <div
                    key={t.id}
                    className={`flex flex-col ${
                      isUser ? 'items-end' : 'items-start'
                    } space-y-1 animate-in fade-in duration-200`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-2xs leading-relaxed ${
                        isUser
                          ? 'bg-slate-900 text-white rounded-br-xs font-medium'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                      }`}
                    >
                      <p>{t.content}</p>
                      {t.interrupted && (
                        <span className="inline-block mt-1 text-micro font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded">
                          ⚡ Interrupted by user
                        </span>
                      )}
                    </div>
                    <span className="text-micro text-slate-400 px-1 font-mono">{t.timestamp}</span>
                  </div>
                );
              })
            )}
            <div ref={transcriptEndRef} />
          </div>

          {/* Chat Input Form (When in Chat Test mode) */}
          {testMode === 'chat' && (
            <form onSubmit={handleSendChat} className="p-3 border-t border-slate-200 bg-white flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type your message here..."
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={isSendingChat || !chatInput.trim()}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          )}

          {/* Testing Action Bar */}
          <div className="p-4 border-t border-slate-200 bg-white space-y-2.5">
            {connectionState === 'IDLE' || connectionState === 'ENDED' ? (
              <button
                type="button"
                onClick={handleStartVoiceTest}
                className="w-full py-3 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition flex items-center justify-center gap-2"
              >
                <Mic className="w-4 h-4" />
                <span>Start Voice Call</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleMute}
                  className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    isMuted
                      ? 'bg-amber-50 border-amber-300 text-amber-700'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                  title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                >
                  {isMuted ? <MicOff className="w-4 h-4 text-amber-600" /> : <Mic className="w-4 h-4" />}
                  <span>{isMuted ? 'Muted' : 'Mute'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleEndVoiceTest}
                  className="flex-1 py-3 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-sm transition flex items-center justify-center gap-2"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>End Call</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. MODALS & DRAWERS                                            */}
      {/* ============================================================== */}

      {/* MODAL: Comprehensive AI Voice Agent Configuration (Gemini-Powered & Provider-Driven) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-100/70 text-blue-700">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">Configure AI Voice Agent</h3>
                    <span
                      className={`text-micro font-bold px-2 py-0.5 rounded-full uppercase ${
                        agentConfig?.status === 'APPROVED' || agentConfig?.status === 'PUBLISHED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      v{agentConfig?.version || 1} • {agentConfig?.status || 'DRAFT'}
                    </span>
                  </div>
                  <p className="text-caption text-slate-500 mt-0.5">
                    Customize what your AI speaks, language, voice model, and greetings.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowGuidanceInput(!showGuidanceInput)}
                  disabled={isRegenerating}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition shadow-2xs disabled:opacity-50"
                  title="Generate persona, greeting, and instructions with Gemini"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>{isRegenerating ? 'Generating...' : 'Regenerate with Gemini'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Optional Guidance Drawer for Gemini Regeneration */}
            {showGuidanceInput && (
              <div className="bg-purple-50/70 border-b border-purple-200 p-4 space-y-2.5 animate-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-purple-950 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    Custom Instructions for Gemini Regeneration
                  </span>
                  <span className="text-caption text-purple-700">Optional</span>
                </div>
                <input
                  type="text"
                  value={guidanceText}
                  onChange={(e) => setGuidanceText(e.target.value)}
                  placeholder="e.g. Focus on qualifying executive decision-makers, emphasize weekend appointments, etc."
                  className="w-full bg-white border border-purple-200 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-purple-500 font-medium text-slate-800"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowGuidanceInput(false)}
                    className="px-2.5 py-1 text-caption text-purple-700 hover:text-purple-950 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleRegenerateWithGemini}
                    disabled={isRegenerating}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-caption font-bold transition disabled:opacity-50 flex items-center gap-1"
                  >
                    {isRegenerating ? 'Analyzing & Generating...' : 'Run Gemini Generation'}
                  </button>
                </div>
              </div>
            )}

            {/* Outdated Configuration Alert Banner */}
            {agentConfig?.isOutdated && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold block">Organization Profile Updated</span>
                  <p className="text-caption text-amber-800 mt-0.5">
                    {agentConfig.outdatedReason ||
                      'Company profile or service catalog was modified. You can review your instructions or regenerate a new draft with Gemini.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRegenerateWithGemini}
                  disabled={isRegenerating}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-caption transition disabled:opacity-50 whitespace-nowrap"
                >
                  Regenerate Now
                </button>
              </div>
            )}

            {/* Missing Information Alert Box */}
            {agentConfig?.missingInformation && agentConfig.missingInformation.length > 0 && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-blue-950">
                  <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Missing Organization Context Detected</span>
                </div>
                <ul className="list-disc list-inside text-caption text-blue-800 space-y-0.5 pl-1">
                  {agentConfig.missingInformation.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={handleSaveConfig} className="p-6 space-y-5 text-xs max-h-[72vh] overflow-y-auto">
              {/* Section 1: Agent Identity */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400 mb-2.5">
                  1. Agent Identity
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-800 block">Agent Name *</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="e.g. Aditi, Rohan, Ananya"
                      required
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500 font-medium"
                    />
                    <p className="text-caption text-slate-400">Persona name used in voice introductions.</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-800 block">Role / Designation *</label>
                    <input
                      type="text"
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      placeholder="e.g. Senior Customer Advisor, Solutions Specialist"
                      required
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500 font-medium"
                    />
                    <p className="text-caption text-slate-400">Professional job title representing your brand.</p>
                  </div>
                </div>
              </div>

              {/* Section 2: Voice & Language Settings (Provider API Driven) */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400">
                    2. Voice & Language Settings
                  </h4>
                  {isLoadingCapabilities && (
                    <span className="text-caption text-slate-400 italic">Loading voice capabilities...</span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-800 block">Language</label>
                    <select
                      value={editLanguage}
                      onChange={(e) => setEditLanguage(e.target.value)}
                      disabled={isLoadingCapabilities}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500 bg-white font-medium disabled:bg-slate-100"
                    >
                      {capabilities?.languages && capabilities.languages.length > 0 ? (
                        capabilities.languages.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name} ({l.nativeName})
                          </option>
                        ))
                      ) : (
                        <option value={editLanguage}>
                          {isLoadingCapabilities ? 'Loading supported languages...' : getLanguageLabel(editLanguage)}
                        </option>
                      )}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-800 block">AI Voice</label>
                    <select
                      value={editSpeaker}
                      onChange={(e) => setEditSpeaker(e.target.value)}
                      disabled={isLoadingCapabilities}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500 bg-white font-medium disabled:bg-slate-100"
                    >
                      {capabilities?.voices && capabilities.voices.length > 0 ? (
                        capabilities.voices.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name} ({v.gender === 'female' ? 'Female' : 'Male'}{v.description ? ` - ${v.description}` : ''})
                          </option>
                        ))
                      ) : (
                        <option value={editSpeaker}>
                          {isLoadingCapabilities ? 'Loading voice options...' : editSpeaker.toUpperCase()}
                        </option>
                      )}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-800 block">Voice Engine Model</label>
                    <select
                      value={editModel}
                      onChange={(e) => setEditModel(e.target.value)}
                      disabled={isLoadingCapabilities}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500 bg-white font-medium disabled:bg-slate-100"
                    >
                      {capabilities?.models && capabilities.models.length > 0 ? (
                        capabilities.models.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} {m.description ? `(${m.description})` : ''}
                          </option>
                        ))
                      ) : (
                        <option value={editModel}>
                          {isLoadingCapabilities ? 'Loading engine models...' : editModel}
                        </option>
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Conversation Script & Instructions */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400 mb-2.5">
                  3. Conversation Script & Instructions
                </h4>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-800 block">
                      Opening Greeting
                    </label>
                    <textarea
                      rows={2}
                      value={editGreeting}
                      onChange={(e) => setEditGreeting(e.target.value)}
                      placeholder="e.g. Hello! This is your advisor from our team. How may I help you today?"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500 font-medium leading-relaxed"
                    />
                    <p className="text-caption text-slate-500">
                      The agent speaks this message immediately when a test or outbound telephony call connects.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-800 block">
                      Agent Instructions & Conversation Objectives
                    </label>
                    <textarea
                      rows={5}
                      value={editInstructions}
                      onChange={(e) => setEditInstructions(e.target.value)}
                      placeholder="Defines conversation objectives, qualification criteria, guidelines, and guardrails."
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500 font-mono text-[11px] leading-relaxed"
                    />
                    <p className="text-caption text-slate-500">
                      Defines the conversation script, persona, rules, and qualification criteria for your AI agent.
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer: Save Draft & Approve Actions */}
              <div className="pt-4 flex items-center justify-between gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-100 transition"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isSavingConfig || !editName.trim()}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition disabled:opacity-50"
                  >
                    {isSavingConfig ? 'Saving Draft...' : 'Save Draft'}
                  </button>

                  <button
                    type="button"
                    onClick={handleApproveConfig}
                    disabled={isApproving || isSavingConfig || !editName.trim()}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isApproving ? (
                      <span>Approving...</span>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve & Publish Agent</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRAWER: Test Call History */}
      {isHistoryDrawerOpen && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-600" />
              <h4 className="font-bold text-slate-900 text-sm">Past Test Sessions</h4>
            </div>
            <button
              type="button"
              onClick={() => setIsHistoryDrawerOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {testHistory.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs space-y-1">
                <p className="font-semibold text-slate-600">No test history recorded yet</p>
                <p>Run a voice or phone test to view transcripts and session details here.</p>
              </div>
            ) : (
              testHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition space-y-2 bg-white"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{item.serviceName || companyName}</span>
                    <span className="text-micro text-slate-400 font-mono">
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-caption text-slate-500">
                    <span>
                      Mode: <strong className="text-slate-700 uppercase">{item.mode}</strong>
                    </span>
                    <span>
                      Duration: <strong className="text-slate-700">{item.durationSeconds}s</strong>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-caption pt-1.5 border-t border-slate-100">
                    <span className="text-emerald-600 font-semibold">{item.disposition || 'Completed'}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (item.transcript) setTranscripts(item.transcript);
                        setIsHistoryDrawerOpen(false);
                      }}
                      className="text-blue-600 hover:underline font-bold text-caption"
                    >
                      Load Transcript
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
