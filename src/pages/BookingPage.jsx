import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Stethoscope,
  Scissors,
  Home,
  Calendar,
  Clock,
  Star,
  MapPin,
  CheckCircle,
  Video,
  X,
  Sparkles,
  ShieldCheck,
  Tag,
  ArrowRight,
  Plus,
  Heart,
  Bell,
  AlertCircle
} from 'lucide-react';
import api from '../services/api.js';
import { usePet } from '../context/PetContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// Standard 1-hour time slots including the requested 1:00 PM - 02:00 PM slot
export const AVAILABLE_TIME_SLOTS = [
  '09:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '01:00 PM - 02:00 PM',
  '02:00 PM - 03:00 PM',
  '03:00 PM - 04:00 PM',
  '04:00 PM - 05:00 PM',
  '05:00 PM - 06:00 PM'
];

export const BookingPage = () => {
  const { user } = useAuth();
  const { pets, selectedPet } = usePet();
  const { success, error: toastError } = useToast();

  const todayStr = new Date().toISOString().split('T')[0];

  const [activeTab, setActiveTab] = useState('specialists');
  const [specialists, setSpecialists] = useState([]);
  const [groomers, setGroomers] = useState([]);
  const [sitters, setSitters] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick Book Form state
  const [quickServiceType, setQuickServiceType] = useState('pet_video');
  const [quickPetName, setQuickPetName] = useState(selectedPet?.name || 'Milo');
  const [quickDate, setQuickDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [quickTime, setQuickTime] = useState(AVAILABLE_TIME_SLOTS[0]);
  const [quickReason, setQuickReason] = useState('Routine wellness checkup');
  const [quickSubmitting, setQuickSubmitting] = useState(false);
  const [quickBookedSlots, setQuickBookedSlots] = useState([]);

  // Provider Detail / Booking Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [modalCategory, setModalCategory] = useState('specialist');
  const [bookingPetId, setBookingPetId] = useState(selectedPet?._id || '');
  const [customPetName, setCustomPetName] = useState(selectedPet?.name || 'Buddy');
  const [consultMode, setConsultMode] = useState('pet_video');
  const [selectedService, setSelectedService] = useState('');
  const [bookingDate, setBookingDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState(AVAILABLE_TIME_SLOTS[0]);
  const [bookingReason, setBookingReason] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalBookedSlots, setModalBookedSlots] = useState([]);

  // Helper function to detect whether candidate slot conflicts with already booked slots
  const isSlotBooked = (candidateSlot, bookedList) => {
    if (!bookedList || bookedList.length === 0) return false;

    const normalize = (s) => {
      let norm = s.toLowerCase().trim();
      norm = norm.replace(/\s+/g, ' ');
      // extract hour and period
      const match = norm.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/);
      if (match) {
        let hour = parseInt(match[1], 10);
        const period = match[3];
        if (period === 'pm' && hour < 12) hour += 12;
        if (period === 'am' && hour === 12) hour = 0;
        return `${hour}`;
      }
      return norm;
    };

    const targetHour = normalize(candidateSlot);
    return bookedList.some((booked) => {
      const bHour = normalize(booked);
      if (bHour === targetHour) return true;
      // Handle ranges like "1 to 2 pm"
      if (candidateSlot.includes('01:00 PM') && (booked.includes('1:00') || booked.includes('1 to 2') || booked.includes('01:00'))) return true;
      if (candidateSlot.includes('02:00 PM') && (booked.includes('2:00') || booked.includes('2 to 3') || booked.includes('02:00'))) return true;
      if (candidateSlot.includes('03:00 PM') && (booked.includes('3:00') || booked.includes('3 to 4') || booked.includes('03:00'))) return true;
      if (candidateSlot.includes('04:00 PM') && (booked.includes('4:00') || booked.includes('4 to 5') || booked.includes('04:00'))) return true;
      if (candidateSlot.includes('05:00 PM') && (booked.includes('5:00') || booked.includes('5 to 6') || booked.includes('05:00'))) return true;
      if (candidateSlot.includes('09:00 AM') && (booked.includes('9:00') || booked.includes('9 to 10') || booked.includes('09:00'))) return true;
      if (candidateSlot.includes('10:00 AM') && (booked.includes('10:00') || booked.includes('10 to 11'))) return true;
      if (candidateSlot.includes('11:00 AM') && (booked.includes('11:00') || booked.includes('11 to 12'))) return true;
      return false;
    });
  };

  // Fetch booked slots for a given date and provider
  const fetchBookedSlots = useCallback(async (date, providerId) => {
    try {
      const res = await api.get('/bookings/booked-slots', {
        params: { date, providerId: providerId || 'any' }
      });
      if (res.data?.success) {
        return (res.data.bookedSlots || res.data.data || []);
      }
    } catch {
      // ignore
    }
    return [];
  }, []);

  // Update quick booked slots whenever quickDate changes
  useEffect(() => {
    if (quickDate) {
      fetchBookedSlots(quickDate).then((slots) => {
        setQuickBookedSlots(slots);
        // If current selected time is booked, pick first available
        if (isSlotBooked(quickTime, slots)) {
          const firstFree = AVAILABLE_TIME_SLOTS.find((s) => !isSlotBooked(s, slots));
          if (firstFree) setQuickTime(firstFree);
        }
      });
    }
  }, [quickDate, fetchBookedSlots]);

  // Update modal booked slots whenever modal is opened, date, or provider changes
  useEffect(() => {
    if (isModalOpen && bookingDate) {
      fetchBookedSlots(bookingDate, selectedProvider?._id).then((slots) => {
        setModalBookedSlots(slots);
        if (isSlotBooked(selectedSlot, slots)) {
          const firstFree = AVAILABLE_TIME_SLOTS.find((s) => !isSlotBooked(s, slots));
          if (firstFree) setSelectedSlot(firstFree);
        }
      });
    }
  }, [isModalOpen, bookingDate, selectedProvider, fetchBookedSlots]);

  // Load all providers & user bookings
  const loadProviders = async () => {
    try {
      setLoading(true);
      const [specialistsRes, groomersRes, sittersRes, bookingsRes] = await Promise.all([
        api.get('/pet-specialists').catch(() => api.get('/vets')),
        api.get('/groomers'),
        api.get('/sitters'),
        api.get('/bookings')
      ]);

      if (specialistsRes.data?.success) setSpecialists(specialistsRes.data.data);
      if (groomersRes.data?.success) setGroomers(groomersRes.data.data);
      if (sittersRes.data?.success) setSitters(sittersRes.data.data);
      if (bookingsRes.data?.success) setMyBookings(bookingsRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviders();
  }, []);

  useEffect(() => {
    if (selectedPet?._id) {
      setBookingPetId(selectedPet._id);
      setCustomPetName(selectedPet.name);
      setQuickPetName(selectedPet.name);
    } else if (pets.length > 0) {
      setBookingPetId(pets[0]._id);
      setCustomPetName(pets[0].name);
      setQuickPetName(pets[0].name);
    }
  }, [selectedPet, pets]);

  // Handle Quick Booking
  const handleQuickBook = async (e) => {
    e.preventDefault();

    // Prevent booking before today's date
    if (quickDate < todayStr) {
      toastError(`You cannot book an appointment before today (${todayStr}). Please choose today or a future date.`);
      return;
    }

    // Check slot availability
    if (isSlotBooked(quickTime, quickBookedSlots)) {
      toastError(`The time slot "${quickTime}" is already booked by another user. Please select another slot.`);
      return;
    }

    try {
      setQuickSubmitting(true);
      const payload = {
        petId: bookingPetId || undefined,
        petName: quickPetName.trim() || 'My Pet',
        type: quickServiceType,
        providerId: 'any',
        date: quickDate,
        timeSlot: quickTime,
        reason: quickReason.trim() || 'General pet service',
        serviceName:
          quickServiceType === 'pet_video'
            ? 'Pet Video Telehealth Consultation'
            : quickServiceType === 'pet_clinic'
              ? 'In-Clinic Pet Specialist Visit'
              : quickServiceType === 'grooming'
                ? 'Full Pet Grooming & Spa'
                : quickServiceType === 'pet_sitting'
                  ? 'Overnight Pet Boarding'
                  : 'Paws & Trails Dog Walking (45 min)'
      };

      const res = await api.post('/bookings', payload);
      if (res.data?.success) {
        window.dispatchEvent(new CustomEvent('petcare_data_updated', { detail: { type: 'booking' } }));
        localStorage.setItem('petcare_last_sync', Date.now().toString());
        success('Appointment booked successfully! Added to your schedule.', 'Booking Confirmed');
        await loadProviders();
        // Refresh booked slots
        const updatedSlots = await fetchBookedSlots(quickDate);
        setQuickBookedSlots(updatedSlots);
        setActiveTab('my-bookings');
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to book appointment. Please try again.');
    } finally {
      setQuickSubmitting(false);
    }
  };

  // Open modal for a specific provider
  const openProviderModal = (provider, category) => {
    setSelectedProvider(provider);
    setModalCategory(category);
    if (category === 'specialist') {
      setConsultMode('pet_video');
      setSelectedService('Pet Video Consultation');
      setSelectedSlot(AVAILABLE_TIME_SLOTS[0]);
    } else if (category === 'groomer') {
      const firstSrv = provider.services?.[0];
      setSelectedService(firstSrv ? firstSrv.name : 'Bath & Brush Deluxe');
      setSelectedSlot(AVAILABLE_TIME_SLOTS[0]);
    } else if (category === 'walker') {
      setSelectedService('Paws & Trails Dog Walking (45 min)');
      setSelectedSlot('09:00 AM - 10:00 AM');
    } else {
      const firstSrv = provider.services?.[0];
      setSelectedService(firstSrv ? firstSrv.name : 'Overnight Pet Boarding');
      setSelectedSlot('09:00 AM - 10:00 AM');
    }
    setIsModalOpen(true);
  };

  // Submit modal booking
  const handleModalBooking = async (e) => {
    e.preventDefault();

    // Prevent booking before today's date
    if (bookingDate < todayStr) {
      toastError(`You cannot book an appointment before today (${todayStr}). Please choose today or a future date.`);
      return;
    }

    if (!selectedSlot) {
      toastError('Please choose an available time slot.');
      return;
    }

    // Check slot availability
    if (isSlotBooked(selectedSlot, modalBookedSlots)) {
      toastError(`The time slot "${selectedSlot}" has already been booked by another user for this date. Please select another slot.`);
      return;
    }

    try {
      setIsSubmitting(true);
      const bookingType =
        modalCategory === 'specialist'
          ? consultMode
          : modalCategory === 'groomer'
            ? 'grooming'
            : modalCategory === 'walker'
              ? 'dog_walking'
              : 'pet_sitting';

      const payload = {
        petId: bookingPetId || undefined,
        petName: customPetName.trim() || 'My Pet',
        type: bookingType,
        providerId: selectedProvider?._id || 'any',
        date: bookingDate,
        timeSlot: selectedSlot,
        reason: bookingReason.trim() || 'General pet service',
        serviceName: selectedService || 'Standard Pet Care Service',
        promoCode: promoCode.trim() || undefined
      };

      const res = await api.post('/bookings', payload);
      if (res.data?.success) {
        window.dispatchEvent(new CustomEvent('petcare_data_updated', { detail: { type: 'booking' } }));
        localStorage.setItem('petcare_last_sync', Date.now().toString());
        success('Your appointment has been confirmed!', 'Booking Confirmed');
        setIsModalOpen(false);
        setBookingReason('');
        setPromoCode('');
        await loadProviders();
        setActiveTab('my-bookings');
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Could not complete booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel Booking
  const handleCancelBooking = async (id) => {
    try {
      const res = await api.patch(`/bookings/${id}`, { status: 'cancelled' });
      if (res.data?.success) {
        success('Appointment cancelled.', 'Cancelled');
        await loadProviders();
        window.dispatchEvent(new CustomEvent('petcare_data_updated', { detail: { type: 'booking' } }));
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to cancel appointment.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* HEADER BANNER */}
      <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-r from-[#20351F] to-[#2C482A] text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-300 text-[11px] font-bold tracking-wider uppercase inline-block mb-2">
            Verified Pet Care Network
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Book Pet Care & Consultations</h1>
          <p className="text-sm text-[#DCE7D5] max-w-xl mt-1">
            Reserve certified pet specialists, top-rated groomers, and loving sitters. Real-time conflict checking prevents double bookings.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
          <ShieldCheck className="w-8 h-8 text-emerald-300 shrink-0" />
          <div className="text-xs">
            <span className="font-bold block text-white">100% Certified Network</span>
            <span className="text-[#DCE7D5]/80 text-[11px]">Identity & license checked</span>
          </div>
        </div>
      </div>

      {/* QUICK APPOINTMENT RESERVATION BAR */}
      <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Instant Pet Care Booking</span>
          </h3>
          <span className="text-[11px] text-stone-500">
            Current Date: <strong>{todayStr}</strong> (Past dates disabled)
          </span>
        </div>

        <form onSubmit={handleQuickBook} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Service Selector */}
          <div>
            <label className="block font-bold text-stone-700 mb-1">Service Type</label>
            <select
              value={quickServiceType}
              onChange={(e) => setQuickServiceType(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#20351F]"
            >
              <option value="pet_video">🩺 Pet Video Telehealth ($45)</option>
              <option value="pet_clinic">🏥 In-Clinic Pet Visit ($65)</option>
              <option value="grooming">✂️ Pet Grooming & Spa ($55)</option>
              <option value="pet_sitting">🏡 Pet Sitting & Boarding ($40)</option>
              <option value="dog_walking">🦮 Dog Walking (45 min) ($25)</option>
            </select>
          </div>

          {/* Pet Name */}
          <div>
            <label className="block font-bold text-stone-700 mb-1">Pet Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Milo, Luna, Charlie"
              value={quickPetName}
              onChange={(e) => setQuickPetName(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#20351F]"
            />
          </div>

          {/* Date with strict min={todayStr} constraint */}
          <div>
            <label className="block font-bold text-stone-700 mb-1">
              Date <span className="text-emerald-700 font-normal">(Today or later)</span>
            </label>
            <input
              type="date"
              required
              min={todayStr}
              value={quickDate}
              onChange={(e) => setQuickDate(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#20351F]"
            />
          </div>

          {/* Time Slot with booked-slot conflict disabling */}
          <div>
            <label className="block font-bold text-stone-700 mb-1">Time Slot</label>
            <select
              value={quickTime}
              onChange={(e) => setQuickTime(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#20351F]"
            >
              {AVAILABLE_TIME_SLOTS.map((slot) => {
                const booked = isSlotBooked(slot, quickBookedSlots);
                return (
                  <option
                    key={slot}
                    value={slot}
                    disabled={booked}
                    className={booked ? 'text-stone-400 bg-stone-100 font-normal italic' : ''}
                  >
                    {slot} {booked ? '(Already Booked - Unavailable)' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Submit Button */}
          <div className="sm:col-span-2 lg:col-span-1 flex items-end">
            <button
              type="submit"
              disabled={quickSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-[#20351F] hover:bg-[#152414] text-white font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              {quickSubmitting ? 'Booking...' : 'Instant Confirm'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* SERVICE CATEGORY TABS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pb-2">
        <button
          onClick={() => setActiveTab('specialists')}
          className={`p-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'specialists'
              ? 'bg-[#20351F] text-white shadow-xs'
              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
            }`}
        >
          <Stethoscope className="w-4 h-4 text-emerald-500" />
          <span>Pet Specialists ({specialists.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('grooming')}
          className={`p-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'grooming'
              ? 'bg-[#20351F] text-white shadow-xs'
              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
            }`}
        >
          <Scissors className="w-4 h-4 text-amber-500" />
          <span>Pet Grooming ({groomers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sitting')}
          className={`p-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'sitting'
              ? 'bg-[#20351F] text-white shadow-xs'
              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
            }`}
        >
          <Home className="w-4 h-4 text-blue-500" />
          <span>Pet Sitting ({sitters.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('walking')}
          className={`p-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'walking'
              ? 'bg-[#20351F] text-white shadow-xs'
              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
            }`}
        >
          <MapPin className="w-4 h-4 text-indigo-500" />
          <span>Dog Walking (Daily)</span>
        </button>

        <button
          onClick={() => setActiveTab('my-bookings')}
          className={`col-span-2 sm:col-span-1 p-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'my-bookings'
              ? 'bg-[#20351F] text-white shadow-xs'
              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
            }`}
        >
          <Clock className="w-4 h-4 text-rose-500" />
          <span>My Bookings ({myBookings.length})</span>
        </button>
      </div>

      {/* 1. PET SPECIALISTS */}
      {activeTab === 'specialists' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {specialists.map((specialist) => (
            <div
              key={specialist._id}
              className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-all"
            >
              <div>
                <div className="flex items-start gap-4">
                  <img
                    src={specialist.photo}
                    alt={specialist.name}
                    className="w-16 h-16 rounded-2xl object-cover ring-1 ring-stone-200"
                  />
                  <div>
                    <h3 className="text-base font-extrabold text-[#20351F]">{specialist.name}</h3>
                    <p className="text-xs text-stone-500">{specialist.clinicName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center text-amber-500 text-xs font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-1" />
                        <span>{specialist.rating}</span>
                      </div>
                      <span className="text-[11px] text-stone-400">({specialist.reviewCount} reviews)</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 space-y-2 text-xs">
                  <p className="text-stone-600 leading-relaxed">
                    {specialist.bio || specialist.about}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(specialist.specialties || [specialist.specialty]).map((spec) => (
                      <span
                        key={spec}
                        className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[10px] font-semibold"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-bold block">Video Consult</span>
                  <span className="text-base font-black text-[#20351F]">${specialist.videoConsultationFee}</span>
                </div>
                <button
                  onClick={() => openProviderModal(specialist, 'specialist')}
                  className="px-5 py-2.5 rounded-xl bg-[#20351F] hover:bg-[#152414] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Book Appointment
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. PET GROOMING */}
      {activeTab === 'grooming' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groomers.map((groomer) => (
            <div
              key={groomer._id}
              className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-all"
            >
              <div>
                <div className="flex items-start gap-4">
                  <img
                    src={groomer.photo}
                    alt={groomer.name}
                    className="w-16 h-16 rounded-2xl object-cover ring-1 ring-stone-200"
                  />
                  <div>
                    <h3 className="text-base font-extrabold text-[#20351F]">{groomer.name}</h3>
                    <p className="text-xs text-stone-500">{groomer.businessName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center text-amber-500 text-xs font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-1" />
                        <span>{groomer.rating}</span>
                      </div>
                      <span className="text-[11px] text-stone-400">({groomer.reviewCount} reviews)</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 space-y-2 text-xs">
                  <p className="text-stone-600 leading-relaxed">{groomer.bio || groomer.about}</p>
                  <div className="space-y-1.5 mt-3">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wide block">
                      Services Available:
                    </span>
                    {groomer.services.map((srv) => (
                      <div key={srv.name} className="flex justify-between items-center text-stone-700">
                        <span>{srv.name}</span>
                        <span className="font-bold">${srv.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-bold block">Starting From</span>
                  <span className="text-base font-black text-[#20351F]">${groomer.services[0]?.price || 45}</span>
                </div>
                <button
                  onClick={() => openProviderModal(groomer, 'groomer')}
                  className="px-5 py-2.5 rounded-xl bg-[#20351F] hover:bg-[#152414] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Book Grooming
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. PET SITTING */}
      {activeTab === 'sitting' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sitters.map((sitter) => (
            <div
              key={sitter._id}
              className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-all"
            >
              <div>
                <div className="flex items-start gap-4">
                  <img
                    src={sitter.photo}
                    alt={sitter.name}
                    className="w-16 h-16 rounded-2xl object-cover ring-1 ring-stone-200"
                  />
                  <div>
                    <h3 className="text-base font-extrabold text-[#20351F]">{sitter.name}</h3>
                    <p className="text-xs text-stone-500">{sitter.experienceYears} Years Experience</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center text-amber-500 text-xs font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-1" />
                        <span>{sitter.rating}</span>
                      </div>
                      <span className="text-[11px] text-stone-400">({sitter.reviewCount} reviews)</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 space-y-2 text-xs">
                  <p className="text-stone-600 leading-relaxed">{sitter.bio || sitter.about}</p>
                  <div className="space-y-1.5 mt-3">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wide block">
                      Sitting Options:
                    </span>
                    {sitter.services.map((srv) => (
                      <div key={srv.name} className="flex justify-between items-center text-stone-700">
                        <span>{srv.name}</span>
                        <span className="font-bold">${srv.rate}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-bold block">Nightly Boarding</span>
                  <span className="text-base font-black text-[#20351F]">${sitter.services[0]?.rate || 40}</span>
                </div>
                <button
                  onClick={() => openProviderModal(sitter, 'sitter')}
                  className="px-5 py-2.5 rounded-xl bg-[#20351F] hover:bg-[#152414] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Reserve Sitter
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. DOG WALKING */}
      {activeTab === 'walking' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-indigo-50/70 border border-indigo-200/80 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-indigo-950">Daily Scheduled Dog Walking</h3>
              <p className="text-xs text-indigo-800/80 mt-1 max-w-xl">
                GPS tracked walks with route maps, water bowl replenishment, and photo updates delivered after every stroll.
              </p>
            </div>
            <MapPin className="w-10 h-10 text-indigo-500 opacity-60 shrink-0" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg">
                30m
              </div>
              <h4 className="text-base font-bold text-[#20351F]">Neighborhood Fitness Stroll</h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                Quick outdoor potty break and light exercise around your immediate neighborhood. Perfect for midday work hours.
              </p>
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                <span className="text-lg font-black text-[#20351F]">$22</span>
                <button
                  onClick={() => {
                    setSelectedProvider({ _id: 'sit_1', name: 'Marcus Vance', businessName: 'Paws & Trails Walking' });
                    openProviderModal({ _id: 'sit_1', name: 'Marcus Vance', businessName: 'Paws & Trails Walking' }, 'walker');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#20351F] text-white text-xs font-bold cursor-pointer"
                >
                  Schedule
                </button>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg">
                60m
              </div>
              <h4 className="text-base font-bold text-[#20351F]">Nature Trail Excursion</h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                Full 60 minutes of high-energy park or scenic trail hiking for active breeds. Includes paw wash & towel dry.
              </p>
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                <span className="text-lg font-black text-[#20351F]">$35</span>
                <button
                  onClick={() => {
                    setSelectedProvider({ _id: 'sit_1', name: 'Marcus Vance', businessName: 'Paws & Trails Walking' });
                    openProviderModal({ _id: 'sit_1', name: 'Marcus Vance', businessName: 'Paws & Trails Walking' }, 'walker');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#20351F] text-white text-xs font-bold cursor-pointer"
                >
                  Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. MY APPOINTMENTS */}
      {activeTab === 'my-bookings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-[#20351F]">
              Your Scheduled Appointments ({myBookings.length})
            </h3>
            <button
              onClick={() => setActiveTab('specialists')}
              className="px-4 py-2 rounded-xl bg-[#20351F] text-white text-xs font-bold cursor-pointer"
            >
              + Book Another Service
            </button>
          </div>

          {myBookings.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-stone-200 p-8">
              <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <h4 className="font-bold text-stone-700">No active appointments scheduled</h4>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                Use the quick booking bar above to reserve a pet specialist consult, grooming session, or dog walker!
              </p>
              <button
                onClick={() => setActiveTab('specialists')}
                className="mt-4 px-5 py-2.5 rounded-xl bg-[#20351F] text-white text-xs font-bold cursor-pointer"
              >
                Browse Available Providers
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myBookings.map((b) => {
                const isVideoBooking =
                  b.type === 'pet_video' ||
                  b.type === 'vet_video' ||
                  b.serviceType === 'pet_video' ||
                  b.serviceType === 'vet_video' ||
                  b.serviceName?.toLowerCase().includes('video') ||
                  Boolean(b.videoMeetingUrl);

                const isToday = b.date === todayStr;
                const isFuture = b.date > todayStr;

                return (
                  <div
                    key={b._id}
                    className="p-5 rounded-3xl bg-white border border-stone-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-[#20351F]">{b.serviceName}</span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${b.status === 'confirmed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : b.status === 'cancelled'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                        >
                          {b.status}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600">
                        <strong>Provider:</strong> {b.providerName} ({b.providerClinicOrBusiness})
                      </p>
                      <p className="text-xs text-stone-500 flex items-center gap-3">
                        <span>📅 {b.date}</span>
                        <span>⏰ {b.timeSlot}</span>
                        <span>💳 Fee: ${b.total.toFixed(2)}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {/* Video Consultation button logic: Reminder before date, Join Video Room on appointment date */}
                      {isVideoBooking && b.status === 'confirmed' && (
                        isToday ? (
                          <Link
                            to={`/video-room?bookingId=${b._id}`}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                          >
                            <Video className="w-3.5 h-3.5 text-white" />
                            <span>Join Video Room</span>
                          </Link>
                        ) : isFuture ? (
                          <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold flex items-center gap-1.5 shadow-2xs">
                            <Bell className="w-3.5 h-3.5 text-amber-700" />
                            <span>Reminder: Room opens {b.date}</span>
                          </div>
                        ) : (
                          <div className="px-3 py-1.5 rounded-xl bg-stone-100 text-stone-500 text-[11px] font-semibold">
                            Completed Video Session
                          </div>
                        )
                      )}

                      {b.status === 'confirmed' && (
                        <button
                          onClick={() => handleCancelBooking(b._id)}
                          className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* PROVIDER BOOKING MODAL */}
      {isModalOpen && selectedProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-base font-extrabold text-[#20351F]">
                  Schedule with {selectedProvider.name}
                </h3>
                <p className="text-xs text-stone-500">
                  {selectedProvider.clinicName || selectedProvider.businessName}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-stone-400 hover:text-stone-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleModalBooking} className="mt-4 space-y-4 text-xs">
              {/* Pet Selection or Custom Name */}
              <div>
                <label className="block font-bold text-stone-800 mb-1">Appointment Pet Name *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Enter Pet's Name"
                    value={customPetName}
                    onChange={(e) => setCustomPetName(e.target.value)}
                    className="flex-1 p-2.5 rounded-xl border border-stone-200 bg-stone-50 font-bold text-stone-800"
                  />
                  {pets.length > 0 && (
                    <select
                      value={bookingPetId}
                      onChange={(e) => {
                        setBookingPetId(e.target.value);
                        const matched = pets.find((p) => p._id === e.target.value);
                        if (matched) setCustomPetName(matched.name);
                      }}
                      className="p-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-700"
                    >
                      {pets.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} ({p.breed})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Consultation Mode for Pet Specialists */}
              {modalCategory === 'specialist' && (
                <div>
                  <label className="block font-bold text-stone-800 mb-1">Consultation Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setConsultMode('pet_video');
                        setSelectedService('Pet Video Consultation');
                      }}
                      className={`p-3 rounded-xl border text-center cursor-pointer transition-colors ${consultMode === 'pet_video'
                          ? 'border-[#20351F] bg-stone-100 font-bold text-[#20351F]'
                          : 'border-stone-200'
                        }`}
                    >
                      <Video className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                      <span>Video Telehealth (${selectedProvider.videoConsultationFee})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConsultMode('pet_clinic');
                        setSelectedService('In-Clinic Pet Visit');
                      }}
                      className={`p-3 rounded-xl border text-center cursor-pointer transition-colors ${consultMode === 'pet_clinic'
                          ? 'border-[#20351F] bg-stone-100 font-bold text-[#20351F]'
                          : 'border-stone-200'
                        }`}
                    >
                      <Stethoscope className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                      <span>In-Clinic Visit (${selectedProvider.consultationFee})</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Date & Time Slot with Conflict Detection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    Date * <span className="text-emerald-700 font-normal">(Today or later)</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={todayStr}
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">Time Slot *</label>
                  <select
                    value={selectedSlot}
                    onChange={(e) => setSelectedSlot(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 font-bold text-stone-800"
                  >
                    {AVAILABLE_TIME_SLOTS.map((slot) => {
                      const booked = isSlotBooked(slot, modalBookedSlots);
                      return (
                        <option
                          key={slot}
                          value={slot}
                          disabled={booked}
                          className={booked ? 'text-stone-400 bg-stone-100 font-normal italic' : ''}
                        >
                          {slot} {booked ? '(Already Booked - Unavailable)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Reason / Notes */}
              <div>
                <label className="block font-bold text-stone-800 mb-1">Reason for Visit & Symptoms</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Skin scratching, routine vaccinations, nail trim, appetite loss..."
                  value={bookingReason}
                  onChange={(e) => setBookingReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:outline-none"
                />
              </div>

              {/* Promo Code */}
              <div>
                <label className="block font-bold text-stone-800 mb-1">Promo Code</label>
                <input
                  type="text"
                  placeholder="e.g. WELCOME10 for 10% off"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="w-full p-2 rounded-xl border border-stone-200 bg-stone-50 uppercase"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#20351F] hover:bg-[#152414] text-white font-bold transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Confirming...' : 'Confirm Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
