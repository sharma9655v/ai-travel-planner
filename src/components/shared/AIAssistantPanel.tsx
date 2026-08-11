'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  X,
  Send,
  RefreshCw,
  Wand2,
  Bookmark,
  Share2,
  Mic,
  MicOff,
} from 'lucide-react';
import type { TravelItinerary } from '@/types/itinerary';
import type { ApiError, RefineItineraryResponse } from '@/types/api';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
}

let nextMessageId = 0;

interface SpeechRecognitionResultLike {
  results: Array<Array<{ transcript: string }>>;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  onresult: ((event: SpeechRecognitionResultLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const editCommands = [
  'Replace Day 2',
  'Add a museum',
  'Remove hiking',
  'More nightlife',
  'Family friendly',
  'Reduce budget',
  'Luxury hotels',
  'Add local food',
  'Add hidden gems',
  'Optimize today\u2019s route',
];

const quickTags = ['#IndoorFun', '#BudgetFix', '#QuietOnly', '#Adventure', '#FoodieMode'];

const defaultMessages: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content:
      "Hi! I'm your AI Travel Assistant. Tell me what to change in your itinerary \u2014 e.g. 'Replace Day 2', 'Add a museum', or 'Reduce budget'.",
  },
];

export default function AIAssistantPanel({
  isOpen,
  onClose,
  itinerary,
  onApply,
}: {
  isOpen: boolean;
  onClose: () => void;
  itinerary?: TravelItinerary | null;
  onApply?: (updated: TravelItinerary) => void;
}) {
  const [messages, setMessages] = useState<Message[]>(defaultMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const pushAssistantMessage = (content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content,
      },
    ]);
  };

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isTyping) return;

    const userMsg: Message = {
      id: `msg-${++nextMessageId}`,
      role: 'user',
      content: query,
    };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    try {
      // Edit mode: the panel has the current itinerary, so commands are applied
      // as real, surgical edits via /api/refine.
      if (itinerary && onApply) {
        const response = await fetch('/api/refine', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itinerary, command: query }),
          signal: AbortSignal.timeout(45_000),
        });

        if (response.ok) {
          const data = (await response.json()) as RefineItineraryResponse;
          if (data.changed) {
            onApply(data.itinerary);
          }
          pushAssistantMessage(
            data.changed ? data.summary : 'Your itinerary is already up to date \u2014 nothing needed to change.'
          );
        } else {
          const errorData = (await response.json().catch(() => null)) as ApiError | null;
          pushAssistantMessage(errorData?.error || "I couldn't update the itinerary. Please try again.");
        }
        return;
      }

      // Chat mode: no itinerary available, respond conversationally.
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, history: messages }),
        signal: AbortSignal.timeout(45_000),
      });

      if (response.ok) {
        const data = await response.json();
        pushAssistantMessage(data.reply || "I've received your request.");
      } else {
        pushAssistantMessage("I couldn't reach the assistant right now. Please try again.");
      }
    } catch {
      pushAssistantMessage("I couldn't reach the assistant right now. Please try again.");
    } finally {
      setIsTyping(false);
    }
  };

  const toggleVoiceMode = () => {
    if (typeof window === 'undefined') return;
    const win = window as unknown as {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      pushAssistantMessage(
        "Voice input isn't supported in this browser — type your request instead."
      );
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = false;

      if (!isListening) {
        setIsListening(true);
        recognition.start();
        recognition.onresult = (event: SpeechRecognitionResultLike) => {
          const transcript = event.results[0][0].transcript;
          setIsListening(false);
          handleSend(transcript);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
      } else {
        setIsListening(false);
      }
    } catch {
      setIsListening(!isListening);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
              zIndex: 90,
            }}
          />

          {/* Panel Container */}
          <motion.div
            initial={{ opacity: 0, y: 80, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 80, scale: 0.96 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            style={{
              position: 'fixed',
              bottom: '5.5rem',
              left: '1rem',
              right: '1rem',
              maxWidth: '520px',
              height: '620px',
              maxHeight: '75vh',
              margin: '0 auto',
              zIndex: 95,
              background: 'rgba(15, 17, 24, 0.92)',
              backdropFilter: 'blur(30px)',
              border: '1px solid rgba(39, 242, 255, 0.2)',
              borderRadius: 'var(--radius-2xl)',
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.7), 0 0 35px rgba(39, 242, 255, 0.12)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.25rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, #27F2FF, #B16DFF)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 12px rgba(39, 242, 255, 0.3)',
                  }}
                >
                  <Bot size={18} color="#090B10" />
                </div>
                <div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#FFF' }}>
                    AI Travel Assistant
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-success)', boxShadow: '0 0 8px var(--color-success)' }} />
                    GLM-5.2 Active
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} />
              </motion.button>
            </div>

            {/* Prompt Suggestion Chips */}
            <div
              style={{
                padding: '0.75rem 1.25rem 0.25rem',
                display: 'flex',
                gap: '0.375rem',
                overflowX: 'auto',
                scrollbarWidth: 'none',
              }}
            >
              {editCommands.map((ex) => (
                <button
                  key={ex}
                  onClick={() => handleSend(ex)}
                  style={{
                    padding: '0.3rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(39, 242, 255, 0.08)',
                    border: '1px solid rgba(39, 242, 255, 0.2)',
                    color: 'var(--color-primary)',
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontFamily: 'inherit',
                  }}
                >
                  ⚡ {ex}
                </button>
              ))}
            </div>

            {/* Messages Area */}
            <div
              ref={scrollRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1rem 1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.875rem',
              }}
            >
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                  }}
                >
                  <div
                    style={{
                      padding: '0.875rem 1.125rem',
                      borderRadius:
                        msg.role === 'user'
                          ? 'var(--radius-xl) var(--radius-xl) var(--radius-sm) var(--radius-xl)'
                          : 'var(--radius-xl) var(--radius-xl) var(--radius-xl) var(--radius-sm)',
                      background:
                        msg.role === 'user'
                          ? 'linear-gradient(135deg, rgba(39, 242, 255, 0.2), rgba(0, 200, 214, 0.2))'
                          : 'rgba(255, 255, 255, 0.04)',
                      border: `1px solid ${
                        msg.role === 'user'
                          ? 'rgba(39, 242, 255, 0.4)'
                          : 'rgba(255, 255, 255, 0.08)'
                      }`,
                      fontSize: '0.875rem',
                      lineHeight: 1.6,
                      color: 'var(--color-text-primary)',
                      boxShadow: msg.role === 'user' ? '0 0 15px rgba(39, 242, 255, 0.15)' : 'none',
                    }}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    alignSelf: 'flex-start',
                    padding: '0.75rem 1.25rem',
                    borderRadius: 'var(--radius-xl)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    gap: '0.375rem',
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: 'var(--color-primary)',
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </div>

            {/* Voice Mode Indicator */}
            {isListening && (
              <div
                style={{
                  padding: '0.5rem 1.25rem',
                  background: 'rgba(255, 107, 107, 0.15)',
                  borderTop: '1px solid rgba(255, 107, 107, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  color: '#FF6B6B',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF6B6B', animation: 'pulse 1s infinite' }} />
                Voice Mode Listening... Speak your request
              </div>
            )}

            {/* Quick Hashtags */}
            <div
              style={{
                padding: '0 1.25rem 0.5rem',
                display: 'flex',
                gap: '0.375rem',
                flexWrap: 'wrap',
              }}
            >
              {quickTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setInput((prev) => prev + ' ' + tag)}
                  className="tag"
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.6875rem' }}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Global Actions Row */}
            <div
              style={{
                padding: '0 1.25rem 0.75rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '0.375rem',
              }}
            >
              <ActionButton icon={RefreshCw} label="Regenerate" onClick={() => handleSend('Regenerate entire plan')} />
              <ActionButton icon={Wand2} label="Optimize" onClick={() => handleSend('Optimize routes and timing')} />
              <ActionButton icon={Bookmark} label="Save" onClick={() => pushAssistantMessage('Plans are saved automatically on this device.')} />
              <ActionButton icon={Share2} label="Share" onClick={() => pushAssistantMessage('Create a shareable link from the itinerary page — use the Share button there.')} />
              <ActionButton icon={isListening ? MicOff : Mic} label="Voice" onClick={toggleVoiceMode} active={isListening} />
            </div>

            {/* Input Bar */}
            <div
              style={{
                padding: '0.75rem 1.25rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                disabled={isTyping}
                placeholder={
                  itinerary && onApply
                    ? "Edit your plan (e.g. 'Replace Day 2', 'Cheaper hotel')..."
                    : "Ask AI assistant..."
                }
                className="glass-input"
                style={{
                  flex: 1,
                  padding: '0.625rem 1rem',
                  fontSize: '0.8125rem',
                  borderRadius: 'var(--radius-xl)',
                  opacity: isTyping ? 0.6 : 1,
                }}
              />

              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => handleSend()}
                disabled={isTyping}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 'var(--radius-lg)',
                  background: isTyping ? 'rgba(255, 255, 255, 0.1)' : 'linear-gradient(135deg, #27F2FF, #00C8D6)',
                  border: 'none',
                  color: isTyping ? 'var(--color-text-secondary)' : '#090B10',
                  cursor: isTyping ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: isTyping ? 'none' : '0 0 15px rgba(39, 242, 255, 0.35)',
                }}
              >
                <Send size={16} />
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  active,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.25rem',
        padding: '0.4rem 0.2rem',
        background: active ? 'rgba(255, 107, 107, 0.2)' : 'rgba(255, 255, 255, 0.04)',
        border: `1px solid ${active ? 'rgba(255, 107, 107, 0.4)' : 'rgba(255, 255, 255, 0.06)'}`,
        borderRadius: 'var(--radius-md)',
        color: active ? '#FF6B6B' : 'var(--color-text-secondary)',
        cursor: 'pointer',
        fontSize: '0.625rem',
        fontWeight: 600,
        fontFamily: 'inherit',
      }}
    >
      <Icon size={13} />
      <span>{label}</span>
    </motion.button>
  );
}
