import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Heart,
  ShieldCheck,
  Plus,
  Syringe,
  Pill,
  FileText,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  X,
  Sparkles,
  Edit2,
  Trash2,
  Upload,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import { usePet } from '../context/PetContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../services/api.js';

export const PRESET_PET_PHOTOS = [
  {
    species: 'Dog',
    label: 'Dog',
    emoji: '🐕',
    url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&auto=format&fit=crop&q=80'
  },
  {
    species: 'Cat',
    label: 'Cat',
    emoji: '🐈',
    url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&auto=format&fit=crop&q=80'
  },
  {
    species: 'Bird',
    label: 'Bird',
    emoji: '🦜',
    url: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=400&auto=format&fit=crop&q=80'
  },
  {
    species: 'Rabbit',
    label: 'Rabbit',
    emoji: '🐇',
    url: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400&auto=format&fit=crop&q=80'
  },
  {
    species: 'Other',
    label: 'Hamster',
    emoji: '🐹',
    url: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&auto=format&fit=crop&q=80'
  }
];

export const PetsPage = () => {
  const {
    pets,
    selectedPet,
    setSelectedPet,
    refreshPets,
    vaccinations,
    medicines,
    medicalRecords,
    addVaccination,
    deleteVaccination,
    addMedicine,
    deleteMedicine,
    addMedicalRecord,
    deleteMedicalRecord,
    deletePet,
    recordMedicineDose
  } = usePet();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState('vaccines');

  // URL search params for deep linking from dashboard
  const [searchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get('action') === 'add-pet') {
      setShowAddPetModal(true);
    }
  }, [searchParams]);

  // Modals
  const [showAddPetModal, setShowAddPetModal] = useState(false);
  const [showAddVaccineModal, setShowAddVaccineModal] = useState(false);
  const [showAddMedModal, setShowAddMedModal] = useState(false);
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);

  // Deletion Confirmation Modals
  const [petToDelete, setPetToDelete] = useState(null);
  const [vacToDelete, setVacToDelete] = useState(null);
  const [medToDelete, setMedToDelete] = useState(null);
  const [recToDelete, setRecToDelete] = useState(null);

  // Photo Upload State
  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = useRef(null);

  // Forms
  const [petForm, setPetForm] = useState({
    name: '',
    species: 'Dog',
    breed: '',
    gender: 'Male',
    dateOfBirth: '',
    weight: 10,
    color: '',
    allergies: '',
    notes: '',
    microchipNumber: '',
    avatar: ''
  });

  const [vacForm, setVacForm] = useState({
    name: '',
    givenDate: new Date().toISOString().split('T')[0],
    nextDueDate: '',
    veterinarian: 'Dr. Elena Alvarez',
    clinic: 'Meadowbrook Animal Clinic',
    batchNumber: '',
    notes: ''
  });

  const [medForm, setMedForm] = useState({
    name: '',
    dosage: '',
    frequency: 'Once daily',
    timeOfDay: '08:00 AM',
    instructions: 'Give with meals.'
  });

  const [recForm, setRecForm] = useState({
    title: '',
    type: 'Checkup',
    date: new Date().toISOString().split('T')[0],
    veterinarian: 'Dr. Elena Alvarez',
    clinic: 'Meadowbrook Animal Clinic',
    diagnosis: '',
    treatment: '',
    notes: ''
  });

  // Handle image upload from user device
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toastError('Pet photo must be under 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      setImagePreview(dataUrl);
      setPetForm(prev => ({ ...prev, avatar: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  // Handle create pet
  const handleCreatePet = async (e) => {
    e.preventDefault();
    if (!petForm.name) return;
    try {
      const payload = {
        ...petForm,
        avatar: imagePreview || petForm.avatar || undefined,
        allergies: petForm.allergies ? petForm.allergies.split(',').map(s => s.trim()) : [],
      };
      const res = await api.post('/pets', payload);
      if (res.data?.success) {
        success(`${petForm.name} added to your pet family!`, 'Pet Registered');
        setShowAddPetModal(false);
        setImagePreview('');
        setPetForm({
          name: '',
          species: 'Dog',
          breed: '',
          gender: 'Male',
          dateOfBirth: '',
          weight: 10,
          color: '',
          allergies: '',
          notes: '',
          microchipNumber: '',
          avatar: ''
        });
        await refreshPets();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Could not register pet.');
    }
  };

  // Handle Delete Confirmation Actions
  const handleConfirmDeletePet = async () => {
    if (!petToDelete) return;
    try {
      await deletePet(petToDelete._id);
      setPetToDelete(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmDeleteVac = async () => {
    if (!selectedPet || !vacToDelete) return;
    try {
      await deleteVaccination(selectedPet._id, vacToDelete._id);
      setVacToDelete(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmDeleteMed = async () => {
    if (!selectedPet || !medToDelete) return;
    try {
      await deleteMedicine(selectedPet._id, medToDelete._id);
      setMedToDelete(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmDeleteRecord = async () => {
    if (!selectedPet || !recToDelete) return;
    try {
      await deleteMedicalRecord(selectedPet._id, recToDelete._id);
      setRecToDelete(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle add vaccine
  const handleAddVaccine = async (e) => {
    e.preventDefault();
    if (!selectedPet) return;
    const ok = await addVaccination(selectedPet._id, vacForm);
    if (ok) {
      setShowAddVaccineModal(false);
      setVacForm({
        name: '',
        givenDate: new Date().toISOString().split('T')[0],
        nextDueDate: '',
        veterinarian: 'Dr. Elena Alvarez',
        clinic: 'Meadowbrook Animal Clinic',
        batchNumber: '',
        notes: ''
      });
    }
  };

  // Handle add med
  const handleAddMed = async (e) => {
    e.preventDefault();
    if (!selectedPet) return;
    const ok = await addMedicine(selectedPet._id, {
      ...medForm,
      timeOfDay: [medForm.timeOfDay]
    });
    if (ok) {
      setShowAddMedModal(false);
      setMedForm({
        name: '',
        dosage: '',
        frequency: 'Once daily',
        timeOfDay: '08:00 AM',
        instructions: 'Give with meals.'
      });
    }
  };

  // Handle add medical record
  const handleAddRecord = async (e) => {
    e.preventDefault();
    if (!selectedPet) return;
    const ok = await addMedicalRecord(selectedPet._id, recForm);
    if (ok) {
      setShowAddRecordModal(false);
      setRecForm({
        title: '',
        type: 'Checkup',
        date: new Date().toISOString().split('T')[0],
        veterinarian: 'Dr. Elena Alvarez',
        clinic: 'Meadowbrook Animal Clinic',
        diagnosis: '',
        treatment: '',
        notes: ''
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header & Pet Selector Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#20351F] tracking-tight">
            Pet Health & Medical Passport
          </h1>
          <p className="text-sm text-[#687166] mt-0.5">
            Complete records, immunization status, daily medicines, and clinical history.
          </p>
        </div>

        <button
          onClick={() => setShowAddPetModal(true)}
          className="px-4 py-2.5 rounded-2xl bg-[#20351F] hover:bg-[#152414] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#DCE7D5]" />
          <span>Add New Pet</span>
        </button>
      </div>

      {/* Pet Switcher Bar */}
      {pets.length > 0 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
          {pets.map((pet) => {
            const isSelected = selectedPet?._id === pet._id;
            return (
              <button
                key={pet._id}
                onClick={() => setSelectedPet(pet)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-[#20351F] text-white border-[#20351F] shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-[#78936D] hover:bg-[#F0F4ED]'
                }`}
              >
                <img src={pet.avatar} alt={pet.name} className="w-9 h-9 rounded-full object-cover ring-2 ring-white/40 shrink-0" />
                <div className="text-left">
                  <span className="block text-xs font-bold leading-tight">{pet.name}</span>
                  <span className={`block text-[11px] ${isSelected ? 'text-[#DCE7D5]' : 'text-[#687166]'}`}>
                    {pet.species} · {pet.breed}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Pet Passport Card or Empty State */}
      {pets.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-dashed border-stone-300 shadow-xs">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F0F4ED] text-[#20351F] flex items-center justify-center">
            <Heart className="w-8 h-8 text-[#20351F]" />
          </div>
          <h2 className="text-xl font-bold text-[#20351F]">No pets registered yet</h2>
          <p className="text-sm text-stone-500 max-w-md mx-auto mt-1 mb-6">
            Register your companion to track vaccinations, medication schedules, and clinical records all in one place.
          </p>
          <button
            onClick={() => setShowAddPetModal(true)}
            className="px-5 py-2.5 rounded-2xl bg-[#20351F] text-white text-xs font-bold hover:bg-[#152414] transition-colors inline-flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#DCE7D5]" />
            <span>Add Your Pet</span>
          </button>
        </div>
      ) : selectedPet && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#20351F]/10 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Avatar & Core Attributes */}
            <div className="flex items-start gap-5">
              <img
                src={selectedPet.avatar}
                alt={selectedPet.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover ring-4 ring-[#DCE7D5] shrink-0 shadow-xs"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black text-[#20351F]">{selectedPet.name}</h2>
                  <span className="px-2 py-0.5 rounded-md bg-[#F0F4ED] text-[#20351F] text-xs font-bold">
                    {selectedPet.gender}
                  </span>
                </div>
                <p className="text-xs font-semibold text-[#687166]">
                  {selectedPet.breed} ({selectedPet.species})
                </p>
                <p className="text-xs text-slate-700">
                  <span className="font-semibold">Weight:</span> {selectedPet.weight} kg
                </p>
                <p className="text-xs text-slate-700">
                  <span className="font-semibold">Date of Birth:</span> {selectedPet.dateOfBirth}
                </p>

                {/* Remove Pet Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setPetToDelete(selectedPet)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                    title={`Remove ${selectedPet.name} from your profile`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Pet</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Microchip & Primary Vet */}
            <div className="space-y-3 bg-[#FCFCF5] p-4 rounded-2xl border border-slate-100 text-xs text-[#20351F]">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#78936D] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Microchip ID</span>
                  <span className="font-mono text-slate-600">{selectedPet.microchipNumber || '985141002348123 (ISO Standard)'}</span>
                </div>
              </div>
              <div className="border-t border-slate-200/60 pt-2 flex items-start gap-2.5">
                <Heart className="w-4 h-4 text-[#C8643D] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Primary Care Clinic</span>
                  <span className="text-slate-600">{selectedPet.primaryVet?.clinic || 'Meadowbrook Animal Clinic'}</span>
                  <span className="block text-[11px] text-slate-400">{selectedPet.primaryVet?.phone || '+1 (555) 234-5678'}</span>
                </div>
              </div>
            </div>

            {/* Allergies & Insurance Highlights */}
            <div className="space-y-3 bg-[#FCFCF5] p-4 rounded-2xl border border-slate-100 text-xs">
              <div>
                <span className="font-bold text-rose-800 block mb-1.5">⚠️ Documented Allergies</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPet.allergies.length > 0 ? (
                    selectedPet.allergies.map((a, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold">
                        {a}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 text-xs">No known allergies</span>
                  )}
                </div>
              </div>
              <div className="border-t border-slate-200/60 pt-2">
                <span className="font-bold text-[#20351F] block">Pet Health Insurance</span>
                <span className="text-slate-600">
                  {selectedPet.insurance?.provider || 'Healthy Paws Pet Insurance'} · {selectedPet.insurance?.policyNumber || 'HP-90218-GOLD'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      {selectedPet && (
        <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200/80 pb-3 no-scrollbar">
          <button
            onClick={() => setActiveTab('vaccines')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer ${
              activeTab === 'vaccines'
                ? 'bg-[#20351F] text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-[#F0F4ED]'
            }`}
          >
            <Syringe className="w-4 h-4" />
            <span>Vaccinations ({vaccinations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('medicines')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer ${
              activeTab === 'medicines'
                ? 'bg-[#20351F] text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-[#F0F4ED]'
            }`}
          >
            <Pill className="w-4 h-4" />
            <span>Medication Schedules ({medicines.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('records')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer ${
              activeTab === 'records'
                ? 'bg-[#20351F] text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-[#F0F4ED]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Medical History ({medicalRecords.length})</span>
          </button>
        </div>
      )}

      {/* TAB 1: VACCINATIONS */}
      {selectedPet && activeTab === 'vaccines' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-[#20351F]">
              Immunization Records for {selectedPet?.name}
            </h3>
            <button
              onClick={() => setShowAddVaccineModal(true)}
              className="px-3.5 py-2 rounded-xl bg-[#F0F4ED] hover:bg-[#DCE7D5] text-[#20351F] text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Log Vaccination</span>
            </button>
          </div>

          {vaccinations.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white rounded-3xl border border-stone-200 shadow-xs">
              <Syringe className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-stone-700">No vaccinations recorded yet</p>
              <p className="text-xs text-stone-400 mt-1">Click &quot;Log Vaccination&quot; to track {selectedPet.name}&apos;s immunizations.</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-[#20351F]/10 shadow-xs overflow-hidden">
              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-xs">
                  <thead className="bg-[#FBFBF6] border-b border-slate-100 text-[#687166] uppercase text-[10px] font-bold">
                    <tr>
                      <th className="py-3.5 px-5">Vaccine Name</th>
                      <th className="py-3.5 px-5 whitespace-nowrap min-w-[120px]">Administered</th>
                      <th className="py-3.5 px-5 whitespace-nowrap min-w-[120px]">Next Due</th>
                      <th className="py-3.5 px-5 min-w-[180px]">Pet Specialist & Clinic</th>
                      <th className="py-3.5 px-5 whitespace-nowrap min-w-[110px]">Batch No.</th>
                      <th className="py-3.5 px-5 whitespace-nowrap min-w-[120px]">Status</th>
                      <th className="py-3.5 px-5 whitespace-nowrap text-right min-w-[80px]">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {vaccinations.map((vac) => {
                      const isUpToDate = vac.status === 'up_to_date';
                      const isDueSoon = vac.status === 'due_soon';

                      return (
                        <tr key={vac._id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-4 px-5 font-bold text-[#20351F]">{vac.name}</td>
                          <td className="py-4 px-5 whitespace-nowrap font-medium text-slate-800">{vac.givenDate}</td>
                          <td className="py-4 px-5 whitespace-nowrap font-semibold text-slate-900">{vac.nextDueDate}</td>
                          <td className="py-4 px-5">
                            <p className="font-medium text-slate-900">{vac.veterinarian}</p>
                            <p className="text-[11px] text-[#687166]">{vac.clinic}</p>
                          </td>
                          <td className="py-4 px-5 whitespace-nowrap font-mono text-slate-600">{vac.batchNumber || '—'}</td>
                          <td className="py-4 px-5 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider whitespace-nowrap ${
                                isUpToDate
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : isDueSoon
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                                  : 'bg-rose-50 text-rose-800 border border-rose-200'
                              }`}
                            >
                              {isUpToDate ? 'Up to date' : isDueSoon ? 'Due Soon' : 'Overdue'}
                            </span>
                          </td>
                          <td className="py-4 px-5 whitespace-nowrap text-right">
                            <button
                              onClick={() => setVacToDelete(vac)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title={`Delete ${vac.name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="sm:hidden divide-y divide-slate-100">
                {vaccinations.map((vac) => {
                  const isUpToDate = vac.status === 'up_to_date';
                  const isDueSoon = vac.status === 'due_soon';

                  return (
                    <div key={vac._id} className="p-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-sm text-[#20351F]">{vac.name}</h4>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 mt-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider whitespace-nowrap ${
                              isUpToDate
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : isDueSoon
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {isUpToDate ? 'Up to date' : isDueSoon ? 'Due Soon' : 'Overdue'}
                          </span>
                        </div>
                        <button
                          onClick={() => setVacToDelete(vac)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                          title={`Delete ${vac.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                        <div>
                          <span className="text-[10px] uppercase text-stone-400 font-semibold block">Administered</span>
                          <span className="font-medium whitespace-nowrap text-slate-900">{vac.givenDate}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase text-stone-400 font-semibold block">Next Due</span>
                          <span className="font-bold whitespace-nowrap text-slate-900">{vac.nextDueDate}</span>
                        </div>
                      </div>

                      <div className="text-xs text-[#687166] pt-1">
                        <span>{vac.veterinarian} · {vac.clinic}</span>
                        {vac.batchNumber && (
                          <span className="block text-[11px] font-mono text-stone-500 whitespace-nowrap">
                            Batch No: <strong className="text-slate-800 font-bold">{vac.batchNumber}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MEDICINE SCHEDULES */}
      {selectedPet && activeTab === 'medicines' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-[#20351F]">
              Active Medication Schedules
            </h3>
            <button
              onClick={() => setShowAddMedModal(true)}
              className="px-3.5 py-2 rounded-xl bg-[#F0F4ED] hover:bg-[#DCE7D5] text-[#20351F] text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Medication</span>
            </button>
          </div>

          {medicines.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white rounded-3xl border border-stone-200 shadow-xs">
              <Pill className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-stone-700">No active medication schedules</p>
              <p className="text-xs text-stone-400 mt-1">Click &quot;Add Medication&quot; to set daily reminders for {selectedPet.name}.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {medicines.map((med) => (
                <div
                  key={med._id}
                  className="p-5 rounded-3xl bg-white border border-[#20351F]/10 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold shrink-0">
                          <Pill className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-[#20351F]">{med.name}</h4>
                          <p className="text-xs text-[#687166]">{med.dosage} · {med.frequency}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold uppercase">
                          {med.status}
                        </span>
                        <button
                          onClick={() => setMedToDelete(med)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title={`Delete schedule for ${med.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 p-3 rounded-2xl bg-[#FCFCF5] border border-slate-100 text-xs space-y-1">
                      <p className="text-slate-700">
                        <span className="font-semibold text-slate-900">Instructions:</span> {med.instructions}
                      </p>
                      <p className="text-slate-500">
                        <span className="font-semibold text-slate-700">Schedule Time:</span> {med.timeOfDay.join(', ')}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-[11px] text-[#687166]">
                      Recent Doses: {(med.history || []).slice(0, 2).map(h => `${h.date} (${h.status})`).join(', ') || 'No doses recorded'}
                    </div>
                    <button
                      onClick={() => recordMedicineDose(med._id, 'taken')}
                      className="px-3 py-1.5 rounded-xl bg-[#20351F] hover:bg-[#152414] text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      Mark Dose Taken ✓
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MEDICAL RECORDS */}
      {selectedPet && activeTab === 'records' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-[#20351F]">
              Comprehensive Clinical History
            </h3>
            <button
              onClick={() => setShowAddRecordModal(true)}
              className="px-3.5 py-2 rounded-xl bg-[#F0F4ED] hover:bg-[#DCE7D5] text-[#20351F] text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Medical Record</span>
            </button>
          </div>

          {medicalRecords.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white rounded-3xl border border-stone-200 shadow-xs">
              <FileText className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-stone-700">No clinical records found</p>
              <p className="text-xs text-stone-400 mt-1">Click &quot;Add Medical Record&quot; to log checkups, surgeries, or diagnostics for {selectedPet.name}.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {medicalRecords.map((rec) => (
                <div
                  key={rec._id}
                  className="p-5 rounded-3xl bg-white border border-[#20351F]/10 shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 rounded-lg bg-[#F0F4ED] text-[#20351F] text-xs font-bold">
                        {rec.type}
                      </span>
                      <h4 className="text-sm font-extrabold text-[#20351F]">{rec.title}</h4>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[#687166]">{rec.date}</span>
                      <button
                        onClick={() => setRecToDelete(rec)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title={`Delete record ${rec.title}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[#687166] mb-3">
                    Attending Pet Specialist: <span className="font-bold text-[#20351F]">{rec.veterinarian}</span> ({rec.clinic})
                  </p>

                  <div className="space-y-2 text-xs bg-[#FCFCF5] p-4 rounded-2xl border border-slate-100">
                    {rec.diagnosis && (
                      <p className="text-slate-800">
                        <span className="font-bold text-slate-900">Diagnosis / Findings:</span> {rec.diagnosis}
                      </p>
                    )}
                    {rec.treatment && (
                      <p className="text-slate-800">
                        <span className="font-bold text-slate-900">Treatment Plan:</span> {rec.treatment}
                      </p>
                    )}
                    {rec.notes && (
                      <p className="text-slate-500 italic">
                        Notes: {rec.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD NEW PET */}
      {showAddPetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-[#20351F]/10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-extrabold text-[#20351F]">Register New Pet</h3>
              <button onClick={() => setShowAddPetModal(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreatePet} className="space-y-4 text-xs">
              {/* Pet Photo Section (Preset Pet Photos + Manual Upload) */}
              <div className="space-y-3 p-3.5 rounded-2xl bg-stone-50/80 border border-stone-200/80">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-stone-800 text-xs">
                    Pet Photo <span className="text-stone-400 font-normal">(Preset or Custom Upload)</span>
                  </label>
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview('');
                        setPetForm(prev => ({ ...prev, avatar: '' }));
                      }}
                      className="text-[11px] font-semibold text-rose-600 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Selected Photo Active Preview */}
                {imagePreview ? (
                  <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white border border-emerald-300 ring-2 ring-emerald-500/20 shadow-2xs">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#20351F]/20 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="inline-block text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                          Photo Selected ✓
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-stone-700 mt-1 truncate">
                        {imagePreview.startsWith('data:')
                          ? 'Uploaded from your device'
                          : 'Selected preset photo'}
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[11px] font-bold text-[#20351F] hover:underline cursor-pointer"
                        >
                          Change to device file
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* 4-5 Preset Photos for different pet types (Dog, Cat, Bird, Rabbit, Hamster) */}
                <div>
                  <span className="block text-[11px] font-semibold text-stone-600 mb-1.5">
                    Choose from preset pet photos:
                  </span>
                  <div className="grid grid-cols-5 gap-2">
                    {PRESET_PET_PHOTOS.map((preset) => {
                      const isChosen = imagePreview === preset.url;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            setImagePreview(preset.url);
                            setPetForm(prev => ({
                              ...prev,
                              avatar: preset.url,
                              species: (prev.species === 'Dog' && preset.species !== 'Dog') ? preset.species : prev.species
                            }));
                          }}
                          className={`flex flex-col items-center p-1.5 rounded-2xl border transition-all text-center group cursor-pointer ${
                            isChosen
                              ? 'border-emerald-600 ring-2 ring-emerald-500/30 bg-emerald-50/70'
                              : 'border-stone-200 hover:border-[#20351F] bg-white'
                          }`}
                        >
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden mb-1">
                            <img
                              src={preset.url}
                              alt={preset.label}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <span className="absolute bottom-0.5 right-0.5 text-[10px] leading-none drop-shadow">
                              {preset.emoji}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-stone-700 truncate w-full">
                            {preset.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Manual Photo Upload from Device or URL */}
                <div className="pt-2 border-t border-stone-200/70 space-y-2">
                  <span className="block text-[11px] font-semibold text-stone-600">
                    Or upload your own pet&apos;s photo:
                  </span>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-3 p-3 rounded-2xl border-2 border-dashed border-stone-300 hover:border-[#20351F] bg-white hover:bg-stone-50/80 transition-colors cursor-pointer text-left"
                  >
                    <div className="w-8 h-8 rounded-xl bg-[#F0F4ED] text-[#20351F] flex items-center justify-center shrink-0">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-stone-800 text-xs">Browse photo from your device</p>
                      <p className="text-[10px] text-stone-400">JPG, PNG, WebP supported (up to 5MB)</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="text-stone-400 text-[11px] shrink-0">or image URL:</span>
                    <input
                      type="url"
                      placeholder="https://example.com/photo.jpg"
                      value={petForm.avatar && !petForm.avatar.startsWith('data:') ? petForm.avatar : ''}
                      onChange={(e) => {
                        setPetForm({ ...petForm, avatar: e.target.value });
                        setImagePreview(e.target.value);
                      }}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-stone-200 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Pet Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bella"
                  value={petForm.name}
                  onChange={(e) => setPetForm({ ...petForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Species</label>
                  <select
                    value={petForm.species}
                    onChange={(e) => setPetForm({ ...petForm, species: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Dog">Dog</option>
                    <option value="Cat">Cat</option>
                    <option value="Bird">Bird</option>
                    <option value="Rabbit">Rabbit</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Breed</label>
                  <input
                    type="text"
                    placeholder="e.g. Golden Retriever"
                    value={petForm.breed}
                    onChange={(e) => setPetForm({ ...petForm, breed: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Gender</label>
                  <select
                    value={petForm.gender}
                    onChange={(e) => setPetForm({ ...petForm, gender: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={petForm.weight}
                    onChange={(e) => setPetForm({ ...petForm, weight: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Known Allergies (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Chicken, Penicillin"
                  value={petForm.allergies}
                  onChange={(e) => setPetForm({ ...petForm, allergies: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPetModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#20351F] text-white font-bold hover:bg-[#152414] cursor-pointer"
                >
                  Save Pet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: REMOVE PET */}
      {petToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#20351F]">Remove {petToDelete.name}?</h3>
              <p className="text-xs text-stone-500 mt-1">
                Are you sure you want to remove this pet? All associated vaccinations, medication schedules, and clinical records will also be permanently deleted.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setPetToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-xs font-semibold hover:bg-stone-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeletePet}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors cursor-pointer"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: DELETE VACCINATION */}
      {vacToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#20351F]">Delete Vaccine Record?</h3>
              <p className="text-xs text-stone-500 mt-1">
                Are you sure you want to delete the vaccination record for <strong className="text-stone-800">{vacToDelete.name}</strong>?
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setVacToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-xs font-semibold hover:bg-stone-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteVac}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors cursor-pointer"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: DELETE MEDICINE SCHEDULE */}
      {medToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#20351F]">Delete Medication Schedule?</h3>
              <p className="text-xs text-stone-500 mt-1">
                Are you sure you want to delete the schedule for <strong className="text-stone-800">{medToDelete.name}</strong>? Daily dosage reminders will be removed.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setMedToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-xs font-semibold hover:bg-stone-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteMed}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors cursor-pointer"
              >
                Delete Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: DELETE MEDICAL RECORD */}
      {recToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#20351F]">Delete Clinical Record?</h3>
              <p className="text-xs text-stone-500 mt-1">
                Are you sure you want to delete the clinical entry <strong className="text-stone-800">&quot;{recToDelete.title}&quot;</strong>?
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setRecToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-xs font-semibold hover:bg-stone-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteRecord}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors cursor-pointer"
              >
                Delete Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD VACCINE */}
      {showAddVaccineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#20351F]/10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-extrabold text-[#20351F]">Log Vaccination Record</h3>
              <button onClick={() => setShowAddVaccineModal(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddVaccine} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Vaccine Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bordetella (Kennel Cough)"
                  value={vacForm.name}
                  onChange={(e) => setVacForm({ ...vacForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Given Date</label>
                  <input
                    type="date"
                    required
                    value={vacForm.givenDate}
                    onChange={(e) => setVacForm({ ...vacForm, givenDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Next Due Date</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={vacForm.nextDueDate}
                    onChange={(e) => setVacForm({ ...vacForm, nextDueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Administering Pet Specialist</label>
                <input
                  type="text"
                  value={vacForm.veterinarian}
                  onChange={(e) => setVacForm({ ...vacForm, veterinarian: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddVaccineModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#20351F] text-white font-bold"
                >
                  Record Vaccine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD MEDICINE */}
      {showAddMedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#20351F]/10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-extrabold text-[#20351F]">Add Medication Schedule</h3>
              <button onClick={() => setShowAddMedModal(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddMed} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Medication Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apoquel"
                  value={medForm.name}
                  onChange={(e) => setMedForm({ ...medForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Dosage</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 16 mg"
                    value={medForm.dosage}
                    onChange={(e) => setMedForm({ ...medForm, dosage: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Frequency</label>
                  <select
                    value={medForm.frequency}
                    onChange={(e) => setMedForm({ ...medForm, frequency: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Once daily">Once daily</option>
                    <option value="Twice daily">Twice daily</option>
                    <option value="Every 8 hours">Every 8 hours</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Instructions</label>
                <input
                  type="text"
                  value={medForm.instructions}
                  onChange={(e) => setMedForm({ ...medForm, instructions: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddMedModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#20351F] text-white font-bold"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD MEDICAL RECORD */}
      {showAddRecordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#20351F]/10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-extrabold text-[#20351F]">Add Clinical Record</h3>
              <button onClick={() => setShowAddRecordModal(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddRecord} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Title / Reason for Visit</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Comprehensive Wellness Exam"
                  value={recForm.title}
                  onChange={(e) => setRecForm({ ...recForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Record Type</label>
                  <select
                    value={recForm.type}
                    onChange={(e) => setRecForm({ ...recForm, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Checkup">Checkup</option>
                    <option value="Surgery">Surgery</option>
                    <option value="Dental">Dental</option>
                    <option value="Lab Test">Lab Test</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Visit Date</label>
                  <input
                    type="date"
                    required
                    value={recForm.date}
                    onChange={(e) => setRecForm({ ...recForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Clinical Findings & Diagnosis</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Mild gingivitis, heart rate regular, clear lungs..."
                  value={recForm.diagnosis}
                  onChange={(e) => setRecForm({ ...recForm, diagnosis: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddRecordModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#20351F] text-white font-bold"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
