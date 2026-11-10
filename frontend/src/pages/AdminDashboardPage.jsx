import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Clock, CheckCircle2, Wrench, XCircle, Eye, 
  BarChart3, RefreshCw, Search, Filter, AlertCircle, Edit3, 
  User, Phone, Mail, MapPin, Calendar, ExternalLink, X, Check, Loader2 
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  CartesianGrid, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { adminAPI, getImageUrl } from '../services/api';
import StatusBadge from '../components/StatusBadge';

const PIE_COLORS = ['#0284c7', '#d97706', '#6366f1', '#059669', '#e11d48', '#8b5cf6'];

export const AdminDashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [search, setSearch] = useState('');
  
  // Status modal state
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [updateError, setUpdateError] = useState('');

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [dashRes, compRes] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getAllComplaints({
          status_filter: statusFilter !== 'All' ? statusFilter : undefined,
          category_filter: categoryFilter !== 'All' ? categoryFilter : undefined,
          search: search.trim() || undefined,
        })
      ]);
      setDashboardData(dashRes.data);
      setComplaints(compRes.data);
    } catch (err) {
      console.error("Admin dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [statusFilter, categoryFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadDashboard();
  };

  const openStatusModal = (comp) => {
    setSelectedComplaint(comp);
    setNewStatus(comp.status);
    setAdminNote('');
    setUpdateSuccess('');
    setUpdateError('');
  };

  const handleUpdateStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    try {
      setUpdatingStatus(true);
      setUpdateError('');
      const res = await adminAPI.updateStatus(selectedComplaint.complaint_id, {
        new_status: newStatus,
        admin_note: adminNote.trim() || `Status updated to ${newStatus} by Municipal Admin.`,
      });

      // Update local table and state
      setComplaints((prev) =>
        prev.map((c) => (c.id === selectedComplaint.id ? res.data : c))
      );
      setUpdateSuccess(`Status successfully updated to '${newStatus}'! Notification dispatched to citizen.`);
      setTimeout(() => {
        setSelectedComplaint(null);
        setUpdateSuccess('');
        // Reload dashboard analytics
        adminAPI.getDashboard().then((r) => setDashboardData(r.data)).catch(console.error);
      }, 1500);
    } catch (err) {
      console.error("Status update failed:", err);
      setUpdateError(err.response?.data?.detail || 'Failed to update complaint status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const stats = dashboardData?.stats || {
    total_complaints: 0,
    submitted: 0,
    under_review: 0,
    in_progress: 0,
    resolved: 0,
    rejected: 0,
    total_citizens: 0,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-navy-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-teal-500/20 text-teal-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-teal-500/30">
              Administrative Command Center
            </span>
            <span className="text-xs text-slate-400">Greater Noida Municipality</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Civic Grievance Management Console
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Review incoming citizen defect reports, assign field maintenance crews, and verify resolutions.
          </p>
        </div>

        <button
          onClick={loadDashboard}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Database</span>
        </button>
      </div>

      {/* TOP METRICS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total</span>
          <div className="text-2xl font-black text-navy-900">{stats.total_complaints}</div>
          <p className="text-[10px] text-slate-400">All wards</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-sky-600 uppercase tracking-wider">Submitted</span>
          <div className="text-2xl font-black text-sky-600">{stats.submitted}</div>
          <p className="text-[10px] text-slate-400">Awaiting intake</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">Under Review</span>
          <div className="text-2xl font-black text-amber-600">{stats.under_review}</div>
          <p className="text-[10px] text-slate-400">With engineers</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">In Progress</span>
          <div className="text-2xl font-black text-indigo-600">{stats.in_progress}</div>
          <p className="text-[10px] text-slate-400">Field work active</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Resolved</span>
          <div className="text-2xl font-black text-emerald-600">{stats.resolved}</div>
          <p className="text-[10px] text-slate-400">Successfully closed</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider">Rejected</span>
          <div className="text-2xl font-black text-rose-600">{stats.rejected}</div>
          <p className="text-[10px] text-slate-400">Duplicates / Invalid</p>
        </div>

      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Category Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-navy-950 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-teal-600" />
              <span>Complaints by Department / Category</span>
            </h3>
            <span className="text-[11px] text-slate-400">Live breakdown</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dashboardData?.category_distribution || []}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="category" 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }} 
                />
                <Bar dataKey="count" fill="#0d9488" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Intake Trend */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-navy-950 flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" />
              <span>Monthly Issue Inflow Trend</span>
            </h3>
            <span className="text-[11px] text-slate-400">Intake volume</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dashboardData?.monthly_trend || []}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }} 
                />
                <Bar dataKey="count" fill="#1e3a8a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* COMPLAINTS MANAGEMENT TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
        
        {/* Table Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <h2 className="text-base font-bold text-navy-950">Master Complaints Register</h2>
            <span className="text-xs bg-slate-100 font-mono font-bold text-slate-700 px-2.5 py-0.5 rounded-full">
              {complaints.length} records
            </span>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search ID, title, citizen..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </form>

            {/* Status select */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Review">Under Review</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 text-slate-500 font-semibold border-b border-slate-100">
                <th className="py-3 px-3">Complaint ID</th>
                <th className="py-3 px-3">Issue Title & Category</th>
                <th className="py-3 px-3">Citizen Contact</th>
                <th className="py-3 px-3">Location</th>
                <th className="py-3 px-3">Submitted</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {complaints.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No complaints matching your filters.
                  </td>
                </tr>
              ) : (
                complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-mono font-bold text-navy-950 whitespace-nowrap">
                      {c.complaint_id}
                    </td>

                    <td className="py-3 px-3 max-w-xs">
                      <div className="font-bold text-slate-900 truncate">{c.title}</div>
                      <span className="text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded font-medium">
                        {c.category}
                      </span>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">{c.citizen_name || 'Citizen'}</div>
                      <div className="text-[10px] text-slate-400">{c.citizen_mobile}</div>
                    </td>

                    <td className="py-3 px-3 max-w-[180px] truncate text-slate-600">
                      {c.location}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap text-slate-500 text-[11px]">
                      {new Date(c.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <StatusBadge status={c.status} size="sm" />
                    </td>

                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => openStatusModal(c)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold text-xs border border-teal-200 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Manage Status</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* UPDATE STATUS MODAL */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 my-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="space-y-0.5">
                <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded">
                  {selectedComplaint.complaint_id}
                </span>
                <h3 className="text-lg font-bold text-navy-950 pt-1">
                  Manage Resolution & Status
                </h3>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success / Error Banners */}
            {updateSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{updateSuccess}</span>
              </div>
            )}
            {updateError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{updateError}</span>
              </div>
            )}

            {/* Complaint Summary details */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs">
              <div className="font-bold text-slate-900">{selectedComplaint.title}</div>
              <p className="text-slate-600 leading-relaxed">{selectedComplaint.description}</p>
              
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500">
                <div><strong>Location:</strong> {selectedComplaint.location}</div>
                <div><strong>Category:</strong> {selectedComplaint.category}</div>
                <div><strong>Citizen:</strong> {selectedComplaint.citizen_name} ({selectedComplaint.citizen_mobile})</div>
                <div><strong>Current Status:</strong> {selectedComplaint.status}</div>
              </div>

              {selectedComplaint.image_path && (
                <div className="pt-2">
                  <span className="font-semibold block text-[11px] text-slate-700 mb-1">Attached Photo:</span>
                  <img
                    src={getImageUrl(selectedComplaint.image_path)}
                    alt="Defect"
                    className="w-36 h-24 object-cover rounded-lg border border-slate-200"
                  />
                </div>
              )}
            </div>

            {/* Status Change Form */}
            <form onSubmit={handleUpdateStatusSubmit} className="space-y-4 text-xs">
              
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800">Update Resolution Status *</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Submitted">Submitted (Waiting Review)</option>
                  <option value="Under Review">Under Review (Assigned to Engineering Dept)</option>
                  <option value="In Progress">In Progress (Work Order Dispatched on Site)</option>
                  <option value="Resolved">Resolved (Rectification Completed & Verified)</option>
                  <option value="Rejected">Rejected (Out of Scope / Duplicate)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800">Official Municipal Note / Remarks *</label>
                <textarea
                  rows={3}
                  required
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="e.g. Assigned to Road Repair Division Ward 4. Patching crew dispatched with asphalt mixer..."
                  className="w-full p-3 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed font-normal"
                />
                <span className="text-[10px] text-slate-400">
                  This note will appear on the citizen's tracking timeline and will trigger an in-app notification.
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="px-6 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-70 text-white rounded-xl font-bold shadow-md shadow-teal-600/20 transition flex items-center gap-2"
                >
                  {updatingStatus ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving to MySQL...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Commit Status Update</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboardPage;
