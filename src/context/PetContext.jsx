import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js';
import { useToast } from './ToastContext.jsx';
import { useAuth } from './AuthContext.jsx';

const PetContext = createContext(undefined);

export const PetProvider = ({ children }) => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [loading, setLoading] = useState(true);

  // Health data for selected pet
  const [vaccinations, setVaccinations] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);

  const fetchPets = async () => {
    if (!user) {
      setPets([]);
      setSelectedPet(null);
      setVaccinations([]);
      setMedicines([]);
      setMedicalRecords([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await api.get('/pets');
      if (res.data?.success) {
        const petList = res.data.data;
        setPets(petList);
        if (petList.length > 0) {
          setSelectedPet((prev) => {
            if (prev) {
              const matched = petList.find((p) => p._id === prev._id);
              return matched || petList[0];
            }
            return petList[0];
          });
        } else {
          setSelectedPet(null);
        }
      }
    } catch (err) {
      console.error('Failed to load pets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, [user]);

  const refreshPetDetails = async (petId) => {
    if (!petId) return;
    try {
      const [vacRes, medRes, recRes] = await Promise.all([
        api.get(`/pets/${petId}/vaccinations`),
        api.get(`/pets/${petId}/medicines`),
        api.get(`/pets/${petId}/medical-records`),
      ]);

      if (vacRes.data?.success) setVaccinations(vacRes.data.data);
      if (medRes.data?.success) setMedicines(medRes.data.data);
      if (recRes.data?.success) setMedicalRecords(recRes.data.data);
    } catch (err) {
      console.error('Failed to load pet details:', err);
    }
  };

  useEffect(() => {
    if (selectedPet?._id) {
      refreshPetDetails(selectedPet._id);
    } else {
      setVaccinations([]);
      setMedicines([]);
      setMedicalRecords([]);
    }
  }, [selectedPet?._id]);

  const addVaccination = async (petId, data) => {
    try {
      const res = await api.post(`/pets/${petId}/vaccinations`, data);
      if (res.data?.success) {
        setVaccinations((prev) => [...prev, res.data.data]);
        success('Vaccination record added successfully!', 'Vaccination Added');
        return true;
      }
      return false;
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to add vaccination.');
      return false;
    }
  };

  const addMedicine = async (petId, data) => {
    try {
      const res = await api.post(`/pets/${petId}/medicines`, data);
      if (res.data?.success) {
        setMedicines((prev) => [...prev, res.data.data]);
        success('Medication routine scheduled!', 'Medicine Added');
        return true;
      }
      return false;
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to add medicine.');
      return false;
    }
  };

  const addMedicalRecord = async (petId, data) => {
    try {
      const res = await api.post(`/pets/${petId}/medical-records`, data);
      if (res.data?.success) {
        setMedicalRecords((prev) => [...prev, res.data.data]);
        success('Medical record saved!', 'Record Added');
        return true;
      }
      return false;
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to add medical record.');
      return false;
    }
  };

  const deleteVaccination = async (petId, vacId) => {
    try {
      const res = await api.delete(`/pets/${petId}/vaccinations/${vacId}`);
      if (res.data?.success) {
        setVaccinations(prev => prev.filter(v => v._id !== vacId));
        success('Vaccination record deleted.', 'Deleted');
        return true;
      }
      return false;
    } catch (err) {
      toastError(err.response?.data?.message || 'Could not delete vaccination record.');
      return false;
    }
  };

  const deleteMedicine = async (petId, medId) => {
    try {
      const res = await api.delete(`/pets/${petId}/medicines/${medId}`);
      if (res.data?.success) {
        setMedicines(prev => prev.filter(m => m._id !== medId));
        success('Medication schedule deleted.', 'Deleted');
        return true;
      }
      return false;
    } catch (err) {
      toastError(err.response?.data?.message || 'Could not delete medication schedule.');
      return false;
    }
  };

  const deleteMedicalRecord = async (petId, recId) => {
    try {
      const res = await api.delete(`/pets/${petId}/medical-records/${recId}`);
      if (res.data?.success) {
        setMedicalRecords(prev => prev.filter(r => r._id !== recId));
        success('Medical record removed.', 'Deleted');
        return true;
      }
      return false;
    } catch (err) {
      toastError(err.response?.data?.message || 'Could not delete medical record.');
      return false;
    }
  };

  const deletePet = async (petId) => {
    try {
      const res = await api.delete(`/pets/${petId}`);
      if (res.data?.success) {
        const remaining = pets.filter(p => p._id !== petId);
        setPets(remaining);
        if (selectedPet?._id === petId) {
          setSelectedPet(remaining.length > 0 ? remaining[0] : null);
        }
        success('Pet removed from your profile.', 'Pet Removed');
        return true;
      }
      return false;
    } catch (err) {
      toastError(err.response?.data?.message || 'Could not delete pet.');
      return false;
    }
  };

  const recordMedicineDose = async (medId, status) => {
    try {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = now.toISOString().split('T')[0];

      setMedicines(prev =>
        prev.map(m => {
          if (m._id === medId) {
            const currentHistory = Array.isArray(m.history) ? m.history : [];
            return {
              ...m,
              history: [{ date: dateStr, time: timeStr, status }, ...currentHistory]
            };
          }
          return m;
        })
      );
      success(status === 'taken' ? 'Dose marked as taken!' : 'Dose marked as missed.', 'Medication Logged');
    } catch (err) {
      console.error('Error logging medication dose:', err);
    }
  };

  return (
    <PetContext.Provider
      value={{
        pets,
        selectedPet,
        loading,
        setSelectedPet,
        refreshPets: fetchPets,
        vaccinations,
        medicines,
        medicalRecords,
        refreshPetDetails,
        addVaccination,
        deleteVaccination,
        addMedicine,
        deleteMedicine,
        addMedicalRecord,
        deleteMedicalRecord,
        deletePet,
        recordMedicineDose
      }}
    >
      {children}
    </PetContext.Provider>
  );
};

export const usePet = () => {
  const context = useContext(PetContext);
  if (!context) {
    throw new Error('usePet must be used within a PetProvider');
  }
  return context;
};
