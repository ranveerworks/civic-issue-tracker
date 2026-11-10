import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Filter, MapPin, Calendar, ArrowRight, RefreshCw, AlertCircle, PlusCircle } from 'lucide-react';
import { complaintsAPI } from '../services/api';
import StatusBadge from '../components/StatusBadge';

const CATEGORIES = [
  'All',
  'Road and potholes',
  'Garbage and waste management',
  'Water leakage',
  'Drainage and sewage',
  'Streetlight problems',
  'Public infrastructure',
  'Other civic problems'
];

const STATUSES = ['All', 'Submitted', 'Under Review', 'In Progress', 'Resolved', 'Rejected'];

export const AllComplaintsPage = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await complaintsAPI.getPublicComplaints({
        category_filter: categoryFilter !== 'All' ? categoryFilter : undefined,
        status_filter: statusFilter !== 'All' ? statusFilter : undefined,
        search: search.trim() || undefined,
        limit: 60,
      });
      setComplaints(res.data);
    } catch (err) {
      console.error("Failed to load public complaints:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [categoryFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchComplaints();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs uppercase tracking-wider font-semibold text-teal-600">
            Community Transparency
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight">
            Public Civic Feed
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Browse reported infrastructure defects across Greater Noida & Delhi NCR.
          </p>
        </div>

        <Link
          to="/report"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md transition shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Report New Problem</span>
        </Link>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by ID, keyword, or landmark..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
            />
          </form>

          {/* Status Dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-semibold text-slate-500 shrink-0">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 w-full md:w-40"
            >
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchComplaints}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition shrink-0"
            title="Refresh feed"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition ${
                categoryFilter === cat
                  ? 'bg-navy-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* COMPLAINTS GRID */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-teal-600 mb-3" />
          Retrieving live complaints from municipal database...
        </div>
      ) : complaints.length === 0 ? (
        <div className="p-16 text-center space-y-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">No complaints matching your criteria</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try resetting filters or searching with a different term.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {complaints.map((c) => (
            <div
              key={c.id}
              onClick={() => navigate(`/track?id=${c.complaint_id}`)}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-3">
                
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-navy-900 bg-slate-100 px-2.5 py-0.5 rounded">
                    {c.complaint_id}
                  </span>
                  <StatusBadge status={c.status} size="sm" />
                </div>

                {/* Category badge */}
                <div>
                  <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                    {c.category}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold text-navy-950 group-hover:text-teal-600 transition line-clamp-2">
                  {c.title}
                </h3>

                {/* Description snippet */}
                <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                  {c.description}
                </p>
              </div>

              {/* Footer row */}
              <div className="pt-4 border-t border-slate-100 mt-4 space-y-2 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{c.location}</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(c.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>

                  <span className="text-teal-600 font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
                    Track <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default AllComplaintsPage;
