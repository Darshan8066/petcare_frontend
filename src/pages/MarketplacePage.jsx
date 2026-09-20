import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Heart,
  Search,
  PlusCircle,
  MapPin,
  CheckCircle2,
  Phone,
  Mail,
  ShieldCheck,
  Tag,
  X,
  Sparkles,
  Filter,
  Check,
  Calendar,
  MessageSquare
} from 'lucide-react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export const MarketplacePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpecies, setSelectedSpecies] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [adoptionOnly, setAdoptionOnly] = useState(false);
  const [priceRange, setPriceRange] = useState('all');

  // Sell Modal State
  const [isSellModalOpen, setIsSellModalOpen] = useState(searchParams.get('action') === 'sell');

  // Contact / Reserve Modal
  const [contactPet, setContactPet] = useState(null);
  const [inquiryName, setInquiryName] = useState(user?.name || '');
  const [inquiryPhone, setInquiryPhone] = useState('+1 (555) 382-9011');
  const [inquiryMsg, setInquiryMsg] = useState('Hi, I am interested in this pet! Is it still available?');
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);

  // New Pet Listing Form
  const [formTitle, setFormTitle] = useState('');
  const [formSpecies, setFormSpecies] = useState('Dog');
  const [formBreed, setFormBreed] = useState('');
  const [formAge, setFormAge] = useState('');
  const [formGender, setFormGender] = useState('Male');
  const [formPrice, setFormPrice] = useState('350');
  const [formIsAdoption, setFormIsAdoption] = useState(false);
  const [formLocation, setFormLocation] = useState('Springfield, OR');
  const [formDescription, setFormDescription] = useState('');
  const [formPhoto, setFormPhoto] = useState('https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&auto=format&fit=crop&q=80');
  const [formVaccinated, setFormVaccinated] = useState(true);
  const [formDewormed, setFormDewormed] = useState(true);
  const [formHealthCert, setFormHealthCert] = useState(true);
  const [formSellerName, setFormSellerName] = useState(user?.name || 'Darshan');
  const [formSellerPhone, setFormSellerPhone] = useState('+1 (555) 382-9011');
  const [formSellerEmail, setFormSellerEmail] = useState(user?.email || 'darshandarji8066@gmail.com');
  const [isPosting, setIsPosting] = useState(false);

  const photoPresets = {
    Dog: [
      'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=800&auto=format&fit=crop&q=80'
    ],
    Cat: [
      'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=800&auto=format&fit=crop&q=80'
    ],
    Bird: [
      'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?w=800&auto=format&fit=crop&q=80'
    ],
    Rabbit: [
      'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=800&auto=format&fit=crop&q=80'
    ]
  };

  const fetchListings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/pet-listings');
      if (res.data?.success) {
        setListings(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    if (searchParams.get('action') === 'sell') {
      setIsSellModalOpen(true);
    }
  }, [searchParams]);

  // Handle Create Listing
  const handlePublishListing = async (e) => {
    e.preventDefault();
    if (!formTitle.trim() || !formBreed.trim() || !formLocation.trim()) {
      toastError('Please fill out the title, breed, and location.');
      return;
    }

    try {
      setIsPosting(true);
      const res = await api.post('/pet-listings', {
        title: formTitle.trim(),
        species: formSpecies,
        breed: formBreed.trim(),
        age: formAge.trim() || 'Young',
        gender: formGender,
        price: formIsAdoption ? 0 : Number(formPrice) || 0,
        isForAdoption: formIsAdoption,
        location: formLocation.trim(),
        description: formDescription.trim() || 'Friendly and healthy companion ready for a new caring home.',
        photos: [formPhoto],
        vaccinated: formVaccinated,
        dewormed: formDewormed,
        healthCertificate: formHealthCert,
        sellerName: formSellerName.trim() || user?.name || 'Pet Owner',
        sellerPhone: formSellerPhone.trim(),
        sellerEmail: formSellerEmail.trim()
      });

      if (res.data?.success) {
        window.dispatchEvent(new CustomEvent('petcare_data_updated', { detail: { type: 'pet-listing' } }));
        localStorage.setItem('petcare_last_sync', Date.now().toString());
        success('Your pet listing is now live in the Pet Marketplace!', 'Pet Listed for Sale');
        setIsSellModalOpen(false);
        setSearchParams({});
        // Reset form
        setFormTitle('');
        setFormBreed('');
        setFormAge('');
        setFormDescription('');
        await fetchListings();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Could not publish pet listing.');
    } finally {
      setIsPosting(false);
    }
  };

  // Handle Inquiry / Reserve
  const handleSendInquiry = async (action) => {
    if (!contactPet) return;
    try {
      setIsSubmittingInquiry(true);
      const res = await api.post(`/pet-listings/${contactPet._id}/inquire`, {
        buyerName: inquiryName,
        buyerPhone: inquiryPhone,
        message: inquiryMsg,
        action
      });

      if (res.data?.success) {
        success(res.data.message, action === 'reserve' ? 'Pet Reserved!' : 'Message Sent!');
        setContactPet(null);
        await fetchListings();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to submit inquiry.');
    } finally {
      setIsSubmittingInquiry(false);
    }
  };

  // Filter listings
  const filteredListings = listings.filter((pet) => {
    const matchSpecies = selectedSpecies === 'all' || pet.species.toLowerCase() === selectedSpecies.toLowerCase();
    const matchAdoption = !adoptionOnly || pet.isForAdoption || pet.price === 0;

    let matchPrice = true;
    if (priceRange === 'free') matchPrice = pet.isForAdoption || pet.price === 0;
    else if (priceRange === 'under200') matchPrice = pet.price > 0 && pet.price <= 200;
    else if (priceRange === '200to500') matchPrice = pet.price > 200 && pet.price <= 500;
    else if (priceRange === '500plus') matchPrice = pet.price > 500;

    const matchSearch =
      pet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pet.breed.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pet.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pet.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchSpecies && matchAdoption && matchPrice && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Primary Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Verified Pet Marketplace & Adoption Network</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#20351F] tracking-tight">
            Buy & Sell Pets
          </h1>
          <p className="text-sm text-stone-600 mt-0.5">
            Connect directly with verified pet parents, ethical breeders, and loving rescue homes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSellModalOpen(true)}
            className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Sell / Rehome a Pet</span>
          </button>
          <Link
            to="/store"
            className="px-4 py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-all"
          >
            Pet Food & Supplies →
          </Link>
        </div>
      </div>

      {/* Quick Sell Banner */}
      <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <Heart className="w-6 h-6 text-amber-600 fill-amber-500/20" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-950">
              Looking to Sell or Rehome a Pet?
            </h3>
            <p className="text-xs text-amber-800 mt-0.5 max-w-xl">
              List your puppies, kittens, birds, or bunnies for sale or adoption in under 2 minutes with photos, health certificates, and direct buyer inquiries.
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsSellModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          Post a Pet Now
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="space-y-3 bg-white p-4 rounded-3xl border border-stone-200 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search by breed (Golden Retriever, Persian Cat), city, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs focus:outline-none focus:ring-2 focus:ring-[#20351F]"
            />
          </div>

          {/* Price Filter */}
          <select
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs font-medium text-stone-700 focus:outline-none"
          >
            <option value="all">All Prices</option>
            <option value="free">Free for Adoption ($0)</option>
            <option value="under200">Under $200</option>
            <option value="200to500">$200 - $500</option>
            <option value="500plus">$500 & Above</option>
          </select>
        </div>

        {/* Species Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'All Pets' },
            { id: 'dog', label: '🐕 Dogs & Puppies' },
            { id: 'cat', label: '🐈 Cats & Kittens' },
            { id: 'bird', label: '🦜 Birds' },
            { id: 'rabbit', label: '🐇 Rabbits' }
          ].map((sp) => (
            <button
              key={sp.id}
              onClick={() => setSelectedSpecies(sp.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedSpecies === sp.id
                  ? 'bg-[#20351F] text-white shadow-xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {sp.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pet Listings Grid */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block w-8 h-8 border-4 border-[#20351F] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs text-stone-500 font-medium">Loading pet listings...</p>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-stone-200 p-8">
          <Heart className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#20351F]">No pets found matching your filters</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
            Try choosing a different species or price range, or be the first to list a pet for sale or adoption!
          </p>
          <button
            onClick={() => setIsSellModalOpen(true)}
            className="mt-4 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors"
          >
            + Post a Pet for Sale
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredListings.map((pet) => {
            const isFree = pet.isForAdoption || pet.price === 0;
            return (
              <div
                key={pet._id}
                className="group rounded-3xl bg-white border border-stone-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                {/* Photo & Status Badge */}
                <div className="relative aspect-4/3 bg-stone-100 overflow-hidden">
                  <img
                    src={pet.photos?.[0] || pet.photo || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600'}
                    alt={pet.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-[11px] font-bold">
                      {pet.species} · {pet.gender}
                    </span>
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <span
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold shadow-sm ${
                        isFree
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#20351F] text-[#DCE7D5]'
                      }`}
                    >
                      {isFree ? 'Free for Adoption' : `$${pet.price}`}
                    </span>
                  </div>
                </div>

                {/* Info Content */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-[#20351F] line-clamp-1 group-hover:text-amber-600 transition-colors">
                      {pet.title}
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-2">
                      <span className="font-semibold text-stone-700">{pet.breed}</span>
                      <span>·</span>
                      <span>{pet.age}</span>
                    </p>

                    <p className="text-xs text-stone-400 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-stone-400" />
                      <span>{pet.location}</span>
                    </p>

                    <p className="text-xs text-stone-600 mt-2 line-clamp-2 leading-relaxed">
                      {pet.description}
                    </p>
                  </div>

                  {/* Health Badges */}
                  <div className="pt-2 border-t border-stone-100 flex flex-wrap gap-1.5">
                    {pet.vaccinated && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" /> Vaccinated
                      </span>
                    )}
                    {pet.dewormed && (
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 text-[10px] font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3 text-blue-600" /> Dewormed
                      </span>
                    )}
                    {pet.healthCertificate && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-amber-600" /> Vet Checked
                      </span>
                    )}
                  </div>

                  {/* Seller & Action Buttons */}
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                    <div className="text-[11px] text-stone-500">
                      <span>Seller: </span>
                      <strong className="text-stone-800 font-semibold">{pet.sellerName}</strong>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setContactPet(pet)}
                        className="px-3 py-2 rounded-xl bg-[#20351F] hover:bg-[#152414] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Contact</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SELL A PET MODAL */}
      {isSellModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-lg font-extrabold text-[#20351F]">
                  Sell or Rehome a Pet
                </h3>
                <p className="text-xs text-stone-500">
                  List your pet for sale or adoption to verified families on PetCare
                </p>
              </div>
              <button
                onClick={() => {
                  setIsSellModalOpen(false);
                  setSearchParams({});
                }}
                className="p-1 text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublishListing} className="mt-4 space-y-4 text-xs">
              {/* Title */}
              <div>
                <label className="block font-bold text-stone-800 mb-1">Listing Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Healthy 2-Month Golden Retriever Puppy (Playful & Gentle)"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#20351F] focus:outline-none"
                />
              </div>

              {/* Species & Breed */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-800 mb-1">Species *</label>
                  <select
                    value={formSpecies}
                    onChange={(e) => {
                      const sp = e.target.value;
                      setFormSpecies(sp);
                      if (photoPresets[sp] && photoPresets[sp].length > 0) {
                        setFormPhoto(photoPresets[sp][0]);
                      }
                    }}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#20351F] focus:outline-none font-semibold"
                  >
                    <option value="Dog">Dog / Puppy</option>
                    <option value="Cat">Cat / Kitten</option>
                    <option value="Bird">Bird</option>
                    <option value="Rabbit">Rabbit</option>
                    <option value="Other">Other Pet</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">Breed *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. British Shorthair, Golden Retriever"
                    value={formBreed}
                    onChange={(e) => setFormBreed(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#20351F] focus:outline-none"
                  />
                </div>
              </div>

              {/* Age, Gender & Location */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-stone-800 mb-1">Age</label>
                  <input
                    type="text"
                    placeholder="e.g. 2 Months, 1 Year"
                    value={formAge}
                    onChange={(e) => setFormAge(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#20351F] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">Gender</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#20351F] focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">City / Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Springfield, OR"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#20351F] focus:outline-none"
                  />
                </div>
              </div>

              {/* Price & Free Adoption Toggle */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/60 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-stone-900">Price & Adoption Setting</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsAdoption}
                      onChange={(e) => setFormIsAdoption(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-semibold text-amber-900">Free for Adoption ($0)</span>
                  </label>
                </div>
                {!formIsAdoption && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-stone-700">$</span>
                    <input
                      type="number"
                      min="0"
                      step="5"
                      placeholder="Enter price in USD"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      className="w-full p-2 rounded-xl border border-stone-300 bg-white font-bold text-stone-800"
                    />
                  </div>
                )}
              </div>

              {/* Health Checkboxes */}
              <div>
                <label className="block font-bold text-stone-800 mb-1">Health & Veterinary Checks</label>
                <div className="grid grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 p-2 rounded-xl border border-stone-200 bg-stone-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formVaccinated}
                      onChange={(e) => setFormVaccinated(e.target.checked)}
                      className="rounded text-[#20351F]"
                    />
                    <span className="font-medium text-stone-700">Vaccinated</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-xl border border-stone-200 bg-stone-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formDewormed}
                      onChange={(e) => setFormDewormed(e.target.checked)}
                      className="rounded text-[#20351F]"
                    />
                    <span className="font-medium text-stone-700">Dewormed</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-xl border border-stone-200 bg-stone-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formHealthCert}
                      onChange={(e) => setFormHealthCert(e.target.checked)}
                      className="rounded text-[#20351F]"
                    />
                    <span className="font-medium text-stone-700">Vet Checked</span>
                  </label>
                </div>
              </div>

              {/* Photo Preview and Selection */}
              <div>
                <label className="block font-bold text-stone-800 mb-1">Photo Selection</label>
                <div className="flex items-center gap-2 mb-2">
                  {photoPresets[formSpecies]?.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormPhoto(img)}
                      className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        formPhoto === img ? 'border-amber-500 scale-105' : 'border-stone-200 opacity-70'
                      }`}
                    >
                      <img src={img} alt="Preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <input
                  type="url"
                  placeholder="Or enter custom image URL"
                  value={formPhoto}
                  onChange={(e) => setFormPhoto(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-stone-800 mb-1">Pet Description & Temperament</label>
                <textarea
                  rows={3}
                  placeholder="Tell potential families about their personality, favorite toys, diet, training, and compatibility with kids/other pets..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#20351F] focus:outline-none leading-relaxed"
                />
              </div>

              {/* Seller Contact Info */}
              <div className="pt-2 border-t border-stone-100">
                <label className="block font-bold text-stone-800 mb-1">Your Contact Info (Visible to Interested Buyers)</label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Your Name"
                    value={formSellerName}
                    onChange={(e) => setFormSellerName(e.target.value)}
                    className="p-2.5 rounded-xl border border-stone-200 bg-stone-50"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="Phone or WhatsApp"
                    value={formSellerPhone}
                    onChange={(e) => setFormSellerPhone(e.target.value)}
                    className="p-2.5 rounded-xl border border-stone-200 bg-stone-50"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSellModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPosting}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-sm transition-colors cursor-pointer"
                >
                  {isPosting ? 'Publishing...' : 'Publish Pet Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONTACT / RESERVE PET MODAL */}
      {contactPet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex justify-between items-start pb-3 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <img
                  src={contactPet.photos?.[0] || contactPet.photo || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600'}
                  alt={contactPet.title}
                  className="w-14 h-14 rounded-2xl object-cover"
                />
                <div>
                  <h3 className="text-sm font-extrabold text-[#20351F] line-clamp-1">
                    {contactPet.title}
                  </h3>
                  <p className="text-xs text-stone-500">
                    {contactPet.breed} · {contactPet.price === 0 ? 'Free Adoption' : `$${contactPet.price}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setContactPet(null)}
                className="p-1 text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Direct Contact Details */}
            <div className="my-4 p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2 text-xs">
              <p className="font-bold text-stone-800">Direct Seller Information:</p>
              <div className="flex items-center gap-2 text-stone-700">
                <span className="font-semibold text-stone-500">Seller:</span>
                <span>{contactPet.sellerName}</span>
              </div>
              <div className="flex items-center gap-2 text-stone-700">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <a href={`tel:${contactPet.sellerPhone}`} className="text-emerald-700 font-bold hover:underline">
                  {contactPet.sellerPhone}
                </a>
              </div>
              <div className="flex items-center gap-2 text-stone-700">
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                <a href={`mailto:${contactPet.sellerEmail}`} className="text-blue-700 font-bold hover:underline">
                  {contactPet.sellerEmail}
                </a>
              </div>
            </div>

            {/* Quick Message Form */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-800 mb-1">Your Name</label>
                <input
                  type="text"
                  value={inquiryName}
                  onChange={(e) => setInquiryName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">Your Phone / WhatsApp</label>
                <input
                  type="tel"
                  value={inquiryPhone}
                  onChange={(e) => setInquiryPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">Message to Seller</label>
                <textarea
                  rows={2}
                  value={inquiryMsg}
                  onChange={(e) => setInquiryMsg(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleSendInquiry('inquire')}
                  disabled={isSubmittingInquiry}
                  className="flex-1 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs transition-colors cursor-pointer"
                >
                  Send Message
                </button>
                <button
                  type="button"
                  onClick={() => handleSendInquiry('reserve')}
                  disabled={isSubmittingInquiry}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  Reserve Pet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
