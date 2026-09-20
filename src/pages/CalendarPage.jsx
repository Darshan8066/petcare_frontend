import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  CheckCircle,
  AlertTriangle,
  Pill,
  Scissors,
  Stethoscope,
  X,
  Filter
} from 'lucide-react';
import api from '../services/api.js';
import { usePet } from '../context/PetContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export const CalendarPage = () => {
  const { selectedPet, pets } = usePet();
  const { success, error: toastError } = useToast();
  const { user } = useAuth();

  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const [newReminder, setNewReminder] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00 AM',
    type: 'medication',
    petId: selectedPet?._id || '',
    notes: ''
  });

  const fetchReminders = async () => {
    // The calendar is private, so there is nothing to request while signed out.
    if (!user) {
      setReminders([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get('/calendar');
      if (res.data?.success) {
        setReminders(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [user]);

  const handleToggleComplete = async (id, currentStatus) => {
    try {
      const res = await api.patch(`/calendar/${id}`, { completed: !currentStatus });
      if (res.data?.success) {
        setReminders(prev =>
          prev.map(r => (r._id === id ? { ...r, completed: !currentStatus } : r))
        );
        success(!currentStatus ? 'Marked as completed!' : 'Marked as pending.');
      }
    } catch {
      toastError('Could not update reminder.');
    }
  };

  const handleAddReminder = async (e) => {
    e.preventDefault();
    if (!newReminder.title) return;

    try {
      const res = await api.post('/calendar', newReminder);
      if (res.data?.success) {
        success('Reminder scheduled on your Care Calendar!', 'Reminder Created');
        setShowAddModal(false);
        setNewReminder({
          title: '',
          date: new Date().toISOString().split('T')[0],
          time: '09:00 AM',
          type: 'medication',
          petId: selectedPet?._id || '',
          notes: ''
        });
        await fetchReminders();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Could not schedule reminder.');
    }
  };

  const filteredReminders = reminders.filter((r) => {
    if (filterType === 'all') return true;
    return r.type === filterType;
  });

  const getTypeIcon = (type) => {
    switch (type) {
      case 'medication':
        return <Pill className="w-4 h-4 text-amber-600" />;
      case 'appointment':
        return <Stethoscope className="w-4 h-4 text-emerald-600" />;
      case 'grooming':
        return <Scissors className="w-4 h-4 text-cyan-600" />;
      case 'vaccination':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      default:
        return <CalendarIcon className="w-4 h-4 text-[#20351F]" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#20351F] tracking-tight">
            Pet Care Calendar & Medication Routine
          </h1>
          <p className="text-sm text-[#687166] mt-0.5">
            Never miss a dose, vaccine booster, or clinic appointment.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-2xl bg-[#20351F] hover:bg-[#152414] text-white text-xs font-bold transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#DCE7D5]" />
          <span>Add Custom Reminder</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        {[
          { key: 'all', label: 'All Reminders' },
          { key: 'medication', label: '💊 Daily Medicines' },
          { key: 'appointment', label: '🩺 Pet Appointments' },
          { key: 'vaccination', label: '💉 Vaccines Due' },
          { key: 'grooming', label: '✂️ Grooming' },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setFilterType(item.key)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              filterType === item.key
                ? 'bg-[#20351F] text-white'
                : 'bg-white text-slate-700 hover:bg-[#F0F4ED] border border-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Reminders Timeline List */}
      <div className="space-y-4">
        {filteredReminders.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
            No reminders found in this category.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReminders.map((r) => (
              <div
                key={r._id}
                className={`p-5 rounded-3xl border transition-all flex items-start justify-between gap-4 ${
                  r.completed
                    ? 'bg-slate-50/70 border-slate-200 opacity-60'
                    : 'bg-white border-[#20351F]/10 shadow-xs hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#F0F4ED] flex items-center justify-center shrink-0 mt-0.5">
                    {getTypeIcon(r.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`font-extrabold text-sm ${r.completed ? 'line-through text-slate-500' : 'text-[#20351F]'}`}>
                        {r.title}
                      </h3>
                      <span className="px-2 py-0.5 rounded-md bg-[#F0F4ED] text-[#20351F] text-[10px] font-bold uppercase">
                        {r.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#687166] mt-1">
                      <span className="flex items-center gap-1 font-semibold text-slate-800">
                        <CalendarIcon className="w-3.5 h-3.5 text-slate-400" /> {r.date}
                      </span>
                      {r.time && (
                        <span className="flex items-center gap-1 text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> {r.time}
                        </span>
                      )}
                    </div>

                    {r.notes && (
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        {r.notes}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleToggleComplete(r._id, r.completed)}
                  className={`p-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                    r.completed
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                      : 'border-slate-200 hover:border-emerald-500 text-slate-400 hover:text-emerald-600'
                  }`}
                  title={r.completed ? 'Mark pending' : 'Mark completed'}
                >
                  <CheckCircle className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD REMINDER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#20351F]/10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-extrabold text-[#20351F]">Add Care Calendar Reminder</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddReminder} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Reminder Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Heartworm Chewable or Nail Trim"
                  value={newReminder.title}
                  onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Category</label>
                  <select
                    value={newReminder.type}
                    onChange={(e) => setNewReminder({ ...newReminder, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="medication">Daily Medicine</option>
                    <option value="appointment">Pet Appointment</option>
                    <option value="vaccination">Vaccination</option>
                    <option value="grooming">Grooming</option>
                    <option value="custom">General Task</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Pet</label>
                  <select
                    value={newReminder.petId}
                    onChange={(e) => setNewReminder({ ...newReminder, petId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    {pets.map((p) => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Date</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={newReminder.date}
                    onChange={(e) => setNewReminder({ ...newReminder, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 08:00 AM"
                    value={newReminder.time}
                    onChange={(e) => setNewReminder({ ...newReminder, time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Notes / Instructions</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Administer with peanut butter or full stomach"
                  value={newReminder.notes}
                  onChange={(e) => setNewReminder({ ...newReminder, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#20351F] text-white font-bold"
                >
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
