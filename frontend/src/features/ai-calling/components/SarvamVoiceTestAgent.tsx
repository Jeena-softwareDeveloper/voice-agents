'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Clock,
  Radio,
  CheckCircle2,
  AlertCircle,
  X,
  Edit2,
  Check,
  RotateCcw,
  Sparkles,
  Bot,
  User,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
  Play,
  Layers,
  History,
} from 'lucide-react';
import { aiCallingApi } from '../api/ai-calling.api';
import { Service, SarvamLanguage, SarvamVoice, AgentConfiguration, ProviderCapabilities } from '@/types';
import { DropdownSelect } from '@/components/common/dropdowns/DropdownSelect';

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
  // =========================================================================
  // 1. Agent Configuration State (Left Panel)
  // =========================================================================
  const [agentConfig, setAgentConfig] = useState<AgentConfiguration | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  // Dynamic Provider Capabilities (languages, voices, engine models)
  const [capabilities, setCapabilities] = useState<ProviderCapabilities | null>(null);
  const [isLoadingCapabilities, setIsLoadingCapabilities] = useState(true);

  // Inline Form State for Left Panel
  const [editName, setEditName] = useState('Simran');
  const [editRole, setEditRole] = useState('Luxury Apartments Specialist');
  const [editGreeting, setEditGreeting] = useState('');
  const [editInstructions, setEditInstructions] = useState('');
  const [editLanguage, setEditLanguage] = useState('hi-IN');
  const [editSpeaker, setEditSpeaker] = useState('kavya');
  const [editModel, setEditModel] = useState('bulbul:v3');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');

  const [isEditingName, setIsEditingName] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showGuidanceInput, setShowGuidanceInput] = useState(false);
  const [guidanceText, setGuidanceText] = useState('');
  const [isPreviewingVoice, setIsPreviewingVoice] = useState(false);

  // =========================================================================
  // 2. Call Testing Workspace State (Right Panel)
  // =========================================================================
  const [customerPhone, setCustomerPhone] = useState('');
  const [connectionState, setConnectionState] = useState<
    'IDLE' | 'CONNECTING' | 'RINGING' | 'CONNECTED' | 'FAILED' | 'ENDED'
  >('IDLE');
  const [isCalling, setIsCalling] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [phoneErrorMessage, setPhoneErrorMessage] = useState<string | null>(null);
  const [quotaNotice, setQuotaNotice] = useState<string | null>(null);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);

  // Live Transcripts
  const [transcripts, setTranscripts] = useState<TranscriptTurn[]>([]);

  // Previous Call History State
  const [testHistory, setTestHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  // Refs
  const audioInterfaceRef = useRef<any>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const levelIntervalRef = useRef<any>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);

  // =========================================================================
  // 3. Load Agent Configuration & Provider Capabilities on Mount
  // =========================================================================
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

          const style = (config.speakingStyle as any) || {};
          if (style.language) setEditLanguage(style.language);
          else if (caps?.defaultSettings?.languageId) setEditLanguage(caps.defaultSettings.languageId);

          if (style.speaker) setEditSpeaker(style.speaker);
          else if (caps?.defaultSettings?.voiceId) setEditSpeaker(caps.defaultSettings.voiceId);

          if (style.model) setEditModel(style.model);
          else if (caps?.defaultSettings?.modelId) setEditModel(caps.defaultSettings.modelId);
        } else {
          // Defaults if no config in DB yet
          setEditGreeting(
            `Hello! This is Simran, Luxury Apartments Specialist calling from ${companyName}. I am following up on your recent inquiry regarding our luxury properties. Do you have two minutes to speak?`,
          );
          setEditInstructions(
            `Identity: Professional AI Voice Specialist for ${companyName}.\nObjectives:\n1. Warmly greet customer and verify interest in luxury real estate.\n2. Collect preferred configuration (3 BHK / 4 BHK) and budget criteria.\n3. Offer Saturday or Sunday 11 AM private model villa site visit.\n4. Escalate to human manager immediately if requested.`,
          );
        }

        if (services.length > 0 && !selectedServiceId) {
          setSelectedServiceId(services[0].id);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingConfig(false);
          setIsLoadingCapabilities(false);
        }
      });

    loadTestHistory();

    return () => {
      isMounted = false;
    };
  }, [services.length]);

  // Load Previous Call History
  const loadTestHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const data = await aiCallingApi.getTestSessionHistory(selectedServiceId || undefined);
      setTestHistory(data || []);
    } catch (err) {
      console.warn('Could not load test session history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Scroll transcript box to bottom ONLY when new messages arrive (does not scroll page)
  useEffect(() => {
    if (transcripts.length > 0 && transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTo({
        top: transcriptContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [transcripts]);

  // Session duration timer while call is CONNECTED
  useEffect(() => {
    if (connectionState === 'CONNECTED') {
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

  // Audio level visualizer wave bars
  useEffect(() => {
    if (connectionState === 'CONNECTED' && !isMuted) {
      levelIntervalRef.current = setInterval(() => {
        setAudioLevel(0.3 + Math.random() * 0.6);
      }, 140);
    } else if (connectionState === 'RINGING' || connectionState === 'CONNECTING') {
      levelIntervalRef.current = setInterval(() => {
        setAudioLevel(0.15 + Math.random() * 0.25);
      }, 200);
    } else {
      setAudioLevel(0);
      if (levelIntervalRef.current) clearInterval(levelIntervalRef.current);
    }
    return () => {
      if (levelIntervalRef.current) clearInterval(levelIntervalRef.current);
    };
  }, [connectionState, isMuted]);

  // Cleanup all media streams on unmount
  useEffect(() => {
    return () => {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
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

  // Helper for language labels
  const getLanguageLabel = (code: string) => {
    const found = capabilities?.languages.find((l) => l.id === code || l.code === code);
    if (found) {
      return `${found.name} (${found.nativeName})`;
    }
    return code;
  };

  // =========================================================================
  // 4. Voice Synthesis Audio Helper (Sarvam AI Bulbul)
  // =========================================================================
  const speakVoiceText = async (text: string, onDone?: () => void) => {
    try {
      const res = await aiCallingApi.synthesizeSpeech({
        text,
        language: editLanguage,
        speaker: editSpeaker,
        model: editModel,
      });

      if (res?.audioBase64) {
        if (activeAudioRef.current) {
          activeAudioRef.current.pause();
          activeAudioRef.current = null;
        }
        const audio = new Audio(`data:audio/wav;base64,${res.audioBase64}`);
        activeAudioRef.current = audio;
        audio.onended = () => {
          activeAudioRef.current = null;
          if (onDone) onDone();
        };
        audio.onerror = () => {
          activeAudioRef.current = null;
          if (onDone) onDone();
        };
        await audio.play();
        return;
      }
    } catch (err: any) {
      console.warn('Voice playback note:', err?.message || err);
    }
    if (onDone) onDone();
  };

  // Action: Preview voice in selected language & speaker
  const handlePreviewVoice = async () => {
    if (isPreviewingVoice) return;
    setIsPreviewingVoice(true);
    const sample = editGreeting.trim()
      ? editGreeting.trim().substring(0, 120)
      : `Hello, this is ${editName || 'your voice assistant'} testing voice playback.`;
    await speakVoiceText(sample, () => {
      setIsPreviewingVoice(false);
    });
  };

  // =========================================================================
  // 5. Left Panel Actions (Save Draft, Approve & Publish, Gemini Regeneration)
  // =========================================================================
  const handleSaveDraft = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editName.trim()) return;

    setIsSavingConfig(true);
    try {
      if (agentConfig?.id) {
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
      }
      setIsEditingName(false);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error('Failed to save configuration draft:', err);
      alert('Failed to save configuration: ' + (err?.response?.data?.message || err.message));
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleApproveConfig = async () => {
    if (!editName.trim()) return;

    setIsApproving(true);
    try {
      if (agentConfig?.id) {
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
        const approved = await aiCallingApi.approveAgentConfiguration(saved.id);
        setAgentConfig(approved);
      }
      setIsEditingName(false);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error('Failed to approve configuration:', err);
      alert('Failed to approve configuration: ' + (err?.response?.data?.message || err.message));
    } finally {
      setIsApproving(false);
    }
  };

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

      const style = (regenerated.speakingStyle as any) || {};
      if (style.language) setEditLanguage(style.language);
      if (style.speaker) setEditSpeaker(style.speaker);
      if (style.model) setEditModel(style.model);

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

  // =========================================================================
  // 6. Right Panel Actions: Live Call Testing Flow
  // =========================================================================
  const handleStartCall = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const phoneToCall = customerPhone.trim();
    if (!phoneToCall) {
      setPhoneErrorMessage('Please enter a valid mobile number with country code (e.g. +91 98765 43210).');
      return;
    }

    setPhoneErrorMessage(null);
    setQuotaNotice(null);
    setIsCalling(true);
    setSessionDuration(0);
    setConnectionState('CONNECTING');

    // Initial connecting turn
    const initialTurn: TranscriptTurn = {
      id: `turn_conn_${Date.now()}`,
      role: 'bot',
      content: `Connecting to telephony carrier network for ${phoneToCall}...`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setTranscripts([initialTurn]);

    try {
      const targetServiceId = selectedServiceId || services[0]?.id || 'default_service';
      const res = await aiCallingApi.dispatchPhoneTest({
        serviceId: targetServiceId,
        testPhoneNumber: phoneToCall,
        customerName: 'Customer',
      });

      setActiveCallId(res.callId || res.externalCallId);
      setConnectionState('RINGING');

      const ringingTurn: TranscriptTurn = {
        id: `turn_ring_${Date.now()}`,
        role: 'bot',
        content: `Call dispatched to carrier network. Recipient mobile phone is ringing...`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setTranscripts((prev) => [...prev, ringingTurn]);

      // Telephony handshake transition to CONNECTED
      setTimeout(() => {
        setConnectionState('CONNECTED');
        const greetingText =
          editGreeting.trim() ||
          agentConfig?.openingGreeting ||
          `Hello! This is ${editName || 'your advisor'} calling from ${companyName}. How may I help you today?`;

        const connectedTurn: TranscriptTurn = {
          id: `turn_greet_${Date.now()}`,
          role: 'bot',
          content: greetingText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setTranscripts((prev) => [...prev, connectedTurn]);

        // Synthesize greeting speech via real voice provider
        speakVoiceText(greetingText);
      }, 2500);
    } catch (err: any) {
      const errorDetail = err?.response?.data?.message || err?.message || 'Call dispatch failed';
      setConnectionState('FAILED');
      setPhoneErrorMessage(errorDetail);
      setIsCalling(false);
      const failTurn: TranscriptTurn = {
        id: `turn_err_${Date.now()}`,
        role: 'bot',
        content: `❌ Call connection failed: ${errorDetail}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setTranscripts((prev) => [...prev, failTurn]);
    }
  };

  // Toggle Mute / Unmute
  const handleToggleMute = () => {
    setIsMuted((prev) => !prev);
    if (!isMuted && activeAudioRef.current) {
      activeAudioRef.current.pause();
    }
  };

  // End Call & Clean Up
  const handleEndCall = async () => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    if (audioInterfaceRef.current) {
      try {
        await audioInterfaceRef.current.stop();
      } catch {}
      audioInterfaceRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    if (levelIntervalRef.current) {
      clearInterval(levelIntervalRef.current);
    }
    setAudioLevel(0);
    setConnectionState('ENDED');
    setIsCalling(false);

    const endTurn: TranscriptTurn = {
      id: `turn_end_${Date.now()}`,
      role: 'bot',
      content: `Call ended. Total session duration: ${formatDuration(sessionDuration)}.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setTranscripts((prev) => [...prev, endTurn]);

    // Persist completed test call session
    try {
      const endTimestamp = Date.now();
      const targetSvc = services.find((s) => s.id === selectedServiceId);
      await aiCallingApi.saveTestSession({
        id: activeCallId || `test_sess_${endTimestamp}`,
        serviceId: selectedServiceId || services[0]?.id || 'default_service',
        serviceName: targetSvc?.name || 'Voice Service',
        agentVersion: `v${agentConfig?.version || 1}`,
        mode: 'phone',
        language: editLanguage,
        voice: editSpeaker,
        durationSeconds: sessionDuration,
        createdAt: new Date().toISOString(),
        scenario: `Outbound Phone Call to ${customerPhone}`,
        disposition: 'COMPLETED',
        transcript: transcripts.map((t) => ({
          role: t.role,
          content: t.content,
          timestamp: Date.now(),
        })),
        outputVariables: { customerPhone },
      });
      loadTestHistory();
    } catch (err) {
      console.warn('Could not save test session record:', err);
    }
  };

  // Clear live transcript
  const handleClearTranscript = () => {
    setTranscripts([]);
    setConnectionState('IDLE');
    setSessionDuration(0);
    setPhoneErrorMessage(null);
    setQuotaNotice(null);
  };

  return (
    <div className="w-full space-y-6">
      {/* ===================================================================== */}
      {/* TOP HEADER: Agent Identity & Action Strip                             */}
      {/* ===================================================================== */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                {editName || 'Voice Agent'}
              </h2>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                  agentConfig?.status === 'APPROVED' || agentConfig?.status === 'PUBLISHED'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                v{agentConfig?.version || 1} • {agentConfig?.status || 'DRAFT'}
              </span>
            </div>
            <p className="text-caption text-slate-500 mt-0.5">
              {editRole || 'Voice Specialist'} • {getLanguageLabel(editLanguage)} • Voice: {editSpeaker}
            </p>
          </div>
        </div>

        {/* Quick Top Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGuidanceInput(!showGuidanceInput)}
            disabled={isRegenerating || isCalling}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition shadow-2xs disabled:opacity-50"
            title="Generate persona, greeting, and instructions with Gemini"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>{isRegenerating ? 'Generating...' : 'Regenerate with Gemini'}</span>
          </button>

          <button
            type="button"
            onClick={handlePreviewVoice}
            disabled={isPreviewingVoice || isCalling}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition disabled:opacity-50"
            title="Listen to a voice preview sample"
          >
            <Volume2 className="w-3.5 h-3.5 text-slate-600" />
            <span>{isPreviewingVoice ? 'Speaking...' : 'Preview Voice'}</span>
          </button>
        </div>
      </div>

      {/* Optional Guidance Drawer for Gemini Regeneration */}
      {showGuidanceInput && (
        <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4 space-y-2.5 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-purple-950 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              Custom Instructions for Gemini Agent Regeneration
            </span>
            <span className="text-caption text-purple-700 font-semibold">Optional</span>
          </div>
          <input
            type="text"
            value={guidanceText}
            onChange={(e) => setGuidanceText(e.target.value)}
            placeholder="e.g. Focus on qualifying executive villa buyers, emphasize weekend site tours, etc."
            className="w-full bg-white border border-purple-200 rounded-lg px-3 py-2 text-xs outline-none focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-medium text-slate-800 transition-all"
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
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
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

      {/* ===================================================================== */}
      {/* MAIN TWO-COLUMN WORKSPACE: LEFT (38%) + RIGHT (62%)                   */}
      {/* ===================================================================== */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* =================================================================== */}
        {/* LEFT PANEL: Configure Agent (Permanent, approx 38% width)           */}
        {/* =================================================================== */}
        <div className="w-full lg:w-[38%] shrink-0 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
          {/* Panel Header */}
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Configure Agent
              </h3>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                agentConfig?.status === 'APPROVED' || agentConfig?.status === 'PUBLISHED'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {agentConfig?.status || 'DRAFT'}
            </span>
          </div>

          {/* Configuration Form Body */}
          <form onSubmit={handleSaveDraft} className="p-5 space-y-4 text-xs">
            {/* Agent Identity & Name */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-800 block">Agent Name *</label>
                <button
                  type="button"
                  onClick={() => setIsEditingName(!isEditingName)}
                  className="text-caption text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-0.5"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>{isEditingName ? 'Done' : 'Edit'}</span>
                </button>
              </div>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g. Simran, Kavya, Rohan"
                required
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold text-slate-800 transition-all bg-white"
              />
              <p className="text-caption text-slate-400">
                Persona name spoken in voice introductions.
              </p>
            </div>

            {/* Role / Designation */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-800 block">Role / Designation *</label>
              <input
                type="text"
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                placeholder="e.g. Luxury Apartments Specialist"
                required
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-800 transition-all bg-white"
              />
            </div>

            {/* Language & Voice Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <DropdownSelect
                label="Language"
                value={editLanguage}
                onChange={(val) => setEditLanguage(val)}
                disabled={isLoadingCapabilities}
                options={
                  capabilities?.languages && capabilities.languages.length > 0
                    ? capabilities.languages.map((l) => ({
                        value: l.id,
                        label: l.name,
                        sublabel: `(${l.nativeName})`,
                      }))
                    : [{ value: editLanguage, label: getLanguageLabel(editLanguage) }]
                }
              />

              <DropdownSelect
                label="AI Voice"
                value={editSpeaker}
                onChange={(val) => setEditSpeaker(val)}
                disabled={isLoadingCapabilities}
                options={
                  capabilities?.voices && capabilities.voices.length > 0
                    ? capabilities.voices.map((v) => ({
                        value: v.id,
                        label: v.name,
                        sublabel: `(${v.gender === 'female' ? 'Female' : 'Male'})`,
                      }))
                    : [{ value: editSpeaker, label: editSpeaker.toUpperCase() }]
                }
              />
            </div>

            {/* Engine Model & Target Service */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <DropdownSelect
                label="Voice Engine Model"
                value={editModel}
                onChange={(val) => setEditModel(val)}
                disabled={isLoadingCapabilities}
                options={
                  capabilities?.models && capabilities.models.length > 0
                    ? capabilities.models.map((m) => ({
                        value: m.id,
                        label: m.name,
                      }))
                    : [{ value: editModel, label: editModel }]
                }
              />

              {services.length > 0 && (
                <DropdownSelect
                  label="Target Service"
                  value={selectedServiceId}
                  onChange={(val) => {
                    setSelectedServiceId(val);
                    loadTestHistory();
                  }}
                  options={services.map((s) => ({
                    value: s.id,
                    label: s.name,
                    sublabel: s.category ? `(${s.category})` : undefined,
                  }))}
                />
              )}
            </div>

            {/* Opening Greeting */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-800 block">Opening Greeting</label>
                <span className="text-caption text-slate-400">Immediate</span>
              </div>
              <textarea
                rows={3}
                value={editGreeting}
                onChange={(e) => setEditGreeting(e.target.value)}
                placeholder="Hello! This is Simran calling from..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium leading-relaxed text-slate-800 transition-all bg-white"
              />
              <p className="text-caption text-slate-400">
                Spoken immediately when a test or outbound telephony call connects.
              </p>
            </div>

            {/* Agent Instructions & Objectives */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-800 block">
                  Agent Instructions & Objectives
                </label>
                <span className="text-caption text-slate-400">Guardrails</span>
              </div>
              <textarea
                rows={5}
                value={editInstructions}
                onChange={(e) => setEditInstructions(e.target.value)}
                placeholder="Defines conversation objectives, qualification criteria, guidelines, and guardrails."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono text-[11px] leading-relaxed text-slate-800 transition-all bg-white"
              />
              <p className="text-caption text-slate-400">
                Persona guidelines, qualification criteria, and brand guardrails.
              </p>
            </div>

            {/* Save Draft & Approve & Publish Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="submit"
                disabled={isSavingConfig || !editName.trim()}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition disabled:opacity-50"
              >
                {isSavingConfig ? 'Saving...' : 'Save Draft'}
              </button>

              <button
                type="button"
                onClick={handleApproveConfig}
                disabled={isApproving || isSavingConfig || !editName.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                {isApproving ? (
                  <span>Publishing...</span>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve & Publish</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* =================================================================== */}
        {/* RIGHT PANEL: Call Testing Workspace (approx 62% width)              */}
        {/* =================================================================== */}
        <div className="w-full lg:w-[62%] flex-1 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col space-y-6 p-5 sm:p-6">
          {/* Header & Connection Status Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Call Testing Workspace
                </h3>
              </div>
              <p className="text-caption text-slate-500 mt-0.5">
                Test outbound calls to an actual mobile phone number using your configured voice agent.
              </p>
            </div>

            {/* Real-Time Connection State Badge */}
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                  connectionState === 'CONNECTED'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs'
                    : connectionState === 'RINGING'
                    ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse'
                    : connectionState === 'CONNECTING'
                    ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                    : connectionState === 'FAILED'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : connectionState === 'ENDED'
                    ? 'bg-slate-100 text-slate-700 border-slate-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    connectionState === 'CONNECTED'
                      ? 'bg-emerald-500 animate-ping'
                      : connectionState === 'RINGING' || connectionState === 'CONNECTING'
                      ? 'bg-amber-500'
                      : connectionState === 'FAILED'
                      ? 'bg-rose-500'
                      : 'bg-slate-400'
                  }`}
                />
                <span>
                  {connectionState === 'IDLE' && 'Ready to Call'}
                  {connectionState === 'CONNECTING' && 'Connecting...'}
                  {connectionState === 'RINGING' && 'Phone Ringing...'}
                  {connectionState === 'CONNECTED' && 'Call Active'}
                  {connectionState === 'FAILED' && 'Call Failed'}
                  {connectionState === 'ENDED' && 'Call Ended'}
                </span>
              </span>

              {/* In-Call Duration Timer */}
              {connectionState === 'CONNECTED' && (
                <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 text-white rounded-lg text-xs font-mono font-bold shadow-2xs">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>{formatDuration(sessionDuration)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Outbound Phone Calling Dial Bar */}
          <form
            onSubmit={handleStartCall}
            className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3"
          >
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                  <span>Customer Mobile Number *</span>
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. +91 98220 11223"
                  disabled={isCalling}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-800 outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-60"
                />
              </div>

              {/* Action Buttons: Start Call / In-Call Controls */}
              {!isCalling ? (
                <button
                  type="submit"
                  disabled={!customerPhone.trim()}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs sm:text-sm transition shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Start Call</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 shrink-0">
                  {/* Mute Button */}
                  <button
                    type="button"
                    onClick={handleToggleMute}
                    className={`p-2.5 rounded-lg border text-xs font-semibold transition flex items-center gap-1.5 ${
                      isMuted
                        ? 'bg-amber-50 border-amber-300 text-amber-800'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                    title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                  >
                    {isMuted ? <MicOff className="w-4 h-4 text-amber-600" /> : <Mic className="w-4 h-4" />}
                    <span>{isMuted ? 'Muted' : 'Mute'}</span>
                  </button>

                  {/* End Call Button */}
                  <button
                    type="button"
                    onClick={handleEndCall}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs sm:text-sm transition shadow-xs flex items-center gap-1.5"
                  >
                    <PhoneOff className="w-4 h-4" />
                    <span>End Call</span>
                  </button>
                </div>
              )}
            </div>

            {/* Error or Quota Warnings */}
            {phoneErrorMessage && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{phoneErrorMessage}</span>
              </div>
            )}
            {quotaNotice && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{quotaNotice}</span>
              </div>
            )}
          </form>

          {/* Active Call Audio Waveform (Visible during active call) */}
          {connectionState === 'CONNECTED' && (
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 flex items-center justify-between animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-900">
                <Radio className="w-4 h-4 text-blue-600 animate-pulse" />
                <span>Live Audio Connection Active</span>
              </div>
              <div className="flex items-center gap-1">
                {[40, 70, 100, 60, 85, 45, 90].map((h, i) => (
                  <div
                    key={i}
                    className="w-1 bg-blue-600 rounded-full transition-all duration-150"
                    style={{
                      height: `${Math.max(6, Math.min(24, h * (audioLevel || 0.4)))}px`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Live Transcript Container */}
          <div className="flex-1 flex flex-col min-h-[280px] bg-slate-50/40 border border-slate-200 rounded-xl overflow-hidden">
            {/* Transcript Toolbar */}
            <div className="px-4 py-2.5 border-b border-slate-200 bg-white flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <span>Live Transcript</span>
                {transcripts.length > 0 && (
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded-full">
                    {transcripts.length}
                  </span>
                )}
              </span>
              {transcripts.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearTranscript}
                  disabled={isCalling}
                  className="text-caption text-slate-400 hover:text-slate-700 font-semibold transition disabled:opacity-40"
                >
                  Clear Transcript
                </button>
              )}
            </div>

            {/* Transcript Message Stream */}
            <div
              ref={transcriptContainerRef}
              className="flex-1 p-4 overflow-y-auto space-y-3.5 max-h-[360px]"
            >
              {transcripts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-12 text-center text-slate-400 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-600 text-xs">No active call</p>
                    <p className="text-caption text-slate-400 max-w-xs mt-0.5">
                      Enter a customer mobile number above and click Start Call to test real-time speech and review live transcripts.
                    </p>
                  </div>
                </div>
              ) : (
                transcripts.map((turn) => (
                  <div
                    key={turn.id}
                    className={`flex gap-2.5 text-xs ${
                      turn.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {turn.role === 'bot' && (
                      <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                        AI
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs shadow-2xs leading-relaxed ${
                        turn.role === 'user'
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 text-[10px] mb-1 opacity-70">
                        <span className="font-bold">
                          {turn.role === 'user' ? 'Customer' : editName || 'Agent'}
                        </span>
                        <span>{turn.timestamp}</span>
                      </div>
                      <p>{turn.content}</p>
                    </div>
                    {turn.role === 'user' && (
                      <div className="w-6 h-6 rounded-md bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={transcriptEndRef} />
            </div>
          </div>

          {/* =================================================================== */}
          {/* PREVIOUS CALL HISTORY SECTION                                      */}
          {/* =================================================================== */}
          <div className="border-t border-slate-100 pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-600" />
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Previous Call History
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {testHistory.length}
                </span>
              </div>
              <button
                type="button"
                onClick={loadTestHistory}
                disabled={isLoadingHistory}
                className="text-caption text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 transition"
              >
                <RotateCcw className={`w-3 h-3 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {testHistory.length === 0 ? (
              <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl text-center text-xs text-slate-400">
                No past test calls recorded yet. Dispatched calls will appear here.
              </div>
            ) : (
              <div className="space-y-2 max-h-[240px] overflow-y-auto">
                {testHistory.slice(0, 10).map((item) => {
                  const isExpanded = expandedHistoryId === item.id;
                  const itemPhone =
                    item.recipientNumber ||
                    item.customerNumber ||
                    item.outputVariables?.customerPhone ||
                    item.scenario?.replace('Outbound Phone Call to ', '') ||
                    'Customer Phone';

                  return (
                    <div
                      key={item.id}
                      className="border border-slate-200 rounded-lg p-3 bg-white hover:border-slate-300 transition text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-bold text-slate-900">{itemPhone}</span>
                          <span
                            className={`text-micro font-bold px-2 py-0.5 rounded uppercase ${
                              item.disposition === 'COMPLETED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : item.disposition === 'FAILED'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {item.disposition || 'Initiated'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-caption text-slate-500">
                          {item.durationSeconds > 0 && (
                            <span className="font-mono font-medium">
                              {formatDuration(item.durationSeconds)}
                            </span>
                          )}
                          <span>
                            {new Date(item.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <button
                            type="button"
                            onClick={() => setExpandedHistoryId(isExpanded ? null : item.id)}
                            className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-0.5 ml-1"
                          >
                            <span>{isExpanded ? 'Hide' : 'Transcript'}</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Transcript Turns */}
                      {isExpanded && (
                        <div className="pt-2 border-t border-slate-100 space-y-1.5 bg-slate-50/50 p-2.5 rounded-md animate-in fade-in duration-150">
                          {item.transcript && item.transcript.length > 0 ? (
                            item.transcript.map((t: any, idx: number) => (
                              <div key={idx} className="text-caption leading-relaxed flex items-start gap-1.5">
                                <span className="font-bold text-slate-700 uppercase shrink-0">
                                  {t.role === 'bot' ? 'Agent:' : 'Customer:'}
                                </span>
                                <span className="text-slate-600">{t.content}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-caption text-slate-400 italic">
                              No transcript recorded for this session.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
