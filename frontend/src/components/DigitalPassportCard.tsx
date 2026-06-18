import React from 'react';
import { CreditCard, ShieldCheck, Zap } from 'lucide-react';

interface DigitalPassportCardProps {
  worker: {
    fullName: string;
    passportId?: string;
    passportExpiry?: string | Date;
    aadhaarNumber?: string;
    dob?: string | Date;
    profileImage?: string;
  };
}

const DigitalPassportCard: React.FC<DigitalPassportCardProps> = ({ worker }) => {
  if (!worker.passportId) return null;

  const maskedAadhaar = worker.aadhaarNumber 
    ? `XXXX XXXX ${worker.aadhaarNumber.slice(-4)}`
    : 'XXXX XXXX XXXX';

  const formattedExpiry = worker.passportExpiry 
    ? `${(new Date(worker.passportExpiry).getMonth() + 1).toString().padStart(2, '0')}/${new Date(worker.passportExpiry).getFullYear().toString().slice(2)}`
    : 'MM/YY';

  return (
    <div className="w-[400px] h-[250px] rounded-2xl p-6 relative overflow-hidden shadow-2xl bg-gradient-to-br from-slate-900 via-brand-900 to-slate-900 text-white select-none">
      {/* Background Graphic */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
      <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-brand-500/20 rounded-full blur-2xl"></div>

      {/* Top Row: Logo and Photo */}
      <div className="flex justify-between items-start relative z-10">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-brand-400" />
            <span className="font-black tracking-wider text-lg italic">WORKLINK</span>
          </div>
          <div className="w-12 h-8 bg-amber-200/80 rounded-md shadow-inner border border-amber-300/50 flex items-center justify-center">
            {/* Smart Chip Mock */}
            <div className="w-8 h-5 border border-amber-400/50 rounded-sm grid grid-cols-3 grid-rows-2 gap-[1px]">
              <div className="border border-amber-400/30"></div>
              <div className="border border-amber-400/30 col-span-2"></div>
              <div className="border border-amber-400/30 col-span-2"></div>
              <div className="border border-amber-400/30"></div>
            </div>
          </div>
        </div>
        
        {/* Profile Photo */}
        <div className="w-16 h-16 rounded-lg bg-slate-800 border-2 border-white/20 overflow-hidden shadow-lg flex items-center justify-center">
          {worker.profileImage ? (
            <img src={worker.profileImage} alt="Profile" className="w-full h-full object-cover" crossOrigin="anonymous" />
          ) : (
            <span className="text-xl font-bold text-slate-400">{worker.fullName.charAt(0)}</span>
          )}
        </div>
      </div>

      {/* Middle Row: Passport Number */}
      <div className="mt-6 relative z-10">
        <p className="text-xs text-brand-200 font-medium mb-1 tracking-widest uppercase">Digital Passport No.</p>
        <p className="font-mono text-2xl tracking-[0.2em] font-bold drop-shadow-md">
          {worker.passportId.match(/.{1,4}/g)?.join(' ') || worker.passportId}
        </p>
      </div>

      {/* Bottom Row: Details */}
      <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end z-10">
        <div>
          <p className="text-[10px] text-brand-200 uppercase tracking-wider mb-1">Worker Name</p>
          <p className="font-bold tracking-widest uppercase text-sm drop-shadow-md">{worker.fullName}</p>
        </div>

        <div className="text-right">
          <div className="flex gap-4">
            <div>
              <p className="text-[10px] text-brand-200 uppercase tracking-wider mb-0.5">Valid Thru</p>
              <p className="font-mono text-sm font-bold">{formattedExpiry}</p>
            </div>
            <div>
              <ShieldCheck className="w-8 h-8 text-green-400/80 drop-shadow-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalPassportCard;
