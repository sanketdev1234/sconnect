import React, { useState } from 'react';
import axios from "axios";

export default function CreateProfile(){
const [formData, setFormData] = useState({
    bio: '',
    headline: '',
    location: '',
    social: {
      twitter: '',
      github: '',
      linkedin: ''
    },
    education: [],
    experience: []
  });

  const [currentEducation, setCurrentEducation] = useState({
    school: '',
    degree: '',
    field_of_study: '',
    from: '',
    to: '',
    current: false,
    gpa: '',
    description: ''
  });

  const [currentExperience, setCurrentExperience] = useState({
    company: '',
    title: '',
    location: '',
    from: '',
    to: '',
    current: false,
    description: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSocialChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      social: {
        ...prev.social,
        [name]: value
      }
    }));
  };

  const handleEducationChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentEducation(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addEducation = () => {
    if (currentEducation.school && currentEducation.degree && currentEducation.field_of_study && currentEducation.from) {
      setFormData(prev => ({
        ...prev,
        education: [...prev.education, currentEducation]
      }));
      setCurrentEducation({
        school: '',
        degree: '',
        field_of_study: '',
        from: '',
        to: '',
        current: false,
        gpa: '',
        description: ''
      });
    }
  };

  const removeEducation = (index) => {
    setFormData((prev)=>({...prev,education:currentEducation.filter((e,i)=>i!==index)}))
  };

  const handleExperienceChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentExperience(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addExperience = () => {
    if (currentExperience.company && currentExperience.title && currentExperience.from) {
      setFormData(prev => ({
        ...prev,
        experience: [...prev.experience, currentExperience]
      }));
      setCurrentExperience({
        company: '',
        title: '',
        location: '',
        from: '',
        to: '',
        current: false,
        description: ''
      });
    }
  };

  const removeExperience = (index) => {
    setFormData((prev)=>({...prev,experience:currentExperience.filter((e,i)=>i!==index)}))
  };

  const handleSubmit = async(e) => {
    console.log('Profile Data:', formData);
    e.preventDefault;
    const response=await axios.post("/profile/addnew",{
    bio: formData.bio,
    headline: formData.headline,
    location: formData.location,
    social:formData.social,
    Education:formData.education ,
    Experience:formData.experience
    },{withCredentials: true })
    console.log(response);
  };


  return (
    <div style={styles.container}>
      <div style={styles.formWrapper}>
        <h1 style={styles.title}>Create Your Profile</h1>
        
        <div>
          {/* Basic Information Section */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Basic Information</h2>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Professional Headline *</label>
              <input
                type="text"
                name="headline"
                value={formData.headline}
                onChange={handleInputChange}
                placeholder="e.g., Senior Node.js Developer"
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Tell us about yourself..."
                style={styles.textarea}
                rows="4"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g., San Francisco, CA"
                style={styles.input}
              />
            </div>
          </section>

          {/* Social Links Section */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Social Links</h2>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Twitter</label>
              <input
                type="text"
                name="twitter"
                value={formData.social.twitter}
                onChange={handleSocialChange}
                placeholder="https://twitter.com/username"
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>GitHub</label>
              <input
                type="text"
                name="github"
                value={formData.social.github}
                onChange={handleSocialChange}
                placeholder="https://github.com/username"
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>LinkedIn</label>
              <input
                type="text"
                name="linkedin"
                value={formData.social.linkedin}
                onChange={handleSocialChange}
                placeholder="https://linkedin.com/in/username"
                style={styles.input}
              />
            </div>
          </section>

          {/* Education Section */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Education</h2>
            
            <div style={styles.addItemContainer}>
              <div style={styles.formGroup}>
                <label style={styles.label}>School/Institution *</label>
                <input
                  type="text"
                  name="school"
                  value={currentEducation.school}
                  onChange={handleEducationChange}
                  placeholder="e.g., Stanford University"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Degree *</label>
                <input
                  type="text"
                  name="degree"
                  value={currentEducation.degree}
                  onChange={handleEducationChange}
                  placeholder="e.g., B.Tech, M.S., Ph.D."
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Field of Study *</label>
                <input
                  type="text"
                  name="field_of_study"
                  value={currentEducation.field_of_study}
                  onChange={handleEducationChange}
                  placeholder="e.g., Computer Science"
                  style={styles.input}
                />
              </div>

              <div style={styles.dateRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Start Date *</label>
                  <input
                    type="date"
                    name="from"
                    value={currentEducation.from}
                    onChange={handleEducationChange}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>End Date</label>
                  <input
                    type="date"
                    name="to"
                    value={currentEducation.to}
                    onChange={handleEducationChange}
                    style={styles.input}
                    disabled={currentEducation.current}
                  />
                </div>
              </div>

              <div style={styles.checkboxGroup}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="current"
                    checked={currentEducation.current}
                    onChange={handleEducationChange}
                    style={styles.checkbox}
                  />
                  Currently studying here
                </label>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>GPA</label>
                <input
                  type="number"
                  name="gpa"
                  value={currentEducation.gpa}
                  onChange={handleEducationChange}
                  placeholder="e.g., 8.0"
                  step="0.01"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  name="description"
                  value={currentEducation.description}
                  onChange={handleEducationChange}
                  placeholder="Activities, societies, achievements..."
                  style={styles.textarea}
                  rows="3"
                />
              </div>

              <button type="button" onClick={addEducation} style={styles.addButton}>
                Add Education
              </button>
            </div>

            {formData.education.length > 0 && (
              <div style={styles.itemsList}>
                <h3 style={styles.listTitle}>Added Education:</h3>
                {formData.education.map((edu, index) => (
                  <div key={index} style={styles.item}>
                    <div style={styles.itemContent}>
                      <strong>{edu.degree} in {edu.field_of_study}</strong>
                      <p>{edu.school}</p>
                      <p style={styles.itemDate}>
                        {new Date(edu.from).getFullYear()} - {edu.current ? 'Present' : new Date(edu.to).getFullYear()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEducation(index)}
                      style={styles.removeButton}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Experience Section */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Work Experience</h2>
            
            <div style={styles.addItemContainer}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Company *</label>
                <input
                  type="text"
                  name="company"
                  value={currentExperience.company}
                  onChange={handleExperienceChange}
                  placeholder="e.g., Google"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Job Title *</label>
                <input
                  type="text"
                  name="title"
                  value={currentExperience.title}
                  onChange={handleExperienceChange}
                  placeholder="e.g., Senior Software Engineer"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Location</label>
                <input
                  type="text"
                  name="location"
                  value={currentExperience.location}
                  onChange={handleExperienceChange}
                  placeholder="e.g., Mountain View, CA"
                  style={styles.input}
                />
              </div>

              <div style={styles.dateRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Start Date *</label>
                  <input
                    type="date"
                    name="from"
                    value={currentExperience.from}
                    onChange={handleExperienceChange}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>End Date</label>
                  <input
                    type="date"
                    name="to"
                    value={currentExperience.to}
                    onChange={handleExperienceChange}
                    style={styles.input}
                    disabled={currentExperience.current}
                  />
                </div>
              </div>

              <div style={styles.checkboxGroup}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="current"
                    checked={currentExperience.current}
                    onChange={handleExperienceChange}
                    style={styles.checkbox}
                  />
                  Currently working here
                </label>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  name="description"
                  value={currentExperience.description}
                  onChange={handleExperienceChange}
                  placeholder="Responsibilities and achievements..."
                  style={styles.textarea}
                  rows="3"
                />
              </div>

              <button type="button" onClick={addExperience} style={styles.addButton}>
                Add Experience
              </button>
            </div>

            {formData.experience.length > 0 && (
              <div style={styles.itemsList}>
                <h3 style={styles.listTitle}>Added Experience:</h3>
                {formData.experience.map((exp, index) => (
                  <div key={index} style={styles.item}>
                    <div style={styles.itemContent}>
                      <strong>{exp.title}</strong>
                      <p>{exp.company} {exp.location && `- ${exp.location}`}</p>
                      <p style={styles.itemDate}>
                        {new Date(exp.from).getFullYear()} - {exp.current ? 'Present' : new Date(exp.to).getFullYear()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExperience(index)}
                      style={styles.removeButton}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <button onClick={handleSubmit} style={styles.submitButton}>
            Create Profile
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '40px 20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  },
  formWrapper: {
    maxWidth: '800px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  title: {
    fontSize: '32px',
    fontWeight: '600',
    marginBottom: '30px',
    color: '#333',
    textAlign: 'center'
  },
  section: {
    marginBottom: '40px',
    paddingBottom: '30px',
    borderBottom: '1px solid #e0e0e0'
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: '600',
    marginBottom: '20px',
    color: '#444'
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#555'
  },
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    boxSizing: 'border-box',
    outline: 'none'
  },
  textarea: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    boxSizing: 'border-box',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit'
  },
  dateRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px'
  },
  checkboxGroup: {
    marginBottom: '20px'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    color: '#555',
    cursor: 'pointer'
  },
  checkbox: {
    marginRight: '8px',
    cursor: 'pointer'
  },
  addItemContainer: {
    backgroundColor: '#f9f9f9',
    padding: '20px',
    borderRadius: '6px',
    marginBottom: '20px'
  },
  addButton: {
    padding: '10px 20px',
    backgroundColor: '#0e0e0eff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  itemsList: {
    marginTop: '20px'
  },
  listTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '15px',
    color: '#555'
  },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '15px',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
    marginBottom: '10px'
  },
  itemContent: {
    flex: 1
  },
  itemDate: {
    fontSize: '13px',
    color: '#666',
    marginTop: '5px'
  },
  removeButton: {
    padding: '6px 12px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '13px',
    cursor: 'pointer',
    marginLeft: '10px'
  },
  submitButton: {
    width: '100%',
    padding: '15px',
    backgroundColor: '#070707ff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '20px'
  }
};