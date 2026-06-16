import React, { useState, useEffect } from 'react';
import axios from "axios";
import { useParams, useNavigate } from 'react-router-dom';

export default function EditPost() {
  const { postId } = useParams();
  const navigate = useNavigate();
  
  const [postData, setPostData] = useState({
    text: ''
  });
  const [originalMedia, setOriginalMedia] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState('');
  const [error, setError] = useState('');
  const [timeExpired, setTimeExpired] = useState(false);

  useEffect(() => {
    fetchPostData();
  }, [postId]);

  const fetchPostData = async () => {
    try {
      const response = await axios.get(`/post/getpost/${postId}`, { withCredentials: true });
      console.log("response in edit post",response)
      setPostData({ text: response.data.text || '' });
      
      if (response.data.media && response.data.media.media_url) {
        setOriginalMedia(response.data.media.media_url);
        setMediaPreview(response.data.media.media_url);
      }
      
      // Check if 30 minutes have passed
      const postCreationTime = new Date(response.data.createdAt);
      const currentTime = new Date();
      const diffInMinutes = (currentTime - postCreationTime) / (1000 * 60);
      
      if (diffInMinutes > 30) {
        setTimeExpired(true);
        setError('This post can no longer be edited. Posts can only be edited within 30 minutes of creation.');
      }
      
    } catch (error) {
      console.error('Error fetching post:', error);
      setError(error.response?.data?.message || 'Failed to load post data');
    }
  };

  const handleTextChange = (e) => {
    setPostData({
      text: e.target.value
    });
  };

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (timeExpired) {
      alert('This post can no longer be edited.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('text', postData.text);

      if (mediaFile) {
        formData.append('edited-post-image', mediaFile);
      }

      const response = await axios.put(`/post/edit/${postId}`, formData, { 
        withCredentials: true 
      });
      
      console.log(response);
      alert('Post updated successfully!');
      
      // Navigate back or to post view
      // navigate(`/post/${postId}`);
      
    } catch (error) {
      console.error('Error updating post:', error);
      
      if (error.response?.status === 403) {
        setTimeExpired(true);
        setError(error.response.data.message);
        alert(error.response.data.message);
      } else {
        alert(error.response?.data?.message || 'Failed to update post');
      }
    }
  };



  if (error && timeExpired) {
    return (
      <div style={styles.container}>
        <div style={styles.postWrapper}>
          <h2 style={styles.title}>Edit Post</h2>
          <div style={styles.errorBox}>
            <p style={styles.errorText}>{error}</p>
          </div>
          <button 
            onClick={() => navigate(-1)} 
            style={styles.backButton}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.postWrapper}>
        <h2 style={styles.title}>Edit Post</h2>
        <p style={styles.warningText}>
           Posts can only be edited within 30 minutes of creation
        </p>
        
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div style={styles.formSection}>
            <div style={styles.formGroup}>
              <label style={styles.label}>What's on your mind?</label>
              <textarea
                name="text"
                value={postData.text}
                onChange={handleTextChange}
                style={styles.textarea}
                rows="6"
              />
              <div style={styles.charCount}>
                {postData.text.length} characters
              </div>
            </div>
           
            {!mediaPreview && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Add Media (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleMediaChange}
                  style={styles.fileInput}
                  name="edited-post-image"
                />
                <p style={styles.helpText}>You can upload an image</p> 
              </div>
            )}

            {mediaPreview && (
              <div style={styles.mediaPreviewContainer}>
                <div style={styles.mediaPreviewHeader}>
                  <span style={styles.previewLabel}>
                    {mediaFile ? 'New Image:' : 'Current Image:'}
                  </span>
                  <button
                    type="button"
                    onClick={removeMedia}
                    style={styles.removeMediaButton}
                  >
                    {mediaFile ? 'Remove New Image' : 'Remove Image'}
                  </button>
                </div>
                
                <img 
                  src={mediaPreview} 
                  alt="Preview" 
                  style={styles.imagePreview}
                />
              </div>
            )}

            <button 
              type="submit" 
              style={timeExpired ? {...styles.submitButton, ...styles.submitButtonDisabled} : styles.submitButton}
              disabled={timeExpired}
            >
              Update Post
            </button>
          </div>
        </form>
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
  postWrapper: {
    maxWidth: '700px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  title: {
    fontSize: '28px',
    fontWeight: '600',
    marginBottom: '15px',
    color: '#333',
    textAlign: 'center'
  },
  warningText: {
    textAlign: 'center',
    color: '#ff9800',
    fontSize: '14px',
    marginBottom: '25px',
    padding: '10px',
    backgroundColor: '#fff3e0',
    borderRadius: '4px'
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    fontSize: '16px',
    padding: '40px'
  },
  errorBox: {
    backgroundColor: '#ffebee',
    padding: '15px',
    borderRadius: '6px',
    marginBottom: '20px',
    border: '1px solid #ef5350'
  },
  errorText: {
    color: '#c62828',
    fontSize: '14px',
    margin: 0,
    textAlign: 'center'
  },
  backButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#757575',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  formSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  formGroup: {
    marginBottom: '10px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#555'
  },
  textarea: {
    width: '100%',
    padding: '12px',
    fontSize: '15px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    boxSizing: 'border-box',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: '1.5'
  },
  charCount: {
    fontSize: '12px',
    color: '#999',
    marginTop: '5px',
    textAlign: 'right'
  },
  fileInput: {
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    cursor: 'pointer',
    backgroundColor: '#fafafa'
  },
  helpText: {
    fontSize: '12px',
    color: '#999',
    marginTop: '5px',
    marginBottom: 0
  },
  mediaPreviewContainer: {
    marginTop: '10px',
    padding: '15px',
    backgroundColor: '#f9f9f9',
    borderRadius: '6px',
    border: '1px solid #e0e0e0'
  },
  mediaPreviewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  previewLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#555'
  },
  removeMediaButton: {
    padding: '6px 12px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '13px',
    cursor: 'pointer',
    fontWeight: '500'
  },
  imagePreview: {
    width: '100%',
    maxHeight: '400px',
    objectFit: 'contain',
    borderRadius: '6px'
  },
  submitButton: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#111212ff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '10px'
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed'
  }
};