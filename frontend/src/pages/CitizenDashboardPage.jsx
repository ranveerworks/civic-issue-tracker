import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  PlusCircle, Clock, Wrench, CheckCircle2, AlertCircle, FileText, 
  MapPin, Calendar, ArrowRight, RefreshCw, BarChart3, Search
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { complaintsAPI } from '../services/api';
import StatusBadge from '../components/StatusBadge';

const COLORS = ['#0284c7', '#d97706', '#6366f1', '#059669', '#e11d48'];

export const CitizenDashboardPage = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await complaintsAPI.getMyComplaints({
        status_filter: statusFilter !== 'All' ? statusFilter : undefined,
        search: search.trim() || undefined,
      });
      setComplaints(res.data);
    } catch (err) {
      console.error("Failed to load citizen complaints:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchComplaints();
  };

  // Derive stats dynamically from live backend data
  const total = complaints.length;
  const pending = complaints.filter(c => c.status === 'Submitted' || c.status === 'Under Review').length;
  const inProgress = complaints.filter(c => c.status === 'In Progress').length;
  const resolved = complaints.filter(c => c.status === 'Resolved').length;
  const rejected = complaints.filter(c => c.status === 'Rejected').length;

  // Recharts chart data
  const chartData = [
    { name: 'Submitted', value: complaints.filter(c => c.status === 'Submitted').length },
    { name: 'Under Review', value: complaints.filter(c => c.status === 'Under Review').length },
    { name: 'In Progress', value: inProgress },
    { name: 'Resolved', value: resolved },
    { name: 'Rejected', value: rejected },
  ].filter(item => item.value > 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner & Quick Report Action */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-teal-950 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-xs uppercase tracking-wider font-semibold text-teal-400">
            Citizen Grievance Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.full_name || 'Citizen'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Monitor, track, and manage your reported civic issues in real-time.
          </p>
        </div>

        <Link
          to="/report"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm shadow-md shadow-teal-950/40 transition hover:scale-102"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Report New Issue</span>
        </Link>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Total Submitted */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Filed</span>
            <div className="text-2xl font-black text-navy-900">{total}</div>
            <p className="text-[10px] text-slate-400">Lifetime submitted</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Review */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Pending</span>
            <div className="text-2xl font-black text-amber-600">{pending}</div>
            <p className="text-[10px] text-slate-400">Submitted & Under Review</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">In Progress</span>
            <div className="text-2xl font-black text-indigo-600">{inProgress}</div>
            <p className="text-[10px] text-slate-400">Active municipal work</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Wrench className="w-5 h-5" />
          </div>
        </div>

        {/* Resolved */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Resolved</span>
            <div className="text-2xl font-black text-emerald-600">{resolved}</div>
            <p className="text-[10px] text-slate-400">Successfully closed</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* DASHBOARD GRID: Chart & Filtered Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: My Complaints Table / Cards */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            
            {/* Filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {['All', 'Submitted', 'Under Review', 'In Progress', 'Resolved'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    statusFilter === st
                      ? 'bg-navy-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search my issues..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 bg-slate-50/50"
              />
            </form>

          </div>

          {/* Complaints List */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-navy-950 flex items-center gap-2">
                <span>My Submitted Complaints</span>
                <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
                  {complaints.length}
                </span>
              </h3>
              <button
                onClick={fetchComplaints}
                className="p-1.5 text-slate-500 hover:text-navy-900 rounded-lg transition"
                title="Refresh list"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs text-slate-500">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-600 mb-2" />
                Loading your complaints from database...
              </div>
            ) : complaints.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                  <FileText className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-700">No complaints found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {statusFilter !== 'All' 
                    ? `You have no complaints currently with status '${statusFilter}'.`
                    : "You haven't submitted any civic complaints yet."}
                </p>
                <Link
                  to="/report"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Report Your First Issue
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {complaints.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 hover:bg-slate-50/80 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-navy-900 bg-slate-100 px-2 py-0.5 rounded">
                          {c.complaint_id}
                        </span>
                        <StatusBadge status={c.status} size="sm" />
                        <span className="text-xs text-slate-500 font-medium bg-teal-50 text-teal-700 px-2 py-0.5 rounded">
                          {c.category}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-navy-950 hover:text-teal-600 transition">
                        {c.title}
                      </h4>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[200px]">{c.location}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                          {new Date(c.created_at).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>

                    <Link
                      to={`/track?id=${c.complaint_id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 text-xs font-semibold rounded-lg transition shrink-0"
                    >
                      <span>Track Details</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Personal Complaints Chart */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-navy-950 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-teal-600" />
              <span>Status Distribution</span>
            </h3>

            {chartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-xs text-slate-400 text-center">
                Submit complaints to view visual status breakdown.
              </div>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      wrapperStyle={{ fontSize: '11px' }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 space-y-1">
              <div className="font-semibold text-slate-800">Municipal Escalation SLA:</div>
              <p>Reports are reviewed within 24 hours of submission and assigned to ward engineering units.</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default CitizenDashboardPage;
