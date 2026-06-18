import React, { useState, useRef } from 'react';
import { User, MapPin, Star, Award, Clock, Loader2, Briefcase, Edit3, X, Phone, CheckCircle2, Calendar, Home, Users } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import DigitalPassportCard from '../components/DigitalPassportCard';
import html2canvas from 'html2canvas';
import { toast } from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

const WorkerDashboard = () => {
  const { user, logout } = useAuthStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'jobs' | 'applications' | 'passport' | 'team'>('dashboard');
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewAppId, setReviewAppId] = useState<string | null>(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [confirmJob, setConfirmJob] = useState<any>(null);
  const [contractorWorkers, setContractorWorkers] = useState(1);
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  
  const [editForm, setEditForm] = useState({
    skills: '',
    languages: '',
    experienceYears: 0,
    preferredWage: 0,
    availabilityStatus: 'Available This Week',
    isContractor: false,
    teamSize: 1
  });
  const [workersToProvide, setWorkersToProvide] = useState<Record<string, number>>({});

  // Digital Passport States
  const [passportModalOpen, setPassportModalOpen] = useState(false);
  const [passportForm, setPassportForm] = useState({ aadhaarNumber: '', dob: '', profileImage: '' });
  
  const [subWorkerForm, setSubWorkerForm] = useState({ fullName: '', address: '', city: '', state: '', aadhaarNumber: '', dob: '', profileImage: '', skills: '' });
  const [showSubWorkerModal, setShowSubWorkerModal] = useState(false);
  const [showLegalAgreement, setShowLegalAgreement] = useState(false);
  const [agreementChecked, setAgreementChecked] = useState(false);

  const [passportSearch, setPassportSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  React.useEffect(() => {
    if (passportSearch.length > 3) {
      const timer = setTimeout(async () => {
        try {
          const { data } = await api.get(`/worker/contractor/search-passport?passportId=${passportSearch}`);
          setSearchResults(data);
        } catch (e) {}
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [passportSearch]);

  const passportRef = React.useRef<HTMLDivElement>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['worker-profile'],
    queryFn: async () => {
      const { data } = await api.get('/worker/profile');
      return data;
    }
  });

  // Auto-open passport modal if not generated
  React.useEffect(() => {
    if (!isLoading && profile && !profile.hasDigitalPassport) {
      setPassportModalOpen(true);
    }
  }, [profile, isLoading]);

  const generatePassportMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/worker/passport', passportForm);
      return data;
    },
    onSuccess: () => {
      setPassportModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['worker-profile'] });
      toast.success("Digital Passport Generated Successfully!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to generate passport');
    }
  });

  const downloadPassport = async () => {
    if (passportRef.current) {
      const canvas = await html2canvas(passportRef.current, { scale: 3, useCORS: true, backgroundColor: null });
      const image = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement('a');
      link.download = `WorkLink_Passport_${profile?.fullName || 'Worker'}.png`;
      link.href = image;
      link.click();
    }
  };

  const { data: applications = [], isLoading: appsLoading } = useQuery({
    queryKey: ['worker-applications'],
    queryFn: async () => {
      const { data } = await api.get('/applications/worker');
      return data;
    }
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.put(`/applications/${id}/cancel`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worker-applications'] });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { data } = await api.put(`/applications/${id}/worker-status`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worker-applications'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  });

  const applyContractorMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/worker/contractor/apply');
      return data;
    },
    onSuccess: () => {
      toast.success("Draft Team started! You must gather 5 workers.");
      queryClient.invalidateQueries({ queryKey: ['worker-profile'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to start application');
    }
  });

  const { data: sentInvites = [], isLoading: sentInvitesLoading } = useQuery({
    queryKey: ['contractor-sent-invites'],
    queryFn: async () => {
      const { data } = await api.get('/worker/contractor/invites-sent');
      return data;
    },
    enabled: !!profile && profile.contractorStatus === 'Gathering Team'
  });

  const { data: receivedInvites = [], isLoading: receivedInvitesLoading } = useQuery({
    queryKey: ['worker-received-invites'],
    queryFn: async () => {
      const { data } = await api.get('/worker/invites');
      return data;
    },
    enabled: !!profile && profile.contractorStatus === 'None' && !profile.managedBy
  });

  const sendInviteMutation = useMutation({
    mutationFn: async (targetWorkerId: string) => {
      const { data } = await api.post('/worker/contractor/invite', { targetWorkerId });
      return data;
    },
    onSuccess: () => {
      toast.success("Invite sent successfully!");
      setPassportSearch('');
      setSearchResults([]);
      queryClient.invalidateQueries({ queryKey: ['contractor-sent-invites'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to send invite');
    }
  });

  const respondInviteMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string, action: 'Accept' | 'Reject' }) => {
      const { data } = await api.put(`/worker/invites/${id}/respond`, { action });
      return data;
    },
    onSuccess: () => {
      toast.success("Responded to invite.");
      queryClient.invalidateQueries({ queryKey: ['worker-received-invites'] });
      queryClient.invalidateQueries({ queryKey: ['worker-profile'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to respond');
    }
  });

  const { data: teamMembers = [], isLoading: teamLoading } = useQuery({
    queryKey: ['contractor-team'],
    queryFn: async () => {
      const { data } = await api.get('/worker/contractor/team');
      return data;
    },
    enabled: !!profile && profile.contractorStatus === 'Approved'
  });

  const createSubWorkerMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...subWorkerForm,
        skills: subWorkerForm.skills.split(',').map(s => s.trim()).filter(Boolean)
      };
      const { data } = await api.post('/worker/contractor/sub-worker', payload);
      return data;
    },
    onSuccess: () => {
      setShowSubWorkerModal(false);
      setSubWorkerForm({ fullName: '', address: '', city: '', state: '', aadhaarNumber: '', dob: '', profileImage: '', skills: '' });
      toast.success("Sub-worker created and Passport generated successfully!");
      queryClient.invalidateQueries({ queryKey: ['contractor-team'] });
      queryClient.invalidateQueries({ queryKey: ['worker-profile'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create sub-worker');
    }
  });

  const { data: matchedJobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['worker-matched-jobs', searchQuery],
    queryFn: async () => {
      const { data } = await api.get(`/jobs/match?query=${encodeURIComponent(searchQuery)}`);
      return data;
    }
  });

  const applyMutation = useMutation({
    mutationFn: async ({ jobId, workerIds }: { jobId: string, workerIds: string[] }) => {
      const { data } = await api.post(`/applications/job/${jobId}/apply`, { workerIds });
      return data;
    },
    onSuccess: () => {
      setConfirmJob(null);
      toast.success("Application submitted successfully!");
      queryClient.invalidateQueries({ queryKey: ['worker-applications'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to apply to job");
    }
  });

  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/applications/${reviewAppId}/worker-review`, { 
        rating: reviewForm.rating, 
        comment: reviewForm.comment 
      });
      return data;
    },
    onSuccess: () => {
      setReviewModalOpen(false);
      setReviewAppId(null);
      setReviewForm({ rating: 5, comment: '' });
      toast.success("Review submitted successfully!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    }
  });



  const handleEditOpen = () => {
    if (profile) {
      setEditForm({
        skills: profile.skills?.join(', ') || '',
        languages: profile.languages?.join(', ') || '',
        experienceYears: profile.experienceYears || 0,
        preferredWage: profile.preferredWage || 0,
        availabilityStatus: profile.availabilityStatus || 'Available This Week',
        isContractor: profile.isContractor || false,
        teamSize: profile.teamSize || 1
      });
    }
    setIsEditing(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/worker/profile', {
        skills: editForm.skills.split(',').map(s => s.trim()).filter(Boolean),
        languages: editForm.languages.split(',').map(s => s.trim()).filter(Boolean),
        experienceYears: Number(editForm.experienceYears),
        preferredWage: Number(editForm.preferredWage),
        availabilityStatus: editForm.availabilityStatus,
        isContractor: editForm.isContractor,
        teamSize: Number(editForm.teamSize)
      });
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['worker-profile'] });
    } catch (err) {
      toast.error('Failed to update profile');
      console.error('Failed to update profile', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navbar */}
      <div className="bg-brand-900 text-white p-4 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="WorkLink Logo" className="h-12 object-contain scale-125 origin-left" />
            <h1 className="font-bold text-xl ml-2"><span className="text-brand-300">Worker</span></h1>
          </div>
          <div className="flex items-center gap-4">
             <span className="hidden sm:inline-block bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-xs font-semibold border border-green-500/30">Verified</span>
             
             <div className="flex items-center gap-4 border-l border-brand-800 pl-4 ml-2">
               <span className="text-sm font-medium text-brand-100 hidden sm:block">Hi, {user?.fullName || 'Worker'} {profile?.isContractor && '(Contractor)'}</span>
               <button onClick={handleEditOpen} className="text-sm text-brand-300 font-medium hover:text-white transition">Account</button>
               <Button variant="ghost" onClick={() => setShowLogoutConfirm(true)} className="text-sm text-red-400 font-medium hover:text-red-300 transition hover:bg-red-950/30">Logout</Button>
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-8">
        
        {/* Navigation Sidebar */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-2">
            <button 
              onClick={() => setActiveTab('dashboard')} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition ${activeTab === 'dashboard' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Home className="w-5 h-5" /> Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('jobs')} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition ${activeTab === 'jobs' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Briefcase className="w-5 h-5" /> Find Jobs
            </button>
            <button 
              onClick={() => setActiveTab('applications')} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition ${activeTab === 'applications' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <CheckCircle2 className="w-5 h-5" /> My Applications
            </button>
            <button 
              onClick={() => setActiveTab('passport')} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition ${activeTab === 'passport' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Award className="w-5 h-5" /> Digital Passport
            </button>
            {profile?.contractorStatus === 'Approved' && (
              <button 
                onClick={() => setActiveTab('team')} 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition ${activeTab === 'team' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Users className="w-5 h-5" /> My Agency
              </button>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="md:col-span-3 space-y-6">

        {/* --- DASHBOARD TAB --- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">

            {/* Inbox for Invites */}
            {receivedInvites.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-amber-600" /> Agency Invites ({receivedInvites.length})
                </h3>
                <div className="space-y-3">
                  {receivedInvites.map((inv: any) => (
                    <div key={inv._id} className="bg-white p-4 rounded-lg border border-amber-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                      <div>
                        <p className="font-bold text-slate-900">{inv.contractor?.fullName}</p>
                        <p className="text-sm text-slate-600">Location: {inv.contractor?.city}</p>
                        <p className="text-xs text-amber-600 font-semibold mt-1">Expires in 24 hours.</p>
                      </div>
                      <div className="flex gap-2 w-full md:w-auto">
                        <button 
                          onClick={() => {
                            if (confirm(`Accept invite from ${inv.contractor?.fullName}? They will manage your account.`)) {
                              respondInviteMutation.mutate({ id: inv._id, action: 'Accept' });
                            }
                          }}
                          disabled={respondInviteMutation.isPending}
                          className="flex-1 md:flex-none px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm(`Reject this invite?`)) {
                              respondInviteMutation.mutate({ id: inv._id, action: 'Reject' });
                            }
                          }}
                          disabled={respondInviteMutation.isPending}
                          className="flex-1 md:flex-none px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg transition"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            {isLoading ? (
               <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>
            ) : (
              <>
                <div className="text-center mb-6 relative">
                  <button onClick={handleEditOpen} className="absolute top-0 right-0 p-2 bg-slate-100 rounded-full text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <div className="w-24 h-24 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center border-4 border-white shadow-lg">
                    <User className="w-12 h-12 text-slate-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">{profile?.fullName || user.fullName}</h2>
                  <p className="text-slate-500 flex items-center justify-center gap-1 mt-1 mb-6"><MapPin className="w-4 h-4" /> {profile?.city || 'Location not set'}</p>
                  
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg mb-6">
                    <div className="flex-1 text-left">
                      <p className="text-xs text-slate-500 font-medium mb-1">Reputation</p>
                      {profile?.averageRating > 0 ? (
                        <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded w-fit">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          <span className="text-sm font-bold text-amber-700">{profile.averageRating} Rating</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="text-xl font-bold text-brand-600">{profile?.trustScore || 0}</span>
                          <span className="text-xs text-slate-400">/ 100</span>
                        </div>
                      )}
                    </div>
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                      <Award className="w-6 h-6 text-amber-500" />
                    </div>
                  </div>
                </div>

                {profile?.badges && profile.badges.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {profile.badges.map((badge: string, i: number) => (
                      <span key={`badge-${i}`} className="px-2 py-1 bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200 text-amber-800 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm">
                        <Award className="w-3 h-3 text-amber-600"/> {badge}
                      </span>
                    ))}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-2">Skills</h3>
                    {profile?.skills && profile.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {profile.skills.map((skill: string, i: number) => (
                           <span key={i} className="px-3 py-1 bg-brand-50 text-brand-600 rounded-md text-xs font-medium">{skill}</span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">No skills added yet.</p>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-2">Availability</h3>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand-500 transition">
                      <option>{profile?.availabilityStatus || 'Available This Week'}</option>
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div className="grid sm:grid-cols-2 gap-4 mt-6">
            <div className="bg-gradient-to-br from-brand-600 to-blue-500 p-6 rounded-2xl shadow-lg shadow-brand-500/20 text-white cursor-pointer hover:shadow-xl transition" onClick={() => setActiveTab('jobs')}>
              <Briefcase className="w-8 h-8 mb-4 text-brand-100" />
              <h3 className="text-xl font-bold mb-1">Smart Job Matching</h3>
              <p className="text-brand-100 text-sm">We find the best jobs based on your exact skills and location.</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between cursor-pointer hover:shadow-md transition" onClick={() => setActiveTab('passport')}>
              <div>
                <Award className="w-8 h-8 mb-4 text-purple-500" />
                <h3 className="text-xl font-bold text-slate-900 mb-1">Digital Identity</h3>
                <p className="text-slate-500 text-sm mb-4">View or download your verified Digital Passport.</p>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* --- PASSPORT TAB --- */}
        {activeTab === 'passport' && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center">
            <Award className="w-12 h-12 text-purple-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Your Digital Passport</h2>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">This passport serves as your verified identity on WorkLink. You must present this to employers if requested.</p>
            
            {profile?.hasDigitalPassport ? (
              <div className="flex flex-col items-center w-full">
                <div className="mb-8 overflow-hidden relative rounded-2xl bg-slate-900 flex items-center justify-center p-2 sm:p-8 w-full max-w-full sm:max-w-lg shadow-2xl min-h-[300px]">
                  <div ref={passportRef} className="w-full max-w-sm mx-auto flex items-center justify-center transform scale-[0.75] sm:scale-100 origin-center transition-transform">
                    <DigitalPassportCard worker={profile} />
                  </div>
                </div>
                <button onClick={downloadPassport} className="px-8 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition shadow-lg shadow-brand-500/30 text-sm flex items-center justify-center gap-2 w-full sm:w-auto">
                  Download High-Quality PNG
                </button>
              </div>
            ) : (
              <div className="py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-600 mb-4">You have not generated your Digital Passport yet.</p>
                <button 
                  onClick={() => setPassportModalOpen(true)}
                  className="px-6 py-3 bg-slate-900 hover:bg-brand-600 text-white font-bold rounded-xl transition"
                >
                  Generate Digital Passport Now
                </button>
              </div>
            )}
            
            {/* Contractor Application Section */}
            <div className="mt-12 pt-8 border-t border-slate-200 text-left">
               <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2"><Briefcase className="w-5 h-5 text-brand-600" /> Agency & Contractor Program</h3>
               
               {profile?.contractorStatus === 'None' && (
                 <>
                   <p className="text-slate-600 text-sm mb-4">Are you a contractor managing a team? Apply for verified contractor status to manage bulk applications. You will need to gather at least 5 workers using their Passport IDs within 24 hours.</p>
                   <button 
                     onClick={() => setShowLegalAgreement(true)}
                     disabled={applyContractorMutation.isPending}
                     className="px-6 py-3 bg-slate-900 hover:bg-brand-600 text-white font-bold rounded-xl transition"
                   >
                     Start Agency Application
                   </button>
                 </>
               )}

               {profile?.contractorStatus === 'Gathering Team' && (
                 <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-4">
                   <h4 className="font-bold text-amber-900 mb-2">⏳ Drafting Team (24 Hours Remaining)</h4>
                   <p className="text-sm text-amber-800 mb-4">You must invite and have at least 5 workers accept your invite to become verified. Current Accepted: {sentInvites.filter((i: any) => i.status === 'Accepted').length}/5</p>
                   
                   <div className="relative mb-6">
                     <label className="block text-sm font-bold text-amber-900 mb-1">Invite by Passport ID</label>
                     <input 
                       type="text" 
                       value={passportSearch}
                       onChange={(e) => setPassportSearch(e.target.value)}
                       placeholder="e.g. WL-12345678"
                       className="w-full bg-white border border-amber-300 rounded-lg px-4 py-2 focus:outline-none focus:border-brand-500"
                     />
                     {searchResults.length > 0 && (
                       <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden z-20">
                         {searchResults.map(w => (
                           <div key={w._id} className="p-3 hover:bg-slate-50 flex justify-between items-center border-b border-slate-100 last:border-0">
                             <div>
                               <div className="font-bold text-slate-900">{w.fullName}</div>
                               <div className="text-xs text-slate-500">{w.passportId} • {w.city}</div>
                             </div>
                             <button 
                               onClick={() => sendInviteMutation.mutate(w._id)}
                               className="px-3 py-1 bg-brand-600 text-white text-xs font-bold rounded-lg hover:bg-brand-700 transition"
                             >
                               Invite
                             </button>
                           </div>
                         ))}
                       </div>
                     )}
                   </div>

                   <div>
                     <h5 className="font-bold text-sm text-amber-900 mb-2">Sent Invites</h5>
                     {sentInvites.length === 0 ? <div className="text-sm text-amber-700 italic">No invites sent yet.</div> : (
                       <div className="space-y-2 max-h-48 overflow-y-auto">
                         {sentInvites.map((inv: any) => (
                           <div key={inv._id} className="bg-white p-3 rounded-lg border border-amber-200 flex justify-between items-center text-sm">
                             <div><span className="font-bold">{inv.worker?.fullName}</span> <span className="text-slate-500">({inv.worker?.passportId})</span></div>
                             <div>
                               {inv.status === 'Pending' && <span className="text-amber-600 font-semibold">Pending</span>}
                               {inv.status === 'Accepted' && <span className="text-green-600 font-semibold">Accepted</span>}
                               {inv.status === 'Rejected' && <span className="text-red-600 font-semibold">Rejected</span>}
                               {inv.status === 'Expired' && <span className="text-slate-500 font-semibold">Expired</span>}
                             </div>
                           </div>
                         ))}
                       </div>
                     )}
                   </div>
                 </div>
               )}

               {profile?.contractorStatus === 'Approved' && (
                 <div className="px-4 py-3 bg-green-50 text-green-700 font-bold rounded-lg inline-block">Verified Contractor (Commission: {profile?.commissionRate || 5}%)</div>
               )}
            </div>

          </div>
        )}

        {/* --- TEAM/AGENCY TAB --- */}
        {activeTab === 'team' && profile?.contractorStatus === 'Approved' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-900">My Agency Team</h2>
                <p className="text-sm text-slate-500 mt-1">Manage profiles and passports for workers without smartphones.</p>
              </div>
              <button 
                onClick={() => setShowSubWorkerModal(true)}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg transition shadow-sm flex items-center gap-2"
              >
                + Add Sub-Worker
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
               {teamLoading && <div className="p-8 col-span-2 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>}
               {!teamLoading && teamMembers.length === 0 && (
                 <div className="col-span-2 bg-slate-50 border border-dashed border-slate-300 rounded-xl p-12 text-center">
                   <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                   <p className="font-bold text-slate-700 mb-1">Your team is empty</p>
                   <p className="text-sm text-slate-500">Create profiles for your workers to manage them here.</p>
                 </div>
               )}
               {!teamLoading && teamMembers.map((member: any) => (
                 <div key={member._id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center gap-4">
                      <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center font-bold text-brand-700 overflow-hidden">
                        {member.profileImage ? <img src={member.profileImage} className="w-full h-full object-cover" alt="Profile" /> : <User className="w-6 h-6" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{member.fullName}</h4>
                        <p className="text-xs text-slate-500">ID: {member.passportId}</p>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 text-sm text-slate-600 grid grid-cols-2 gap-2">
                      <div><span className="font-medium text-slate-900">Aadhaar:</span> XXXX-XXXX-{member.aadhaarNumber?.slice(-4)}</div>
                      <div><span className="font-medium text-slate-900">Skills:</span> {member.skills?.join(', ') || 'N/A'}</div>
                      <div className="col-span-2"><span className="font-medium text-slate-900">Location:</span> {member.city}, {member.state}</div>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* --- FIND JOBS TAB --- */}
        {activeTab === 'jobs' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
            {/* Job Feed */}
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Recommended Jobs Feed</h3>
                <span className="text-sm text-brand-600 font-medium">{matchedJobs.length} smart matches found</span>
              </div>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search jobs or skills..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:border-brand-500 w-full md:w-64 transition"
                />
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              </div>
            </div>
            <div className="divide-y divide-slate-100">
               {jobsLoading && (
                 <div className="p-8 text-center text-slate-500">
                   <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-500" />
                   Finding the best matches...
                 </div>
               )}

               {!jobsLoading && matchedJobs.length === 0 && (
                 <div className="p-12 text-center text-slate-500">
                    <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="font-medium text-slate-900">No matching jobs</p>
                    <p className="text-sm">Try adjusting your search or adding more skills to your profile.</p>
                 </div>
               )}

               {!jobsLoading && matchedJobs.map((job: any) => {
                 // Check if already applied
                 const hasApplied = applications.some((app: any) => app.job?._id === job._id && app.status !== 'Cancelled');

                 return (
                   <div key={job._id} className="p-6 hover:bg-slate-50 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                     <div>
                       <h4 className="font-bold text-slate-900 text-lg">{job.title}</h4>
                       <p className="text-sm text-slate-500 mb-2">
                         <Link to={`/employer/${job.employer?._id}`} className="hover:text-brand-600 hover:underline">
                           {job.employer?.company?.companyName || job.employer?.fullName || 'Verified Employer'}
                         </Link>
                         {' '}• {job.address || job.city}
                       </p>
                       <div className="flex flex-wrap gap-2 text-xs font-semibold mb-2">
                         <span className="px-2 py-1 bg-brand-50 text-brand-700 rounded">₹{job.dailyWage}/day</span>
                         <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded">{job.jobType}</span>
                         {job.matchScore > 0 && <span className="px-2 py-1 bg-green-50 text-green-700 rounded flex items-center gap-1"><Star className="w-3 h-3"/> Top Match</span>}
                       </div>
                       <p className="text-xs text-slate-400">Requires: {job.requiredSkills?.join(', ')}</p>
                     </div>
                     <div className="md:w-32 shrink-0 flex flex-col gap-2">
                       <button 
                         onClick={() => { setConfirmJob(job); setContractorWorkers(1); }}
                         disabled={applyMutation.isPending || hasApplied}
                         className="w-full py-2 rounded-lg text-sm font-medium transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed bg-brand-600 text-white hover:bg-brand-700"
                       >
                         {hasApplied ? 'Applied' : 'Apply Now'}
                       </button>
                     </div>
                   </div>
                 );
               })}
            </div>
          </div>
        )}

        {/* --- MY APPLICATIONS TAB --- */}
        {activeTab === 'applications' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Recent Applications</h3>
            </div>
            <div className="divide-y divide-slate-100">
               {appsLoading && (
                 <div className="p-8 text-center text-slate-500">
                   <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-500" />
                   Loading applications...
                 </div>
               )}

               {!appsLoading && applications.length === 0 && (
                 <div className="p-12 text-center text-slate-500">
                    <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="font-medium text-slate-900">No applications yet</p>
                    <p className="text-sm">You have not applied to any jobs. Discover jobs on the map!</p>
                 </div>
               )}

               {!appsLoading && applications.map((app: any) => (
                 <div key={app._id} className={`p-6 hover:bg-slate-50 transition flex flex-col md:flex-row md:justify-between md:items-center gap-4 ${app.status === 'Accepted' ? 'bg-green-50/50 border-l-4 border-green-500' : ''}`}>
                   <div>
                     {app.status === 'Accepted' && (
                       <div className="text-green-600 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                         <Star className="w-3 h-3 fill-green-600" /> You've been selected!
                       </div>
                     )}
                     <h4 className="font-bold text-slate-900">{app.job?.title}</h4>
                     <p className="text-sm text-slate-500 mb-2">
                        <Link to={`/employer/${app.job?.employer?._id}`} className="hover:text-brand-600 hover:underline">
                          {app.job?.employer?.company?.companyName || app.job?.employer?.fullName || 'Verified Employer'}
                        </Link>
                     </p>
                     
                     {app.appliedBy && app.appliedBy._id !== profile?._id && (
                       <p className="text-xs font-semibold text-brand-700 bg-brand-50 px-2 py-1 rounded w-fit mb-2">
                         Applied via Agency: {app.appliedBy.fullName}
                       </p>
                     )}
                     
                     {(app.status === 'Accepted' || app.status === 'Completed') && app.job?.employer?.user?.mobile && (
                       <div className="flex items-center gap-2 mt-2 mb-3 px-3 py-2 bg-slate-100 rounded-lg w-fit border border-slate-200">
                         <Phone className="w-4 h-4 text-brand-600" />
                         <span className="text-sm font-semibold text-slate-800">{app.job.employer.user.mobile}</span>
                         <span className="text-xs text-slate-500 ml-1">(Employer Contact)</span>
                       </div>
                     )}

                     <div className="flex gap-2 mt-2">
                       {app.status === 'Pending' && <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded">Pending</span>}
                       {app.status === 'Offer Sent' && <span className="px-2 py-1 bg-brand-50 text-brand-700 text-xs font-semibold rounded">Offer Received</span>}
                       {app.status === 'Accepted' && <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded">Confirmed / Scheduled</span>}
                       {app.status === 'Completed' && <span className="px-2 py-1 bg-slate-800 text-white text-xs font-semibold rounded">Completed</span>}
                       {app.status === 'Rejected' && <span className="px-2 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded">Rejected</span>}
                       {app.status === 'Cancelled' && <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded">Cancelled</span>}
                     </div>
                   </div>
                   <div className="flex flex-col gap-2 items-end">
                     <div className="flex gap-2">
                       {(app.status === 'Offer Sent' || app.status === 'Accepted' || app.status === 'Completed') && (
                         <button 
                           onClick={() => setSelectedOffer(app)}
                           className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition"
                         >
                           {app.status === 'Offer Sent' ? 'Review Schedule' : 'View Schedule'}
                         </button>
                       )}
                       
                       {app.status === 'Offer Sent' && (
                         <button 
                           onClick={() => updateStatusMutation.mutate({ id: app._id, status: 'Accepted' })}
                           disabled={updateStatusMutation.isPending}
                           className="px-4 py-2 bg-gradient-to-r from-brand-600 to-blue-500 text-white font-bold rounded-lg hover:shadow-lg transition shadow-sm"
                         >
                           Accept Schedule
                         </button>
                       )}

                       {app.status === 'Pending' && (
                         <button 
                           onClick={() => cancelMutation.mutate(app._id)}
                           disabled={cancelMutation.isPending}
                           className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium transition disabled:opacity-50"
                         >
                           {cancelMutation.isPending ? 'Cancelling...' : 'Cancel'}
                         </button>
                       )}

                       {app.status === 'Completed' && (
                         <button 
                           onClick={() => { setReviewAppId(app._id); setReviewModalOpen(true); }}
                           className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-lg hover:shadow-lg transition shadow-sm flex items-center gap-2"
                         >
                           <Star className="w-4 h-4 fill-white"/> Rate Employer
                         </button>
                       )}
                     </div>
                   </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        </div>
      </div>
    </div>

      {/* Review Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-[3000] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-slate-800 flex items-center gap-2"><Star className="w-5 h-5 text-amber-500 fill-amber-500"/> Rate Employer</h2>
              <button onClick={() => { setReviewModalOpen(false); setReviewAppId(null); }} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 space-y-4">
               <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Rating (1-5)</label>
                  <div className="flex gap-2">
                     {[1, 2, 3, 4, 5].map(num => (
                        <button 
                          key={num}
                          onClick={() => setReviewForm({ ...reviewForm, rating: num })}
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${reviewForm.rating >= num ? 'bg-amber-100 text-amber-500 scale-110' : 'bg-slate-100 text-slate-400'}`}
                        >
                           <Star className={`w-5 h-5 ${reviewForm.rating >= num ? 'fill-amber-500' : ''}`}/>
                        </button>
                     ))}
                  </div>
               </div>
               <div>
                 <label className="block text-sm font-semibold text-slate-700 mb-1">Feedback (Optional)</label>
                 <textarea 
                   rows={3} placeholder="Did the employer pay on time? Was the site safe?"
                   className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 outline-none focus:border-brand-500"
                   value={reviewForm.comment} onChange={e => setReviewForm({...reviewForm, comment: e.target.value})}
                 ></textarea>
               </div>
               <button 
                 onClick={() => submitReviewMutation.mutate()}
                 disabled={submitReviewMutation.isPending}
                 className="w-full py-3 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 disabled:opacity-50 transition"
               >
                 {submitReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Application Modal */}
      {confirmJob && (
        <div className="fixed inset-0 z-[3000] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">Confirm Application</h2>
              <button onClick={() => setConfirmJob(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 space-y-4">
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h3 className="font-bold text-slate-900 text-lg mb-1">{confirmJob.title}</h3>
                <p className="text-sm text-slate-500 mb-3">{confirmJob.employer?.company?.companyName || 'Verified Employer'}</p>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Wage</span>
                    <span className="font-semibold text-slate-800">₹{confirmJob.dailyWage}/day</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Timing</span>
                    <span className="font-semibold text-slate-800">{confirmJob.timing}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Location</span>
                    <span className="font-semibold text-slate-800">{confirmJob.address || confirmJob.city}</span>
                  </div>
                </div>
              </div>

              {profile?.contractorStatus === 'Approved' && (
                <div className="bg-brand-50 border border-brand-100 p-4 rounded-xl max-h-64 overflow-y-auto">
                  <label className="block text-sm font-bold text-brand-900 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Select Workers to Apply For
                  </label>
                  <p className="text-xs text-brand-700 mb-3">This job requires {confirmJob.workersRequired} workers. Select who will be assigned to this job.</p>
                  
                  <div className="space-y-2">
                    {/* Include themselves */}
                    <label className="flex items-center gap-3 p-2 bg-white rounded-lg border border-brand-200 cursor-pointer hover:bg-brand-50">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-brand-600 rounded border-brand-300 focus:ring-brand-500"
                        checked={selectedWorkers.includes(profile._id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedWorkers([...selectedWorkers, profile._id]);
                          else setSelectedWorkers(selectedWorkers.filter(id => id !== profile._id));
                        }}
                      />
                      <div>
                        <p className="font-bold text-sm text-slate-900">Myself ({profile.fullName})</p>
                      </div>
                    </label>

                    {/* Include team members */}
                    {teamMembers.map((member: any) => (
                      <label key={member._id} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-brand-200 cursor-pointer hover:bg-brand-50">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 text-brand-600 rounded border-brand-300 focus:ring-brand-500"
                          checked={selectedWorkers.includes(member._id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedWorkers([...selectedWorkers, member._id]);
                            else setSelectedWorkers(selectedWorkers.filter(id => id !== member._id));
                          }}
                        />
                        <div>
                          <p className="font-bold text-sm text-slate-900">{member.fullName}</p>
                          <p className="text-xs text-slate-500">{member.skills?.join(', ') || 'No specific skills'}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-brand-800 font-semibold mt-3">Selected: {selectedWorkers.length} / {confirmJob.workersRequired}</p>
                </div>
              )}

              <p className="text-xs text-slate-500 text-center">By confirming, you agree to show up on time and fulfill the job requirements.</p>

              <button 
                onClick={() => applyMutation.mutate({ 
                  jobId: confirmJob._id, 
                  workerIds: profile?.contractorStatus === 'Approved' ? selectedWorkers : [profile._id] 
                })}
                disabled={applyMutation.isPending || (profile?.contractorStatus === 'Approved' && (selectedWorkers.length === 0 || selectedWorkers.length > confirmJob.workersRequired))}
                className="w-full py-3 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 transition shadow-lg shadow-brand-500/20 disabled:opacity-50"
              >
                {applyMutation.isPending ? 'Submitting...' : 'Confirm & Apply'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[2000] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-slate-800">Complete Your Profile</h2>
              <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Skills (comma separated)</label>
                <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500" placeholder="e.g. Masonry, Plumbing" value={editForm.skills} onChange={e => setEditForm({...editForm, skills: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Languages (comma separated)</label>
                <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500" placeholder="e.g. Hindi, English" value={editForm.languages} onChange={e => setEditForm({...editForm, languages: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Experience (Years)</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500" value={editForm.experienceYears} onChange={e => setEditForm({...editForm, experienceYears: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Preferred Wage (₹/day)</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500" value={editForm.preferredWage} onChange={e => setEditForm({...editForm, preferredWage: Number(e.target.value)})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Availability</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500" value={editForm.availabilityStatus} onChange={e => setEditForm({...editForm, availabilityStatus: e.target.value})}>
                  <option>Available Today</option>
                  <option>Available This Week</option>
                  <option>Currently Working</option>
                  <option>Not Available</option>
                </select>
              </div>
              <div className="pt-2 border-t border-slate-100 mt-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 text-brand-600 rounded" checked={editForm.isContractor} onChange={e => setEditForm({...editForm, isContractor: e.target.checked})} />
                  I am a Contractor (I manage a team)
                </label>
                {editForm.isContractor && (
                  <div className="mt-3 pl-6 border-l-2 border-brand-200">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Total Team Size (including yourself)</label>
                    <input type="number" min={1} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500" value={editForm.teamSize} onChange={e => setEditForm({...editForm, teamSize: Number(e.target.value)})} />
                  </div>
                )}
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full bg-brand-600 text-white rounded-lg py-2.5 font-medium hover:bg-brand-700 transition shadow-lg shadow-brand-500/20">
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Offer Details Modal */}
      {selectedOffer && (
        <div className="fixed inset-0 z-[3000] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-slate-800 flex items-center gap-2"><Briefcase className="w-5 h-5 text-brand-600"/> Job Offer Details</h2>
              <button onClick={() => setSelectedOffer(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-1">{selectedOffer.job?.title}</h3>
                <p className="text-brand-600 font-semibold">{selectedOffer.job?.employer?.company?.companyName || 'Verified Employer'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 font-medium mb-1">Salary</p>
                  <p className="font-bold text-lg text-slate-900">₹{selectedOffer.job?.dailyWage} / day</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 font-medium mb-1">Duration</p>
                  <p className="font-bold text-lg text-slate-900">{selectedOffer.job?.workDuration}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Confirmed Schedule</p>
                    <p className="text-sm font-bold text-brand-600">
                      {selectedOffer.job?.startDate ? new Date(selectedOffer.job.startDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Flexible Date'} 
                      {' '}at {selectedOffer.job?.reportingTime || '9:00 AM'} Sharp
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Working Hours</p>
                    <p className="text-sm text-slate-600">{selectedOffer.job?.timing || 'Flexible'}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Exact Location</p>
                    <p className="text-sm text-slate-600">{selectedOffer.job?.address}</p>
                  </div>
                </div>
                
                {selectedOffer.job?.employer?.user?.mobile && (
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Contact Employer</p>
                      <p className="text-sm font-bold text-slate-800">{selectedOffer.job.employer.user.mobile}</p>
                    </div>
                  </div>
                )}
              </div>

              {(selectedOffer.job?.perks?.accommodationAvailable || selectedOffer.job?.perks?.foodAvailable || selectedOffer.job?.perks?.transportAvailable) && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-3">Included Perks</h4>
                  <div className="space-y-2">
                    {selectedOffer.job.perks.accommodationAvailable && (
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-brand-500" /> Accommodation Provided
                      </div>
                    )}
                    {selectedOffer.job.perks.foodAvailable && (
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-brand-500" /> Meals Provided
                      </div>
                    )}
                    {selectedOffer.job.perks.transportAvailable && (
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-brand-500" /> Transportation Available
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
            
            {selectedOffer.status === 'Offer Sent' && (
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-col gap-3">
                <p className="text-xs text-slate-500 text-center mb-1">By accepting this offer, you commit to arriving at the specified time and location.</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setSelectedOffer(null)}
                    className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition"
                  >
                    Decline
                  </button>
                  <button 
                    onClick={() => {
                      updateStatusMutation.mutate({ id: selectedOffer._id, status: 'Accepted' });
                      setSelectedOffer(null);
                    }}
                    disabled={updateStatusMutation.isPending}
                    className="flex-1 py-3 bg-gradient-to-r from-brand-600 to-blue-500 text-white font-bold rounded-xl hover:shadow-lg transition shadow-sm"
                  >
                    Confirm Schedule & Accept
                  </button>
                </div>
              </div>
            )}
            
          </div>
        </div>
      )}

      {/* Digital Passport Modal */}
      {passportModalOpen && (
        <div className="fixed inset-0 z-[4000] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-brand-50 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-brand-200 rounded-full blur-3xl opacity-50"></div>
               <h2 className="text-2xl font-bold text-slate-900 relative z-10">Create Digital Passport</h2>
               <p className="text-slate-600 relative z-10 text-sm mt-1">Required to apply for verified jobs on WorkLink.</p>
               {!profile?.hasDigitalPassport && (
                  <button onClick={() => setPassportModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10"><X className="w-5 h-5"/></button>
               )}
            </div>
            <div className="p-6 space-y-5">
               <div>
                 <label className="block text-sm font-bold text-slate-700 mb-1">Date of Birth</label>
                 <input 
                   type="date"
                   className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 outline-none focus:border-brand-500 text-slate-700"
                   value={passportForm.dob} 
                   onChange={e => setPassportForm({...passportForm, dob: e.target.value})}
                 />
               </div>
               <div>
                 <label className="block text-sm font-bold text-slate-700 mb-1">Aadhaar Number</label>
                 <input 
                   type="text"
                   placeholder="12-digit Aadhaar Number"
                   maxLength={12}
                   className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 outline-none focus:border-brand-500 font-mono tracking-widest text-lg"
                   value={passportForm.aadhaarNumber} 
                   onChange={e => setPassportForm({...passportForm, aadhaarNumber: e.target.value})}
                 />
               </div>
               <div>
                 <label className="block text-sm font-bold text-slate-700 mb-1">Profile Photo URL (Optional)</label>
                 <input 
                   type="text"
                   placeholder="https://example.com/photo.jpg"
                   className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 outline-none focus:border-brand-500"
                   value={passportForm.profileImage} 
                   onChange={e => setPassportForm({...passportForm, profileImage: e.target.value})}
                 />
               </div>
               
               <div className="pt-4">
                 <button 
                   onClick={() => generatePassportMutation.mutate()}
                   disabled={generatePassportMutation.isPending || !passportForm.dob || passportForm.aadhaarNumber.length < 12}
                   className="w-full py-4 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 disabled:opacity-50 transition shadow-lg shadow-brand-500/30 flex justify-center items-center gap-2"
                 >
                   {generatePassportMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Award className="w-5 h-5" />}
                   Generate My Passport
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Worker Creation Modal */}
      {showSubWorkerModal && (
        <div className="fixed inset-0 z-[3000] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2"><User className="w-5 h-5 text-brand-600"/> Add Sub-Worker</h3>
              <button onClick={() => setShowSubWorkerModal(false)} className="text-slate-400 hover:text-slate-600 bg-white rounded-full p-1"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form onSubmit={(e) => { e.preventDefault(); createSubWorkerMutation.mutate(); }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                    <input type="text" required value={subWorkerForm.fullName} onChange={e => setSubWorkerForm({...subWorkerForm, fullName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500" placeholder="e.g. Rahul Kumar"/>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Date of Birth</label>
                    <input type="date" required value={subWorkerForm.dob} onChange={e => setSubWorkerForm({...subWorkerForm, dob: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"/>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Aadhaar Number</label>
                    <input type="text" required pattern="\d{12}" maxLength={12} value={subWorkerForm.aadhaarNumber} onChange={e => setSubWorkerForm({...subWorkerForm, aadhaarNumber: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500" placeholder="12 Digit Number"/>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">City</label>
                    <input type="text" required value={subWorkerForm.city} onChange={e => setSubWorkerForm({...subWorkerForm, city: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"/>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">State</label>
                    <input type="text" required value={subWorkerForm.state} onChange={e => setSubWorkerForm({...subWorkerForm, state: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"/>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Address</label>
                    <input type="text" required value={subWorkerForm.address} onChange={e => setSubWorkerForm({...subWorkerForm, address: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"/>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Skills (comma separated)</label>
                    <input type="text" required value={subWorkerForm.skills} onChange={e => setSubWorkerForm({...subWorkerForm, skills: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500" placeholder="e.g. Masonry, Plumbing, Loading"/>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Profile Image URL (Optional)</label>
                    <input type="url" value={subWorkerForm.profileImage} onChange={e => setSubWorkerForm({...subWorkerForm, profileImage: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500" placeholder="https://..."/>
                  </div>
                </div>
                
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setShowSubWorkerModal(false)} className="flex-1 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition">Cancel</button>
                  <button type="submit" disabled={createSubWorkerMutation.isPending} className="flex-1 py-2 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 transition disabled:opacity-50">
                    {createSubWorkerMutation.isPending ? 'Saving...' : 'Create Profile'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Legal Agreement Modal */}
      {showLegalAgreement && (
        <div className="fixed inset-0 z-[4000] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-brand-50 relative overflow-hidden shrink-0">
               <h2 className="text-2xl font-bold text-slate-900 relative z-10 flex items-center gap-2">
                 <Briefcase className="w-6 h-6 text-brand-600" /> Agency & Contractor Agreement
               </h2>
               <button onClick={() => setShowLegalAgreement(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 z-10"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-slate-50 flex-1 text-sm text-slate-700 space-y-4">
              <p className="font-bold text-slate-900 text-lg">Terms of Service for Contractors</p>
              <p>By applying to become a verified Contractor/Agency on WorkLink, you agree to the following terms and conditions:</p>
              
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900">1. Responsibilities and Conduct</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>You are responsible for the management, attendance, and conduct of the workers under your agency.</li>
                  <li>You must ensure that all workers you represent have a valid Digital Passport and verify their Aadhaar details.</li>
                  <li>You agree to show up on time with the exact number of workers you committed to providing for a job.</li>
                </ul>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900">2. Commission and Payments</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>As a verified contractor, you will earn a <strong>{profile?.commissionRate || 5}% commission</strong> on the total wages earned by the workers you provide for a job.</li>
                  <li>WorkLink facilitates the matching process but does not guarantee employment or payment. Disputes must be handled between you and the employer.</li>
                </ul>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900">3. Verification Requirement</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>To gain full verified status, you must successfully invite at least <strong>5 workers</strong> to join your agency within 24 hours of accepting this agreement.</li>
                  <li>Failure to meet this requirement may result in the suspension of your contractor privileges.</li>
                </ul>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-white shrink-0">
              <label className="flex items-start gap-3 p-3 bg-brand-50 rounded-lg border border-brand-200 cursor-pointer mb-4 hover:bg-brand-100 transition">
                <input 
                  type="checkbox" 
                  className="mt-0.5 w-5 h-5 text-brand-600 rounded border-brand-300 focus:ring-brand-500"
                  checked={agreementChecked}
                  onChange={(e) => setAgreementChecked(e.target.checked)}
                />
                <span className="text-sm font-semibold text-brand-900">
                  I have read and agree to the Agency & Contractor Terms of Service. I understand my responsibilities and the commission structure.
                </span>
              </label>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowLegalAgreement(false)} 
                  className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setShowLegalAgreement(false);
                    applyContractorMutation.mutate();
                  }}
                  disabled={!agreementChecked || applyContractorMutation.isPending}
                  className="flex-1 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition shadow-lg shadow-brand-500/20 disabled:opacity-50"
                >
                  {applyContractorMutation.isPending ? 'Processing...' : 'Accept & Start Agency'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={logout}
        title="Sign Out"
        description="Are you sure you want to sign out of your Worker account?"
        confirmText="Sign Out"
        cancelText="Cancel"
        type="danger"
      />

    </div>
  );
};

export default WorkerDashboard;
