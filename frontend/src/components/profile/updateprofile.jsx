// src/components/profile/updateprofile.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { UserContext } from '../usercontext';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  ArrowLeft, Plus, Trash2, Pencil, X,
  Briefcase, GraduationCap, MapPin, Link2,
  AlertCircle, Loader2, CheckCircle2, Save,
  RefreshCw, User, FileText, Check
} from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────

const emptyExperience = {
  company: '', title: '', location: '',
  from: '', to: '', current: false, description: '',
};

const emptyEducation = {
  school: '', degree: '', field_of_study: '',
  from: '', to: '', current: false, gpa: '', description: '',
};

// ── Reusable UI ───────────────────────────────────────────────────────────────

function Field({ label, error, hint, required, children }) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="flex items-center gap-1 mt-1.5 text-xs text-red-600">
          <AlertCircle size={11} />
          {error}
        </p>
      )}
      {!error && hint && (
        <p className="mt-1.5 text-xs text-gray-400">{hint}</p>
      )}
    </div>
  );
}

const inputClass = (err) =>
  `w-full px-3 py-2.5 text-sm border rounded-lg outline-none transition-colors ${
    err
      ? 'border-red-300 bg-red-50 focus:border-red-400'
      : 'border-gray-300 bg-white focus:border-gray-500'
  }`;

const dateInputClass = (err) =>
  `w-full px-3 py-2.5 text-sm border rounded-lg outline-none transition-colors bg-gray-50 ${
    err ? 'border-red-300' : 'border-gray-300 focus:border-gray-500'
  }`;

// ── Section Wrapper ───────────────────────────────────────────────────────────

