import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  AlertTriangle,
  Bot,
  User,
  ShieldAlert,
  ArrowRight,
  Info,
  CheckCircle2,
  Stethoscope,
  Heart
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import { usePet } from '../context/PetContext.jsx';

export const AIAssistantPage = () => {
  const { selectedPet } = usePet();
  const petName = selectedPet?.name || 'your pet';
  const hasPet = Boolean(selectedPet);

  const [messages, setMessages] = useState(() => [
    {
      id: 'init_1',
      sender: 'assistant',
      text: hasPet
        ? `Hello! I am your PetCare AI Pet Health Advisor. I have loaded ${selectedPet?.name}’s medical profile${selectedPet?.allergies?.length ? ` (known allergies: ${selectedPet.allergies.join(', ')})` : ''}. How can I assist you with ${selectedPet?.name}'s care and wellness today?`
        : `Hello! I am your PetCare AI Pet Health Advisor. I can answer any questions about pet nutrition, common symptoms, safety, vaccine schedules, or emergency guidance. How can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      severity: 'normal'
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (promptToSend) => {
    const query = (promptToSend || inputPrompt).trim();
    if (!query || loading) return;

    const userMsg = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', {
        prompt: query,
        petContext: selectedPet
      });

      if (res.data?.success) {
        const { text, severity } = res.data.data;
        const aiMsg = {
          id: `ai_${Date.now()}`,
          sender: 'assistant',
          text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          severity: severity || 'normal'
        };
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'assistant',
          text: "I'm having trouble connecting to the pet health knowledge base right now. If your pet is in distress, please contact your nearest emergency animal hospital immediately.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          severity: 'emergency'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = hasPet ? [
    `Check if chicken or grain is safe for ${petName}`,
    `${petName} is shaking head and scratching ears`,
    `When is ${petName}'s next booster vaccine recommended?`,
    `What should I do if ${petName} ate chocolate or grapes?`,
    `Optimal daily feeding portions and healthy weight for ${petName}`
  ] : [
    `What human foods are toxic to dogs and cats?`,
    `My pet has an upset stomach and is vomiting, what should I do?`,
    `What are the core vaccinations puppies and kittens need?`,
    `How can I tell if my pet has a skin allergy or flea reaction?`,
    `Emergency first aid steps if a pet is choking`
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#78936D] mb-1">
            <Sparkles className="w-4 h-4 text-[#C8643D]" />
            <span>Gemini-Powered Pet Health AI</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#20351F] tracking-tight">
            AI Pet Health & Symptom Advisor
          </h1>
          <p className="text-sm text-[#687166] mt-0.5">
            {hasPet
              ? `Instant clinical guidance tailored to ${petName}’s profile, allergies, and wellness.`
              : `Instant clinical guidance for pet parents covering symptoms, nutrition, and emergency triage.`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/booking"
            className="px-4 py-2 rounded-2xl bg-[#20351F] text-white text-xs font-bold shadow-xs hover:bg-[#152414] transition-colors flex items-center gap-1.5"
          >
            <Stethoscope className="w-4 h-4 text-[#DCE7D5]" />
            <span>Book Pet Specialist</span>
          </Link>
          <Link
            to="/emergency"
            className="px-4 py-2 rounded-2xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold hover:bg-rose-100 transition-colors flex items-center gap-1.5"
          >
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Emergency SOS</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Active Pet Context & Sample Prompts */}
        <div className="lg:col-span-1 space-y-4">
          {/* Pet Dossier Card */}
          {selectedPet && (
            <div className="p-5 rounded-3xl bg-white border border-[#20351F]/10 shadow-xs space-y-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#687166] block">
                Context Injected Pet Dossier
              </span>
              <div className="flex items-center gap-3">
                <img
                  src={selectedPet.avatar}
                  alt={selectedPet.name}
                  className="w-12 h-12 rounded-2xl object-cover ring-2 ring-[#78936D]"
                />
                <div>
                  <h4 className="font-extrabold text-sm text-[#20351F]">{selectedPet.name}</h4>
                  <p className="text-xs text-[#687166]">{selectedPet.breed}</p>
                </div>
              </div>

              <div className="space-y-1.5 text-xs pt-2 border-t border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Weight:</span>
                  <span className="font-bold text-slate-800">{selectedPet.weight} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Age:</span>
                  <span className="font-bold text-slate-800">3 Years</span>
                </div>
                <div className="pt-1">
                  <span className="text-slate-500 block mb-1">Documented Allergies:</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedPet.allergies.map((a, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 text-[10px] font-bold">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="pt-1">
                  <span className="text-slate-500 block mb-1">Current Medication:</span>
                  <span className="font-medium text-slate-800 block text-[11px]">
                    Apoquel 16mg (Once daily)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Questions */}
          <div className="p-5 rounded-3xl bg-[#FCFCF5] border border-[#20351F]/10 shadow-xs space-y-2.5">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#687166] block">
              Suggested Questions
            </span>
            <div className="space-y-2">
              {sampleQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(q)}
                  className="w-full text-left p-2.5 rounded-xl bg-white border border-slate-200/80 hover:border-[#78936D] hover:bg-[#F0F4ED] text-xs font-medium text-slate-700 transition-colors cursor-pointer"
                >
                  "{q}"
                </button>
              ))}
            </div>
          </div>

          {/* Medical Disclaimer */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 leading-relaxed">
            <p className="font-bold flex items-center gap-1.5 mb-1">
              <Info className="w-3.5 h-3.5 text-amber-700" /> Pet Health AI Disclaimer
            </p>
            AI recommendations are for informational purposes and triage assistance. Always consult a licensed pet care specialist for definitive clinical diagnoses.
          </div>
        </div>

        {/* Right Column: Interactive Chat Interface */}
        <div className="lg:col-span-3 flex flex-col h-[650px] bg-white rounded-3xl border border-[#20351F]/10 shadow-xs overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-[#FBFBF6]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-[#20351F] text-white flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#DCE7D5]" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-[#20351F]">PetCare Clinical Assistant</h3>
                <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active · Server-Side Gemini API
                </p>
              </div>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg) => {
              const isAi = msg.sender === 'assistant';
              const isCaution = msg.severity === 'caution';
              const isEmergency = msg.severity === 'emergency';

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-3xl ${isAi ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                      isAi ? 'bg-[#20351F] text-[#DCE7D5]' : 'bg-[#C8643D] text-white'
                    }`}
                  >
                    {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  <div className="space-y-1">
                    <div
                      className={`p-4 rounded-2xl text-xs leading-relaxed ${
                        isAi
                          ? isEmergency
                            ? 'bg-rose-50 text-rose-950 border border-rose-200 shadow-xs'
                            : isCaution
                            ? 'bg-amber-50 text-amber-950 border border-amber-200 shadow-xs'
                            : 'bg-[#F0F4ED] text-[#20351F] border border-[#78936D]/20 shadow-2xs'
                          : 'bg-[#20351F] text-white shadow-xs'
                      }`}
                    >
                      {/* Emergency Warning Header if Emergency */}
                      {isEmergency && (
                        <div className="flex items-center gap-2 font-black text-rose-700 pb-2 mb-2 border-b border-rose-200">
                          <AlertTriangle className="w-4 h-4" />
                          <span>HIGH SEVERITY ALERT — IMMEDIATE CLINICAL ATTENTION NEEDED</span>
                        </div>
                      )}

                      <div className="whitespace-pre-wrap">{msg.text}</div>
                    </div>

                    <span className={`text-[10px] text-slate-400 block ${isAi ? 'text-left pl-1' : 'text-right pr-1'}`}>
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-3 max-w-lg mr-auto">
                <div className="w-8 h-8 rounded-xl bg-[#20351F] text-[#DCE7D5] flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-2xl bg-[#F0F4ED] text-xs text-[#20351F] flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#78936D] animate-bounce" />
                  <span className="inline-block w-2 h-2 rounded-full bg-[#78936D] animate-bounce [animation-delay:0.2s]" />
                  <span className="inline-block w-2 h-2 rounded-full bg-[#78936D] animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[#687166] font-medium ml-1">Analyzing pet health knowledge base...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Box */}
          <div className="p-4 border-t border-slate-100 bg-[#FCFCF5]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask about symptoms, diet, allergens, medications, or behavior..."
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#78936D]"
              />
              <button
                type="submit"
                disabled={loading || !inputPrompt.trim()}
                className="p-3 rounded-2xl bg-[#20351F] hover:bg-[#152414] text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                aria-label="Send prompt"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
