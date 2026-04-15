"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

/* ───────────────────── Types ───────────────────── */

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface CriterionScore {
  criterion_id: string;
  criterion_name: string;
  score: number;
  feedback: string;
}

interface CompanyResearch {
  company_name: string;
  revenue: string;
  industry: string;
  business_model: string;
  key_contacts: string;
  pain_points: string;
  recent_news: string;
}

interface SessionData {
  session_id: string;
  system_prompt: string;
  opening_message: string;
  company_name: string;
  meeting_type: string;
  disc_profile: string;
  framework_ids: string[];
  voice_enabled: boolean;
  mic_enabled: boolean;
  // Briefing context (optional — present for sessions launched from setup)
  company_research?: CompanyResearch | null;
  partner_name?: string;
  partner_role?: string;
  partner_solution?: string;
  relationship_stage?: string;
  proposal?: string;
  objective?: string;
  expected_objection?: string;
  disc_blend?: string;
}

/* ───────────────────── Speech Recognition Hook ───────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionAny = any;

function useSpeechRecognition(onResult: (text: string) => void) {
  const recognitionRef = useRef<SpeechRecognitionAny>(null);
  const [isListening, setIsListening] = useState(false);

  const startListening = useCallback(() => {
    const win = window as SpeechRecognitionAny;
    const SpeechRecognitionCtor = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionAny) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) onResult(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [onResult]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return { isListening, startListening, stopListening };
}

/* ───────────────────── Main Component ───────────────────── */

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  // Session config (loaded from sessionStorage, set by roleplay page)
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userMsg, setUserMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [timer, setTimer] = useState(0);
  const [overallScore, setOverallScore] = useState(0);
  const [turns, setTurns] = useState(0);
  const [criteriaScores, setCriteriaScores] = useState<CriterionScore[]>([]);
  const [nudges, setNudges] = useState<string[]>([]);
  const [ending, setEnding] = useState(false);
  const [sessionSummary, setSessionSummary] = useState("");
  const [sessionEnded, setSessionEnded] = useState(false);

  const chatRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Briefing panel expand/collapse
  const [briefingOpen, setBriefingOpen] = useState(true);

  // Speech recognition
  const handleSpeechResult = useCallback((text: string) => {
    setUserMsg((prev) => (prev ? prev + " " + text : text));
  }, []);
  const { isListening, startListening, stopListening } = useSpeechRecognition(handleSpeechResult);

  // Load session data from sessionStorage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(`session_${sessionId}`);
      if (stored) {
        const data = JSON.parse(stored) as SessionData;
        setSessionData(data);
        setMessages([{ role: "assistant", content: data.opening_message }]);

        // Voice will play when user clicks "Begin Session" button
        // (Chrome requires a user gesture before playing audio)
      } else {
        // No session data found — redirect back
        router.push("/dashboard/roleplay");
      }
    } catch {
      router.push("/dashboard/roleplay");
    }
    setLoading(false);
  }, [sessionId, router]);

  // Timer
  useEffect(() => {
    if (sessionData && !sessionEnded) {
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionData, sessionEnded]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  // Voice status & selected voice
  const [voiceStatus, setVoiceStatus] = useState<"idle" | "loading" | "playing" | "error">("idle");
  const [sessionStarted, setSessionStarted] = useState(false);
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  // Load voices — prefer Samantha/Victoria/Karen for a natural female CFO voice
  useEffect(() => {
    function loadVoices() {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return;

      // Preferred voices in order of priority
      const preferred = ["Samantha", "Victoria", "Karen", "Zira", "Google US English"];
      for (const name of preferred) {
        const match = voices.find((v) => v.name.includes(name) && v.lang.startsWith("en"));
        if (match) {
          selectedVoiceRef.current = match;
          return;
        }
      }

      // Fallback: any English voice
      const englishVoice = voices.find((v) => v.lang.startsWith("en"));
      if (englishVoice) {
        selectedVoiceRef.current = englishVoice;
      }
    }

    loadVoices();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Speak text using browser speech synthesis (direct, no ElevenLabs)
  function speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setVoiceStatus("error");
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    if (selectedVoiceRef.current) {
      utterance.voice = selectedVoiceRef.current;
    }
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onstart = () => setVoiceStatus("playing");
    utterance.onend = () => setVoiceStatus("idle");
    utterance.onerror = () => setVoiceStatus("error");

    setVoiceStatus("loading");
    window.speechSynthesis.speak(utterance);
  }

  // Begin session — triggered by user click (needed for Chrome audio policy)
  function handleBeginSession() {
    setSessionStarted(true);
    if (sessionData?.voice_enabled && messages.length > 0) {
      // Small delay then speak the opening message
      setTimeout(() => {
        speak(messages[0].content);
      }, 300);
    }
  }

  // Send message
  async function sendMessage() {
    if (!userMsg.trim() || sending || !sessionData) return;
    const msg = userMsg;
    setUserMsg("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setSending(true);

    try {
      const res = await fetch("/api/session/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          message: msg,
          system_prompt: sessionData.system_prompt,
          framework_ids: sessionData.framework_ids,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, { role: "assistant", content: data.ai_response }]);
        setTurns((t) => t + 1);
        if (data.overall_score) setOverallScore(data.overall_score);
        if (data.scores) setCriteriaScores(data.scores);
        if (data.nudge) setNudges((prev) => [data.nudge, ...prev].slice(0, 5));

        // Speak AI response using browser speech synthesis
        if (sessionData.voice_enabled) {
          speak(data.ai_response);
        }
      }
    } catch {
      /* ignore */
    } finally {
      setSending(false);
    }
  }

  // End session
  async function endSession() {
    if (!sessionData) return;
    setEnding(true);
    // Stop any playing audio and cancel speech synthesis
    if (audioRef.current) audioRef.current.pause();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setVoiceStatus("idle");

    try {
      const res = await fetch("/api/session/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          duration_seconds: timer,
          final_scores: criteriaScores.map((cs) => ({
            criterion_id: cs.criterion_id,
            score: cs.score,
            feedback: cs.feedback,
          })),
          framework_ids: sessionData.framework_ids,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setOverallScore(data.overall_score);
        setSessionSummary(data.summary);
        setSessionEnded(true);
      }
    } catch {
      /* ignore */
    } finally {
      setEnding(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-ink-3 text-sm">Loading session...</div>
      </div>
    );
  }

  if (!sessionData) return null;

  /* ═══════════════════════════════════════════════════════
     RENDER: "Begin Session" gate (user gesture needed for audio)
     ═══════════════════════════════════════════════════════ */
  if (!sessionStarted) {
    return (
      <div className="p-8 flex flex-col items-center min-h-[500px] max-w-[640px] mx-auto text-center">
        <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-6">
          <span className="text-3xl">🎙</span>
        </div>
        <h1 className="font-serif text-[24px] text-ink mb-2">Ready to begin</h1>
        <p className="text-sm text-ink-3 mb-2">
          {sessionData.company_name} · {sessionData.meeting_type}
        </p>
        <p className="text-xs text-ink-3 mb-6">
          {sessionData.voice_enabled
            ? "The AI client will speak out loud. Make sure your volume is on."
            : "Text-only mode — the AI client will respond in chat."}
        </p>

        {/* Pre-session briefing summary */}
        {(sessionData.company_research || sessionData.proposal || sessionData.objective) && (
          <div className="w-full bg-card border border-border rounded-[12px] shadow-card p-5 mb-6 text-left">
            <div className="font-semibold text-xs text-ink-3 uppercase tracking-wide mb-3">
              Your briefing
            </div>
            <div className="space-y-2 text-xs text-ink-2 leading-relaxed">
              {sessionData.company_research?.pain_points && (
                <div>
                  <span className="font-semibold text-ink-3">Customer pain points: </span>
                  {sessionData.company_research.pain_points}
                </div>
              )}
              {sessionData.partner_name && (
                <div>
                  <span className="font-semibold text-ink-3">Partner: </span>
                  {sessionData.partner_name}
                  {sessionData.partner_role ? ` (${sessionData.partner_role})` : ""}
                  {sessionData.partner_solution ? ` — ${sessionData.partner_solution}` : ""}
                </div>
              )}
              {sessionData.proposal && (
                <div>
                  <span className="font-semibold text-ink-3">Proposing: </span>
                  {sessionData.proposal}
                </div>
              )}
              {sessionData.objective && (
                <div>
                  <span className="font-semibold text-ink-3">Your goal: </span>
                  {sessionData.objective}
                </div>
              )}
            </div>
          </div>
        )}

        <button
          onClick={handleBeginSession}
          className="px-8 py-3 bg-accent text-white rounded-sm text-sm font-medium hover:bg-[#4a3ce0] transition-colors shadow-card"
        >
          ▶ Begin Session
        </button>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════
     RENDER: Live session
     ═══════════════════════════════════════════════════════ */
  const hasBriefing =
    !!sessionData.company_research ||
    !!sessionData.partner_name ||
    !!sessionData.partner_solution ||
    !!sessionData.proposal ||
    !!sessionData.objective ||
    !!sessionData.expected_objection;

  return (
    <div className="p-8 max-w-[1100px]">
      {/* ── Briefing panel (context: customer research, partner, scenario) ── */}
      {hasBriefing && (
        <div className="mb-4 bg-card border border-border rounded-[12px] shadow-card">
          <button
            onClick={() => setBriefingOpen((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-surface/50 transition-colors rounded-t-[12px]"
          >
            <div className="flex items-center gap-3">
              <span className="font-semibold text-sm text-ink">Session Briefing</span>
              <span className="text-[11px] text-ink-3">
                Customer research, partner, and scenario context
              </span>
            </div>
            <span className="text-ink-3 text-xs">{briefingOpen ? "▾ Hide" : "▸ Show"}</span>
          </button>

          {briefingOpen && (
            <div className="px-5 pb-5 pt-1 grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-border">
              {/* Customer Research */}
              {sessionData.company_research && (
                <div className="bg-surface/60 rounded-sm p-4 border border-border">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-accent to-[#7b6dfa] rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0">
                      {sessionData.company_research.company_name?.substring(0, 2).toUpperCase() || "CO"}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-ink">
                        {sessionData.company_research.company_name}
                      </div>
                      <div className="text-[11px] text-ink-3">Customer research</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {sessionData.company_research.revenue && (
                      <span className="inline-flex px-2 py-0.5 bg-white text-ink-3 text-[10px] font-semibold rounded-full border border-border">
                        {sessionData.company_research.revenue}
                      </span>
                    )}
                    {sessionData.company_research.industry && (
                      <span className="inline-flex px-2 py-0.5 bg-white text-ink-3 text-[10px] font-semibold rounded-full border border-border">
                        {sessionData.company_research.industry}
                      </span>
                    )}
                    {sessionData.company_research.business_model && (
                      <span className="inline-flex px-2 py-0.5 bg-white text-ink-3 text-[10px] font-semibold rounded-full border border-border">
                        {sessionData.company_research.business_model}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 text-xs text-ink-2 leading-relaxed">
                    {sessionData.company_research.key_contacts && (
                      <div>
                        <span className="font-semibold text-ink-3">Key contacts: </span>
                        {sessionData.company_research.key_contacts}
                      </div>
                    )}
                    {sessionData.company_research.pain_points && (
                      <div>
                        <span className="font-semibold text-ink-3">Pain points: </span>
                        {sessionData.company_research.pain_points}
                      </div>
                    )}
                    {sessionData.company_research.recent_news && (
                      <div>
                        <span className="font-semibold text-ink-3">Recent news: </span>
                        {sessionData.company_research.recent_news}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Partner + Scenario */}
              <div className="flex flex-col gap-3">
                {(sessionData.partner_name || sessionData.partner_role || sessionData.partner_solution) && (
                  <div className="bg-surface/60 rounded-sm p-4 border border-border">
                    <div className="font-semibold text-xs text-ink-3 mb-2 uppercase tracking-wide">
                      Partner
                    </div>
                    <div className="space-y-1 text-xs text-ink-2">
                      {sessionData.partner_name && (
                        <div>
                          <span className="font-semibold text-ink">{sessionData.partner_name}</span>
                          {sessionData.partner_role && (
                            <span className="text-ink-3"> · {sessionData.partner_role}</span>
                          )}
                        </div>
                      )}
                      {sessionData.partner_solution && (
                        <div className="text-ink-3 leading-relaxed">
                          {sessionData.partner_solution}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(sessionData.proposal || sessionData.objective || sessionData.expected_objection ||
                  sessionData.relationship_stage) && (
                  <div className="bg-surface/60 rounded-sm p-4 border border-border">
                    <div className="font-semibold text-xs text-ink-3 mb-2 uppercase tracking-wide">
                      Scenario
                    </div>
                    <div className="space-y-2 text-xs text-ink-2 leading-relaxed">
                      {sessionData.relationship_stage && (
                        <div>
                          <span className="font-semibold text-ink-3">Stage: </span>
                          {sessionData.relationship_stage}
                        </div>
                      )}
                      {sessionData.proposal && (
                        <div>
                          <span className="font-semibold text-ink-3">Proposing: </span>
                          {sessionData.proposal}
                        </div>
                      )}
                      {sessionData.objective && (
                        <div>
                          <span className="font-semibold text-ink-3">Your goal: </span>
                          {sessionData.objective}
                        </div>
                      )}
                      {sessionData.expected_objection && (
                        <div>
                          <span className="font-semibold text-ink-3">Expected objection: </span>
                          {sessionData.expected_objection}
                        </div>
                      )}
                      <div className="pt-1 flex flex-wrap gap-1.5">
                        <span className="inline-flex px-2 py-0.5 bg-accent/10 text-accent text-[10px] font-semibold rounded-full">
                          DISC: {sessionData.disc_profile}
                          {sessionData.disc_blend && sessionData.disc_blend !== "single"
                            ? ` (${sessionData.disc_blend})`
                            : ""}
                        </span>
                        {sessionData.meeting_type && (
                          <span className="inline-flex px-2 py-0.5 bg-surface text-ink-3 text-[10px] font-semibold rounded-full border border-border">
                            {sessionData.meeting_type}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-[1fr_340px] gap-5">
        {/* ── Chat area ── */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              {!sessionEnded ? (
                <span className="inline-flex px-2.5 py-0.5 bg-green/10 text-green text-[11px] font-semibold rounded-full">
                  ● LIVE
                </span>
              ) : (
                <span className="inline-flex px-2.5 py-0.5 bg-surface text-ink-3 text-[11px] font-semibold rounded-full">
                  ENDED
                </span>
              )}
              <span className="text-xs text-ink-3">{formatTime(timer)}</span>
              <span className="text-xs text-ink-3">
                {sessionData.company_name} · {sessionData.meeting_type || "Session"}
              </span>
              {sessionData.voice_enabled && (
                <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                  voiceStatus === "playing" ? "bg-green/10 text-green animate-pulse" :
                  voiceStatus === "loading" ? "bg-gold/10 text-[#92400e]" :
                  voiceStatus === "error" ? "bg-red/10 text-red" :
                  "bg-accent/[0.08] text-accent"
                }`}>
                  {voiceStatus === "playing" ? "🔊 Speaking..." :
                   voiceStatus === "loading" ? "🔊 Loading..." :
                   voiceStatus === "error" ? "🔇 Voice error" :
                   "🔊 Voice on"}
                </span>
              )}
            </div>
            {!sessionEnded && (
              <button
                onClick={endSession}
                disabled={ending}
                className="px-3 py-1.5 bg-white text-red border border-border rounded-sm text-xs font-medium hover:border-red transition-colors disabled:opacity-50"
              >
                {ending ? "Ending..." : "End Session"}
              </button>
            )}
          </div>

          <div
            ref={chatRef}
            className="flex flex-col gap-3 p-5 bg-surface rounded-[12px] min-h-[400px] max-h-[500px] overflow-y-auto"
          >
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    msg.role === "assistant" ? "bg-accent/10 text-accent" : "bg-accent text-white"
                  }`}
                >
                  {msg.role === "assistant" ? "AI" : "You"}
                </div>
                <div
                  className={`max-w-[72%] px-3.5 py-2.5 rounded-[12px] text-[13px] leading-relaxed ${
                    msg.role === "assistant"
                      ? "bg-white border border-border text-ink"
                      : "bg-accent text-white"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex gap-2.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-accent/10 text-accent shrink-0">
                  AI
                </div>
                <div className="px-3.5 py-2.5 bg-white border border-border rounded-[12px]">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-ink-3 rounded-full animate-pulse" />
                    <span className="w-1.5 h-1.5 bg-ink-3 rounded-full animate-pulse [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-ink-3 rounded-full animate-pulse [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {!sessionEnded && (
            <div className="mt-3 flex gap-2">
              {/* Mic button */}
              {sessionData.mic_enabled && (
                <button
                  onClick={isListening ? stopListening : startListening}
                  className={`px-3 py-2.5 rounded-sm text-sm font-medium transition-all border ${
                    isListening
                      ? "bg-red/10 border-red text-red animate-pulse"
                      : "bg-white border-border text-ink-3 hover:border-accent hover:text-accent"
                  }`}
                  title={isListening ? "Stop listening" : "Speak"}
                >
                  🎙
                </button>
              )}
              <input
                className="flex-1 px-3 py-2.5 border border-border rounded-sm text-sm text-ink bg-white outline-none focus:border-accent transition-colors"
                placeholder={
                  isListening ? "Listening..." : sessionData.mic_enabled ? "Type or speak..." : "Type your response..."
                }
                value={userMsg}
                onChange={(e) => setUserMsg(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                disabled={sending}
              />
              <button
                onClick={sendMessage}
                disabled={sending || !userMsg.trim()}
                className="px-4 py-2.5 bg-accent text-white rounded-sm text-sm font-medium hover:bg-[#4a3ce0] transition-colors disabled:opacity-50"
              >
                Send
              </button>
            </div>
          )}

          {/* Session summary */}
          {sessionEnded && sessionSummary && (
            <div className="mt-4 bg-card border border-border rounded-[12px] p-5 shadow-card">
              <div className="font-semibold text-sm mb-2">AI Coach Summary</div>
              <div className="text-sm text-ink-2 leading-relaxed">{sessionSummary}</div>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => router.push("/dashboard/roleplay")}
                  className="px-4 py-2 bg-accent text-white rounded-sm text-sm font-medium hover:bg-[#4a3ce0] transition-colors"
                >
                  New Session
                </button>
                <button
                  onClick={() => router.push("/dashboard/history")}
                  className="px-4 py-2 bg-white text-ink border border-border rounded-sm text-sm font-medium hover:border-accent transition-colors"
                >
                  View History
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Right panel: Live scoring + nudges ── */}
        <div>
          <div className="bg-card border border-border rounded-[12px] p-4 shadow-card mb-4">
            <div className="font-semibold text-sm mb-3">Live Rubric Score</div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="text-center p-3 bg-surface rounded-sm">
                <div className="text-2xl font-bold text-accent">{overallScore || "--"}</div>
                <div className="text-[11px] text-ink-3">Overall</div>
              </div>
              <div className="text-center p-3 bg-surface rounded-sm">
                <div className="text-2xl font-bold text-gold">{turns}</div>
                <div className="text-[11px] text-ink-3">Exchanges</div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {criteriaScores.length > 0 ? (
                criteriaScores.map((cs) => {
                  const pct = (cs.score / 5) * 100;
                  return (
                    <div key={cs.criterion_id}>
                      <div className="flex justify-between text-xs text-ink-3 mb-1">
                        <span className="truncate mr-2">{cs.criterion_name}</span>
                        <span className="font-semibold text-ink">{cs.score}</span>
                      </div>
                      <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-accent transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-ink-3 italic">Scores will appear after your first exchange...</div>
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-[12px] p-4 shadow-card">
            <div className="font-semibold text-sm mb-3">AI Coach Nudges</div>
            <div className="flex flex-col gap-2">
              {nudges.length === 0 ? (
                <div className="text-xs text-ink-3 italic">Coaching tips will appear as you practice...</div>
              ) : (
                nudges.map((nudge, i) => (
                  <div
                    key={i}
                    className="p-2.5 bg-gold/[0.08] border border-gold/20 rounded-sm text-xs text-[#92400e] leading-relaxed"
                  >
                    <span className="font-semibold">💡 </span>
                    {nudge}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
