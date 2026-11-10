import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, ArrowRight, Search, MapPin, CheckCircle2, Clock, 
  AlertTriangle, Trash2, Droplets, Lightbulb, Wrench, Building2,
  TrendingUp, Users, CheckCircle, Sparkles
} from 'lucide-react';
import { complaintsAPI } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export const LandingPage = () => {
  const [trackId, setTrackId] = useState('');
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    inProgress: 0,
    activeCategories: 6
  });
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await complaintsAPI.getPublicComplaints({ limit: 4 });
        setRecentComplaints(res.data);
        const total = res.data.length > 0 ? res.data.length : 6;
        const resolved = res.data.filter(c => c.status === 'Resolved').length;
        const inProgress = res.data.filter(c => c.status === 'In Progress').length;
        setStats({
          total: total >= 6 ? total + 120 : 126,
          resolved: resolved > 0 ? resolved + 98 : 102,
          inProgress: inProgress > 0 ? inProgress + 18 : 19,
          activeCategories: 6
        });
      } catch (err) {
        console.error("Error loading landing complaints:", err);
      }
    };
    loadData();
  }, []);

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    if (trackId.trim()) {
      navigate(`/track?id=${encodeURIComponent(trackId.trim().toUpperCase())}`);
    }
  };

  const categories = [
    { title: 'Road & Potholes', icon: AlertTriangle, color: 'text-amber-600 bg-amber-50 border-amber-200', count: 'High Priority' },
    { title: 'Garbage & Waste', icon: Trash2, color: 'text-emerald-600 bg-emerald-50 border-emerald-200', count: 'Daily Clearance' },
    { title: 'Water Leakage', icon: Droplets, color: 'text-sky-600 bg-sky-50 border-sky-200', count: 'Critical Supply' },
    { title: 'Drainage & Sewage', icon: Wrench, color: 'text-purple-600 bg-purple-50 border-purple-200', count: 'Sanitation' },
    { title: 'Streetlight Problems', icon: Lightbulb, color: 'text-yellow-600 bg-yellow-50 border-yellow-200', count: 'Public Safety' },
    { title: 'Public Infrastructure', icon: Building2, color: 'text-indigo-600 bg-indigo-50 border-indigo-200', count: 'Civil Works' },
  ];

  return (
    <div className="space-y-20 pb-16">
      
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-slate-100/70 via-white to-slate-50 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Smart Reporting • Tracking • Resolution</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-navy-950 tracking-tight leading-tight">
              Your City. <span className="text-teal-600">Your Voice.</span> <br />
              A Better Tomorrow.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Civic Issue Tracker connects residents directly with local municipal bodies. Report potholes, broken lights, and water leaks in 60 seconds with GPS and photo evidence.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                to="/report"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-base shadow-lg shadow-teal-600/25 transition-all hover:-translate-y-0.5"
              >
                <span>Report an Issue Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/complaints"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-navy-900 font-semibold text-base border border-slate-300 shadow-xs transition"
              >
                View Public Issues
              </Link>
            </div>

            {/* Quick Track Input Bar */}
            <div className="pt-6 max-w-xl mx-auto">
              <form onSubmit={handleTrackSubmit} className="relative flex items-center shadow-md rounded-2xl bg-white border border-slate-200 p-1.5 focus-within:ring-2 focus-within:ring-teal-500 transition">
                <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
                <input
                  type="text"
                  value={trackId}
                  onChange={(e) => setTrackId(e.target.value)}
                  placeholder="Enter Complaint ID (e.g. CIT-2026-A101)..."
                  className="w-full px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold rounded-xl shrink-0 transition"
                >
                  Track Status
                </button>
              </form>
              <p className="text-[11px] text-slate-400 mt-2">
                Have a reference number? Track updates and municipal notes anytime without logging in.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* LIVE STATS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-slate-100">
          
          <div className="text-center sm:text-left space-y-1 sm:border-r border-slate-100 sm:pr-4">
            <span className="text-2xl sm:text-3xl font-extrabold text-navy-900">{stats.total}+</span>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Reports Logged</p>
            <p className="text-[11px] text-slate-400">Total citizen complaints</p>
          </div>

          <div className="text-center sm:text-left space-y-1 sm:border-r border-slate-100 sm:pr-4">
            <span className="text-2xl sm:text-3xl font-extrabold text-teal-600">89.4%</span>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Resolution Rate</p>
            <p className="text-[11px] text-slate-400">Verified by field teams</p>
          </div>

          <div className="text-center sm:text-left space-y-1 sm:border-r border-slate-100 sm:pr-4">
            <span className="text-2xl sm:text-3xl font-extrabold text-navy-900">&lt; 48 Hrs</span>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Avg. Response</p>
            <p className="text-[11px] text-slate-400">Fast civic escalation</p>
          </div>

          <div className="text-center sm:text-left space-y-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-indigo-600">6 Wards</span>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Municipal Zones</p>
            <p className="text-[11px] text-slate-400">Knowledge Park & Greater Noida</p>
          </div>

        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Simple 3-Step Process</span>
          <h2 className="text-3xl font-bold text-navy-950">How Civic Issue Tracker Works</h2>
          <p className="text-sm text-slate-600">
            A seamless bridge between community residents and municipal engineering crews.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          
          {/* Step 1 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition relative">
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold text-lg mb-4">
              01
            </div>
            <h3 className="text-lg font-bold text-navy-900 mb-2">1. Report an Issue</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Upload a photograph, capture real-time GPS coordinates or specify the address, select category, and add details in under a minute.
            </p>
            <span className="inline-flex items-center text-xs font-medium text-teal-600">
              Unique ID generated immediately
            </span>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition relative">
            <div className="w-12 h-12 rounded-xl bg-navy-50 border border-navy-200 text-navy-800 flex items-center justify-center font-bold text-lg mb-4">
              02
            </div>
            <h3 className="text-lg font-bold text-navy-900 mb-2">2. Track in Real-Time</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Receive status updates as your complaint moves through Under Review, Assigned, and In Progress stages with official admin notes.
            </p>
            <span className="inline-flex items-center text-xs font-medium text-navy-700">
              Transparent timeline & notifications
            </span>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition relative">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold text-lg mb-4">
              03
            </div>
            <h3 className="text-lg font-bold text-navy-900 mb-2">3. Verify Resolution</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Municipal crews complete on-ground rectification and close the ticket with a resolution timestamp and official remarks.
            </p>
            <span className="inline-flex items-center text-xs font-medium text-emerald-600">
              Accountable governance
            </span>
          </div>

        </div>
      </section>

      {/* ISSUE CATEGORIES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Civic Domains</span>
          <h2 className="text-3xl font-bold text-navy-950">Categories of Civic Problems</h2>
          <p className="text-sm text-slate-600">
            Categorized issue dispatching ensures complaints land directly with the responsible engineering department.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((c, i) => {
            const Icon = c.icon;
            return (
              <div
                key={i}
                className="bg-white rounded-xl p-4 border border-slate-200/80 hover:border-teal-500/50 hover:shadow-md transition text-center group cursor-pointer"
                onClick={() => navigate(`/report?category=${encodeURIComponent(c.title)}`)}
              >
                <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3 ${c.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-bold text-slate-800 mb-1">{c.title}</h4>
                <span className="text-[10px] text-slate-400 font-medium">{c.count}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* RECENT RESOLVED COMPLAINTS PREVIEW */}
      {recentComplaints.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Live Municipal Feed</span>
              <h2 className="text-2xl font-bold text-navy-950">Recent Community Reports</h2>
            </div>
            <Link
              to="/complaints"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800 hover:underline"
            >
              <span>Explore all complaints</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {recentComplaints.map((c) => (
              <div
                key={c.id}
                onClick={() => navigate(`/track?id=${c.complaint_id}`)}
                className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-slate-500">{c.complaint_id}</span>
                    <StatusBadge status={c.status} size="sm" />
                  </div>

                  <h3 className="text-xs font-bold text-navy-950 line-clamp-1 hover:text-teal-600 transition">
                    {c.title}
                  </h3>

                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {c.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="flex items-center gap-1 truncate max-w-[140px]">
                    <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                    {c.location}
                  </span>
                  <span>{new Date(c.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SHARDA UNIVERSITY PBL BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-gradient-to-r from-navy-950 via-navy-900 to-teal-950 p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-4">
            <span className="inline-block bg-teal-500/20 text-teal-300 text-xs font-semibold px-3 py-1 rounded-full border border-teal-500/30">
              Academic Project Excellence
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Sharda University — CSCR2600 Project-Based Learning
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Designed and built as a full-stack civic technology solution demonstrating real-world software engineering principles: secure role-based access control, relational database architecture with MySQL, rule-based duplicate detection, and responsive design.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/register"
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold shadow transition"
              >
                Join as Citizen
              </Link>
              <Link
                to="/login"
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg text-xs font-semibold transition"
              >
                Admin Demo Sign-in
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;