function SectionCard({ icon: Icon, title, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
        <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center">
          <Icon size={14} className="text-gray-600" />
        </div>
        <h2 className="text-sm font-bold text-gray-900">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Experience Form ───────────────────────────────────────────────────────────

function ExperienceForm({ draft, onChange, errors, onSave, onCancel, isEdit }) {
  return (
    <div className="border border-blue-200 bg-blue-50/30 rounded-lg p-4 space-y-3">
      <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest">
        {isEdit ? 'Edit Experience' : 'Add Experience'}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Job Title" error={errors.title} required>
          <input
            value={draft.title}
            onChange={e => onChange('title', e.target.value)}
            placeholder="e.g. Backend Developer"
            className={inputClass(errors.title)}
          />
        </Field>
        <Field label="Company" error={errors.company} required>
          <input
            value={draft.company}
            onChange={e => onChange('company', e.target.value)}
            placeholder="e.g. Tech Corp"
            className={inputClass(errors.company)}
          />
        </Field>
      </div>

      <Field label="Location">
        <input
          value={draft.location}
          onChange={e => onChange('location', e.target.value)}
          placeholder="e.g. Mumbai, India"
          className={inputClass()}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Start Date" error={errors.from} required>
          <input
            type="month"
            value={draft.from}
            onChange={e => onChange('from', e.target.value)}
            className={dateInputClass(errors.from)}
          />
        </Field>
        <Field label="End Date" error={errors.to}>
          <input
            type="month"
            value={draft.to}
            onChange={e => onChange('to', e.target.value)}
            disabled={draft.current}
            className={dateInputClass(errors.to)}
          />
        </Field>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={draft.current}
          onChange={e => onChange('current', e.target.checked)}
          className="w-4 h-4 rounded border-gray-300"
        />
        <span className="text-sm text-gray-700">I currently work here</span>
      </label>

      <Field label="Description">
        <textarea
          value={draft.description}
          onChange={e => onChange('description', e.target.value)}
          placeholder="Briefly describe your responsibilities..."
          rows={3}
          className={`w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg outline-none focus:border-gray-500 resize-none transition-colors`}
        />
      </Field>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onSave}
          className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Check size={13} />
          {isEdit ? 'Save Changes' : 'Add'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Education Form ────────────────────────────────────────────────────────────

function EducationForm({ draft, onChange, errors, onSave, onCancel, isEdit }) {
  return (
    <div className="border border-blue-200 bg-blue-50/30 rounded-lg p-4 space-y-3">
      <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest">
        {isEdit ? 'Edit Education' : 'Add Education'}
      </p>

      <Field label="School / University" error={errors.school} required>
        <input
          value={draft.school}
          onChange={e => onChange('school', e.target.value)}
          placeholder="e.g. IIIT Surat"
          className={inputClass(errors.school)}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Degree" error={errors.degree} required>
          <input
            value={draft.degree}
            onChange={e => onChange('degree', e.target.value)}
            placeholder="e.g. B.Tech"
            className={inputClass(errors.degree)}
          />
        </Field>
        <Field label="Field of Study" error={errors.field_of_study} required>
          <input
            value={draft.field_of_study}
            onChange={e => onChange('field_of_study', e.target.value)}
            placeholder="e.g. Computer Science"
            className={inputClass(errors.field_of_study)}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Start Date" error={errors.from} required>
          <input
            type="month"
            value={draft.from}
            onChange={e => onChange('from', e.target.value)}
            className={dateInputClass(errors.from)}
          />
        </Field>
        <Field label="End Date" error={errors.to}>
          <input
            type="month"
            value={draft.to}
            onChange={e => onChange('to', e.target.value)}
            disabled={draft.current}
            className={dateInputClass(errors.to)}
          />
        </Field>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={draft.current}
          onChange={e => onChange('current', e.target.checked)}
          className="w-4 h-4 rounded border-gray-300"
        />
        <span className="text-sm text-gray-700">I currently study here</span>
      </label>

      <Field label="GPA" hint="Optional — between 0 and 10" error={errors.gpa}>
        <input
          type="number"
          value={draft.gpa}
          onChange={e => onChange('gpa', e.target.value)}
          placeholder="e.g. 8.5"
          min="0" max="10" step="0.1"
          className={inputClass(errors.gpa)}
        />
      </Field>

      <Field label="Description">
        <textarea
          value={draft.description}
          onChange={e => onChange('description', e.target.value)}
          placeholder="Activities, societies, achievements..."
          rows={3}
          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg outline-none focus:border-gray-500 resize-none transition-colors"
        />
      </Field>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onSave}
          className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Check size={13} />
          {isEdit ? 'Save Changes' : 'Add'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function UpdateProfile() {
  const { wantid, profileId } = useParams();
  const navigate = useNavigate();
  const { curruser } = useContext(UserContext);

  // ── Fetch state ─────────────────────────────────────────────────────────────
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // ── Basic info ──────────────────────────────────────────────────────────────
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [social, setSocial] = useState({ twitter: '', github: '', linkedin: '' });
  const [basicErrors, setBasicErrors] = useState({});
  const [basicSaving, setBasicSaving] = useState(false);
  const [basicSaved, setBasicSaved] = useState(false);

  // ── Experience ──────────────────────────────────────────────────────────────
  const [experiences, setExperiences] = useState([]);
  const [expDraft, setExpDraft] = useState(emptyExperience);
  const [expErrors, setExpErrors] = useState({});
  const [addingExp, setAddingExp] = useState(false);
  const [editingExpId, setEditingExpId] = useState(null);

  // ── Education ───────────────────────────────────────────────────────────────
  const [educations, setEducations] = useState([]);
  const [eduDraft, setEduDraft] = useState(emptyEducation);
  const [eduErrors, setEduErrors] = useState({});
  const [addingEdu, setAddingEdu] = useState(false);
  const [editingEduId, setEditingEduId] = useState(null);

  // ── Saving ──────────────────────────────────────────────────────────────────
  const [savingAll, setSavingAll] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState(null);

  // ── Fetch existing profile ──────────────────────────────────────────────────

  // Backend: GET /profile/get/:userId
  // Returns: { profile: { _id, headline, bio, location, social,
  //             Experience: [...], Education: [...] }, status: true }
  const fetchProfile = async () => {
    setFetchLoading(true);
    setFetchError('');
    try {
      const res = await axios.get(
        `/profile/get/${wantid}`,
        { withCredentials: true }
      );

      if (!res.data?.status || !res.data?.profile) {
        setFetchError('Profile not found. Please create a profile first.');
        return;
      }

      const p = res.data.profile;

      // Authorization check — must be own profile
      const ownerId = p.owner?._id?.toString() || p.owner?.toString();
      if (ownerId && curruser?._id && ownerId !== curruser._id.toString()) {
        setFetchError('You are not authorised to edit this profile.');
        return;
      }

      // Populate all state
      const snap = {
        headline: p.headline || '',
        bio: p.bio || '',
        location: p.location || '',
        social: {
          twitter: p.social?.twitter || '',
          github: p.social?.github || '',
          linkedin: p.social?.linkedin || '',
        },
        experiences: (p.Experience || []).map(e => ({
          ...e,
          _id: e._id?.toString() || Date.now().toString(),
          from: e.from ? e.from.slice(0, 7) : '',
          to: e.to ? e.to.slice(0, 7) : '',
        })),
        educations: (p.Education || []).map(e => ({
          ...e,
          _id: e._id?.toString() || Date.now().toString(),
          from: e.from ? e.from.slice(0, 7) : '',
          to: e.to ? e.to.slice(0, 7) : '',
          gpa: e.gpa?.toString() || '',
        })),
      };

      setOriginalData(snap);
      setHeadline(snap.headline);
      setBio(snap.bio);
      setLocation(snap.location);
      setSocial(snap.social);
      setExperiences(snap.experiences);
      setEducations(snap.educations);

    } catch (err) {
      if (err.response?.status === 401) {
        setFetchError('Session expired. Please log in again.');
      } else if (err.response?.status === 403) {
        setFetchError('You are not authorised to edit this profile.');
      } else if (err.response?.status === 404) {
        setFetchError('Profile not found.');
      } else {
        setFetchError('Failed to load profile. Please try again.');
      }
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    if (wantid) fetchProfile();
  }, [wantid]);

  // Track unsaved changes
  useEffect(() => {
    if (!originalData) return;
    const changed =
      headline !== originalData.headline ||
      bio !== originalData.bio ||
      location !== originalData.location ||
      JSON.stringify(social) !== JSON.stringify(originalData.social) ||
      JSON.stringify(experiences) !== JSON.stringify(originalData.experiences) ||
      JSON.stringify(educations) !== JSON.stringify(originalData.educations);
    setHasChanges(changed);
  }, [headline, bio, location, social, experiences, educations, originalData]);

  // ── Basic Info Validation ───────────────────────────────────────────────────

  const validateBasic = () => {
    const errs = {};
    if (!headline.trim()) {
      errs.headline = 'Headline is required';
    } else if (headline.trim().length < 5) {
      errs.headline = 'Headline must be at least 5 characters';
    } else if (headline.trim().length > 120) {
      errs.headline = 'Headline must be under 120 characters';
    }
    if (bio.length > 2000) {
      errs.bio = 'Bio must be under 2000 characters';
    }
    setBasicErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Experience Validation ───────────────────────────────────────────────────

  const validateExp = (draft) => {
    const errs = {};
    if (!draft.company.trim()) errs.company = 'Company is required';
    if (!draft.title.trim()) errs.title = 'Job title is required';
    if (!draft.from) errs.from = 'Start date is required';
    if (!draft.current && !draft.to) errs.to = 'End date required or mark as current';
    if (draft.from && draft.to && !draft.current) {
      if (new Date(draft.to) <= new Date(draft.from)) {
        errs.to = 'End date must be after start date';
      }
    }
    setExpErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleExpChange = (field, value) => {
    setExpDraft(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'current' && value) updated.to = '';
      return updated;
    });
    if (expErrors[field]) setExpErrors(p => ({ ...p, [field]: '' }));
  };

  const startEditExp = (exp) => {
    setEditingExpId(exp._id);
    setExpDraft({ ...exp });
    setAddingExp(false);
    setExpErrors({});
  };

  const saveExp = () => {
    if (!validateExp(expDraft)) return;
    if (editingExpId) {
      setExperiences(prev =>
        prev.map(e => e._id === editingExpId ? { ...expDraft } : e)
      );
      setEditingExpId(null);
    } else {
      setExperiences(prev => [...prev, { ...expDraft, _id: Date.now().toString() }]);
      setAddingExp(false);
    }
    setExpDraft(emptyExperience);
    setExpErrors({});
    toast.success(editingExpId ? 'Experience updated' : 'Experience added');
  };

  const cancelExp = () => {
    setAddingExp(false);
    setEditingExpId(null);
    setExpDraft(emptyExperience);
    setExpErrors({});
  };

  const removeExp = (id) => {
    setExperiences(prev => prev.filter(e => e._id !== id));
    if (editingExpId === id) cancelExp();
  };

  // ── Education Validation ────────────────────────────────────────────────────

  const validateEdu = (draft) => {
    const errs = {};
    if (!draft.school.trim()) errs.school = 'School is required';
    if (!draft.degree.trim()) errs.degree = 'Degree is required';
    if (!draft.field_of_study.trim()) errs.field_of_study = 'Field of study is required';
    if (!draft.from) errs.from = 'Start date is required';
    if (!draft.current && !draft.to) errs.to = 'End date required or mark as current';
    if (draft.from && draft.to && !draft.current) {
      if (new Date(draft.to) <= new Date(draft.from)) {
        errs.to = 'End date must be after start date';
      }
    }
    if (draft.gpa && (isNaN(draft.gpa) || +draft.gpa < 0 || +draft.gpa > 10)) {
      errs.gpa = 'GPA must be between 0 and 10';
    }
    setEduErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleEduChange = (field, value) => {
    setEduDraft(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'current' && value) updated.to = '';
      return updated;
    });
    if (eduErrors[field]) setEduErrors(p => ({ ...p, [field]: '' }));
  };

  const startEditEdu = (edu) => {
    setEditingEduId(edu._id);
    setEduDraft({ ...edu });
    setAddingEdu(false);
    setEduErrors({});
  };

  const saveEdu = () => {
    if (!validateEdu(eduDraft)) return;
    if (editingEduId) {
      setEducations(prev =>
        prev.map(e => e._id === editingEduId ? { ...eduDraft } : e)
      );
      setEditingEduId(null);
    } else {
      setEducations(prev => [...prev, { ...eduDraft, _id: Date.now().toString() }]);
      setAddingEdu(false);
    }
    setEduDraft(emptyEducation);
    setEduErrors({});
    toast.success(editingEduId ? 'Education updated' : 'Education added');
  };

  const cancelEdu = () => {
    setAddingEdu(false);
    setEditingEduId(null);
    setEduDraft(emptyEducation);
    setEduErrors({});
  };

  const removeEdu = (id) => {
    setEducations(prev => prev.filter(e => e._id !== id));
    if (editingEduId === id) cancelEdu();
  };

  // ── Save All ────────────────────────────────────────────────────────────────

  // Backend: PUT /profile/edit/:profileId
  // Middleware: iscorrect_owner_profile (403 if not owner)
  // Body: { headline, bio, location, social, Experience, Education }
  // Returns: { message: "profile updated!", newprofile: {...}, status: true }
  const handleSaveAll = async () => {
    if (!validateBasic()) {
      toast.error('Please fix the errors before saving');
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!hasChanges) {
      toast.info('No changes to save');
      return;
    }

    setSavingAll(true);
    try {
      const payload = {
        headline: headline.trim(),
        bio: bio.trim(),
        location: location.trim(),
        social: {
          twitter: social.twitter.trim(),
          github: social.github.trim(),
          linkedin: social.linkedin.trim(),
        },
        Experience: experiences.map(({ _id, ...rest }) => rest),
        Education: educations.map(({ _id, ...rest }) => rest),
      };

      const res = await axios.put(
        `/profile/edit/${profileId}`,
        payload,
        { withCredentials: true }
      );

      // Backend: { message: "profile updated!", newprofile: {...}, status: true }
      if (res.data?.status === true || res.status === 200) {
        setOriginalData({
          headline: headline.trim(),
          bio: bio.trim(),
          location: location.trim(),
          social: { ...social },
          experiences: [...experiences],
          educations: [...educations],
        });
        setHasChanges(false);
        setBasicSaved(true);
        setTimeout(() => setBasicSaved(false), 2500);
        toast.success('Profile updated successfully!');
      } else {
        toast.error('Something went wrong. Please try again.');
      }

    } catch (err) {
      if (err.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
      } else if (err.response?.status === 403) {
        toast.error('You are not authorised to edit this profile.');
      } else {
        toast.error(
          err.response?.data?.message ||
          'Failed to update profile. Please try again.'
        );
      }
    } finally {
      setSavingAll(false);
    }
  };

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => navigate(-1)} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg transition-all">
              <ArrowLeft size={18} />
            </button>
            <div className="h-6 bg-gray-200 rounded w-36 animate-pulse" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-32 mb-4" />
                <div className="space-y-3">
                  <div className="h-10 bg-gray-100 rounded-lg" />
                  <div className="h-20 bg-gray-100 rounded-lg" />
                  <div className="h-10 bg-gray-100 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────────

  if (fetchError) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => navigate(-1)} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg transition-all">
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Edit Profile</h1>
          </div>
          <div className="bg-white border border-red-200 rounded-xl p-10 text-center">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={22} className="text-red-400" />
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">{fetchError}</p>
            <div className="flex items-center justify-center gap-3 mt-5">
              {!fetchError.includes('authorised') && (
                <button
                  onClick={fetchProfile}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <RefreshCw size={13} />
                  Try Again
                </button>
              )}
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

      <div className="max-w-2xl mx-auto space-y-4">

        {/* ── Page Header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg transition-all"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Edit Profile</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Update your professional information
              </p>
            </div>
          </div>

          {/* Unsaved changes indicator */}
          {hasChanges && (
            <span className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Unsaved changes
            </span>
          )}
        </div>

        {/* ══════════════════════════════════════════
            SECTION 1 — BASIC INFO
        ══════════════════════════════════════════ */}
        <SectionCard icon={User} title="Basic Information">
          <div className="space-y-4">

            <Field
              label="Professional Headline"
              error={basicErrors.headline}
              hint='e.g. "Full Stack Developer" or "CS Student at IIIT Surat"'
              required
            >
              <input
                value={headline}
                onChange={e => {
                  setHeadline(e.target.value);
                  if (basicErrors.headline)
                    setBasicErrors(p => ({ ...p, headline: '' }));
                }}
                placeholder="What do you do professionally?"
                maxLength={120}
                className={inputClass(basicErrors.headline)}
              />
              <p className={`text-xs text-right mt-1 ${
                headline.length > 100 ? 'text-amber-500' : 'text-gray-400'
              }`}>
                {headline.length}/120
              </p>
            </Field>

            <Field
              label="Bio"
              error={basicErrors.bio}
              hint="A short professional summary about yourself"
            >
              <textarea
                value={bio}
                onChange={e => {
                  setBio(e.target.value);
                  if (basicErrors.bio)
                    setBasicErrors(p => ({ ...p, bio: '' }));
                }}
                placeholder="Tell your professional story..."
                rows={4}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg outline-none focus:border-gray-500 resize-none transition-colors"
              />
              <p className={`text-xs text-right mt-1 ${
                bio.length > 1800 ? 'text-amber-500' : 'text-gray-400'
              }`}>
                {bio.length}/2000
              </p>
            </Field>

            <Field label="Location" hint="City, State or Country">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin size={14} className="text-gray-400" />
                </div>
                <input
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. Surat, Gujarat"
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg outline-none focus:border-gray-500 transition-colors"
                />
              </div>
            </Field>
          </div>
        </SectionCard>

        {/* ══════════════════════════════════════════
            SECTION 2 — SOCIAL LINKS
        ══════════════════════════════════════════ */}
        <SectionCard icon={Link2} title="Social Links">
          <div className="space-y-3">
            {[
              { key: 'twitter', label: 'Twitter / X', placeholder: 'https://twitter.com/username' },
              { key: 'github', label: 'GitHub', placeholder: 'https://github.com/username' },
              { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/username' },
            ].map(({ key, label, placeholder }) => (
              <Field key={key} label={label}>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Link2 size={14} className="text-gray-400" />
                  </div>
                  <input
                    type="url"
                    value={social[key]}
                    onChange={e =>
                      setSocial(prev => ({ ...prev, [key]: e.target.value }))
                    }
                    placeholder={placeholder}
                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg outline-none focus:border-gray-500 transition-colors"
                  />
                  {social[key] && (
                    <button
                      type="button"
                      onClick={() => setSocial(prev => ({ ...prev, [key]: '' }))}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </Field>
            ))}
          </div>
        </SectionCard>

        {/* ══════════════════════════════════════════
            SECTION 3 — EXPERIENCE
        ══════════════════════════════════════════ */}
        <SectionCard icon={Briefcase} title="Work Experience">

          {/* Existing items */}
          {experiences.length > 0 && (
            <div className="space-y-3 mb-4">
              {experiences.map(exp => (
                editingExpId === exp._id ? (
                  <ExperienceForm
                    key={exp._id}
                    draft={expDraft}
                    onChange={handleExpChange}
                    errors={expErrors}
                    onSave={saveExp}
                    onCancel={cancelExp}
                    isEdit
                  />
                ) : (
                  <div
                    key={exp._id}
                    className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg group"
                  >
                    <div className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Briefcase size={13} className="text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{exp.title}</p>
                      <p className="text-xs text-blue-600 mt-0.5">{exp.company}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {exp.from} — {exp.current ? 'Present' : exp.to}
                        {exp.location && ` · ${exp.location}`}
                      </p>
                      {exp.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {exp.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button
                        onClick={() => startEditExp(exp)}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => removeExp(exp._id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )
              ))}
            </div>
          )}

          {/* Add form */}
          {addingExp ? (
            <ExperienceForm
              draft={expDraft}
              onChange={handleExpChange}
              errors={expErrors}
              onSave={saveExp}
              onCancel={cancelExp}
              isEdit={false}
            />
          ) : !editingExpId && (
            <button
              type="button"
              onClick={() => { setAddingExp(true); setEditingExpId(null); }}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 text-sm font-medium text-gray-500 rounded-lg hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all"
            >
              <Plus size={16} />
              Add Experience
            </button>
          )}
        </SectionCard>

        {/* ══════════════════════════════════════════
            SECTION 4 — EDUCATION
        ══════════════════════════════════════════ */}
        <SectionCard icon={GraduationCap} title="Education">

          {educations.length > 0 && (
            <div className="space-y-3 mb-4">
              {educations.map(edu => (
                editingEduId === edu._id ? (
                  <EducationForm
                    key={edu._id}
                    draft={eduDraft}
                    onChange={handleEduChange}
                    errors={eduErrors}
                    onSave={saveEdu}
                    onCancel={cancelEdu}
                    isEdit
                  />
                ) : (
                  <div
                    key={edu._id}
                    className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg group"
                  >
                    <div className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <GraduationCap size={13} className="text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{edu.school}</p>
                      <p className="text-xs text-blue-600 mt-0.5">
                        {edu.degree} · {edu.field_of_study}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {edu.from} — {edu.current ? 'Present' : edu.to}
                        {edu.gpa && ` · GPA: ${edu.gpa}`}
                      </p>
                      {edu.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {edu.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button
                        onClick={() => startEditEdu(edu)}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => removeEdu(edu._id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )
              ))}
            </div>
          )}

          {addingEdu ? (
            <EducationForm
              draft={eduDraft}
              onChange={handleEduChange}
              errors={eduErrors}
              onSave={saveEdu}
              onCancel={cancelEdu}
              isEdit={false}
            />
          ) : !editingEduId && (
            <button
              type="button"
              onClick={() => { setAddingEdu(true); setEditingEduId(null); }}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 text-sm font-medium text-gray-500 rounded-lg hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all"
            >
              <Plus size={16} />
              Add Education
            </button>
          )}
        </SectionCard>

        {/* ── Save All Sticky Bar ── */}
        <div className={`sticky bottom-4 transition-all ${
          hasChanges ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}>
          <div className="bg-white border border-gray-200 rounded-xl shadow-md px-5 py-3.5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                You have unsaved changes
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Save your profile to apply all updates
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => {
                  if (originalData) {
                    setHeadline(originalData.headline);
                    setBio(originalData.bio);
                    setLocation(originalData.location);
                    setSocial({ ...originalData.social });
                    setExperiences([...originalData.experiences]);
                    setEducations([...originalData.educations]);
                  }
                  toast.info('Changes discarded');
                }}
                disabled={savingAll}
                className="px-3 py-2 text-xs font-semibold border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Discard
              </button>
              <button
                onClick={handleSaveAll}
                disabled={savingAll}
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {savingAll ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Saving...
                  </>
                ) : basicSaved ? (
                  <>
                    <CheckCircle2 size={13} />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save size={13} />
                    Save All Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom spacing so sticky bar doesn't cover content */}
        <div className="h-4" />
      </div>
    </div>
  );
}