import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Search, MapPin, Calendar, Clock, CheckCircle2, AlertCircle, 
  Eye, Wrench, XCircle, ArrowRight, User, ExternalLink, Image as ImageIcon
} from 'lucide-react';
import { complaintsAPI, getImageUrl } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export const TrackComplaintPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryId = searchParams.get('id') || '';

  const [searchInput, setSearchInput] = useState(queryId);
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  const fetchComplaint = async (idToSearch) => {
    if (!idToSearch || !idToSearch.trim()) return;
    try {
      setLoading(true);
      setError('');
      const res = await complaintsAPI.getById(idToSearch.trim());
      setComplaint(res.data);
    } catch (err) {
      console.error("Tracking lookup error:", err);
      setComplaint(null);
      setError(
        err.response?.status === 404
          ? `No complaint found with Reference ID '${idToSearch}'. Please check the ID and try again.`
          : 'Unable to retrieve complaint record. Please verify connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (queryId) {
      setSearchInput(queryId);
      fetchComplaint(queryId);
    }
  }, [queryId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ id: searchInput.trim().toUpperCase() });
      fetchComplaint(searchInput.trim().toUpperCase());
    }
  };

  // Helper to determine step progress in the 4-step timeline
  const getStepProgress = (status) => {
    switch (status) {
      case 'Submitted': return 1;
      case 'Under Review': return 2;
      case 'In Progress': return 3;
      case 'Resolved': return 4;
      case 'Rejected': return -1;
      default: return 1;
    }
  };

  const currentStep = complaint ? getStepProgress(complaint.status) : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="space-y-1 text-center sm:text-left">
        <span className="text-xs uppercase tracking-wider font-semibold text-teal-600">
          Public Verification & Status
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight">
          Track Civic Complaint
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Enter your unique reference number to inspect municipal progress, field inspection reports, and resolution notes.
        </p>
      </div>

      {/* SEARCH BOX */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Enter Complaint ID (e.g. CIT-2026-A101)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-navy-900 hover:bg-navy-800 disabled:opacity-70 text-white rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 shadow-xs"
          >
            {loading ? 'Searching...' : 'Track Status'}
          </button>
        </form>

        {/* Quick sample pills for testing */}
        <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
          <span className="font-semibold text-slate-600">Sample IDs to try:</span>
          {['CIT-2026-A101', 'CIT-2026-B202', 'CIT-2026-C303', 'CIT-2026-D404'].map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => {
                setSearchInput(sample);
                setSearchParams({ id: sample });
                fetchComplaint(sample);
              }}
              className="px-2 py-0.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 rounded font-mono transition"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-700">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <div className="space-y-1">
            <span className="font-semibold">{error}</span>
            <p className="text-slate-600">
              Ensure you included the full prefix, e.g. <code className="font-mono bg-white px-1 py-0.5 rounded">CIT-2026-A101</code>.
            </p>
          </div>
        </div>
      )}

      {/* COMPLAINT DETAILS & TIMELINE */}
      {complaint && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Main Card */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-6">
            
            {/* Top Bar with Reference & Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm font-extrabold text-navy-900 bg-slate-100 px-3 py-1 rounded-lg">
                    {complaint.complaint_id}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                    {complaint.category}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-navy-950 pt-1">
                  {complaint.title}
                </h2>
              </div>

              <div className="sm:text-right space-y-1">
                <StatusBadge status={complaint.status} size="lg" />
                <p className="text-[11px] text-slate-400">
                  Last Updated: {new Date(complaint.updated_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
            </div>

            {/* PROGRESS STEPPER (4 Steps) */}
            <div className="py-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">
                Resolution Workflow Progress
              </h4>

              {currentStep === -1 ? (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-xs text-rose-800">
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <div>
                    <span className="font-bold block">Complaint Status: Rejected</span>
                    <span>This ticket was reviewed and determined to be duplicate, out of municipal jurisdiction, or already covered by an existing work order.</span>
                  </div>
                </div>
              ) : (
                <div className="relative flex items-center justify-between max-w-2xl mx-auto">
                  {/* Connecting Line */}
                  <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-200 -z-0">
                    <div
                      className="h-full bg-teal-600 transition-all duration-500"
                      style={{
                        width: `${((currentStep - 1) / 3) * 100}%`,
                      }}
                    />
                  </div>

                  {/* 4 Steps */}
                  {[
                    { step: 1, label: 'Submitted', desc: 'Registered' },
                    { step: 2, label: 'Under Review', desc: 'Escalated' },
                    { step: 3, label: 'In Progress', desc: 'Work Order' },
                    { step: 4, label: 'Resolved', desc: 'Completed' },
                  ].map((s) => {
                    const isDone = currentStep >= s.step;
                    const isCurrent = currentStep === s.step;
                    return (
                      <div key={s.step} className="flex flex-col items-center relative z-10 text-center">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                            isDone
                              ? 'bg-teal-600 text-white ring-4 ring-teal-50'
                              : 'bg-white border-2 border-slate-300 text-slate-400'
                          }`}
                        >
                          {isDone ? <CheckCircle2 className="w-4 h-4" /> : s.step}
                        </div>
                        <span className={`text-[11px] font-bold mt-2 ${isCurrent ? 'text-teal-700' : isDone ? 'text-slate-800' : 'text-slate-400'}`}>
                          {s.label}
                        </span>
                        <span className="text-[9px] text-slate-400 hidden sm:block">
                          {s.desc}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* COMPLAINT DETAILS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100 text-xs">
              
              {/* Left 2 Cols: Description & Location */}
              <div className="md:col-span-2 space-y-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-700">Detailed Description</h4>
                  <p className="text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    {complaint.description}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-700">Location Information</h4>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
                    <div className="flex items-start gap-2 text-slate-700 font-medium">
                      <MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                      <span>{complaint.location}</span>
                    </div>

                    {complaint.latitude && complaint.longitude && (
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                        <span>Coordinates: {complaint.latitude}, {complaint.longitude}</span>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${complaint.latitude},${complaint.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-teal-600 hover:text-teal-700 font-semibold inline-flex items-center gap-1 hover:underline"
                        >
                          <span>Open in Map</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Col: Photograph & Citizen meta */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-700">Uploaded Defect Photo</h4>
                  {complaint.image_path ? (
                    <div
                      onClick={() => setSelectedImage(getImageUrl(complaint.image_path))}
                      className="cursor-pointer group relative rounded-xl overflow-hidden border border-slate-200 shadow-xs"
                    >
                      <img
                        src={getImageUrl(complaint.image_path)}
                        alt="Defect"
                        className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                        <ImageIcon className="w-4 h-4" />
                        <span>Click to Zoom</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-32 rounded-xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 text-center p-4">
                      <ImageIcon className="w-6 h-6 mb-1 text-slate-300" />
                      <span>No photograph uploaded</span>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1 text-[11px] text-slate-500">
                  <div className="font-semibold text-slate-700">Submitted by:</div>
                  <div>{complaint.citizen_name || 'Citizen'}</div>
                  <div className="text-[10px] text-slate-400">
                    Logged on {new Date(complaint.created_at).toLocaleDateString([], { dateStyle: 'long' })}
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* STATUS UPDATES TIMELINE (HISTORY) */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-6">
            <h3 className="text-base font-bold text-navy-950 flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" />
              <span>Official Activity & Resolution Log ({complaint.updates?.length || 0})</span>
            </h3>

            {complaint.updates && complaint.updates.length > 0 ? (
              <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {complaint.updates.map((up) => (
                  <div key={up.id} className="relative pl-8 space-y-1 text-xs">
                    {/* Timeline Dot */}
                    <div className="absolute left-2 top-1.5 w-3.5 h-3.5 -translate-x-1/2 rounded-full border-2 border-white bg-teal-600 ring-2 ring-teal-100" />
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={up.new_status} size="sm" />
                      <span className="text-[11px] font-semibold text-slate-500">
                        by {up.updated_by_name || 'Municipal Engineer'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(up.created_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    {up.admin_note && (
                      <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed font-medium">
                        "{up.admin_note}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No updates logged yet.</p>
            )}
          </div>

        </div>
      )}

      {/* IMAGE ZOOM MODAL */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs cursor-pointer"
        >
          <div className="max-w-3xl max-h-[90vh] relative">
            <img
              src={selectedImage}
              alt="Enlarged defect"
              className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl"
            />
            <p className="text-center text-xs text-white/80 mt-2">Click anywhere to close</p>
          </div>
        </div>
      )}

    </div>
  );
};

export default TrackComplaintPage;
