import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  Calendar,
  AlertTriangle,
  Stethoscope,
  Scissors,
  Home,
  ShoppingBag,
  Sparkles,
  Clock,
  ShieldCheck,
  Video,
  Pill,
  Syringe,
  Lock,
  LogIn,
  UserCheck,
  X,
  Bell,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { usePet } from '../context/PetContext.jsx';
import api from '../services/api.js';

export const DashboardPage = () => {
  const { user } = useAuth();
  const { selectedPet, pets, vaccinations, medicines, recordMedicineDose } = usePet();
  const navigate = useNavigate();

  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [pendingActionDesc, setPendingActionDesc] = useState('');
  const [doseTaken, setDoseTaken] = useState(false);

  // If user is administrator, navigate directly to Admin Console
  useEffect(() => {
    if (user?.role === 'admin') {
      const lastAdmin = localStorage.getItem('petcare_last_admin_path') || '/admin';
      navigate(lastAdmin, { replace: true });
    }
  }, [user, navigate]);

  const fetchBookings = async () => {
    if (!user || user.role === 'admin') return;
    try {
      const res = await api.get('/bookings');
      if (res.data?.success) {
        setUpcomingBookings(res.data.data);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchBookings();

    // Auto-update dashboard bookings in real time without page refresh
    const handleDataUpdate = () => {
      fetchBookings();
    };
    window.addEventListener('petcare_data_updated', handleDataUpdate);
    window.addEventListener('storage', handleDataUpdate);

    return () => {
      window.removeEventListener('petcare_data_updated', handleDataUpdate);
      window.removeEventListener('storage', handleDataUpdate);
    };
  }, [user]);

  // Determine if user has pets
  const hasUserPets = Boolean(user && pets.length > 0);
  const isNewUserWithoutPets = Boolean(user && pets.length === 0);

  // Strictly show active pet ONLY when user has registered a pet
  const activePet = hasUserPets ? (selectedPet || pets[0]) : null;
  const activeVaccinations = hasUserPets ? vaccinations : [];
  const activeBookings = upcomingBookings;

  // Today's date string YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  // Video consultations booked by the user
  const videoBookings = upcomingBookings.filter(
    (b) =>
      b.status === 'confirmed' &&
      (b.type === 'pet_video' ||
        b.type === 'vet_video' ||
        b.serviceType === 'pet_video' ||
        b.serviceType === 'vet_video' ||
        b.serviceName?.toLowerCase().includes('video') ||
        b.videoMeetingUrl)
  );
  // Earliest upcoming or today's video booking
  const upcomingVideoBooking = videoBookings
    .filter((b) => b.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  // Next non-video appointment if available
  const otherUpcomingAppt = upcomingBookings
    .filter(
      (b) =>
        b.status === 'confirmed' &&
        b.date >= todayStr &&
        !(
          b.type === 'pet_video' ||
          b.type === 'vet_video' ||
          b.serviceType === 'pet_video' ||
          b.serviceType === 'vet_video' ||
          b.serviceName?.toLowerCase().includes('video')
        )
    )
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  // Check for vaccinations due soon (only if active pet exists)
  const rabiesVaccine = activePet && activeVaccinations.find(v => v.name.toLowerCase().includes('rabies'));
  const isRabiesDueSoon = Boolean(rabiesVaccine && rabiesVaccine.status === 'due_soon');

  // Intercept any protected activity if user is signed out
  const handleProtectedAction = (e, destination, actionName) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!user) {
      setPendingActionDesc(actionName || 'perform this activity');
      setLoginModalOpen(true);
      return;
    }
    if (destination) {
      navigate(destination);
    }
  };

  const handleMedicationClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      setPendingActionDesc('record a medication dose');
      setLoginModalOpen(true);
      return;
    }
    // Records the dose against the pet's first active medication. The
    // hard-coded seed id 'med_1' no longer exists once records live in
    // MongoDB, so the id is resolved from the loaded schedule instead.
    const activeMedicine = medicines.find((m) => m.status === 'active') || medicines[0];
    if (!activeMedicine) {
      console.warn('No medication schedule found for this pet.');
      return;
    }

    try {
      await recordMedicineDose(activeMedicine._id, 'taken');
      setDoseTaken(true);
    } catch (err) {
      console.error('Failed to log dose:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Greeting & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#78936D] mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Pet Health & Wellness Command</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#20351F] tracking-tight">
            {user
              ? activePet
                ? `Welcome back, ${user.name || user.user?.name || 'Pet Parent'} & ${activePet.name}`
                : `Welcome to PetCare, ${user.name || user.user?.name || 'Pet Parent'}`
              : `Welcome to PetCare`}
          </h1>
          <p className="text-sm text-[#687166] mt-0.5">
            {isNewUserWithoutPets
              ? "Start by adding your pet to unlock customized care, vaccine tracking, and medical records."
              : "Everything your pet family needs today is monitored and up to date."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={(e) => handleProtectedAction(e, '/booking', 'book an appointment')}
            className="px-4 py-2.5 rounded-2xl bg-[#20351F] hover:bg-[#152414] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <Stethoscope className="w-4 h-4 text-[#DCE7D5]" />
            <span>Book Appointment</span>
          </button>
          <button
            onClick={(e) => handleProtectedAction(e, '/ai-assistant', 'consult the AI Pet Assistant')}
            className="px-4 py-2.5 rounded-2xl bg-[#DCE7D5] hover:bg-[#cbdec3] text-[#20351F] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#C8643D]" />
            <span>Ask AI Pet Assistant</span>
          </button>
        </div>
      </div>

      {/* Urgent Rabies Due Soon Banner */}
      {isRabiesDueSoon && activePet && (
        <div className="p-4 sm:p-5 rounded-3xl bg-amber-50 border border-amber-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-amber-200/70 text-amber-900 text-[10px] font-extrabold uppercase tracking-wide">
                  Action Required
                </span>
                <span className="text-xs text-amber-900/80 font-medium">Due in 4 Days</span>
              </div>
              <h3 className="text-sm font-bold text-amber-950 mt-1">
                {activePet.name}’s Rabies Booster Vaccination is Due Soon
              </h3>
              <p className="text-xs text-amber-800/90 leading-relaxed mt-0.5 max-w-2xl">
                Current immunity is expiring soon. Schedule a quick clinic visit with a certified pet specialist.
              </p>
            </div>
          </div>
          <button
            onClick={(e) => handleProtectedAction(e, '/booking', 'schedule a vaccination booster')}
            className="px-4 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            Schedule Booster Now →
          </button>
        </div>
      )}

      {/* Active Pet Snapshot Card OR New User Add Pet Onboarding Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {activePet ? (
          /* Main Pet Profile Spotlight when a pet is registered */
          <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-[#20351F]/10 shadow-xs flex flex-col justify-between relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    src={activePet.avatar}
                    alt={activePet.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover ring-4 ring-[#DCE7D5]"
                  />
                  <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#20351F] text-white flex items-center justify-center text-xs">
                    🐾
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-black text-[#20351F]">{activePet.name}</h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#F0F4ED] text-[#20351F] text-xs font-bold">
                      {activePet.gender}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[#687166] mt-0.5">
                    {activePet.breed} · {activePet.species} · {activePet.weight} kg
                  </p>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#78936D]" />
                    Microchip: <span className="font-mono font-medium">{activePet.microchipNumber || 'Chipped'}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={(e) => handleProtectedAction(e, '/pets', 'view pet medical records')}
                className="px-3.5 py-2 rounded-xl bg-[#F0F4ED] hover:bg-[#DCE7D5] text-[#20351F] text-xs font-bold transition-colors cursor-pointer"
              >
                View Full Medical Passport
              </button>
            </div>

            {/* Allergies & Key Medical Conditions */}
            <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] uppercase font-bold tracking-wider text-rose-700 block mb-1.5">
                  ⚠️ Known Allergies
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activePet.allergies && activePet.allergies.length > 0 ? (
                    activePet.allergies.map((allergy, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold"
                      >
                        {allergy}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-stone-500 font-medium">No recorded allergies</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[11px] uppercase font-bold tracking-wider text-[#78936D] block mb-1.5">
                  Primary Care Pet Specialist
                </span>
                <p className="text-xs font-bold text-[#20351F]">
                  {activePet.primaryVet?.name || 'Dr. Elena Alvarez'}
                </p>
                <p className="text-[11px] text-[#687166]">
                  {activePet.primaryVet?.clinic || 'Meadowbrook Pet Clinic'} · {activePet.primaryVet?.phone || '(555) 234-5678'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Dedicated Onboarding Spotlight Card for new user with 0 pets */
          <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white via-[#FBFBF6] to-[#F0F4ED] border border-[#20351F]/15 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#78936D] mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Pet Registration Required</span>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#20351F] text-white flex items-center justify-center shrink-0 text-2xl shadow-xs">
                  🐾
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-black text-[#20351F]">
                    You haven&apos;t registered any pets yet
                  </h2>
                  <p className="text-xs sm:text-sm text-[#687166] leading-relaxed max-w-xl">
                    Register your companion in <strong>My Pets</strong> to manage their health passport, vaccination reminders, daily medications, and appointment bookings. You can choose from our 5 preset pet photos or upload your pet&apos;s own photo from your device.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-white border border-stone-200/80">
                  <span className="text-base">📋</span>
                  <h4 className="text-xs font-bold text-[#20351F] mt-1">Digital Passport</h4>
                  <p className="text-[11px] text-[#687166]">Breed, weight & microchip history</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-stone-200/80">
                  <span className="text-base">💉</span>
                  <h4 className="text-xs font-bold text-[#20351F] mt-1">Vaccine Tracker</h4>
                  <p className="text-[11px] text-[#687166]">Booster alerts & dates</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-stone-200/80">
                  <span className="text-base">🩺</span>
                  <h4 className="text-xs font-bold text-[#20351F] mt-1">Care & Consultations</h4>
                  <p className="text-[11px] text-[#687166]">Online video rooms & clinic visits</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-stone-200/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <span className="text-xs font-medium text-stone-500">Go to My Pets to register your pet</span>
              <button
                onClick={() => navigate('/pets?action=add-pet')}
                className="px-5 py-2.5 rounded-2xl bg-[#20351F] hover:bg-[#152414] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#DCE7D5]" />
                <span>+ Add Your First Pet Now</span>
              </button>
            </div>
          </div>
        )}

        {/* Today's Medication & Routine Card */}
        <div className="p-6 rounded-3xl bg-[#FBFBF6] border border-[#20351F]/10 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-sm text-[#20351F] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#78936D]" /> Today’s Care Schedule
              </h3>
              <span className="text-[11px] font-semibold text-[#687166]">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>

            <div className="space-y-3">
              {/* Daily Medication Slot (shown if active pet exists) */}
              {activePet ? (
                <div
                  onClick={(e) => handleProtectedAction(e, '/pets', 'view pet medications')}
                  className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-[#78936D] transition-colors cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                        <Pill className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#20351F]">Apoquel (Oclacitinib)</h4>
                        <p className="text-[11px] text-[#687166]">16 mg with breakfast (Once daily)</p>
                      </div>
                    </div>
                    <button
                      onClick={handleMedicationClick}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-colors cursor-pointer shrink-0 ${
                        doseTaken
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {doseTaken ? 'Taken ✓' : 'Mark Taken ✓'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-white border border-dashed border-stone-300 text-center">
                  <Pill className="w-5 h-5 text-stone-400 mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-stone-700">No Medications Scheduled</p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Register your pet in My Pets to set up daily medicines and doses.
                  </p>
                </div>
              )}

              {/* Video Consultation / Appointment Slot */}
              {upcomingVideoBooking ? (
                upcomingVideoBooking.date === todayStr ? (
                  /* User's appointment date IS TODAY: Show Join Video Room Section */
                  <div className="p-3.5 rounded-2xl bg-[#20351F] text-white shadow-xs animate-in fade-in">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-400/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        Today · {upcomingVideoBooking.timeSlot}
                      </span>
                      <Video className="w-3.5 h-3.5 text-emerald-300" />
                    </div>
                    <h4 className="text-xs font-bold text-white">
                      {upcomingVideoBooking.serviceName || 'Pet Video Consultation'}
                    </h4>
                    <p className="text-[11px] text-[#DCE7D5]/80">
                      With {upcomingVideoBooking.providerName} ({upcomingVideoBooking.providerClinicOrBusiness})
                    </p>
                    <button
                      onClick={(e) =>
                        handleProtectedAction(
                          e,
                          `/video-room?bookingId=${upcomingVideoBooking._id}`,
                          'join pet video consultation'
                        )
                      }
                      className="mt-2.5 w-full text-center py-2 px-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-[#20351F] text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Video className="w-3.5 h-3.5 text-[#20351F]" />
                      Join Video Room →
                    </button>
                  </div>
                ) : (
                  /* User's appointment is in the future: Show Reminder in place of Join Video Room */
                  <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-stone-800 shadow-2xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Bell className="w-3 h-3 text-amber-700" />
                        Reminder · Upcoming Consultation
                      </span>
                      <span className="text-[10px] font-bold text-amber-900">
                        {upcomingVideoBooking.date}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-[#20351F]">
                      {upcomingVideoBooking.serviceName || 'Pet Video Consultation'}
                    </h4>
                    <p className="text-[11px] text-stone-600">
                      With {upcomingVideoBooking.providerName} · {upcomingVideoBooking.timeSlot}
                    </p>
                    <div className="mt-2.5 w-full text-center py-1.5 px-3 rounded-xl bg-amber-100/80 text-amber-900 text-[11px] font-semibold flex items-center justify-center gap-1.5">
                      <Clock className="w-3 h-3 text-amber-700" />
                      <span>Video room opens on {upcomingVideoBooking.date}</span>
                    </div>
                  </div>
                )
              ) : otherUpcomingAppt ? (
                /* No video consultation, but another confirmed care booking exists */
                <div className="p-3.5 rounded-2xl bg-[#F0F4ED] border border-[#20351F]/15 text-[#20351F] shadow-2xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-[#20351F]/10 text-[#20351F] text-[10px] font-bold uppercase tracking-wider">
                      {otherUpcomingAppt.date === todayStr
                        ? `Today · ${otherUpcomingAppt.timeSlot}`
                        : `${otherUpcomingAppt.date} · ${otherUpcomingAppt.timeSlot}`}
                    </span>
                    <Calendar className="w-3.5 h-3.5 text-[#20351F]" />
                  </div>
                  <h4 className="text-xs font-bold text-[#20351F]">{otherUpcomingAppt.serviceName}</h4>
                  <p className="text-[11px] text-[#687166]">With {otherUpcomingAppt.providerName}</p>
                  <button
                    onClick={(e) => handleProtectedAction(e, '/booking', 'view appointments')}
                    className="mt-2.5 w-full text-center py-1.5 px-3 rounded-xl bg-white text-[#20351F] border border-stone-200 text-xs font-bold hover:bg-stone-50 transition-colors cursor-pointer"
                  >
                    View Care Appointment →
                  </button>
                </div>
              ) : (
                /* No appointments booked yet */
                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 text-stone-700">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                      Pet Telehealth & Clinic
                    </span>
                    <Stethoscope className="w-3.5 h-3.5 text-[#78936D]" />
                  </div>
                  <h4 className="text-xs font-bold text-[#20351F]">Need a Pet Consultation?</h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Schedule a video telehealth session or clinic visit with a specialist.
                  </p>
                  <button
                    onClick={(e) => handleProtectedAction(e, '/booking', 'book pet consultation')}
                    className="mt-2 w-full text-center py-1.5 px-3 rounded-xl bg-[#20351F] text-white text-xs font-bold hover:bg-[#152414] transition-colors cursor-pointer"
                  >
                    Book Pet Appointment →
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200/60 mt-4 text-center">
            <button
              onClick={(e) => handleProtectedAction(e, '/calendar', 'view the care calendar')}
              className="text-xs font-bold text-[#20351F] hover:underline cursor-pointer"
            >
              Open Care Calendar & Reminders →
            </button>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Cards (6 Pillars) */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#687166] mb-3">
          Quick Care Hub
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <button
            onClick={(e) => handleProtectedAction(e, '/booking', 'access pet care booking')}
            className="p-4 rounded-2xl bg-white border border-[#20351F]/10 hover:border-[#78936D] shadow-2xs hover:shadow-md transition-all flex flex-col items-center text-center group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-2xl bg-[#F0F4ED] text-[#20351F] group-hover:scale-110 flex items-center justify-center mb-2.5 transition-transform">
              <Stethoscope className="w-5 h-5 text-[#20351F]" />
            </div>
            <span className="text-xs font-bold text-[#20351F] leading-tight">Pet Specialists</span>
            <span className="text-[10px] text-[#687166] mt-0.5">Clinic & Video</span>
          </button>

          <button
            onClick={(e) => handleProtectedAction(e, '/booking', 'book pet grooming')}
            className="p-4 rounded-2xl bg-white border border-[#20351F]/10 hover:border-[#78936D] shadow-2xs hover:shadow-md transition-all flex flex-col items-center text-center group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-800 group-hover:scale-110 flex items-center justify-center mb-2.5 transition-transform">
              <Scissors className="w-5 h-5 text-amber-700" />
            </div>
            <span className="text-xs font-bold text-[#20351F] leading-tight">Pet Grooming</span>
            <span className="text-[10px] text-[#687166] mt-0.5">Salon & Mobile</span>
          </button>

          <button
            onClick={(e) => handleProtectedAction(e, '/booking', 'book pet sitting')}
            className="p-4 rounded-2xl bg-white border border-[#20351F]/10 hover:border-[#78936D] shadow-2xs hover:shadow-md transition-all flex flex-col items-center text-center group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-800 group-hover:scale-110 flex items-center justify-center mb-2.5 transition-transform">
              <Home className="w-5 h-5 text-emerald-700" />
            </div>
            <span className="text-xs font-bold text-[#20351F] leading-tight">Pet Sitting</span>
            <span className="text-[10px] text-[#687166] mt-0.5">Boarding & Walks</span>
          </button>

          <button
            onClick={() => navigate('/store')}
            className="p-4 rounded-2xl bg-white border border-[#20351F]/10 hover:border-[#78936D] shadow-2xs hover:shadow-md transition-all flex flex-col items-center text-center group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-800 group-hover:scale-110 flex items-center justify-center mb-2.5 transition-transform">
              <ShoppingBag className="w-5 h-5 text-[#C8643D]" />
            </div>
            <span className="text-xs font-bold text-[#20351F] leading-tight">Pet Supplies</span>
            <span className="text-[10px] text-[#687166] mt-0.5">Food, Gear & Pets</span>
          </button>

          <button
            onClick={(e) => handleProtectedAction(e, '/ai-assistant', 'consult the AI Pet Advisor')}
            className="p-4 rounded-2xl bg-[#DCE7D5]/40 border border-[#78936D]/30 hover:border-[#78936D] shadow-2xs hover:shadow-md transition-all flex flex-col items-center text-center group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-2xl bg-[#DCE7D5] text-[#20351F] group-hover:scale-110 flex items-center justify-center mb-2.5 transition-transform">
              <Sparkles className="w-5 h-5 text-[#C8643D]" />
            </div>
            <span className="text-xs font-bold text-[#20351F] leading-tight">AI Pet Advisor</span>
            <span className="text-[10px] text-[#687166] mt-0.5">Instant Guidance</span>
          </button>

          <button
            onClick={() => navigate('/emergency')}
            className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200 hover:border-rose-400 shadow-2xs hover:shadow-md transition-all flex flex-col items-center text-center group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-800 group-hover:scale-110 flex items-center justify-center mb-2.5 transition-transform">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <span className="text-xs font-bold text-rose-900 leading-tight">Emergency SOS</span>
            <span className="text-[10px] text-rose-700/80 mt-0.5">24/7 Trauma ICU</span>
          </button>
        </div>
      </div>

      {/* Vaccination Status & Appointments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Immunization Summary */}
        <div className="p-6 rounded-3xl bg-white border border-[#20351F]/10 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-base text-[#20351F] flex items-center gap-2">
                <Syringe className="w-4 h-4 text-[#78936D]" /> Vaccination Tracker
              </h3>
              <p className="text-xs text-[#687166]">
                {activePet ? `Immunization records for ${activePet.name}` : 'Pet Immunization Records'}
              </p>
            </div>
            <button
              onClick={(e) => handleProtectedAction(e, '/pets', 'view all vaccination records')}
              className="text-xs font-bold text-[#78936D] hover:underline cursor-pointer"
            >
              View All →
            </button>
          </div>

          {activeVaccinations.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {activeVaccinations.slice(0, 4).map((vac) => {
                const isUpToDate = vac.status === 'up_to_date';
                const isDueSoon = vac.status === 'due_soon';

                return (
                  <div key={vac._id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-[#20351F]">{vac.name}</h4>
                      <p className="text-[11px] text-[#687166]">
                        Next due: <span className="font-medium text-slate-800">{vac.nextDueDate}</span>
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isUpToDate
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : isDueSoon
                          ? 'bg-amber-50 text-amber-800 border border-amber-300'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {isUpToDate ? 'Up to date' : isDueSoon ? 'Due Soon' : 'Overdue'}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Syringe className="w-8 h-8 text-stone-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-stone-700">No Vaccination Records Yet</p>
              <p className="text-[11px] text-stone-500 mt-0.5 max-w-xs mx-auto">
                {activePet
                  ? `Add core immunization or booster records for ${activePet.name}.`
                  : 'Register your pet to track core vaccines and booster reminders.'}
              </p>
              <button
                onClick={(e) => handleProtectedAction(e, '/pets', 'add vaccination record')}
                className="mt-3 px-3.5 py-1.5 rounded-xl bg-[#20351F] text-white text-[11px] font-bold hover:bg-[#152414] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#DCE7D5]" />
                <span>Add Vaccine Record</span>
              </button>
            </div>
          )}
        </div>

        {/* Active Appointments */}
        <div className="p-6 rounded-3xl bg-white border border-[#20351F]/10 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-base text-[#20351F] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#78936D]" /> Upcoming Care Bookings
              </h3>
              <p className="text-xs text-[#687166]">Confirmed pet care & groomer visits</p>
            </div>
            <button
              onClick={(e) => handleProtectedAction(e, '/booking', 'manage bookings')}
              className="text-xs font-bold text-[#78936D] hover:underline cursor-pointer"
            >
              Manage →
            </button>
          </div>

          {activeBookings.length > 0 ? (
            <div className="space-y-3">
              {activeBookings.map((b) => (
                <div
                  key={b._id}
                  className="p-3.5 rounded-2xl bg-[#F0F4ED]/50 border border-[#78936D]/20 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-[#20351F] flex items-center justify-center font-bold text-xs shrink-0">
                      {(b.type.includes('pet') || b.type.includes('vet')) ? '🩺' : b.type === 'grooming' ? '✂️' : '🏡'}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#20351F]">{b.serviceName}</h4>
                      <p className="text-[11px] text-[#687166]">
                        {b.providerName} · {b.date} at {b.timeSlot}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleProtectedAction(e, '/booking', 'manage appointment')}
                    className="px-3 py-1.5 rounded-xl bg-[#20351F] text-white text-xs font-bold hover:bg-[#152414] transition-colors cursor-pointer"
                  >
                    Manage
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Calendar className="w-8 h-8 text-stone-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-stone-700">No Care Bookings Scheduled</p>
              <p className="text-[11px] text-stone-500 mt-0.5 max-w-xs mx-auto">
                Schedule a certified clinic visit, online video consultation, or grooming session.
              </p>
              <button
                onClick={(e) => handleProtectedAction(e, '/booking', 'book an appointment')}
                className="mt-3 px-3.5 py-1.5 rounded-xl bg-[#20351F] text-white text-[11px] font-bold hover:bg-[#152414] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#DCE7D5]" />
                <span>Book Care Appointment</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Login Required Popup Modal */}
      {loginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-5 animate-in zoom-in-95">
            <button
              onClick={() => setLoginModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#20351F] text-white flex items-center justify-center shadow-sm shrink-0">
                <Lock className="w-6 h-6 text-[#DCE7D5]" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold uppercase tracking-wide">
                  Authentication Required
                </span>
                <h3 className="text-lg font-black text-[#20351F] mt-0.5">
                  Sign In to Continue
                </h3>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              To {pendingActionDesc || 'access pet medical passports, book appointments, or consult with our AI pet health assistant'}, please sign in or register your Pet Parent account.
            </p>

            <div className="space-y-2.5 pt-1">
              <button
                onClick={() => {
                  setLoginModalOpen(false);
                  navigate('/login');
                }}
                className="w-full py-3 rounded-2xl bg-[#20351F] hover:bg-[#152414] text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Go to Sign In & Register Page</span>
              </button>

              <button
                onClick={() => setLoginModalOpen(false)}
                className="w-full py-2 text-xs font-semibold text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
              >
                Continue Browsing as Guest
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
