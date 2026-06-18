import React from 'react';
import { ShieldAlert, Users, Building, Activity, Check, X, Loader2, Briefcase, Eye, PhoneCall } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Navigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

const AdminDashboard = () => {
  const { user, logout } = useAuthStore();
  const queryClient = useQueryClient();
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

  const { data: pendingUsers = [], isLoading, isError } = useQuery({
    queryKey: ['pending-verifications'],
    queryFn: async () => {
      const { data } = await api.get('/admin/verifications/pending');
      return data;
    }
  });

  const { data: pendingContractors = [], isLoading: contractorsLoading } = useQuery({
    queryKey: ['admin-pending-contractors'],
    queryFn: async () => {
      const { data } = await api.get('/admin/contractors/pending');
      return data;
    }
  });

  const { data: allJobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['admin-all-jobs'],
    queryFn: async () => {
      const { data } = await api.get('/jobs');
      return data;
    }
  });

  const { data: allWorkers = [], isLoading: workersLoading } = useQuery({
    queryKey: ['admin-all-workers'],
    queryFn: async () => {
      const { data } = await api.get('/admin/workers');
      return data;
    }
  });

  const { data: allEmployers = [], isLoading: employersLoading } = useQuery({
    queryKey: ['admin-all-employers'],
    queryFn: async () => {
      const { data } = await api.get('/admin/employers');
      return data;
    }
  });

  const { data: callbacks = [], isLoading: callbacksLoading } = useQuery({
    queryKey: ['admin-support-callbacks'],
    queryFn: async () => {
      const { data } = await api.get('/support/callbacks');
      return data;
    }
  });

  const [viewingJobId, setViewingJobId] = React.useState<string | null>(null);
  
  const { data: applicants = [], isLoading: appsLoading } = useQuery({
    queryKey: ['admin-job-applicants', viewingJobId],
    queryFn: async () => {
      if (!viewingJobId) return [];
      const { data } = await api.get(`/applications/job/${viewingJobId}`);
      return data;
    },
    enabled: !!viewingJobId
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string, action: 'approve' | 'reject' }) => {
      const { data } = await api.put(`/admin/verifications/${id}`, { action });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-verifications'] });
    }
  });

  const resolveCallbackMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.put(`/support/callback/${id}/resolve`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-support-callbacks'] });
    }
  });

  const approveContractorMutation = useMutation({
    mutationFn: async ({ id, action, commissionRate }: { id: string, action: 'Approve' | 'Reject', commissionRate?: number }) => {
      const { data } = await api.put(`/admin/contractors/${id}/approve`, { action, commissionRate });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-contractors'] });
      queryClient.invalidateQueries({ queryKey: ['admin-all-workers'] });
    }
  });

  const [activeTab, setActiveTab] = React.useState('verifications');

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <div className="flex flex-col md:flex-row h-screen overflow-hidden">
        
        {/* Sidebar / Topnav on mobile */}
        <div className="w-full md:w-64 bg-slate-900 text-white flex flex-col shrink-0">
          <div className="p-4 md:p-6 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="WorkLink Logo" className="h-10 md:h-12 object-contain scale-125 origin-left" />
              <h1 className="font-bold text-xl md:text-2xl tracking-tight ml-2"><span className="text-red-500">Admin</span></h1>
            </div>
            <button onClick={() => useAuthStore.getState().logout()} className="md:hidden text-sm text-red-400 font-bold border border-red-900 px-3 py-1 rounded">Logout</button>
          </div>
          <div className="p-2 md:p-4 flex-1 overflow-x-auto md:overflow-y-auto">
            <nav className="flex md:flex-col gap-2 min-w-max md:min-w-0 pb-2 md:pb-0">
              <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-lg transition ${activeTab === 'dashboard' ? 'bg-brand-600 font-medium shadow-lg shadow-brand-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                <Activity className="w-4 md:w-5 h-4 md:h-5" /> <span className="text-sm md:text-base">Dashboard</span>
              </button>
              <button onClick={() => setActiveTab('verifications')} className={`flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-lg transition ${activeTab === 'verifications' ? 'bg-brand-600 font-medium shadow-lg shadow-brand-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                <ShieldAlert className="w-4 md:w-5 h-4 md:h-5" /> <span className="text-sm md:text-base">Verifications</span>
              </button>
              <button onClick={() => setActiveTab('workers')} className={`flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-lg transition ${activeTab === 'workers' ? 'bg-brand-600 font-medium shadow-lg shadow-brand-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                <Users className="w-4 md:w-5 h-4 md:h-5" /> <span className="text-sm md:text-base">Workers</span>
              </button>
              <button onClick={() => setActiveTab('contractors')} className={`flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-lg transition ${activeTab === 'contractors' ? 'bg-brand-600 font-medium shadow-lg shadow-brand-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                <Briefcase className="w-4 md:w-5 h-4 md:h-5" /> <span className="text-sm md:text-base">Contractors</span>
              </button>
              <button onClick={() => setActiveTab('employers')} className={`flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-lg transition ${activeTab === 'employers' ? 'bg-brand-600 font-medium shadow-lg shadow-brand-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                <Building className="w-4 md:w-5 h-4 md:h-5" /> <span className="text-sm md:text-base">Employers</span>
              </button>
              <button onClick={() => setActiveTab('jobs')} className={`flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-lg transition ${activeTab === 'jobs' ? 'bg-brand-600 font-medium shadow-lg shadow-brand-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                <Briefcase className="w-4 md:w-5 h-4 md:h-5" /> <span className="text-sm md:text-base">Jobs</span>
              </button>
              <button onClick={() => setActiveTab('support')} className={`flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-lg transition ${activeTab === 'support' ? 'bg-brand-600 font-medium shadow-lg shadow-brand-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                <PhoneCall className="w-4 md:w-5 h-4 md:h-5" /> <span className="text-sm md:text-base">Support CRM</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Main Area */}
        <div className="flex-1 overflow-y-auto">
          <header className="bg-white p-4 shadow-sm flex justify-between items-center sticky top-0 z-10">
            <h2 className="text-xl font-bold text-slate-800 capitalize">{activeTab}</h2>
            <div className="flex items-center gap-4">
              <div className="text-sm font-medium text-slate-600 hidden sm:block">{user?.email || 'Super Admin'}</div>
              <div className="w-10 h-10 rounded-full bg-brand-100 border-2 border-white shadow-sm flex items-center justify-center font-bold text-brand-700">SA</div>
              <Button 
                variant="ghost" 
                onClick={() => setShowLogoutConfirm(true)} 
                className="hidden md:inline-flex text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Logout
              </Button>
            </div>
          </header>

          <div className="p-6 md:p-8">
            {activeTab === 'dashboard' && (
              <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
                <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-900 mb-1">Dashboard Overview</h3>
                <p className="text-slate-500">Welcome to the Admin portal. Use the tabs on the left to manage the platform.</p>
              </div>
            )}

            {activeTab === 'contractors' && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Briefcase className="w-5 h-5 text-brand-600"/> Pending Contractor Applications</h3>
                  <span className="text-sm bg-brand-100 text-brand-800 font-bold px-3 py-1 rounded-full">{pendingContractors.length} Pending</span>
                </div>
                
                {contractorsLoading ? (
                  <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>
                ) : pendingContractors.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">No pending contractor applications.</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {pendingContractors.map((worker: any) => (
                      <div key={worker._id} className="p-6 hover:bg-slate-50 transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                            {worker.fullName}
                          </h4>
                          <p className="text-sm text-slate-600 mt-1">Mobile: <span className="font-medium text-slate-900">{worker.user?.mobile}</span> | Location: {worker.city}, {worker.state}</p>
                          <p className="text-xs text-slate-500 mt-1">Current Team Size: {worker.teamSize || 1}</p>
                        </div>
                        
                        <div className="flex gap-2 w-full md:w-auto">
                          <button 
                            onClick={() => {
                              const rateStr = prompt(`Enter commission rate percentage for ${worker.fullName} (e.g., 5 for 5%):`, "5");
                              const rate = rateStr ? parseFloat(rateStr) : 5;
                              if (confirm(`Approve ${worker.fullName} as a verified contractor with a ${rate}% commission rate?`)) {
                                approveContractorMutation.mutate({ id: worker._id, action: 'Approve', commissionRate: rate });
                              }
                            }}
                            className="flex-1 md:flex-none px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 font-bold rounded-lg transition"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => {
                              if (confirm(`Reject this contractor application?`)) {
                                approveContractorMutation.mutate({ id: worker._id, action: 'Reject' });
                              }
                            }}
                            className="flex-1 md:flex-none px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 font-bold rounded-lg transition"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'support' && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><PhoneCall className="w-5 h-5 text-brand-600"/> Call Back Requests</h3>
                  <span className="text-sm bg-brand-100 text-brand-800 font-bold px-3 py-1 rounded-full">{callbacks.filter((c:any) => c.status === 'Pending').length} Pending</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                        <th className="p-4 font-medium">Phone Number</th>
                        <th className="p-4 font-medium">Requested At</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {callbacksLoading ? (
                         <tr><td colSpan={4} className="p-8 text-center text-slate-500"><Loader2 className="w-6 h-6 animate-spin mx-auto"/></td></tr>
                      ) : callbacks.length === 0 ? (
                         <tr><td colSpan={4} className="p-8 text-center text-slate-500">No support requests yet.</td></tr>
                      ) : callbacks.map((request: any) => (
                        <tr key={request._id} className="hover:bg-slate-50 transition">
                          <td className="p-4 font-bold text-slate-800">{request.phoneNumber}</td>
                          <td className="p-4 text-slate-500 text-sm">{new Date(request.createdAt).toLocaleString()}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${request.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                              {request.status}
                            </span>
                          </td>
                          <td className="p-4">
                            {request.status === 'Pending' ? (
                              <button 
                                onClick={() => resolveCallbackMutation.mutate(request._id)}
                                disabled={resolveCallbackMutation.isPending}
                                className="px-3 py-1.5 bg-brand-600 text-white rounded text-sm font-bold hover:bg-brand-700 transition"
                              >
                                Mark Resolved
                              </button>
                            ) : (
                              <span className="text-slate-400 text-sm font-medium">Done</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'verifications' && (
              <>
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-amber-500">
                <p className="text-sm text-slate-500 font-medium mb-1">Pending Verifications</p>
                <p className="text-3xl font-bold text-slate-900">
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-slate-400" /> : pendingUsers.length}
                </p>
              </div>
            </div>

            {/* Pending Verifications Queue */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900">Verification Queue</h3>
                {verifyMutation.isPending && <span className="text-sm text-brand-600 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> Processing...</span>}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-sm">
                      <th className="p-4 font-medium">User Details</th>
                      <th className="p-4 font-medium">Type</th>
                      <th className="p-4 font-medium">Contact</th>
                      <th className="p-4 font-medium">Registered At</th>
                      <th className="p-4 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoading && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-500" />
                          Loading pending verifications...
                        </td>
                      </tr>
                    )}
                    
                    {!isLoading && pendingUsers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500">
                          <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                          No pending verifications found. All caught up!
                        </td>
                      </tr>
                    )}

                    {pendingUsers.map((pUser: any) => (
                      <tr key={pUser._id} className="hover:bg-slate-50 transition">
                        <td className="p-4">
                          <div className="font-medium text-slate-900">{pUser.details?.fullName || 'N/A'}</div>
                          <div className="text-xs text-slate-500">ID: {pUser._id}</div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            pUser.role === 'employer' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                          }`}>
                            {pUser.role.charAt(0).toUpperCase() + pUser.role.slice(1)}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-slate-900">{pUser.mobile}</div>
                          {pUser.role === 'worker' ? (
                            <div className="text-xs text-brand-600 font-medium bg-brand-50 inline-block px-1 rounded mt-1">Aadhaar: {pUser.details?.aadhaarNumber || 'Missing'}</div>
                          ) : (
                            <div className="text-xs text-blue-600 font-medium bg-blue-50 inline-block px-1 rounded mt-1">Reg: {pUser.details?.registrationNumber || 'Missing'}</div>
                          )}
                        </td>
                        <td className="p-4 text-sm text-slate-500">
                          {new Date(pUser.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 flex gap-2">
                          <button 
                            onClick={() => verifyMutation.mutate({ id: pUser._id, action: 'approve' })}
                            disabled={verifyMutation.isPending}
                            className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition disabled:opacity-50" 
                            title="Approve"
                          >
                            <Check className="w-4 h-4"/>
                          </button>
                          <button 
                            onClick={() => verifyMutation.mutate({ id: pUser._id, action: 'reject' })}
                            disabled={verifyMutation.isPending}
                            className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition disabled:opacity-50" 
                            title="Reject"
                          >
                            <X className="w-4 h-4"/>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            </>
            )}

            {activeTab === 'workers' && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-900">All Registered Workers</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-sm">
                        <th className="p-4 font-medium">Worker Name</th>
                        <th className="p-4 font-medium">Location</th>
                        <th className="p-4 font-medium">Experience & Wage</th>
                        <th className="p-4 font-medium">Skills</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {workersLoading && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-500">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-500" /> Loading workers...
                          </td>
                        </tr>
                      )}
                      {!workersLoading && allWorkers.map((worker: any) => (
                        <tr key={worker._id} className="hover:bg-slate-50 transition">
                          <td className="p-4">
                            <div className="font-medium text-slate-900">{worker.fullName}</div>
                            <div className="text-xs text-slate-500">{worker.user?.email || 'No email'}</div>
                          </td>
                          <td className="p-4 text-sm text-slate-900">{worker.city}, {worker.state}</td>
                          <td className="p-4">
                            <div className="text-sm font-medium">{worker.experienceYears || 0} years</div>
                            <div className="text-xs text-slate-500">Prefers ₹{worker.preferredWage}/day</div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              {worker.skills?.slice(0, 3).map((skill: string, i: number) => (
                                <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">{skill}</span>
                              ))}
                              {worker.skills?.length > 3 && <span className="px-2 py-0.5 text-xs text-slate-500">+{worker.skills.length - 3}</span>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'employers' && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-900">All Registered Employers</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-sm">
                        <th className="p-4 font-medium">Employer Name</th>
                        <th className="p-4 font-medium">Company</th>
                        <th className="p-4 font-medium">Location</th>
                        <th className="p-4 font-medium">Verified</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {employersLoading && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-500">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-500" /> Loading employers...
                          </td>
                        </tr>
                      )}
                      {!employersLoading && allEmployers.map((emp: any) => (
                        <tr key={emp._id} className="hover:bg-slate-50 transition">
                          <td className="p-4">
                            <div className="font-medium text-slate-900">{emp.fullName}</div>
                            <div className="text-xs text-slate-500">{emp.user?.email || 'No email'}</div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm font-bold text-slate-900">{emp.company?.companyName || 'Not setup'}</div>
                            {emp.company?.registrationNumber && <div className="text-xs text-slate-500">Reg: {emp.company.registrationNumber}</div>}
                          </td>
                          <td className="p-4 text-sm text-slate-900">{emp.city}, {emp.state}</td>
                          <td className="p-4">
                             {emp.user?.isVerified ? (
                               <span className="text-green-600 font-bold text-sm flex items-center gap-1"><Check className="w-4 h-4"/> Yes</span>
                             ) : (
                               <span className="text-amber-600 font-bold text-sm">No</span>
                             )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'jobs' && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-900">All Platform Jobs</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-sm">
                        <th className="p-4 font-medium">Job Title</th>
                        <th className="p-4 font-medium">Employer</th>
                        <th className="p-4 font-medium">Location</th>
                        <th className="p-4 font-medium">Wage / Type</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {jobsLoading && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-500">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-500" />
                            Loading jobs...
                          </td>
                        </tr>
                      )}
                      
                      {!jobsLoading && allJobs.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-500">
                            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            No jobs found on the platform.
                          </td>
                        </tr>
                      )}

                      {!jobsLoading && allJobs.map((job: any) => (
                        <tr key={job._id} className="hover:bg-slate-50 transition">
                          <td className="p-4">
                            <div className="font-medium text-slate-900">{job.title}</div>
                            <div className="text-xs text-slate-500">Created: {new Date(job.createdAt).toLocaleDateString()}</div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-slate-900">{job.employer?.company?.companyName || 'Verified Employer'}</div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-slate-900">{job.city || job.address}</div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-brand-600 font-bold">₹{job.dailyWage}/day</div>
                            <div className="text-xs text-slate-500 mt-1">{job.jobType}</div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              job.status === 'Open' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {job.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <button 
                              onClick={() => setViewingJobId(job._id)}
                              className="px-3 py-1.5 bg-brand-50 text-brand-700 hover:bg-brand-100 rounded text-xs font-bold flex items-center gap-1 transition"
                            >
                              <Eye className="w-3 h-3"/> Applicants
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Admin Applicants Modal (Read-Only) */}
      {viewingJobId && (
        <div className="fixed inset-0 z-[2000] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-slate-800 flex items-center gap-2"><Users className="w-5 h-5 text-brand-600"/> Job Applicants (Admin View)</h2>
              <button onClick={() => setViewingJobId(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-0 overflow-y-auto flex-1">
              {appsLoading ? (
                <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-500"/></div>
              ) : applicants.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="font-medium text-slate-900">No applicants yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {applicants.map((app: any) => (
                    <div key={app._id} className="p-6 hover:bg-slate-50 transition flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-slate-900">{app.worker?.fullName || 'Worker'}</h4>
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                            app.status === 'Accepted' ? 'bg-green-50 text-green-700' : 
                            app.status === 'Rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {app.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500">{app.worker?.city || 'Unknown Location'} • {app.worker?.experienceYears || 0} years experience</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={logout}
        title="Sign Out"
        description="Are you sure you want to sign out of the Admin Dashboard?"
        confirmText="Sign Out"
        cancelText="Cancel"
        type="danger"
      />

    </div>
  );
};

export default AdminDashboard;
