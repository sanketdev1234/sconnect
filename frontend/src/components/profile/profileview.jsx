// src/components/profile/profileview.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function DisplayProfile() {
  const { wantid } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/profile/get/${wantid}`, { withCredentials: true })
      .then(res => { setProfile(res.data.profile); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const fmtDate = (d) => {
    const date = new Date(d);
    return `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][date.getMonth()]} ${date.getFullYear()}`;
  };

  if (loading) return <div className="min-h-screen bg-gray-100 flex items-center justify-center text-sm text-gray-400">Loading...</div>;
  if (!profile) return <div className="min-h-screen bg-gray-100 flex items-center justify-center text-sm text-gray-400">Profile not found</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto space-y-4">

        {/* Header */}
        <div className="bg-gray-900 rounded-xl p-6 text-white">
          <h1 className="text-2xl font-bold">{profile.owner?.full_name}</h1>
          <p className="text-gray-300 mt-1">{profile.headline}</p>
          {profile.location && <p className="text-gray-400 text-sm mt-1">📍 {profile.location}</p>}
          <div className="flex gap-3 mt-4 flex-wrap">
            {profile.social?.twitter && <a href={profile.social.twitter} target="_blank" rel="noreferrer" className="text-xs px-3 py-1 bg-white bg-opacity-10 rounded-full hover:bg-opacity-20 transition-colors">Twitter</a>}
            {profile.social?.github && <a href={profile.social.github} target="_blank" rel="noreferrer" className="text-xs px-3 py-1 bg-white bg-opacity-10 rounded-full hover:bg-opacity-20 transition-colors">GitHub</a>}
            {profile.social?.linkedin && <a href={profile.social.linkedin} target="_blank" rel="noreferrer" className="text-xs px-3 py-1 bg-white bg-opacity-10 rounded-full hover:bg-opacity-20 transition-colors">LinkedIn</a>}
          </div>
        </div>

        {/* About */}
        {profile.bio && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-base font-bold text-gray-900 mb-2">About</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Experience */}
        {profile.Experience?.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-base font-bold text-gray-900 mb-4">Experience</h3>
            <div className="space-y-4">
              {profile.Experience.map((exp, i) => (
                <div key={i} className={i > 0 ? 'pt-4 border-t border-gray-100' : ''}>
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{exp.title}</p>
                      <p className="text-blue-600 text-sm">{exp.company}</p>
                      {exp.location && <p className="text-xs text-gray-400">{exp.location}</p>}
                    </div>
                    <p className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                      {fmtDate(exp.from)} — {exp.current ? 'Present' : fmtDate(exp.to)}
                    </p>
                  </div>
                  {exp.description && <p className="text-sm text-gray-500 mt-2 leading-relaxed">{exp.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {profile.Education?.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-base font-bold text-gray-900 mb-4">Education</h3>
            <div className="space-y-4">
              {profile.Education.map((edu, i) => (
                <div key={i} className={i > 0 ? 'pt-4 border-t border-gray-100' : ''}>
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{edu.degree} in {edu.field_of_study}</p>
                      <p className="text-blue-600 text-sm">{edu.school}</p>
                      {edu.gpa && <p className="text-xs text-gray-400">GPA: {edu.gpa}</p>}
                    </div>
                    <p className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                      {fmtDate(edu.from)} — {edu.current ? 'Present' : fmtDate(edu.to)}
                    </p>
                  </div>
                  {edu.description && <p className="text-sm text-gray-500 mt-2 leading-relaxed">{edu.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}