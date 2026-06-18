import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { MapPin, Star, Building2, Briefcase, Award, ArrowLeft, Users, Phone, Calendar } from 'lucide-react';

const CompanyPage = () => {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['company-page', id],
    queryFn: async () => {
      const res = await api.get(`/employer/public/${id}`);
      return res.data;
    },
    enabled: !!id
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 bg-brand-200 rounded-full mb-4"></div>
          <div className="h-6 w-32 bg-slate-200 rounded mb-2"></div>
          <div className="h-4 w-24 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (isError || !data?.employer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Company Not Found</h2>
          <p className="text-slate-500 mb-6">This employer profile is missing or has been removed.</p>
          <Link to="/worker" className="text-brand-600 font-bold flex items-center gap-2 justify-center hover:underline">
            <ArrowLeft className="w-4 h-4"/> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { employer, openJobs = [] } = data;
  const isTrusted = employer.totalReviews >= 3 && employer.averageRating >= 4.0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <div className="bg-brand-900 text-white p-4 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/worker" className="flex items-center gap-2 hover:opacity-80 transition">
             <img src="/logo.png" alt="WorkLink Logo" className="h-10 object-contain" />
          </Link>
          <Link to="/worker" className="text-sm font-medium hover:text-brand-200 transition flex items-center gap-2">
            <ArrowLeft className="w-4 h-4"/> Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Company Header */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 mb-8 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-brand-100 to-transparent opacity-50 rounded-bl-full pointer-events-none"></div>
           
           <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
             <div className="w-24 h-24 bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg shrink-0">
               <Building2 className="w-10 h-10" />
             </div>
             <div className="flex-1">
                <div className="flex flex-wrap gap-3 items-center mb-2">
                  <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {employer.company?.companyName || employer.fullName}
                  </h1>
                  {isTrusted && (
                    <span className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-green-200 shadow-sm">
                      <Award className="w-3.5 h-3.5"/> Trusted Employer
                    </span>
                  )}
                </div>
                
                <p className="text-lg text-slate-600 font-medium mb-4">{employer.fullName}</p>
                
                <div className="flex flex-wrap gap-6 text-sm text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4"/> {employer.city || 'Unknown'}, {employer.state || 'Unknown'}</span>
                  <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4"/> {openJobs.length} Active Postings</span>
                  
                  {employer.totalReviews > 0 ? (
                    <span className="flex items-center gap-1.5 text-slate-800 font-bold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 shadow-sm">
                      <Star className="w-4 h-4 fill-amber-500 text-amber-500"/> 
                      {employer.averageRating} 
                      <span className="text-slate-500 font-medium text-xs ml-1">({employer.totalReviews} reviews)</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md text-xs">New Employer</span>
                  )}
                </div>
             </div>
           </div>
        </div>

        {/* Active Jobs */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-brand-600" />
            Currently Hiring ({openJobs.length})
          </h2>
          
          {openJobs.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl text-center shadow-sm border border-slate-100">
               <Briefcase className="w-12 h-12 text-slate-200 mx-auto mb-3" />
               <h3 className="font-bold text-slate-800 text-lg">No open positions</h3>
               <p className="text-slate-500">This employer is not currently hiring on WorkLink.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {openJobs.map((job: any) => (
                 <div key={job._id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-brand-200 transition">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900 mb-2">{job.title}</h3>
                        <p className="text-slate-600 text-sm mb-4 line-clamp-2">{job.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Wage</span>
                            <span className="font-bold text-slate-900">₹{job.dailyWage} <span className="text-xs font-medium text-slate-500">/ day</span></span>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Location</span>
                            <span className="font-bold text-slate-900 text-sm truncate">{job.city}</span>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Workers Needed</span>
                            <span className="font-bold text-slate-900 flex items-center gap-1"><Users className="w-3.5 h-3.5 text-blue-600"/> {job.workersRequired}</span>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Timing</span>
                            <span className="font-bold text-slate-900 text-sm">{job.timing}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="md:w-48 shrink-0 flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                        <Link to="/worker" className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl text-center hover:bg-brand-700 transition shadow-lg shadow-brand-500/20 block">
                          Apply via Dashboard
                        </Link>
                      </div>
                    </div>
                 </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyPage;
