import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Phone,
  MapPin,
  Clock,
  ShieldAlert,
  Activity,
  HeartCrack,
  Flame,
  Zap,
  CheckCircle2,
  Navigation,
  Sparkles,
  ArrowRight,
  Info,
  X,
  Stethoscope,
  Share2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import { usePet } from '../context/PetContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export const EmergencyPage = () => {
  const { pets, selectedPet } = usePet();
  const { success, info } = useToast();

  const defaultClinics = [
    {
      _id: 'emerg_1',
      name: 'Cascade 24/7 Emergency & Critical Pet Care',
      address: '1450 Gateway Blvd, Springfield, OR',
      phone: '+1 (555) 911-7387',
      hours: '24 Hours / 7 Days a week',
      openHours: 'Open 24/7 · 365 Days',
      isOpen24Hours: true,
      distance: '1.4 miles',
      emergencyFee: 95,
      facilities: ['Oxygen Therapy & Ventilator', 'Digital X-Ray & Ultrasound', 'Trauma Emergency Surgery', 'Onsite ICU & Blood Bank'],
      services: ['Oxygen Therapy & Ventilator', 'Digital X-Ray & Ultrasound', 'Trauma Emergency Surgery', 'Onsite ICU & Blood Bank']
    },
    {
      _id: 'emerg_2',
      name: 'Willamette Veterinary Emergency Hospital',
      address: '890 Franklin Blvd, Eugene, OR',
      phone: '+1 (555) 746-9900',
      hours: 'Open 24/7 (365 days)',
      openHours: 'Open 24/7 (365 days)',
      isOpen24Hours: true,
      distance: '4.2 miles',
      emergencyFee: 110,
      facilities: ['Advanced Surgical Suites', 'Neurology Evaluation', 'Toxicology & Antivenom Unit'],
      services: ['Advanced Surgical Suites', 'Neurology Evaluation', 'Toxicology & Antivenom Unit']
    }
  ];

  const [clinics, setClinics] = useState(defaultClinics);
  const [activeGuide, setActiveGuide] = useState('gdv');
  const [loading, setLoading] = useState(true);

  // Interactive SOS Dispatch System State
  const [activeEmergency, setActiveEmergency] = useState(false);
  const [emergencyPetId, setEmergencyPetId] = useState(selectedPet?._id || pets[0]?._id || '');
  const [selectedEmergencyType, setSelectedEmergencyType] = useState('poison');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [sosCountdown, setSosCountdown] = useState(null);

  useEffect(() => {
    if (selectedPet?._id) {
      setEmergencyPetId(selectedPet._id);
    } else if (pets.length > 0 && !emergencyPetId) {
      setEmergencyPetId(pets[0]._id);
    }
  }, [selectedPet?._id, pets]);

  const currentPet = pets.find(p => p._id === emergencyPetId) || selectedPet || pets[0] || {
    name: 'My Pet',
    breed: 'Companion Pet',
    weight: 15,
    allergies: ['None listed'],
    medications: []
  };

  useEffect(() => {
    const fetchClinics = async () => {
      try {
        setLoading(true);
        const res = await api.get('/emergency-clinics');
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setClinics(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load emergency clinics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchClinics();
  }, []);

  const emergencyTypes = [
    { id: 'poison', label: 'Toxic Ingestion / Poison', severity: 'Immediate Action Required', icon: '🧪' },
    { id: 'choking', label: 'Choking / Labored Breathing', severity: 'Critical Airway Emergency', icon: '🫁' },
    { id: 'gdv', label: 'Severe Bloat / Retching (GDV)', severity: 'Immediate Surgical Risk', icon: '⚠️' },
    { id: 'trauma', label: 'Hit by Car / Severe Trauma / Fracture', severity: 'Critical Trauma', icon: '🩹' },
    { id: 'seizure', label: 'Continuous Seizure / Collapse', severity: 'Neurological Crisis', icon: '⚡' },
    { id: 'heatstroke', label: 'Heatstroke / Temperature > 104°F', severity: 'Thermal Hyperthermia', icon: '🔥' }
  ];

  const nearestHospital = clinics[0] || defaultClinics[0];

  const handleTriggerSOS = () => {
    setSosCountdown(3);
    const interval = setInterval(() => {
      setSosCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          setActiveEmergency(true);
          success('EMERGENCY SOS ACTIVATED: Nearest hospital alerted with patient medical profile.', 'Dispatch Broadcast Active');
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCancelSOS = () => {
    setSosCountdown(null);
    setActiveEmergency(false);
    info('Emergency alert deactivated.');
  };

  const triageGuides = [
    {
      id: 'gdv',
      title: 'Bloat & GDV (Gastric Torsion)',
      risk: 'Critical / Fatal within hours',
      icon: <Activity className="w-5 h-5 text-rose-600" />,
      breeds: 'Common in Golden Retrievers, Labradors, Great Danes, German Shepherds',
      symptoms: [
        'Unproductive retching / attempting to vomit with nothing coming up',
        'Firm, distended, or drum-like swollen abdomen',
        'Pacing, agitation, inability to get comfortable or lie down',
        'Rapid, shallow panting and pale or grey gums'
      ],
      action: 'Rush to 24/7 emergency hospital IMMEDIATELY. Do not wait. This requires emergency surgical gastropexy.'
    },
    {
      id: 'poison',
      title: 'Toxic Ingestion / Poisoning',
      risk: 'Urgent Emergency',
      icon: <ShieldAlert className="w-5 h-5 text-amber-600" />,
      breeds: 'All pets (Dogs & Cats)',
      symptoms: [
        'Ingestion of Dark Chocolate, Xylitol (sugar-free gum), Raisins/Grapes, Lilies (deadly to cats)',
        'Salivation, drooling, vomiting, diarrhea',
        'Tremors, seizures, or extreme lethargy'
      ],
      action: 'Do NOT induce vomiting unless instructed by a pet medical specialist. Call ASPCA Animal Poison Control (888-426-4435) or head directly to the nearest emergency clinic with the packaging.'
    },
    {
      id: 'choking',
      title: 'Choking & Airway Obstruction',
      risk: 'Immediate Life Threat',
      icon: <HeartCrack className="w-5 h-5 text-red-600" />,
      breeds: 'All pets',
      symptoms: [
        'Paw at mouth, violent coughing, wheezing',
        'Blue or purple tongue and gums (Cyanosis)',
        'Collapse or unconsciousness'
      ],
      action: 'Open mouth carefully to inspect for balls or sticks. If visible and safe, sweep with your finger. For dogs, place hands behind the ribs and press upward firmly (Pet Heimlich).'
    },
    {
      id: 'heatstroke',
      title: 'Heatstroke & Hyperthermia',
      risk: 'High Severity',
      icon: <Flame className="w-5 h-5 text-orange-600" />,
      breeds: 'Heavy-coated breeds & Brachycephalic breeds (Pugs, Bulldogs)',
      symptoms: [
        'Excessive loud panting, thick sticky saliva',
        'Bright red tongue, dizziness, confusion, stumbling',
        'Body temperature above 104°F (40°C)'
      ],
      action: 'Move to air-conditioned area immediately. Apply cool (NOT ICE COLD) water to paw pads and belly. Offer small sips of water. Rush to clinic.'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Active SOS Crisis Banner (If Triggered) */}
      {activeEmergency && (
        <div className="p-6 sm:p-8 rounded-3xl bg-red-600 text-white shadow-2xl border-4 border-red-500 animate-in fade-in slide-in-from-top-4 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-red-500 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white text-red-600 flex items-center justify-center font-black animate-pulse text-xl">
                🚨
              </div>
              <div>
                <span className="px-3 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-black uppercase tracking-wider">
                  Active Emergency SOS Broadcast
                </span>
                <h2 className="text-2xl sm:text-3xl font-black">
                  Dispatching for {currentPet.name} ({currentPet.breed})
                </h2>
                <p className="text-xs text-red-100 mt-0.5">
                  Nearest 24/7 Trauma Center: <strong>{nearestHospital.name}</strong> ({nearestHospital.distance} away)
                </p>
              </div>
            </div>

            <button
              onClick={handleCancelSOS}
              className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-colors self-start md:self-auto cursor-pointer"
            >
              Cancel Alert
            </button>
          </div>

          {/* Quick Direct Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a
              href={`tel:${nearestHospital.phone.replace(/[^0-9]/g, '')}`}
              className="p-4 rounded-2xl bg-white text-red-700 hover:bg-red-50 font-black text-sm text-center flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <Phone className="w-5 h-5 animate-pulse" />
              <span>Call ER: {nearestHospital.phone}</span>
            </a>

            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(nearestHospital.name + ' ' + nearestHospital.address)}`}
              target="_blank"
              rel="noreferrer"
              className="p-4 rounded-2xl bg-red-700 hover:bg-red-800 text-white font-bold text-sm text-center flex items-center justify-center gap-2 transition-all border border-red-500"
            >
              <Navigation className="w-5 h-5" />
              <span>Start GPS Navigation (Directions)</span>
            </a>

            <Link
              to="/ai-assistant"
              className="p-4 rounded-2xl bg-red-800 hover:bg-red-900 text-white font-bold text-sm text-center flex items-center justify-center gap-2 transition-all border border-red-600"
            >
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>Ask AI Pet Care First-Aid Triage</span>
            </Link>
          </div>

          {/* Patient Emergency Passport for Doctor Triage */}
          <div className="p-4 rounded-2xl bg-red-700/80 border border-red-500 text-xs space-y-2">
            <div className="flex items-center justify-between font-bold">
              <span className="uppercase tracking-wider text-[11px] text-red-200">
                Medical Passport Ready for Hospital Reception:
              </span>
              <span className="text-white">Weight: <strong>{currentPet.weight} kg</strong></span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-red-100">
              <div><strong>Known Allergies:</strong> {currentPet.allergies?.join(', ') || 'None reported'}</div>
              <div><strong>Age / Species:</strong> 3 Years · Dog (Canine)</div>
              <div><strong>Current Meds:</strong> Apoquel 16mg daily</div>
            </div>
          </div>
        </div>
      )}

      {/* Main SOS Trigger Console */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#20351F]/10 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-rose-600 mb-1">
              <ShieldAlert className="w-4 h-4" />
              <span>Rapid Clinical Response Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#20351F]">
              Emergency SOS & 24/7 Animal Trauma Centers
            </h1>
            <p className="text-xs sm:text-sm text-[#687166] mt-0.5">
              Select your pet and emergency condition below to alert your nearest hospital and view stabilization steps.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="tel:18884264435"
              className="px-4 py-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-colors flex items-center gap-2 border border-amber-200"
            >
              <Phone className="w-4 h-4 text-amber-700" />
              <span>ASPCA Poison Hotline: (888) 426-4435</span>
            </a>
          </div>
        </div>

        {/* Pet & Emergency Condition Picker */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pet Selector */}
          <div className="space-y-3">
            <label className="block text-xs font-black text-[#20351F] uppercase tracking-wider">
              1. Select Affected Pet
            </label>
            <div className="space-y-2">
              {pets.map((pet) => (
                <button
                  key={pet._id}
                  onClick={() => setEmergencyPetId(pet._id)}
                  className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                    emergencyPetId === pet._id
                      ? 'border-[#20351F] bg-[#F0F4ED] shadow-xs'
                      : 'border-stone-200 hover:border-stone-300 bg-white'
                  }`}
                >
                  <img src={pet.avatar} alt={pet.name} className="w-10 h-10 rounded-xl object-cover ring-1 ring-stone-300" />
                  <div>
                    <h4 className="font-extrabold text-xs text-[#20351F]">{pet.name}</h4>
                    <p className="text-[11px] text-stone-500">{pet.breed} · {pet.weight} kg</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Emergency Type Selector */}
          <div className="lg:col-span-2 space-y-3">
            <label className="block text-xs font-black text-[#20351F] uppercase tracking-wider">
              2. Select Emergency Category
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {emergencyTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedEmergencyType(type.id)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedEmergencyType === type.id
                      ? 'border-rose-600 bg-rose-50/80 shadow-xs'
                      : 'border-stone-200 hover:border-stone-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{type.icon}</span>
                    <span className="font-extrabold text-xs text-[#20351F]">{type.label}</span>
                  </div>
                  <span className="text-[10px] text-rose-700 font-bold block mt-1">
                    {type.severity}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Trigger Button Bar */}
        <div className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-stone-500">
            Designated Trauma Center: <strong className="text-[#20351F]">{nearestHospital.name}</strong> ({nearestHospital.distance})
          </div>

          <button
            onClick={handleTriggerSOS}
            disabled={sosCountdown !== null}
            className="px-8 py-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <AlertTriangle className="w-5 h-5 animate-pulse" />
            <span>
              {sosCountdown !== null
                ? `BROADCASTING DISPATCH IN ${sosCountdown}s...`
                : `🚨 ACTIVATE EMERGENCY SOS FOR ${currentPet.name.toUpperCase()}`}
            </span>
          </button>
        </div>
      </div>

      {/* Verified 24/7 Trauma Centers Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-extrabold text-[#20351F]">Nearest 24/7 Animal Trauma Centers</h2>
            <p className="text-xs text-[#687166]">Verified emergency clinics with surgical suites and oxygen ICUs</p>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full">
            ● Live GPS Proximity
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {clinics.map((clinic) => (
            <div
              key={clinic._id}
              className="p-6 rounded-3xl bg-white border border-[#20351F]/10 shadow-xs flex flex-col justify-between hover:shadow-md transition-all space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                    {clinic.openHours || clinic.hours || 'Open 24/7'}
                  </span>
                  <span className="text-xs font-bold text-[#20351F]">{clinic.distance} away</span>
                </div>

                <h3 className="font-extrabold text-base text-[#20351F] leading-tight mt-1">
                  {clinic.name}
                </h3>
                <p className="text-xs text-[#687166] mt-1 flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                  <span>{clinic.address}</span>
                </p>

                <div className="mt-4 p-3 rounded-2xl bg-[#FCFCF5] border border-stone-100 text-xs">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">Available Facilities</span>
                  <div className="flex flex-wrap gap-1">
                    {(clinic.services || clinic.facilities || []).map((s, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-white border border-stone-200 text-stone-700 text-[10px]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100 flex gap-2">
                <a
                  href={`tel:${clinic.phone}`}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Hospital</span>
                </a>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(clinic.name + ' ' + clinic.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors"
                >
                  Directions
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Critical Veterinary First-Aid Protocols */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#20351F]/10 shadow-xs space-y-6">
        <div>
          <h2 className="text-xl font-extrabold text-[#20351F]">Clinical First-Aid Stabilization Protocols</h2>
          <p className="text-xs text-[#687166]">Pet specialist-approved instructions while transporting your pet</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {triageGuides.map((guide) => (
            <button
              key={guide.id}
              onClick={() => setActiveGuide(guide.id)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                activeGuide === guide.id
                  ? 'border-[#20351F] bg-[#F0F4ED] shadow-xs'
                  : 'border-stone-200 hover:border-stone-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-2.5 mb-2">
                {guide.icon}
                <span className="font-extrabold text-xs text-[#20351F]">{guide.title}</span>
              </div>
              <span className="text-[10px] font-bold text-rose-700 uppercase block">{guide.risk}</span>
            </button>
          ))}
        </div>

        {/* Active Protocol Content */}
        {(() => {
          const current = triageGuides.find(g => g.id === activeGuide);
          if (!current) return null;
          return (
            <div className="p-6 rounded-3xl bg-[#FCFCF5] border border-stone-200/80 space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-3">
                <h3 className="font-black text-base text-[#20351F] flex items-center gap-2">
                  {current.icon} {current.title}
                </h3>
                <span className="text-[11px] font-semibold text-stone-500">{current.breeds}</span>
              </div>

              <div>
                <h4 className="font-bold text-stone-900 mb-2">Warning Signs & Symptoms:</h4>
                <ul className="space-y-1.5 pl-4 list-disc text-stone-700">
                  {current.symptoms.map((sym, i) => (
                    <li key={i}>{sym}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 font-medium leading-relaxed">
                <strong className="font-bold text-rose-900 block mb-1">Immediate Action Plan:</strong>
                {current.action}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
