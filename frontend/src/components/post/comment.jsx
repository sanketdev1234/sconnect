import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from "../usercontext";
import axios from "axios";

export default function CommentsSection({ postId }) {
  const { curruser } = useContext(UserContext);
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (postId) {
      fetchComments();
    }
  }, [postId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get(`/post/${postId}/comment/all`, {
        withCredentials: true
      });
      console.log("the response of fetchcomments",response)
      setComments(response.data.comments || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    try {
      setIsCommenting(true);
      const response = await axios.post(
        `/post/${postId}/comment/new`,
        {text:newCommentText},
        { withCredentials: true }
      );
      console.log("the response of addcomment",response)
      setComments([ ...comments , response.data.comment]);
      setNewCommentText('');
      setIsCommenting(false);
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
      setIsCommenting(false);
    }
  };

  const handleEditComment = async (commentId) => {

    try {
      const response = await axios.patch(
        `/post/${postId}/comment/${commentId}/edit`,
        {text:editText},
        { withCredentials: true }
      );
      console.log("the response of editcomments",response)
      setComments(comments.map(comment => 
        comment._id === commentId 
          ? { ...comment, text: editText }
          : comment
      ));
      
      setEditingCommentId(null);
      setEditText('');
    } catch (error) {
      console.error('Error editing comment:', error);
      alert('Failed to edit comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
  
    try {
      await axios.delete(
        `/post/${postId}/comment/${commentId}/delete`,
        { withCredentials: true }
      );

      setComments(comments.filter(comment => comment._id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment');
    }
  };

  const startEditing = (comment) => {
    setEditingCommentId(comment._id);
    setEditText(comment.text);
  };

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditText('');
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  return (
    <div style={styles.container}>
      {/* Add Comment Form */}
      <div style={styles.addCommentSection}>
        <div style={styles.commentInputWrapper}>
          <div style={styles.userAvatar}>
            {curruser.profile_picture?.url && 
              <img 
                src={curruser.profile_picture.url} 
                alt={curruser.display_name}
                style={styles.avatarImage}
              />
            }
          </div>
          <form onSubmit={handleAddComment} style={styles.commentForm}>
            <input
              type="text"
              placeholder='Add  a comment...'
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              style={styles.commentInput}
              name="text"
            />
            {newCommentText && (
              <button 
                type="submit" 
                style={styles.postButton}
                disabled={isCommenting}
              >
                {isCommenting ? 'Posting...' : 'Post'}
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Comments List */}
      <div style={styles.commentsSection}>
        {loading ? (
          <p style={styles.loadingText}>Loading comments...</p>
        ) : comments.length === 0 ? (
          <p style={styles.noComments}>No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} style={styles.commentCard}>
              <div style={styles.commentHeader}>
                <div style={styles.commentAuthorInfo}>
                  <div style={styles.commentAvatar}>
                      <div> {comment.Author.display_name}</div>
                  </div>
                  <div>
                    <h4 style={styles.commentAuthorName}>
                      {comment.Author?._id === curruser._id 
                        ? 'You' 
                        : comment.Author?.display_name}
                    </h4>
                    <p style={styles.commentTime}>{formatDate(comment.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Comment Content */}
              {editingCommentId === comment._id ? (
                <div style={styles.editSection}>
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    style={styles.editInput}
                    autoFocus
                  />
                  <div style={styles.editActions}>
                    <button 
                      onClick={() => handleEditComment(comment._id)}
                      style={styles.saveButton}
                    >
                      Save
                    </button>
                    <button 
                      onClick={cancelEditing}
                      style={styles.cancelButton}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div style={styles.commentContent}>
                  <p style={styles.commentText}>{comment.text}</p>
                  
                  {/* Action Buttons - Only for comment author */}
                  {comment.Author?._id === curruser._id && (
                    <div style={styles.commentActions}>
                      <button 
                        onClick={() => startEditing(comment)}
                        style={styles.actionLink}
                      >
                        Edit
                      </button>
                      <span style={styles.actionDivider}>•</span>
                      <button 
                        onClick={() => handleDeleteComment(comment._id)}
                        style={styles.actionLink}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '16px',
    borderTop: '1px solid #e0e0e0'
  },
  addCommentSection: {
    marginBottom: '16px'
  },
  commentInputWrapper: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start'
  },
  userAvatar: {
    width: '36px',
    height: '36px',
    flexShrink: 0
  },
  commentAvatar: {
    width: '32px',
    height: '32px',
    flexShrink: 0
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    objectFit: 'cover'
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    backgroundColor: '#0a66c2',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '600'
  },
  commentForm: {
    flex: 1,
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  },
  commentInput: {
    flex: 1,
    padding: '10px 14px',
    border: '1px solid #d0d0d0',
    borderRadius: '20px',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'inherit'
  },
  postButton: {
    padding: '8px 20px',
    backgroundColor: '#0a66c2',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  commentsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    fontSize: '14px',
    padding: '20px 0'
  },
  noComments: {
    textAlign: 'center',
    color: '#999',
    fontSize: '14px',
    padding: '20px 0'
  },
  commentCard: {
    padding: '12px 0'
  },
  commentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px'
  },
  commentAuthorInfo: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center'
  },
  commentAuthorName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    margin: 0
  },
  commentTime: {
    fontSize: '12px',
    color: '#666',
    margin: 0
  },
  commentContent: {
    marginLeft: '42px'
  },
  commentText: {
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#333',
    margin: '0 0 8px 0',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  },
  commentActions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  },
  actionLink: {
    background: 'none',
    border: 'none',
    color: '#666',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    padding: '4px 0'
  },
  actionDivider: {
    color: '#d0d0d0',
    fontSize: '12px'
  },
  editSection: {
    marginLeft: '42px'
  },
  editInput: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d0d0d0',
    borderRadius: '4px',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'inherit',
    marginBottom: '8px'
  },
  editActions: {
    display: 'flex',
    gap: '8px'
  },
  saveButton: {
    padding: '6px 16px',
    backgroundColor: '#0a66c2',
    color: 'white',
    border: 'none',
    borderRadius: '16px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  cancelButton: {
    padding: '6px 16px',
    backgroundColor: 'transparent',
    color: '#666',
    border: '1px solid #d0d0d0',
    borderRadius: '16px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer'
  }
};