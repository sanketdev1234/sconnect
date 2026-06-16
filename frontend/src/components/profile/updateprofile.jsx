import React, { useState, useEffect } from 'react';
import axios from "axios";
import {useParams} from "react-router-dom"
export default function UpdateProfile() {
  const {wantid,profileId}=useParams()
  const [formData, setFormData] = useState({
    bio: '',
    headline: '',
    location: '',
    social: {
      twitter: '',
      github: '',
      linkedin: ''
    },
    Education: [],
    Experience: [],

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



  // Fetch existing profile data on component mount
  useEffect(()=>{
        async function getprofile(){
            const response=await axios.get(`/profile/get/${wantid}`,{withCredentials:true})
            console.log(typeof(response));
            console.log(response.data)
            setFormData(response.data.profile);
            setCurrentEducation(response.data.profile.Education);
            setCurrentExperience(response.data.profile.Experience);
        }
        getprofile();
  },[]);


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
        Education: [...prev.Education, currentEducation]
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
    setFormData(prev => ({
      ...prev,
      Education: prev.Education.filter((_, i) => i !== index)
    }));
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
        Experience: [...prev.Experience, currentExperience]
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
    setFormData(prev => ({
      ...prev,
      Experience: prev.Experience.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log(formData)
      const respone=await axios.put(`/profile/edit/${profileId}`,formData,{withCredentials:true});
      console.log(respone);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.formWrapper}>
        <h1 style={styles.title}>Update Your Profile</h1>
        
        <div>
         <form onSubmit={handleSubmit}>
          {/* Basic Information Section */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Basic Information</h2>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Professional Headline</label>
              <input
                type="text"
                name="headline"
                value={formData.headline}
                onChange={handleInputChange}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
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
                <label style={styles.label}>GPA (0-10)</label>
                <input
                  type="number"
                  name="gpa"
                  value={currentEducation.gpa}
                  onChange={handleEducationChange}
                  step="0.01"
                  min="0"
                  max="10"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  name="description"
                  value={currentEducation.description}
                  onChange={handleEducationChange}
                  style={styles.textarea}
                  rows="3"
                />
              </div>

              <button type="button" onClick={addEducation} style={styles.addButton}>
                Add Education
              </button>
            </div>

            {formData.Education.length > 0 && (
              <div style={styles.itemsList}>
                <h3 style={styles.listTitle}>Current Education Entries:</h3>
                {formData.Education.map((edu, index) => (
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
                  style={styles.textarea}
                  rows="3"
                />
              </div>

              <button type="button" onClick={addExperience} style={styles.addButton}>
                Add Experience
              </button>
            </div>

            {formData.Experience.length > 0 && (
              <div style={styles.itemsList}>
                <h3 style={styles.listTitle}>Current Experience Entries:</h3>
                {formData.Experience.map((exp, index) => (
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

          <button type="submit" style={styles.submitButton}>
            Update Profile
          </button>
          </form>
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
  loadingText: {
    fontSize: '20px',
    textAlign: 'center',
    padding: '50px',
    color: '#666'
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
  profilePictureContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px'
  },
  profilePicturePreview: {
    width: '150px',
    height: '150px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid #ddd'
  },
  fileInput: {
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer'
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
    backgroundColor: '#070707ff',
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
    backgroundColor: '#0d0d0eff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '20px'
  }
};