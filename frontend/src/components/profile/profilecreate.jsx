// src/components/profile/profilecreate.jsx
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../usercontext';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  ArrowLeft, ArrowRight, Plus, Trash2,
  Briefcase, GraduationCap, User, MapPin,
  Link2, AlertCircle, Loader2, CheckCircle2,
  Save
} from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Basic Info',   icon: User },
  { id: 2, label: 'Experience',   icon: Briefcase },
  { id: 3, label: 'Education',    icon: GraduationCap },
  { id: 4, label: 'Social Links', icon: Link2 },
];

const emptyExperience = {
  company: '', title: '', location: '',
  from: '', to: '', current: false, description: '',
};

const emptyEducation = {
  school: '', degree: '', field_of_study: '',
  from: '', to: '', current: false, gpa: '', description: '',
};

// ── Step Indicator ────────────────────────────────────────────────────────────

function StepIndicator({ currentStep, completedSteps }) {
  return (
    <div className="flex items-center justify-between mb-6">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const isActive = currentStep === step.id;
        const isDone = completedSteps.includes(step.id);
        const isLast = i === STEPS.length - 1;

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                isDone
                  ? 'bg-green-600 text-white'
                  : isActive
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {isDone
                  ? <CheckCircle2 size={16} />
                  : <Icon size={15} />
                }
              </div>
              <span className={`text-xs font-medium hidden sm:block ${
                isActive ? 'text-gray-900' : isDone ? 'text-green-600' : 'text-gray-400'
              }`}>
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div className={`flex-1 h-px mx-2 transition-colors ${
                completedSteps.includes(step.id) ? 'bg-green-300' : 'bg-gray-200'
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Reusable Field ────────────────────────────────────────────────────────────

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

function Input({ error, ...props }) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-2.5 text-sm border rounded-lg outline-none transition-colors ${
        error
          ? 'border-red-300 bg-red-50 focus:border-red-400'
          : 'border-gray-300 bg-white focus:border-gray-500'
      } ${props.disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
    />
  );
}

function Textarea({ error, rows = 3, ...props }) {
  return (
    <textarea
      rows={rows}
      {...props}
      className={`w-full px-3 py-2.5 text-sm border rounded-lg outline-none transition-colors resize-none ${
        error
          ? 'border-red-300 bg-red-50 focus:border-red-400'
          : 'border-gray-300 bg-white focus:border-gray-500'
      } ${props.disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
    />
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ProfileCreation() {
  const navigate = useNavigate();
  const { curruser } = useContext(UserContext);

  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Step 1 — Basic Info
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');

  // Step 2 — Experience
  const [experiences, setExperiences] = useState([]);
  const [expDraft, setExpDraft] = useState(emptyExperience);
  const [expErrors, setExpErrors] = useState({});
  const [addingExp, setAddingExp] = useState(false);

  // Step 3 — Education
  const [educations, setEducations] = useState([]);
  const [eduDraft, setEduDraft] = useState(emptyEducation);
  const [eduErrors, setEduErrors] = useState({});
  const [addingEdu, setAddingEdu] = useState(false);

  // Step 4 — Social
  const [social, setSocial] = useState({
    twitter: '', github: '', linkedin: ''
  });

  // ── Check if profile already exists ────────────────────────────────────────

  // Backend: GET /profile/get/:userId
  // If profile already exists, redirect to edit instead
  useEffect(() => {
    if (!curruser?._id) return;
    axios.get(`/profile/get/${curruser._id}`, { withCredentials: true })
      .then(res => {
        if (res.data?.status && res.data?.profile) {
          toast.info('You already have a profile. Redirecting to edit...');
          setTimeout(() => {
            navigate(
              `/updateprofile/${curruser._id}/${res.data.profile._id}`,
              { replace: true }
            );
          }, 1200);
        }
      })
      .catch(() => {});
  }, [curruser?._id]);

  // ── Step 1 Validation ───────────────────────────────────────────────────────

  const validateStep1 = () => {
    const errs = {};
    if (!headline.trim()) {
      errs.headline = 'Professional headline is required';
    } else if (headline.trim().length < 5) {
      errs.headline = 'Headline must be at least 5 characters';
    } else if (headline.trim().length > 120) {
      errs.headline = 'Headline must be under 120 characters';
    }
    if (bio.length > 2000) {
      errs.bio = 'Bio must be under 2000 characters';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Experience Helpers ──────────────────────────────────────────────────────

  const validateExp = () => {
    const errs = {};
    if (!expDraft.company.trim()) errs.company = 'Company name is required';
    if (!expDraft.title.trim()) errs.title = 'Job title is required';
    if (!expDraft.from) errs.from = 'Start date is required';
    if (!expDraft.current && !expDraft.to) errs.to = 'End date is required (or mark as current)';
    if (expDraft.from && expDraft.to && !expDraft.current) {
      if (new Date(expDraft.to) <= new Date(expDraft.from)) {
        errs.to = 'End date must be after start date';
      }
    }
    setExpErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleExpChange = (field, value) => {
    setExpDraft(prev => ({ ...prev, [field]: value }));
    if (expErrors[field]) setExpErrors(prev => ({ ...prev, [field]: '' }));
    // Clear end date when current is checked
    if (field === 'current' && value) {
      setExpDraft(prev => ({ ...prev, current: true, to: '' }));
    }
  };

  const addExperience = () => {
    if (!validateExp()) return;
    setExperiences(prev => [...prev, { ...expDraft, _id: Date.now().toString() }]);
    setExpDraft(emptyExperience);
    setExpErrors({});
    setAddingExp(false);
    toast.success('Experience added');
  };

  const removeExperience = (id) => {
    setExperiences(prev => prev.filter(e => e._id !== id));
  };

  // ── Education Helpers ───────────────────────────────────────────────────────

  const validateEdu = () => {
    const errs = {};
    if (!eduDraft.school.trim()) errs.school = 'School name is required';
    if (!eduDraft.degree.trim()) errs.degree = 'Degree is required';
    if (!eduDraft.field_of_study.trim()) errs.field_of_study = 'Field of study is required';
    if (!eduDraft.from) errs.from = 'Start date is required';
    if (!eduDraft.current && !eduDraft.to) errs.to = 'End date is required (or mark as current)';
    if (eduDraft.from && eduDraft.to && !eduDraft.current) {
      if (new Date(eduDraft.to) <= new Date(eduDraft.from)) {
        errs.to = 'End date must be after start date';
      }
    }
    if (eduDraft.gpa && (isNaN(eduDraft.gpa) || eduDraft.gpa < 0 || eduDraft.gpa > 10)) {
      errs.gpa = 'GPA must be between 0 and 10';
    }
    setEduErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleEduChange = (field, value) => {
    setEduDraft(prev => ({ ...prev, [field]: value }));
    if (eduErrors[field]) setEduErrors(prev => ({ ...prev, [field]: '' }));
    if (field === 'current' && value) {
      setEduDraft(prev => ({ ...prev, current: true, to: '' }));
    }
  };

  const addEducation = () => {
    if (!validateEdu()) return;
    setEducations(prev => [...prev, { ...eduDraft, _id: Date.now().toString() }]);
    setEduDraft(emptyEducation);
    setEduErrors({});
    setAddingEdu(false);
    toast.success('Education added');
  };

  const removeEducation = (id) => {
    setEducations(prev => prev.filter(e => e._id !== id));
  };

  // ── Navigation ──────────────────────────────────────────────────────────────

  const goNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    setCompletedSteps(prev =>
      prev.includes(currentStep) ? prev : [...prev, currentStep]
    );
    setCurrentStep(prev => prev + 1);
  };

  const goBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  // Backend: POST /profile/addnew
  // Body: { headline, bio, location, social, Experience: [...], Education: [...] }
  // Returns: { success: true, message: "profile created", data: {...} }
  // Validation via Joi profile_validator in controller
  const handleSubmit = async () => {
    setLoading(true);
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

      const res = await axios.post(
        '/profile/addnew',
        payload,
        { withCredentials: true }
      );

      // Backend returns: { success: true, message: "profile created", data: {...} }
      if (res.data?.success === true || res.status === 200 || res.status === 201) {
        setCompletedSteps([1, 2, 3, 4]);
        toast.success('Profile created successfully!');
        setTimeout(() => navigate(`/getprofile/${curruser._id}`), 1000);
      } else {
        toast.error('Something went wrong. Please try again.');
      }

    } catch (err) {
      if (err.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
      } else if (err.response?.status === 400) {
        // Joi validation error from backend
        const msg = err.response?.data?.message ||
                    err.response?.data?.details?.[0]?.message ||
                    'Validation failed. Please check your inputs.';
        toast.error(msg);
        setErrors({ general: msg });
      } else {
        toast.error('Failed to create profile. Please try again.');
        setErrors({ general: 'Something went wrong. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Shared date input style ─────────────────────────────────────────────────

  const dateInputClass = (err) =>
    `w-full px-3 py-2.5 text-sm border rounded-lg outline-none transition-colors bg-gray-50 ${
      err ? 'border-red-300' : 'border-gray-300 focus:border-gray-500'
    }`;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

      <div className="max-w-xl mx-auto">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Create Profile</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Step {currentStep} of {STEPS.length} —{' '}
              {STEPS.find(s => s.id === currentStep)?.label}
            </p>
          </div>
        </div>

        {/* ── Step Indicator ── */}
        <StepIndicator
          currentStep={currentStep}
          completedSteps={completedSteps}
        />

        {/* ── Card ── */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

          {/* General error */}
          {errors.general && (
            <div className="flex items-start gap-2 bg-red-50 border-b border-red-200 px-5 py-3">
              <AlertCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-700">{errors.general}</p>
            </div>
          )}

          <div className="p-5">

            {/* ════════════════════════════════════════════
                STEP 1 — BASIC INFO
            ════════════════════════════════════════════ */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
                  Basic Information
                </p>

                <Field
                  label="Professional Headline"
                  error={errors.headline}
                  hint='e.g. "Full Stack Developer at XYZ" or "CS Student at IIIT Surat"'
                  required
                >
                  <Input
                    value={headline}
                    onChange={e => {
                      setHeadline(e.target.value);
                      if (errors.headline) setErrors(p => ({ ...p, headline: '' }));
                    }}
                    placeholder="What do you do professionally?"
                    maxLength={120}
                    error={errors.headline}
                  />
                  <p className={`text-xs text-right mt-1 ${
                    headline.length > 100 ? 'text-amber-500' : 'text-gray-400'
                  }`}>
                    {headline.length}/120
                  </p>
                </Field>

                <Field
                  label="Bio"
                  error={errors.bio}
                  hint="A short professional summary about yourself"
                >
                  <Textarea
                    value={bio}
                    onChange={e => {
                      setBio(e.target.value);
                      if (errors.bio) setErrors(p => ({ ...p, bio: '' }));
                    }}
                    placeholder="Tell your professional story..."
                    rows={4}
                    maxLength={2100}
                    error={errors.bio}
                  />
                  <p className={`text-xs text-right mt-1 ${
                    bio.length > 1800 ? 'text-amber-500' : 'text-gray-400'
                  }`}>
                    {bio.length}/2000
                  </p>
                </Field>

                <Field
                  label="Location"
                  hint="City, State or Country"
                >
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
            )}

            {/* ════════════════════════════════════════════
                STEP 2 — EXPERIENCE
            ════════════════════════════════════════════ */}
            {currentStep === 2 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
                  Work Experience
                </p>

                {/* Existing experiences */}
                {experiences.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {experiences.map(exp => (
                      <div
                        key={exp._id}
                        className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg"
                      >
                        <div className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Briefcase size={13} className="text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{exp.title}</p>
                          <p className="text-xs text-blue-600">{exp.company}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {exp.from} — {exp.current ? 'Present' : exp.to}
                            {exp.location && ` · ${exp.location}`}
                          </p>
                        </div>
                        <button
                          onClick={() => removeExperience(exp._id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                          title="Remove"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add experience form */}
                {addingExp ? (
                  <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest">
                      Add Experience
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="Job Title" error={expErrors.title} required>
                        <Input
                          value={expDraft.title}
                          onChange={e => handleExpChange('title', e.target.value)}
                          placeholder="e.g. Backend Developer"
                          error={expErrors.title}
                        />
                      </Field>
                      <Field label="Company" error={expErrors.company} required>
                        <Input
                          value={expDraft.company}
                          onChange={e => handleExpChange('company', e.target.value)}
                          placeholder="e.g. Tech Corp"
                          error={expErrors.company}
                        />
                      </Field>
                    </div>

                    <Field label="Location">
                      <Input
                        value={expDraft.location}
                        onChange={e => handleExpChange('location', e.target.value)}
                        placeholder="e.g. Mumbai, India"
                      />
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Start Date" error={expErrors.from} required>
                        <input
                          type="month"
                          value={expDraft.from}
                          onChange={e => handleExpChange('from', e.target.value)}
                          className={dateInputClass(expErrors.from)}
                        />
                      </Field>
                      <Field label="End Date" error={expErrors.to}>
                        <input
                          type="month"
                          value={expDraft.to}
                          onChange={e => handleExpChange('to', e.target.value)}
                          disabled={expDraft.current}
                          className={dateInputClass(expErrors.to)}
                        />
                      </Field>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={expDraft.current}
                        onChange={e => handleExpChange('current', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                      />
                      <span className="text-sm text-gray-700">
                        I currently work here
                      </span>
                    </label>

                    <Field label="Description">
                      <Textarea
                        value={expDraft.description}
                        onChange={e => handleExpChange('description', e.target.value)}
                        placeholder="Briefly describe your responsibilities..."
                        rows={3}
                      />
                    </Field>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={addExperience}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <CheckCircle2 size={13} />
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAddingExp(false);
                          setExpDraft(emptyExperience);
                          setExpErrors({});
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddingExp(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 text-sm font-medium text-gray-500 rounded-lg hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all"
                  >
                    <Plus size={16} />
                    {experiences.length === 0
                      ? 'Add your first work experience'
                      : 'Add another experience'}
                  </button>
                )}

                {experiences.length === 0 && !addingExp && (
                  <p className="text-center text-xs text-gray-400 mt-3">
                    Experience is optional — you can skip this step
                  </p>
                )}
              </div>
            )}

            {/* ════════════════════════════════════════════
                STEP 3 — EDUCATION
            ════════════════════════════════════════════ */}
            {currentStep === 3 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
                  Education
                </p>

                {/* Existing educations */}
                {educations.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {educations.map(edu => (
                      <div
                        key={edu._id}
                        className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg"
                      >
                        <div className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <GraduationCap size={13} className="text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{edu.school}</p>
                          <p className="text-xs text-blue-600">
                            {edu.degree} · {edu.field_of_study}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {edu.from} — {edu.current ? 'Present' : edu.to}
                            {edu.gpa && ` · GPA: ${edu.gpa}`}
                          </p>
                        </div>
                        <button
                          onClick={() => removeEducation(edu._id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                          title="Remove"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add education form */}
                {addingEdu ? (
                  <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest">
                      Add Education
                    </p>

                    <Field label="School / University" error={eduErrors.school} required>
                      <Input
                        value={eduDraft.school}
                        onChange={e => handleEduChange('school', e.target.value)}
                        placeholder="e.g. IIIT Surat"
                        error={eduErrors.school}
                      />
                    </Field>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="Degree" error={eduErrors.degree} required>
                        <Input
                          value={eduDraft.degree}
                          onChange={e => handleEduChange('degree', e.target.value)}
                          placeholder="e.g. B.Tech"
                          error={eduErrors.degree}
                        />
                      </Field>
                      <Field label="Field of Study" error={eduErrors.field_of_study} required>
                        <Input
                          value={eduDraft.field_of_study}
                          onChange={e => handleEduChange('field_of_study', e.target.value)}
                          placeholder="e.g. Computer Science"
                          error={eduErrors.field_of_study}
                        />
                      </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Start Date" error={eduErrors.from} required>
                        <input
                          type="month"
                          value={eduDraft.from}
                          onChange={e => handleEduChange('from', e.target.value)}
                          className={dateInputClass(eduErrors.from)}
                        />
                      </Field>
                      <Field label="End Date" error={eduErrors.to}>
                        <input
                          type="month"
                          value={eduDraft.to}
                          onChange={e => handleEduChange('to', e.target.value)}
                          disabled={eduDraft.current}
                          className={dateInputClass(eduErrors.to)}
                        />
                      </Field>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={eduDraft.current}
                        onChange={e => handleEduChange('current', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">
                        I currently study here
                      </span>
                    </label>

                    <Field label="GPA" error={eduErrors.gpa} hint="Optional — between 0 and 10">
                      <Input
                        type="number"
                        value={eduDraft.gpa}
                        onChange={e => handleEduChange('gpa', e.target.value)}
                        placeholder="e.g. 8.5"
                        min="0"
                        max="10"
                        step="0.1"
                        error={eduErrors.gpa}
                      />
                    </Field>

                    <Field label="Description">
                      <Textarea
                        value={eduDraft.description}
                        onChange={e => handleEduChange('description', e.target.value)}
                        placeholder="Activities, societies, achievements..."
                        rows={3}
                      />
                    </Field>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={addEducation}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <CheckCircle2 size={13} />
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAddingEdu(false);
                          setEduDraft(emptyEducation);
                          setEduErrors({});
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddingEdu(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 text-sm font-medium text-gray-500 rounded-lg hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all"
                  >
                    <Plus size={16} />
                    {educations.length === 0
                      ? 'Add your education'
                      : 'Add another education'}
                  </button>
                )}

                {educations.length === 0 && !addingEdu && (
                  <p className="text-center text-xs text-gray-400 mt-3">
                    Education is optional — you can skip this step
                  </p>
                )}
              </div>
            )}

            {/* ════════════════════════════════════════════
                STEP 4 — SOCIAL LINKS
            ════════════════════════════════════════════ */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
                  Social Links
                </p>

                <p className="text-xs text-gray-500 -mt-2 mb-4">
                  Add your social profiles to help people connect with you outside S-Connect.
                  All fields are optional.
                </p>

                {[
                  {
                    key: 'twitter',
                    label: 'Twitter / X',
                    placeholder: 'https://twitter.com/username',
                  },
                  {
                    key: 'github',
                    label: 'GitHub',
                    placeholder: 'https://github.com/username',
                  },
                  {
                    key: 'linkedin',
                    label: 'LinkedIn',
                    placeholder: 'https://linkedin.com/in/username',
                  },
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
                    </div>
                  </Field>
                ))}

                {/* Profile summary before submit */}
                <div className="mt-5 bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
                    Profile Summary
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-green-500" />
                      <span className="text-xs text-gray-600">
                        Headline: <span className="font-medium text-gray-900">
                          {headline || '—'}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {bio ? (
                        <CheckCircle2 size={14} className="text-green-500" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-gray-300" />
                      )}
                      <span className="text-xs text-gray-600">
                        Bio: <span className="font-medium text-gray-900">
                          {bio ? `${bio.substring(0, 40)}${bio.length > 40 ? '...' : ''}` : 'Not added'}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {experiences.length > 0 ? (
                        <CheckCircle2 size={14} className="text-green-500" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-gray-300" />
                      )}
                      <span className="text-xs text-gray-600">
                        Experience:{' '}
                        <span className="font-medium text-gray-900">
                          {experiences.length > 0
                            ? `${experiences.length} added`
                            : 'None'}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {educations.length > 0 ? (
                        <CheckCircle2 size={14} className="text-green-500" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-gray-300" />
                      )}
                      <span className="text-xs text-gray-600">
                        Education:{' '}
                        <span className="font-medium text-gray-900">
                          {educations.length > 0
                            ? `${educations.length} added`
                            : 'None'}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Footer Navigation ── */}
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50">
            <button
              type="button"
              onClick={currentStep === 1 ? () => navigate(-1) : goBack}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors disabled:opacity-50"
            >
              <ArrowLeft size={13} />
              {currentStep === 1 ? 'Cancel' : 'Back'}
            </button>

            <span className="text-xs text-gray-400">
              {currentStep} / {STEPS.length}
            </span>

            {currentStep < STEPS.length ? (
              <button
                type="button"
                onClick={goNext}
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 transition-colors"
              >
                Next
                <ArrowRight size={13} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save size={13} />
                    Create Profile
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}