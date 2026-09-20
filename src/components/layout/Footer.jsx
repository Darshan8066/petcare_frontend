import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Phone, ShieldCheck, Mail, MapPin } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-[#20351F] text-[#FBFBF6] pt-14 pb-8 border-t border-[#20351F]/20 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[#DCE7D5] text-[#20351F] flex items-center justify-center font-black">
                <Heart className="w-5 h-5 text-[#20351F] fill-[#20351F]/30" />
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-white">
                PetCare
              </span>
            </div>
            <p className="text-sm text-[#DCE7D5]/80 max-w-sm leading-relaxed">
              "Everything Your Pet Needs, All in One Place." From preventative vaccinations and telemedicine consultations to luxury grooming, trusted sitting, and curated nutrition.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#DCE7D5] mb-4">Care Services</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link to="/booking" className="hover:text-white transition-colors">Pet Care Consultations</Link></li>
              <li><Link to="/booking" className="hover:text-white transition-colors">Video Telemedicine</Link></li>
              <li><Link to="/booking" className="hover:text-white transition-colors">Master Pet Grooming</Link></li>
              <li><Link to="/booking" className="hover:text-white transition-colors">Trusted Pet Sitters</Link></li>
              <li><Link to="/pets" className="hover:text-white transition-colors">Vaccination Records</Link></li>
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#DCE7D5] mb-4">Pet Wellness</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link to="/store" className="hover:text-white transition-colors">Curated Pet Store</Link></li>
              <li><Link to="/calendar" className="hover:text-white transition-colors">Care Calendar & Dosing</Link></li>
              <li><Link to="/ai-assistant" className="hover:text-white transition-colors">AI Pet Advisor</Link></li>
              <li><Link to="/emergency" className="hover:text-white transition-colors text-amber-300 font-semibold">24/7 Emergency SOS</Link></li>
            </ul>
          </div>

          {/* Emergency & Support */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#DCE7D5] mb-4">Emergency & Contact</h4>
            <ul className="space-y-3 text-xs text-white/80">
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block font-bold text-amber-300">1-800-PET-EMERGENCY</span>
                  <span className="text-[11px] text-white/50">24/7 Urgent Triage Dispatch</span>
                </div>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#78936D] shrink-0" />
                <span>support@petcare.com</span>
              </li>
              
            </ul>
          </div>
        </div>

        {/* Disclaimer & Copyright */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <p>© {new Date().getFullYear()} PetCare Technologies, Inc. All rights reserved.</p>
          <p className="max-w-xl text-center md:text-right text-[11px]">
            Pet care advice provided on PetCare is intended for informational purposes and does not replace emergency medical interventions. For severe distress, locate your nearest emergency hospital immediately.
          </p>
        </div>
      </div>
    </footer>
  );
};
