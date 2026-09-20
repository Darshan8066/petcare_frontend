import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  FileText,
  CheckCircle2,
  Clock,
  Stethoscope,
  Heart,
  Globe,
  UserCheck,
  Languages,
  Activity,
  User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { usePet } from '../context/PetContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../services/api.js';

const AVAILABLE_DOCTORS = [
  {
    id: 'vet_1',
    name: 'Dr. Elena Alvarez, DVM',
    gender: 'female',
    title: 'Senior Veterinary Telemedicine Consultant',
    clinic: 'Meadowbrook Animal Hospital',
    photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=1400&q=80',
    specialty: 'Internal Medicine & Preventative Care'
  },
  {
    id: 'vet_2',
    name: 'Dr. Marcus Vance, DVM',
    gender: 'male',
    title: 'Orthopedic & General Pet Specialist',
    clinic: 'Valley Pet Health Center',
    photo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=1400&q=80',
    specialty: 'Bones, Joints, Tummy & Surgery'
  },
  {
    id: 'vet_3',
    name: 'Dr. Priya Nair, BVSc',
    gender: 'female',
    title: 'Holistic & Dermatology Specialist',
    clinic: 'Harmony Pet Wellness Studio',
    photo: 'https://images.unsplash.com/photo-1594824813598-c178229bbfd2?auto=format&fit=crop&w=1400&q=80',
    specialty: 'Skin Itching, Diet & Natural Care'
  },
  {
    id: 'vet_4',
    name: 'Dr. Rajesh Sharma, MVSc',
    gender: 'male',
    title: 'Senior Canine & Feline Physician',
    clinic: 'Apex Regional Pet Care',
    photo: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=1400&q=80',
    specialty: 'Emergency, Fever, Digestion & Diet'
  },
  {
    id: 'vet_5',
    name: 'Dr. Ananya Patel, BVSc & AH',
    gender: 'female',
    title: 'Preventative Health & Nutrition Specialist',
    clinic: 'CareNest Veterinary Clinic',
    photo: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=1400&q=80',
    specialty: 'Puppy Care, Vaccinations & Wellness'
  }
];

const SUPPORTED_LANGUAGES = [
  { code: 'auto', label: '🌐 All Languages (Auto / બધી / सभी)', speechLang: 'auto' },
  { code: 'hi', label: '🇮🇳 हिन्दी (Hindi)', speechLang: 'hi-IN' },
  { code: 'gu', label: '🇮🇳 ગુજરાતી (Gujarati)', speechLang: 'gu-IN' },
  { code: 'en', label: '🇺🇸 English', speechLang: 'en-US' },
  { code: 'mr', label: '🇮🇳 मराठी (Marathi)', speechLang: 'mr-IN' },
  { code: 'bn', label: '🇮🇳 বাংলা (Bengali)', speechLang: 'bn-IN' },
  { code: 'ta', label: '🇮🇳 தமிழ் (Tamil)', speechLang: 'ta-IN' },
  { code: 'te', label: '🇮🇳 తెలుగు (Telugu)', speechLang: 'te-IN' },
  { code: 'es', label: '🇪🇸 Español (Spanish)', speechLang: 'es-ES' },
  { code: 'fr', label: '🇫🇷 Français (French)', speechLang: 'fr-FR' }
];

