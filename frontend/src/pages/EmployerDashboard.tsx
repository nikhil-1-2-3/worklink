import React, { useState } from 'react';
import { Building2, Users, PlusCircle, CheckCircle2, Loader2, Briefcase, ShieldAlert, X, Edit3, Star, Award, Phone, Calendar } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Navigate, Link } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

const EmployerDashboard = () => {
  const { user, logout } = useAuthStore();
  const queryClient = useQueryClient();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [viewingJobId, setViewingJobId] = useState<string | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewAppId, setReviewAppId] = useState<string | null>(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  
  const [editForm, setEditForm] = useState({
    fullName: '',
    companyName: '',
    registrationNumber: '',
    address: '',
    city: '',
    state: ''
  });

  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    address: '',
    city: 'Delhi',
    workersRequired: 1,
    dailyWage: 500,
    skillsRequired: '',
    startDate: new Date(),
    endDate: new Date(Date.now() + 86400000 * 7), // Default 1 week from now
    reportingTime: '9:00 AM',
    jobType: 'Daily Wage',
    timing: '9:00 AM to 5:00 PM',
    perks: {
      accommodationAvailable: false,
      transportAvailable: false,
      foodAvailable: false
    }
  });

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['employer-profile'],
    queryFn: async () => {
      const { data } = await api.get('/employer/profile');
      return data;
    }
  });

  const { data: jobs = [], isLoading, isError } = useQuery({
    queryKey: ['employer-jobs'],
    queryFn: async () => {
      const { data } = await api.get('/jobs/employer');
      return data;
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['employer-stats'],
    queryFn: async () => {
      const { data } = await api.get('/employer/stats');
      return data;
    }
  });

  const { data: applicants = [], isLoading: appsLoading } = useQuery({
    queryKey: ['job-applicants', viewingJobId],
    queryFn: async () => {
      if (!viewingJobId) return [];
      const { data } = await api.get(`/applications/job/${viewingJobId}`);
      return data;
    },
    enabled: !!viewingJobId
  });

  const updateAppMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { data } = await api.put(`/applications/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-applicants', viewingJobId] });
      queryClient.invalidateQueries({ queryKey: ['employer-stats'] });
      queryClient.invalidateQueries({ queryKey: ['employer-jobs'] });
    }
  });

  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/applications/${reviewAppId}/review`, { 
        rating: reviewForm.rating, 
        comment: reviewForm.comment 
      });
      return data;
    },
    onSuccess: () => {
      setReviewModalOpen(false);
      setReviewAppId(null);
      setReviewForm({ rating: 5, comment: '' });
      alert("Review submitted successfully!");
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to submit review');
    }
  });



  const handleEditOpen = () => {
    if (profile) {
      setEditForm({
        fullName: profile.fullName || '',
        companyName: profile.company?.companyName || '',
        registrationNumber: profile.company?.registrationNumber || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || ''
      });
    }
    setIsEditing(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/employer/profile', editForm);
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['employer-profile'] });
    } catch (err) {
      console.error('Failed to update profile', err);
    }
  };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const diffTime = Math.abs(jobForm.endDate.getTime() - jobForm.startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
      const computedDuration = `${diffDays} Day${diffDays > 1 ? 's' : ''}`;

      await api.post('/jobs', {
        ...jobForm,
        requiredSkills: jobForm.skillsRequired.split(',').map(s => s.trim()).filter(Boolean),
        category: 'Construction',
        startDate: jobForm.startDate,
        endDate: jobForm.endDate,
        workDuration: computedDuration,
        jobType: 'Daily Wage',
        workloadLevel: 'Medium'
      });
      setIsPosting(false);
      setJobForm({
        title: '', description: '', address: '', city: 'Delhi',
        workersRequired: 1, dailyWage: 500, skillsRequired: '', jobType: 'Daily Wage',
        timing: '9:00 AM to 5:00 PM',
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000 * 7),
        reportingTime: '9:00 AM',
        perks: { accommodationAvailable: false, transportAvailable: false, foodAvailable: false }
      });
      queryClient.invalidateQueries({ queryKey: ['employer-jobs'] });
      alert("Job posted successfully!");
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to post job');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="WorkLink Logo" className="h-12 object-contain scale-125" />
            <span className="text-xl font-bold text-slate-900">Employer</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-block text-sm font-medium text-slate-600">Hi, {profile?.fullName || user.fullName || 'Employer'}</span>
            <Button variant="ghost" onClick={handleEditOpen}>Account</Button>
            <Button variant="ghost" onClick={() => setShowLogoutConfirm(true)} className="text-red-600 hover:text-red-700 hover:bg-red-50">Logout</Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-slate-500 text-sm font-medium mb-1">Active Jobs</p>
            <h3 className="text-3xl font-bold text-slate-900">
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : stats?.activeJobs || jobs.length}
            </h3>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-slate-500 text-sm font-medium mb-1">Total Applicants</p>
            <h3 className="text-3xl font-bold text-brand-600">
              {stats?.totalApplicants || 0}
            </h3>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-slate-500 text-sm font-medium mb-1">Hired Workers</p>
            <h3 className="text-3xl font-bold text-slate-900">
              {stats?.hiredWorkers || 0}
            </h3>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-slate-500 text-sm font-medium mb-1">Profile Completion</p>
            <h3 className="text-3xl font-bold text-amber-500 flex items-center gap-1">
              {profile?.company?.registrationNumber && profile?.fullName ? '100%' : '50%'} 
            </h3>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Main Content (Jobs list) */}
          <div className="md:col-span-2 space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-900">Your Postings</h2>
              <button 
                onClick={() => setIsPosting(true)}
                className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition flex items-center gap-2 shadow-lg shadow-brand-500/20"
              >
                <PlusCircle className="w-4 h-4" /> Post New Job
              </button>
            </div>



            <div className="space-y-4">
              {isLoading && (
                 <div className="p-8 text-center text-slate-500 bg-white rounded-2xl shadow-sm border border-slate-100">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-500" />
                    Loading your jobs...
                 </div>
              )}

              {!isLoading && jobs.length === 0 && (
                <div className="p-12 text-center bg-white rounded-2xl shadow-sm border border-slate-100">
                  <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-900 mb-2">No jobs available now</h3>
                  <p className="text-slate-500">You haven't posted any jobs yet. Click 'Post New Job' to get started.</p>
                </div>
              )}

              {!isLoading && jobs.map((job: any) => (
                <div key={job._id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-brand-200 transition">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">{job.title}</h3>
                      <p className="text-sm text-slate-500">{job.address} • {new Date(job.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-bold">{job.status}</span>
                  </div>
                  
                  <div className="flex gap-4 mb-6">
                    <div className="bg-slate-50 px-4 py-2 rounded-lg">
                      <p className="text-xs text-slate-500 font-medium">Workers Needed</p>
                      <p className="font-bold text-slate-900">{job.workersRequired}</p>
                    </div>
                    <div className="bg-slate-50 px-4 py-2 rounded-lg">
                      <p className="text-xs text-slate-500 font-medium">Daily Wage</p>
                      <p className="font-bold text-brand-600">₹{job.dailyWage}</p>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                       Manage Applications
                    </div>
                    <button 
                      onClick={() => setViewingJobId(job._id)}
                      className="px-4 py-2 bg-slate-100 text-brand-600 font-medium rounded-lg hover:bg-brand-50 transition"
                    >
                      View Applicants
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-brand-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{profile?.company?.companyName || 'Setup Your Company'}</h3>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-4">Manage your profile and access our smart matching engine once verified.</p>
              <button onClick={handleEditOpen} className="w-full py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition">
                Edit Company Profile
              </button>
            </div>
            
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-sm text-white">
              <Users className="w-8 h-8 mb-4 text-brand-400" />
              <h3 className="font-bold text-lg mb-2">Smart Matching</h3>
              <p className="text-sm text-slate-300 mb-4">Our AI will automatically recommend verified workers near your project location.</p>
              <button className="text-brand-400 text-sm font-medium hover:text-brand-300 transition">Explore Matches →</button>
            </div>
          </div>
        </div>

      </div>


      {/* Post Job Modal */}
      {isPosting && (
        <div className="fixed inset-0 z-[2000] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0 rounded-t-2xl">
              <h2 className="font-bold text-slate-800 flex items-center gap-2"><PlusCircle className="w-5 h-5 text-brand-600"/> Post New Job</h2>
              <button onClick={() => setIsPosting(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handlePostJob} className="p-6 space-y-5 overflow-y-auto flex-1">
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Job Title</label>
                <input 
                  type="text" required placeholder="e.g. Need 5 Masons for construction"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 outline-none focus:border-brand-500"
                  value={jobForm.title} onChange={e => setJobForm({...jobForm, title: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea 
                  required placeholder="Describe the work required..." rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 outline-none focus:border-brand-500"
                  value={jobForm.description} onChange={e => setJobForm({...jobForm, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Workers Needed</label>
                  <input 
                    type="number" min="1" required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 outline-none focus:border-brand-500"
                    value={jobForm.workersRequired} onChange={e => setJobForm({...jobForm, workersRequired: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Daily Wage (₹)</label>
                  <input 
                    type="number" min="100" required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 outline-none focus:border-brand-500"
                    value={jobForm.dailyWage} onChange={e => setJobForm({...jobForm, dailyWage: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Project Address</label>
                <input 
                  type="text" required placeholder="Complete site address"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 outline-none focus:border-brand-500"
                  value={jobForm.address} onChange={e => setJobForm({...jobForm, address: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Required Skills (comma separated)</label>
                <input 
                  type="text" required placeholder="e.g. Masonry, Plumbing"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 outline-none focus:border-brand-500"
                  value={jobForm.skillsRequired} onChange={e => setJobForm({...jobForm, skillsRequired: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Start Date</label>
                  <DatePicker 
                    selected={jobForm.startDate} 
                    onChange={(date: Date | null) => date && setJobForm({...jobForm, startDate: date})}
                    minDate={new Date()}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 outline-none focus:border-brand-500"
                    dateFormat="dd MMM yyyy"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">End Date</label>
                  <DatePicker 
                    selected={jobForm.endDate} 
                    onChange={(date: Date | null) => date && setJobForm({...jobForm, endDate: date})}
                    minDate={jobForm.startDate}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 outline-none focus:border-brand-500"
                    dateFormat="dd MMM yyyy"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Reporting Time</label>
                  <input 
                    type="time" required 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 outline-none focus:border-brand-500"
                    value={jobForm.reportingTime} onChange={e => setJobForm({...jobForm, reportingTime: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Working Hours (Timing)</label>
                  <input 
                    type="text" required placeholder="e.g. 9:00 AM to 6:00 PM"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 outline-none focus:border-brand-500"
                    value={jobForm.timing} onChange={e => setJobForm({...jobForm, timing: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Additional Perks Provided</label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={jobForm.perks.accommodationAvailable} onChange={e => setJobForm({...jobForm, perks: {...jobForm.perks, accommodationAvailable: e.target.checked}})} className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500" />
                    <span className="text-sm text-slate-700 font-medium">Accommodation</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={jobForm.perks.transportAvailable} onChange={e => setJobForm({...jobForm, perks: {...jobForm.perks, transportAvailable: e.target.checked}})} className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500" />
                    <span className="text-sm text-slate-700 font-medium">Transportation</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={jobForm.perks.foodAvailable} onChange={e => setJobForm({...jobForm, perks: {...jobForm.perks, foodAvailable: e.target.checked}})} className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500" />
                    <span className="text-sm text-slate-700 font-medium">Food / Meals</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsPosting(false)} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 bg-brand-600 text-white font-medium hover:bg-brand-700 rounded-lg transition shadow-lg shadow-brand-500/20">
                  Publish Job
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Applicants Modal */}
      {viewingJobId && (
        <div className="fixed inset-0 z-[2000] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-slate-800 flex items-center gap-2"><Users className="w-5 h-5 text-brand-600"/> Job Applicants</h2>
              <button onClick={() => setViewingJobId(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-0 overflow-y-auto flex-1">
              {appsLoading ? (
                <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-500"/></div>
              ) : applicants.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="font-medium text-slate-900">No applicants yet</p>
                  <p className="text-sm">When workers apply, they will appear here.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {applicants.map((app: any) => (
                    <div key={app._id} className="p-6 hover:bg-slate-50 transition flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-slate-900">{app.worker?.fullName || 'Worker'}</h4>
                          {app.worker?.averageRating > 0 && (
                            <span className="flex items-center text-amber-500 text-xs font-bold gap-0.5">
                              <Star className="w-3 h-3 fill-amber-500" /> {app.worker.averageRating}
                            </span>
                          )}
                          {app.appliedBy && (
                            <span className="px-2 py-0.5 bg-brand-100 text-brand-800 text-[10px] font-bold uppercase rounded border border-brand-200">
                              Team: {app.appliedBy.fullName}
                            </span>
                          )}
                          {app.worker?.averageRating > 0 && (
                            <span className="flex items-center text-amber-500 text-xs font-bold gap-0.5">
                              <Star className="w-3 h-3 fill-amber-500" /> {app.worker.averageRating}
                            </span>
                          )}
                          {app.status === 'Pending' && <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold uppercase rounded">Pending</span>}
                          {app.status === 'Offer Sent' && <span className="px-2 py-0.5 bg-brand-50 text-brand-700 text-[10px] font-bold uppercase rounded border border-brand-200">Offer Sent</span>}
                          {app.status === 'Accepted' && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase rounded">Confirmed / Scheduled</span>}
                          {app.status === 'Completed' && <span className="px-2 py-0.5 bg-slate-800 text-white text-[10px] font-bold uppercase rounded">Completed</span>}
                          {app.status === 'Rejected' && <span className="px-2 py-0.5 bg-red-50 text-red-700 text-[10px] font-bold uppercase rounded">Rejected</span>}
                        </div>
                        <p className="text-sm text-slate-500">{app.worker?.city || 'Unknown Location'} • {app.worker?.experienceYears || 0} years experience</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {app.worker?.badges?.map((badge: string, i: number) => (
                            <span key={`b-${i}`} className="px-2 py-0.5 bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200 text-amber-800 rounded text-xs font-bold flex items-center gap-1 shadow-sm"><Award className="w-3 h-3 text-amber-600"/> {badge}</span>
                          ))}
                          {app.worker?.skills?.map((skill: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">{skill}</span>
                          ))}
                        </div>
                        {(app.status === 'Accepted' || app.status === 'Completed') && app.worker?.user?.mobile && (
                          <div className="flex items-center gap-2 mt-3 mb-1 px-3 py-2 bg-slate-100 rounded-lg w-fit border border-slate-200">
                            <Phone className="w-4 h-4 text-brand-600" />
                            <span className="text-sm font-semibold text-slate-800">{app.worker.user.mobile}</span>
                            <span className="text-xs text-slate-500 ml-1">(Worker Contact)</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        {app.status === 'Pending' && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => updateAppMutation.mutate({ id: app._id, status: 'Offer Sent' })}
                              disabled={updateAppMutation.isPending}
                              className="px-4 py-2 bg-brand-50 text-brand-600 font-bold text-sm rounded-lg hover:bg-brand-100 transition"
                              title="Send Offer to Worker"
                            >
                              Send Offer
                            </button>
                            <button 
                              onClick={() => updateAppMutation.mutate({ id: app._id, status: 'Rejected' })}
                              disabled={updateAppMutation.isPending}
                              className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                              title="Reject Worker"
                            >
                              <X className="w-5 h-5"/>
                            </button>
                          </div>
                        )}
                        {app.status === 'Offer Sent' && (
                          <span className="text-xs text-slate-500 italic">Waiting for worker to confirm schedule...</span>
                        )}
                        {app.status === 'Accepted' && (
                           <button 
                             onClick={() => updateAppMutation.mutate({ id: app._id, status: 'Completed' })}
                             disabled={updateAppMutation.isPending}
                             className="px-4 py-2 bg-blue-50 text-blue-600 font-bold text-sm rounded-lg hover:bg-blue-100 transition border border-blue-200"
                           >
                             Mark Completed
                           </button>
                        )}
                        {app.status === 'Completed' && (
                           <button 
                             onClick={() => { setReviewAppId(app._id); setReviewModalOpen(true); }}
                             className="px-4 py-2 bg-gradient-to-r from-brand-600 to-blue-500 text-white font-bold text-sm rounded-lg hover:shadow-lg transition flex items-center gap-2"
                           >
                             <Star className="w-4 h-4"/> Leave Review
                           </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-[3000] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-slate-800 flex items-center gap-2"><Star className="w-5 h-5 text-brand-600"/> Leave a Review</h2>
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
                 <label className="block text-sm font-semibold text-slate-700 mb-1">Feedback</label>
                 <textarea 
                   rows={3} required placeholder="How was the worker's performance?"
                   className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 outline-none focus:border-brand-500"
                   value={reviewForm.comment} onChange={e => setReviewForm({...reviewForm, comment: e.target.value})}
                 ></textarea>
               </div>
               <button 
                 onClick={() => submitReviewMutation.mutate()}
                 disabled={submitReviewMutation.isPending || !reviewForm.comment.trim()}
                 className="w-full py-3 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 disabled:opacity-50 transition"
               >
                 {submitReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[2000] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-slate-800 flex items-center gap-2"><Edit3 className="w-5 h-5 text-brand-600"/> Edit Profile</h2>
              <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Your Full Name</label>
                <input 
                  type="text" required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 outline-none focus:border-brand-500" 
                  value={editForm.fullName} 
                  onChange={e => setEditForm({...editForm, fullName: e.target.value})} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Company Name</label>
                  <input 
                    type="text" required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 outline-none focus:border-brand-500" 
                    value={editForm.companyName} 
                    onChange={e => setEditForm({...editForm, companyName: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Registration/GST No.</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 outline-none focus:border-brand-500" 
                    value={editForm.registrationNumber} 
                    onChange={e => setEditForm({...editForm, registrationNumber: e.target.value})} 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Business Address</label>
                <input 
                  type="text" required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 outline-none focus:border-brand-500" 
                  value={editForm.address} 
                  onChange={e => setEditForm({...editForm, address: e.target.value})} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">City</label>
                  <input 
                    type="text" required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 outline-none focus:border-brand-500" 
                    value={editForm.city} 
                    onChange={e => setEditForm({...editForm, city: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">State</label>
                  <input 
                    type="text" required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 outline-none focus:border-brand-500" 
                    value={editForm.state} 
                    onChange={e => setEditForm({...editForm, state: e.target.value})} 
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsEditing(false)} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 bg-brand-600 text-white font-medium hover:bg-brand-700 rounded-lg transition shadow-lg shadow-brand-500/20">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={logout}
        title="Sign Out"
        description="Are you sure you want to sign out of your Employer account?"
        confirmText="Sign Out"
        cancelText="Cancel"
        type="danger"
      />

    </div>
  );
};

export default EmployerDashboard;
