import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  PlusCircle, MapPin, Camera, Navigation, AlertTriangle, CheckCircle2, 
  Info, X, UploadCloud, ArrowRight, Copy, Check, Loader2 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { complaintsAPI } from '../services/api';

const CATEGORIES = [
  'Road and potholes',
  'Garbage and waste management',
  'Water leakage',
  'Drainage and sewage',
  'Streetlight problems',
  'Public infrastructure',
  'Other civic problems'
];

export const ReportIssuePage = () => {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || '';

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: initialCategory && CATEGORIES.includes(initialCategory) ? initialCategory : 'Road and potholes',
    location: '',
    latitude: '',
    longitude: '',
  });

  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successComplaint, setSuccessComplaint] = useState(null);
  const [copied, setCopied] = useState(false);

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  // Check for duplicate issues when title, category, or coordinates change
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (formData.title.trim().length >= 5 && formData.location.trim().length >= 3) {
        try {
          setCheckingDuplicates(true);
          const res = await complaintsAPI.checkDuplicate({
            title: formData.title,
            description: formData.description || formData.title,
            category: formData.category,
            location: formData.location,
            latitude: formData.latitude ? parseFloat(formData.latitude) : null,
            longitude: formData.longitude ? parseFloat(formData.longitude) : null,
          });
          if (res.data.has_potential_duplicates && res.data.potential_matches.length > 0) {
            setDuplicateWarning(res.data);
          } else {
            setDuplicateWarning(null);
          }
        } catch (err) {
          console.error("Duplicate check error:", err);
        } finally {
          setCheckingDuplicates(false);
        }
      } else {
        setDuplicateWarning(null);
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [formData.title, formData.category, formData.location, formData.latitude, formData.longitude]);

  // Handle GPS location via browser API
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setGpsStatus('Geolocation is not supported by your browser.');
      return;
    }

    setDetectingLocation(true);
    setGpsStatus('Acquiring high-accuracy GPS coordinates...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lon = position.coords.longitude.toFixed(6);
        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lon,
          // Pre-fill location if empty
          location: prev.location || `GPS Location: ${lat}, ${lon} (Near Greater Noida)`,
        }));
        setDetectingLocation(false);
        setGpsStatus(`GPS coordinates locked: ${lat}, ${lon}`);
      },
      (err) => {
        console.warn("Geolocation error:", err);
        setDetectingLocation(false);
        setGpsStatus('Unable to access location automatically. Please type your address manually below.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Photo file picker
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('Selected image exceeds maximum allowed limit of 10MB.');
      return;
    }

    setPhoto(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
  };

  // Form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/report' } } });
      return;
    }

    if (formData.title.trim().length < 5) {
      return setError('Title must be at least 5 characters long.');
    }
    if (formData.description.trim().length < 10) {
      return setError('Please provide a detailed description (minimum 10 characters).');
    }
    if (!formData.location.trim()) {
      return setError('Please specify the location or landmark of the issue.');
    }

    try {
      setSubmitting(true);
      const submitData = new FormData();
      submitData.append('title', formData.title.trim());
      submitData.append('description', formData.description.trim());
      submitData.append('category', formData.category);
      submitData.append('location', formData.location.trim());
      if (formData.latitude) submitData.append('latitude', formData.latitude);
      if (formData.longitude) submitData.append('longitude', formData.longitude);
      if (photo) submitData.append('photo', photo);

      const res = await complaintsAPI.create(submitData);
      setSuccessComplaint(res.data);
    } catch (err) {
      console.error("Submission failed:", err);
      const detail = err.response?.data?.detail;
      setError(
        typeof detail === 'string'
          ? detail
          : 'Failed to submit complaint. Please check your network and fields.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const copyComplaintId = () => {
    if (successComplaint) {
      navigator.clipboard.writeText(successComplaint.complaint_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Header */}
      <div className="space-y-1 text-center sm:text-left">
        <span className="text-xs uppercase tracking-wider font-semibold text-teal-600">
          Citizen Reporting Portal
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight">
          Report a Local Civic Problem
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Submit potholes, broken streetlights, water leakages, or waste accumulation for prompt municipal resolution.
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-md">
        
        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* RULE-BASED DUPLICATE WARNING BANNER */}
        {duplicateWarning && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50/90 border border-amber-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Potential Duplicate Warning (Rule-Based Nearby Detection)</span>
            </div>
            <p className="text-xs text-amber-700 leading-relaxed">
              {duplicateWarning.message}
            </p>
            <div className="space-y-1.5 pt-1">
              {duplicateWarning.potential_matches.slice(0, 2).map((m) => (
                <div key={m.complaint_id} className="bg-white/80 p-2 rounded-lg text-xs flex items-center justify-between border border-amber-200/60">
                  <div className="space-y-0.5">
                    <span className="font-mono font-bold text-navy-900">{m.complaint_id}</span>: {m.title}
                    <div className="text-[10px] text-slate-500">
                      Location: {m.location} {m.distance_km !== null ? `(${m.distance_km} km away)` : ''} • Status: {m.status}
                    </div>
                  </div>
                  <Link
                    to={`/track?id=${m.complaint_id}`}
                    target="_blank"
                    className="text-xs font-semibold text-teal-700 hover:underline shrink-0 ml-2"
                  >
                    View Existing
                  </Link>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-amber-600 italic">
              Note: This is an automated warning. If your issue is a separate occurrence, you may proceed with submitting.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          
          {/* Row 1: Category & Title */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="space-y-1.5 md:col-span-1">
              <label className="font-semibold text-slate-700">Issue Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="font-semibold text-slate-700">Complaint Title *</label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Deep pothole causing two-wheeler skids"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              />
            </div>

          </div>

          {/* Detailed Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700">Detailed Description *</label>
              <span className="text-[10px] text-slate-400">
                {formData.description.length} characters (min 10)
              </span>
            </div>
            <textarea
              name="description"
              rows={4}
              required
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide exact details: size of pothole, duration of leakage, exact street pole number, or danger level..."
              className="w-full p-3 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed font-normal"
            />
          </div>

          {/* LOCATION SECTION */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-teal-600" />
                <span className="font-bold text-slate-800">Location & Coordinates</span>
              </div>
              
              {/* GPS Button */}
              <button
                type="button"
                onClick={handleDetectGPS}
                disabled={detectingLocation}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-xs transition"
              >
                {detectingLocation ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Detecting GPS...</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Detect My Current GPS</span>
                  </>
                )}
              </button>
            </div>

            {gpsStatus && (
              <p className="text-[11px] text-teal-700 font-medium">
                {gpsStatus}
              </p>
            )}

            {/* Address / Landmark */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Address / Landmark / Street *</label>
              <input
                type="text"
                name="location"
                required
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Near Sharda University Gate 3, Knowledge Park III, Greater Noida"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Manual Lat / Lon fallback */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="font-semibold text-slate-500 text-[11px]">Latitude (Optional)</label>
                <input
                  type="number"
                  step="any"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  placeholder="e.g. 28.4727"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-slate-800 bg-white focus:outline-none text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-500 text-[11px]">Longitude (Optional)</label>
                <input
                  type="number"
                  step="any"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  placeholder="e.g. 77.4880"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-slate-800 bg-white focus:outline-none text-xs"
                />
              </div>
            </div>
          </div>

          {/* PHOTOGRAPH UPLOAD */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-teal-600" />
              <span>Photograph of Defect (Recommended)</span>
            </label>

            {!photoPreview ? (
              <label className="border-2 border-dashed border-slate-200 hover:border-teal-500 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-teal-50/30 transition text-center group">
                <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-teal-600 transition mb-2" />
                <span className="text-xs font-semibold text-slate-700 group-hover:text-teal-700">
                  Click to upload or drag photo here
                </span>
                <span className="text-[10px] text-slate-400 mt-1">
                  JPG, PNG, WEBP up to 10MB
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative inline-block rounded-xl overflow-hidden border border-slate-200 shadow-sm max-w-xs">
                <img
                  src={photoPreview}
                  alt="Complaint Preview"
                  className="w-full h-44 object-cover"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-rose-600 text-white rounded-full transition"
                  title="Remove photo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-70 text-white rounded-xl font-bold shadow-md shadow-teal-600/20 transition flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting to Municipal Database...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Complaint</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>

      {/* SUCCESS CONFIRMATION MODAL */}
      {successComplaint && (
        <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-extrabold text-navy-950">
                Complaint Registered Successfully!
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your report has been logged into the municipal database and routed to the ward engineer.
              </p>
            </div>

            {/* Generated Unique Complaint ID Box */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Your Unique Tracking Reference
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl font-mono font-extrabold text-navy-900">
                  {successComplaint.complaint_id}
                </span>
                <button
                  onClick={copyComplaintId}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                  title="Copy Reference Code"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              {copied && <span className="text-[10px] text-emerald-600 font-semibold block">Copied to clipboard!</span>}
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => navigate(`/track?id=${successComplaint.complaint_id}`)}
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2"
              >
                <span>Track Complaint Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setSuccessComplaint(null);
                  navigate('/dashboard');
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                Return to Dashboard
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ReportIssuePage;