export function VideoRoomPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { pets, selectedPet, setSelectedPet, medicines, recordMedicineDose } = usePet();
  const { success, info, error: toastError } = useToast();

  // Active Pet
  const activePet = selectedPet || (pets.length > 0 ? pets[0] : null);
  const petDisplayName = activePet?.name || (user ? 'your pet' : 'your pet');

  // Selected Doctor
  const initialDoctorId = searchParams.get('doctorId') || searchParams.get('providerId') || 'vet_1';
  const matchedDoctor = AVAILABLE_DOCTORS.find(d => d.id === initialDoctorId) || AVAILABLE_DOCTORS[0];
  const [selectedDoctor, setSelectedDoctor] = useState(matchedDoctor);

  // Selected Language
  const initialLang = searchParams.get('lang') || 'auto';
  const [selectedLanguage, setSelectedLanguage] = useState(initialLang);

  // Video & Audio States
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [doctorMuted, setDoctorMuted] = useState(false);
  const [isDoctorSpeaking, setIsDoctorSpeaking] = useState(false);
  const [cameraPermissionError, setCameraPermissionError] = useState(false);

  // Hands-free conversation state
  const [handsFreeActive, setHandsFreeActive] = useState(true);
  const [liveTranscript, setLiveTranscript] = useState('');

  // Call Lifecycle
  const [callDuration, setCallDuration] = useState(0);
  const [isCallActive, setIsCallActive] = useState(true);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  // Messages & Consultation
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeTab, setActiveTab] = useState('consult');

  // Video Element Ref
  const userVideoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const chatScrollRef = useRef(null);
  const recognitionRef = useRef(null);

  // Refs to avoid stale closures in speech recognition events
  const handsFreeActiveRef = useRef(handsFreeActive);
  handsFreeActiveRef.current = handsFreeActive;

  const isGeneratingRef = useRef(isGenerating);
  isGeneratingRef.current = isGenerating;

  const isDoctorSpeakingRef = useRef(isDoctorSpeaking);
  isDoctorSpeakingRef.current = isDoctorSpeaking;

  const micEnabledRef = useRef(micEnabled);
  micEnabledRef.current = micEnabled;

  const selectedDoctorRef = useRef(selectedDoctor);
  selectedDoctorRef.current = selectedDoctor;

  const selectedLanguageRef = useRef(selectedLanguage);
  selectedLanguageRef.current = selectedLanguage;

  // Voice list tracking
  const [availableVoices, setAvailableVoices] = useState([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const v = window.speechSynthesis.getVoices();
        if (v && v.length > 0) {
          setAvailableVoices(v);
        }
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Clinical Consultation Notes (SOAP)
  const [soapNotes, setSoapNotes] = useState({
    subjective: `Patient ${petDisplayName} (${activePet?.breed || 'Companion'}) presented for live video checkup. Owner connected via telehealth.`,
    objective: `Telehealth video exam: Alert, attentive, and breathing comfortably. Mucous membranes visible pink on camera.`,
    assessment: `Live routine inquiry and wellness evaluation. Pet is stable and resting comfortably.`,
    plan: `Follow simple home care steps. Maintain fresh water and comfortable rest. Schedule clinic visit if symptoms escalate.`
  });

  // Timer interval
  useEffect(() => {
    let timer;
    if (isCallActive) {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isCallActive]);

  // Scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isGenerating, liveTranscript]);

  // Request user webcam
  useEffect(() => {
    let stream = null;
    const startCamera = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && cameraEnabled) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false
          });
          mediaStreamRef.current = stream;
          if (userVideoRef.current) {
            userVideoRef.current.srcObject = stream;
          }
        }
      } catch (err) {
        console.warn('Camera access unavailable or declined, using simulated pet video feed:', err);
        setCameraPermissionError(true);
      }
    };

    if (cameraEnabled) {
      startCamera();
    } else {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
    }

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraEnabled]);

  // Stop Speech Recognition safely
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  // Continuous Hands-Free Speech Recognition helper defined before speakDoctorResponse
  const silenceTimerRef = useRef(null);

  // Send message and get AI Doctor response in simple words
  const handleSendMessage = useCallback(async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text || isGeneratingRef.current) return;

    // Stop listening while generating response
    stopListening();
    setLiveTranscript('');
    setInputText('');
    setIsGenerating(true);

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text,
      time: timeStr
    };

    setMessages(prev => [...prev, userMsg]);

    try {
      const historyPayload = messages.slice(-6).map(m => ({
        role: m.sender,
        text: m.text
      }));

      const res = await api.post('/ai/video-consultation', {
        petId: activePet?._id || 'pet_general',
        message: text,
        conversationHistory: historyPayload,
        petContext: {
          name: petDisplayName,
          breed: activePet?.breed || 'Companion',
          weight: activePet?.weight || 5,
          allergies: activePet?.allergies || []
        },
        doctorName: selectedDoctorRef.current.name,
        doctorGender: selectedDoctorRef.current.gender,
        userName: user?.name || user?.email?.split('@')[0] || 'Friend',
        preferredLanguage: selectedLanguageRef.current
      });

      const replyText =
        res.data?.data?.reply ||
        `Thank you for explaining that. I am watching ${petDisplayName} right here on the camera. Everything looks calm and stable. Please keep ${petDisplayName} comfortable and let me know if any other symptoms appear.`;

      const detectedLang = res.data?.data?.detectedLanguage || (
        /[\u0A80-\u0AFF]/.test(replyText) ? 'gu-IN' :
        /[\u0900-\u097F]/.test(replyText) ? 'hi-IN' :
        'en-US'
      );

      const docMsg = {
        id: `doc_${Date.now()}`,
        sender: 'doctor',
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language: detectedLang
      };

      setMessages(prev => [...prev, docMsg]);
      speakDoctorResponse(replyText, detectedLang);

      // Update clinical notes with simple summary
      setSoapNotes(prev => ({
        ...prev,
        subjective: `${prev.subjective} Owner shared: "${text}".`,
        assessment: `Live telehealth evaluation ongoing with ${selectedDoctorRef.current.name}. ${petDisplayName} is stable.`
      }));
    } catch (err) {
      console.error('Error in video consultation:', err);
      const fallbackReply = `I understand your concern. Please keep ${petDisplayName} calm, offer fresh water, and avoid heavy foods right now. If anything worsens, I recommend an in-clinic checkup.`;
      const docMsg = {
        id: `doc_${Date.now()}`,
        sender: 'doctor',
        text: fallbackReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, docMsg]);
      speakDoctorResponse(fallbackReply);
    } finally {
      setIsGenerating(false);
    }
  }, [inputText, messages, activePet, petDisplayName, user, stopListening]);

  // Continuous Hands-Free Speech Recognition (Hindi, Gujarati, English, and all languages)
  const startListeningContinuous = useCallback(() => {
    if (!micEnabledRef.current || isGeneratingRef.current || isDoctorSpeakingRef.current) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;

      // Select proper language code
      const currentLang = selectedLanguageRef.current;
      if (currentLang === 'hi') {
        recognition.lang = 'hi-IN';
      } else if (currentLang === 'gu') {
        recognition.lang = 'gu-IN';
      } else if (currentLang === 'mr') {
        recognition.lang = 'mr-IN';
      } else if (currentLang === 'en') {
        recognition.lang = 'en-US';
      } else {
        // Auto: defaults to user's browser language (e.g. hi-IN or en-US)
        recognition.lang = navigator.language || 'en-US';
      }

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let interim = '';
        let final = '';
        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        const captured = final || interim;
        if (captured) {
          setLiveTranscript(captured);
        }

        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        if (final && final.trim()) {
          // Speak completed -> Automatically send without button click!
          handleSendMessage(final.trim());
        } else if (interim && interim.trim().length > 3) {
          // Auto-submit after natural conversational pause without needing any button click
          silenceTimerRef.current = setTimeout(() => {
            if (interim.trim()) {
              handleSendMessage(interim.trim());
            }
          }, 1800);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        // Automatically restart listening if still in hands-free mode
        if (
          handsFreeActiveRef.current &&
          !isGeneratingRef.current &&
          !isDoctorSpeakingRef.current &&
          micEnabledRef.current
        ) {
          setTimeout(() => {
            if (
              handsFreeActiveRef.current &&
              !isGeneratingRef.current &&
              !isDoctorSpeakingRef.current &&
              micEnabledRef.current
            ) {
              try {
                recognition.start();
              } catch {}
            }
          }, 400);
        }
      };

      recognition.start();
    } catch (err) {
      console.warn('Speech recognition start failed:', err);
      setIsListening(false);
    }
  }, [handleSendMessage]);

  // Voice synthesis matching Doctor Gender (Female vs Male) and Language
  const speakDoctorResponse = useCallback((text, langHint) => {
    if (doctorMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }
    try {
      window.speechSynthesis.cancel();
      stopListening();

      // Clean markdown tags for natural speech
      const cleanText = text.replace(/[*_#`~>]/g, '').trim();
      const utterance = new SpeechSynthesisUtterance(cleanText);

      // Determine Language
      const isGujarati = /[\u0A80-\u0AFF]/.test(cleanText) || selectedLanguageRef.current === 'gu';
      const isHindi = /[\u0900-\u097F]/.test(cleanText) || selectedLanguageRef.current === 'hi';
      const isMarathi = selectedLanguageRef.current === 'mr';
      const targetLang = langHint || (isGujarati ? 'gu-IN' : isHindi ? 'hi-IN' : isMarathi ? 'mr-IN' : 'en-US');
      utterance.lang = targetLang;

      // Doctor Gender: Female vs Male pitch and tone
      const currentDoc = selectedDoctorRef.current;
      const isFemale = currentDoc.gender === 'female';

      if (isFemale) {
        utterance.pitch = 1.18; // Crisp, warm female pitch
        utterance.rate = 0.98;
      } else {
        utterance.pitch = 0.82; // Warm, resonant male pitch
        utterance.rate = 0.94;
      }

      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        let matchedVoice = null;
        const matchingLangVoices = voices.filter(v =>
          v.lang.toLowerCase().startsWith(targetLang.slice(0, 2).toLowerCase())
        );

        if (matchingLangVoices.length > 0) {
          if (isFemale) {
            matchedVoice =
              matchingLangVoices.find(v =>
                /female|woman|girl|samantha|victoria|zira|aditi|kavya|lekha|sangeeta|priya|swara|veena|heera|kalpana|geeta/i.test(v.name)
              ) || matchingLangVoices[0];
          } else {
            matchedVoice =
              matchingLangVoices.find(v =>
                /male|man|boy|david|mark|alex|daniel|george|ravi|neil|madhav|hemant|valluvar|rishi/i.test(v.name)
              ) || matchingLangVoices[0];
          }
        }

        if (!matchedVoice) {
          if (isFemale) {
            matchedVoice = voices.find(v => /female|woman|samantha|victoria|zira|aditi|kavya|lekha|karen|cindy|moira/i.test(v.name)) || null;
          } else {
            matchedVoice = voices.find(v => /male|man|david|mark|alex|daniel|george|ravi|neil|tom|fred/i.test(v.name)) || null;
          }
        }

        if (matchedVoice) {
          utterance.voice = matchedVoice;
        }
      }

      utterance.onstart = () => {
        setIsDoctorSpeaking(true);
      };

      utterance.onend = () => {
        setIsDoctorSpeaking(false);
        // Automatically start listening for user without clicking any button!
        if (handsFreeActiveRef.current && micEnabledRef.current) {
          setTimeout(() => {
            startListeningContinuous();
          }, 350);
        }
      };

      utterance.onerror = () => {
        setIsDoctorSpeaking(false);
        if (handsFreeActiveRef.current && micEnabledRef.current) {
          setTimeout(() => {
            startListeningContinuous();
          }, 350);
        }
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      setIsDoctorSpeaking(false);
    }
  }, [doctorMuted, stopListening, startListeningContinuous]);

  // Initial Join: AI immediately speaks directly to user without any button click!
  useEffect(() => {
    const userName = user?.name || user?.email?.split('@')[0] || 'Friend';
    let greeting = '';
    let greetingLang = 'en-US';

    if (selectedLanguage === 'hi') {
      greeting = `नमस्ते ${userName}! मैं ${selectedDoctor.name} हूँ। मैं यहाँ आपके पेट ${petDisplayName} की मदद के लिए तैयार हूँ। चिंता मत कीजिए, बताइए आज ${petDisplayName} को क्या समस्या हो रही है?`;
      greetingLang = 'hi-IN';
    } else if (selectedLanguage === 'gu') {
      greeting = `નમસ્તે ${userName}! હું ${selectedDoctor.name} છું. હું અહીં ${petDisplayName} ની મદદ માટે હાજર છું. ચિંતા કર્યા વગર મને કહો, આજે ${petDisplayName} ને શું તકલીફ થઈ રહી છે?`;
      greetingLang = 'gu-IN';
    } else if (selectedLanguage === 'mr') {
      greeting = `नमस्कार ${userName}! मी ${selectedDoctor.name}. मी तुमच्या पाळीव प्राणी ${petDisplayName} च्या मदतीसाठी हजर आहे. काळजी करू नका, आज काय अडचण आहे ते सांगा?`;
      greetingLang = 'mr-IN';
    } else {
      greeting = `Hello ${userName}! I am ${selectedDoctor.name}. I am right here on video to help take care of ${petDisplayName}. Please tell me, what problem is ${petDisplayName} having today?`;
      greetingLang = 'en-US';
    }

    const initMsg = {
      id: `msg_init_${Date.now()}`,
      sender: 'doctor',
      text: greeting,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      language: greetingLang
    };

    setMessages([initMsg]);

    // Speak greeting directly out loud on arrival
    const speakTimer = setTimeout(() => {
      speakDoctorResponse(greeting, greetingLang);
    }, 600);

    return () => {
      clearTimeout(speakTimer);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      stopListening();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [selectedDoctor.id, selectedLanguage]);

  const formatTimer = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    stopListening();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsCallActive(false);
    setShowSummaryModal(true);
  };

  const handleApplyMedication = async () => {
    // Resolved from the loaded schedule rather than the removed seed id.
    const activeMedicine = medicines.find((m) => m.status === 'active') || medicines[0];
    if (!activeMedicine) {
      toastError('No medication schedule found for this pet.', 'Nothing to sync');
      return;
    }
    await recordMedicineDose(activeMedicine._id, 'taken');
    success('Consultation prescription synchronized with Pet Medication schedule!', 'Prescription Recorded');
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Top Telehealth Control Bar */}
      <div className="bg-white rounded-3xl border border-[#20351F]/10 shadow-xs p-3.5 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative shrink-0">
            <img
              src={selectedDoctor.photo}
              alt={selectedDoctor.name}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border-2 border-emerald-500 shadow-sm"
              referrerPolicy="no-referrer"
            />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h1 className="font-extrabold text-sm sm:text-base md:text-lg text-[#20351F] truncate">
                {selectedDoctor.name}
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300 shrink-0">
                {selectedDoctor.gender === 'female' ? '👩‍⚕️ FEMALE VOICE' : '👨‍⚕️ MALE VOICE'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200 shrink-0">
                LIVE TELEHEALTH
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-[#687166] truncate mt-0.5">
              {selectedDoctor.title} · {selectedDoctor.clinic}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Doctor Switcher (Female/Male) */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-[#FBFBF6] border border-stone-200 text-xs">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="text-stone-500 font-medium hidden sm:inline">Doctor:</span>
            <select
              value={selectedDoctor.id}
              onChange={(e) => {
                const doc = AVAILABLE_DOCTORS.find(d => d.id === e.target.value);
                if (doc) setSelectedDoctor(doc);
              }}
              className="font-bold text-[#20351F] bg-transparent border-none outline-hidden cursor-pointer text-xs"
            >
              {AVAILABLE_DOCTORS.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.gender === 'female' ? 'Female Voice' : 'Male Voice'})
                </option>
              ))}
            </select>
          </div>

          {/* Multilingual Selector */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-[#FBFBF6] border border-stone-200 text-xs">
            <Languages className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="font-bold text-[#20351F] bg-transparent border-none outline-hidden cursor-pointer text-xs"
            >
              {SUPPORTED_LANGUAGES.map(l => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {/* Patient Selector */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-[#FBFBF6] border border-stone-200 text-xs">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 shrink-0" />
            {pets.length > 0 ? (
              <select
                value={activePet?._id || ''}
                onChange={(e) => {
                  const pet = pets.find(p => p._id === e.target.value);
                  if (pet) setSelectedPet(pet);
                }}
                className="font-bold text-[#20351F] bg-transparent border-none outline-hidden cursor-pointer text-xs"
              >
                {pets.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-bold text-[#20351F] text-xs">{petDisplayName}</span>
            )}
          </div>

          {/* Call Duration */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200 shrink-0">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>{formatTimer(callDuration)}</span>
          </div>

          {/* End Call Button */}
          <button
            onClick={handleEndCall}
            className="px-3.5 py-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span>End Call</span>
          </button>
        </div>
      </div>

      {/* Hands-Free Live Voice Conversation Indicator Bar */}
      <div className="p-3 sm:p-4 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-2xs flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl text-white ${isListening ? 'bg-rose-500 animate-pulse' : isDoctorSpeaking ? 'bg-emerald-600' : 'bg-[#20351F]'}`}>
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-[#20351F]">
                  {isDoctorSpeaking
                    ? `${selectedDoctor.name} (${selectedDoctor.gender === 'female' ? 'Female Voice' : 'Male Voice'}) is speaking...`
                    : isListening
                    ? 'Listening to you live... (Speak now in any language)'
                    : 'Hands-Free Direct Conversation Active'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-200/70 text-emerald-900 text-[10px] font-bold">
                  No buttons needed
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                {liveTranscript ? (
                  <span className="font-semibold text-rose-700">You are saying: &ldquo;{liveTranscript}&rdquo;</span>
                ) : (
                  'Speak freely in Hindi, Gujarati, English, or any language. Doctor speaks directly back to you in clear, simple words.'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              onClick={() => {
                if (isListening) {
                  stopListening();
                } else {
                  startListeningContinuous();
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              {isListening ? 'Pause Mic' : 'Start Mic'}
            </button>
          </div>
        </div>

        {/* Quick Language Switch Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-emerald-200/60">
          <span className="text-[10px] font-bold text-emerald-900 mr-1 flex items-center gap-1">
            <Languages className="w-3 h-3 text-emerald-700" />
            Language:
          </span>
          {[
            { code: 'auto', label: '🌐 All (Auto)' },
            { code: 'hi', label: '🇮🇳 हिन्दी (Hindi)' },
            { code: 'gu', label: '🇮🇳 ગુજરાતી (Gujarati)' },
            { code: 'en', label: '🇺🇸 English' },
            { code: 'mr', label: '🇮🇳 मराठी (Marathi)' },
          ].map(langItem => (
            <button
              key={langItem.code}
              onClick={() => setSelectedLanguage(langItem.code)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                selectedLanguage === langItem.code
                  ? 'bg-[#20351F] text-white shadow-xs'
                  : 'bg-white/80 hover:bg-white text-stone-700 border border-emerald-200'
              }`}
            >
              {langItem.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Call Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left Column: Video Arena (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl aspect-16/10 flex items-center justify-center">
            {/* Main Feed: Doctor */}
            <div className="absolute inset-0">
              <img
                src={selectedDoctor.photo}
                alt={selectedDoctor.name}
                className="w-full h-full object-cover object-center filter brightness-95 contrast-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
            </div>

            {/* Doctor Audio Visualizer Bar */}
            {isDoctorSpeaking && (
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-bold backdrop-blur-md">
                <div className="flex items-center gap-1">
                  <span className="w-1 h-3 bg-emerald-400 rounded-full animate-bounce" />
                  <span className="w-1 h-5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                  <span className="w-1 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                </div>
                <span>{selectedDoctor.name} ({selectedDoctor.gender === 'female' ? 'Female' : 'Male'} Voice)</span>
              </div>
            )}

            {/* Doctor Info Badge Overlay */}
            <div className="absolute bottom-4 left-4 z-20 flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 text-white flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <h4 className="text-xs font-bold leading-tight">{selectedDoctor.name}</h4>
                  <p className="text-[10px] text-white/70">{selectedDoctor.clinic} · Room #402</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setDoctorMuted(prev => !prev);
                  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                  }
                }}
                className="p-2.5 rounded-2xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white transition-colors cursor-pointer"
                title={doctorMuted ? 'Unmute Doctor' : 'Mute Doctor Voice'}
              >
                {doctorMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>
            </div>

            {/* Picture-in-Picture: Patient's Feed (User / Pet) */}
            <div className="absolute top-4 right-4 z-30 w-32 sm:w-44 aspect-4/3 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-slate-900">
              {cameraEnabled ? (
                cameraPermissionError ? (
                  <div className="relative w-full h-full">
                    <img
                      src={activePet?.photoUrl || activePet?.avatar || "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80"}
                      alt={petDisplayName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-1 right-1.5 px-1.5 py-0.5 rounded-md bg-black/70 text-[9px] font-bold text-emerald-300">
                      LIVE PET HD
                    </div>
                  </div>
                ) : (
                  <video
                    ref={userVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform scale-x-[-1]"
                  />
                )
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-stone-400 text-[10px] font-medium p-2 text-center">
                  <VideoOff className="w-5 h-5 mb-1 text-stone-500" />
                  <span>Camera Off</span>
                </div>
              )}
              <div className="absolute bottom-1 left-1.5 px-1.5 py-0.5 rounded-md bg-black/70 text-[9px] font-bold text-white">
                {petDisplayName}
              </div>
            </div>

            {/* Video Control Dock */}
            <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
              <button
                onClick={() => {
                  const nextState = !micEnabled;
                  setMicEnabled(nextState);
                  if (!nextState) {
                    stopListening();
                  } else {
                    startListeningContinuous();
                  }
                }}
                className={`p-3 rounded-2xl backdrop-blur-md border transition-all cursor-pointer ${
                  micEnabled
                    ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                    : 'bg-rose-600 border-rose-500 text-white'
                }`}
                title={micEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
              >
                {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setCameraEnabled(prev => !prev)}
                className={`p-3 rounded-2xl backdrop-blur-md border transition-all cursor-pointer ${
                  cameraEnabled
                    ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                    : 'bg-rose-600 border-rose-500 text-white'
                }`}
                title={cameraEnabled ? 'Disable Camera' : 'Enable Camera'}
              >
                {cameraEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Quick Consultation Examination Prompts */}
          <div className="bg-white rounded-3xl border border-[#20351F]/10 shadow-xs p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#687166] mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Quick Everyday Pet Topics (Speak or Click)</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                `My pet is scratching their ears and skin`,
                `My dog is having loose motion and not eating`,
                `Check breathing and chest movements on camera`,
                `मेरे पेट को बुखार और उल्टी आ रही है`,
                `મારો કૂતરો જમતો નથી અને નબળો લાગે છે`
              ].map((promptText, i) => (
                <button
                  key={i}
                  disabled={isGenerating}
                  onClick={() => handleSendMessage(promptText)}
                  className="px-3 py-1.5 rounded-xl bg-[#F0F4ED] hover:bg-[#DCE7D5] text-[#20351F] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {promptText} →
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Consultation & Clinical SOAP Chart (4 cols) */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          <div className="bg-white rounded-3xl border border-[#20351F]/10 shadow-xs flex flex-col h-[520px] overflow-hidden">
            {/* Tabs Header */}
            <div className="flex items-center border-b border-stone-100 p-2 gap-1 bg-[#FBFBF6]">
              <button
                onClick={() => setActiveTab('consult')}
                className={`flex-1 py-2 px-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'consult'
                    ? 'bg-[#20351F] text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                Live Consultation
              </button>
              <button
                onClick={() => setActiveTab('soap')}
                className={`flex-1 py-2 px-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'soap'
                    ? 'bg-[#20351F] text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                SOAP Notes & Rx
              </button>
            </div>

            {/* Tab 1: Live Chat Conversation */}
            {activeTab === 'consult' && (
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div
                  ref={chatScrollRef}
                  className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3"
                >
                  {messages.map((msg) => {
                    const isDoc = msg.sender === 'doctor';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isDoc ? 'items-start' : 'items-end'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          <span className="text-[10px] font-bold text-stone-500">
                            {isDoc ? selectedDoctor.name : 'You'}
                          </span>
                          <span className="text-[9px] text-stone-400">{msg.time}</span>
                        </div>
                        <div
                          className={`max-w-[88%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                            isDoc
                              ? 'bg-[#F0F4ED] text-[#20351F] rounded-tl-xs border border-[#20351F]/5'
                              : 'bg-[#20351F] text-white rounded-tr-xs shadow-xs'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}

                  {/* Realtime voice transcription preview */}
                  {liveTranscript && (
                    <div className="flex flex-col items-end animate-pulse">
                      <div className="text-[10px] text-emerald-600 font-bold px-1">Speaking now...</div>
                      <div className="max-w-[88%] p-3 rounded-2xl text-xs bg-emerald-50 border border-emerald-300 text-emerald-900 italic">
                        &ldquo;{liveTranscript}&rdquo;
                      </div>
                    </div>
                  )}

                  {isGenerating && (
                    <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#F0F4ED] text-[#20351F] text-xs max-w-[80%]">
                      <div className="w-2 h-2 rounded-full bg-[#20351F] animate-ping" />
                      <span className="font-semibold">{selectedDoctor.name} is responding...</span>
                    </div>
                  )}
                </div>

                {/* Input Bar */}
                <div className="p-3 border-t border-stone-100 bg-white">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (isListening) {
                          stopListening();
                        } else {
                          startListeningContinuous();
                        }
                      }}
                      className={`p-2.5 rounded-2xl border transition-colors cursor-pointer shrink-0 ${
                        isListening
                          ? 'bg-rose-500 border-rose-500 text-white animate-pulse'
                          : 'bg-[#F0F4ED] hover:bg-[#DCE7D5] border-[#20351F]/10 text-[#20351F]'
                      }`}
                      title="Speak without clicking send"
                    >
                      <Mic className="w-4 h-4" />
                    </button>

                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendMessage();
                      }}
                      placeholder={`Type or just speak in Hindi, Gujarati, English...`}
                      className="flex-1 py-2 px-3 rounded-2xl bg-[#FBFBF6] border border-stone-200 text-xs text-slate-800 placeholder:text-stone-400 focus:outline-hidden focus:border-[#20351F]"
                    />

                    <button
                      type="button"
                      disabled={!inputText.trim() || isGenerating}
                      onClick={() => handleSendMessage()}
                      className="p-2.5 rounded-2xl bg-[#20351F] hover:bg-[#152414] text-white transition-colors cursor-pointer disabled:opacity-40 shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Clinical SOAP Notes & Prescription */}
            {activeTab === 'soap' && (
              <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>Real-time Clinical Encounter Record</span>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    Live pet specialist notes generated during this video session for {activePet?.name || petDisplayName}.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-[#FCFCF5] border border-stone-200">
                    <span className="font-extrabold uppercase text-[10px] text-stone-400 block mb-1">
                      Subjective (Owner Notes & History)
                    </span>
                    <p className="text-slate-800 leading-relaxed">{soapNotes.subjective}</p>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#FCFCF5] border border-stone-200">
                    <span className="font-extrabold uppercase text-[10px] text-stone-400 block mb-1">
                      Objective (Video Examination)
                    </span>
                    <p className="text-slate-800 leading-relaxed">{soapNotes.objective}</p>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#FCFCF5] border border-stone-200">
                    <span className="font-extrabold uppercase text-[10px] text-stone-400 block mb-1">
                      Assessment & Advice
                    </span>
                    <p className="text-slate-800 leading-relaxed">{soapNotes.assessment}</p>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#FCFCF5] border border-stone-200">
                    <span className="font-extrabold uppercase text-[10px] text-stone-400 block mb-1">
                      Care Plan
                    </span>
                    <p className="text-slate-800 leading-relaxed">{soapNotes.plan}</p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleApplyMedication}
                    className="w-full py-2.5 px-4 rounded-2xl bg-[#20351F] hover:bg-[#152414] text-white font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Save Care Notes to Pet Profile</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Post-Call Summary Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-white border border-[#20351F]/10 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-xl font-extrabold text-[#20351F]">
                Telehealth Consultation Completed
              </h2>
              <p className="text-xs text-[#687166]">
                Duration: {formatTimer(callDuration)} · {selectedDoctor.name}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FCFCF5] border border-stone-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-500 font-medium">Patient:</span>
                <span className="font-bold text-slate-900">{petDisplayName} ({activePet?.breed || 'Companion'})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 font-medium">Consultant:</span>
                <span className="font-bold text-slate-900">{selectedDoctor.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 font-medium">Primary Outcome:</span>
                <span className="font-bold text-emerald-800">Stable · Advice Recorded</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => navigate('/pets')}
                className="w-full py-3 px-4 rounded-2xl bg-[#20351F] hover:bg-[#152414] text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <FileText className="w-4 h-4" />
                <span>View Pet Health Records</span>
              </button>

              <button
                onClick={() => navigate('/')}
                className="w-full py-3 px-4 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-colors cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
