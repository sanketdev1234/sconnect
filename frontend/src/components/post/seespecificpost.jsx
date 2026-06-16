import React, { useState, useEffect ,useContext} from 'react';
import { useParams } from 'react-router-dom';
import { Link } from "react-router-dom";
import {UserContext} from "../usercontext"
import axios from "axios"
import CommentsSection from './comment';

export default function SeeAllPosts() {
  const {full_name}=useParams();
  const {curruser}=useContext(UserContext);
  const [posts, setPosts] = useState([]);
  // const [isPostLike ,  setisPostLike]=useState(false);
  const [postlike,setpostlike]=useState({});

  const [showComments, setShowComments] = useState({});

  useEffect(() => {
    async function fetchallpost(){
    const response2=await axios.get(`/post/getallpost/${full_name}`,{withCredentials:true});
    console.log("this is the response 2",response2);
    console.log("the current usser is ",curruser);
    setPosts(response2.data.posts);
    const arr=response2.data.posts;
    let obj={};
    arr.forEach((ele)=>{
      obj[ele._id]=ele.likeby
    });
    console.log("obj is",obj);
    setpostlike(obj);
    }
    fetchallpost()
  }, []);
  
  const handleLike = async (postId) => {
    try {
      const response3=await axios.get(`/post/likepost/${postId}`,{withCredentials:true});
      console.log(response3);
      // setisPostLike(!isPostLike);
      if(response3.data==="liked")setpostlike((prev)=>({...prev,[postId]:[...prev[postId],curruser._id]}))
      if(response3.data==="like remove")setpostlike((prev)=>({...prev,[postId]:prev[postId].filter((id)=>id!=curruser._id)}))
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };
  
  const handeletepost=async(postId)=>{
      const response=await axios.delete(`/post/delete/${postId}`);
      console.log("the response of delete post",response);
      setPosts((prev)=>(prev.filter((post)=>post._id!=postId)));
  }

    const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]}  ${date.getFullYear()}`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.feedWrapper}>
        <h1 style={styles.pageTitle}>All post of {full_name}</h1>

        {posts.length === 0 ? (
          <div style={styles.noPosts}>
            <p>No posts yet.</p>
          </div>
        ) : (
          <div style={styles.postsContainer}>
            {posts.map((post) => (
              <div key={post._id} style={styles.postCard}>
                {/* Post Header */}
                <div style={styles.postHeader}>
                  <div style={styles.authorInfo}>
                    <div style={styles.avatar}>
                      {post.owner.profile_picture?.url &&
                        <img 
                          src={post.owner.profile_picture.url} 
                          alt={post.owner.display_name}
                          style={styles.avatarImage}
                        />
                      }
                    </div>
                    <div style={styles.authorDetails}>
                    {(post.owner.display_name!==curruser.display_name)?
                      (<h3 style={styles.authorName}>{post.owner.display_name}</h3>):
                      (<h3 style={styles.authorName}>you</h3>)
                    }
                      <p style={styles.postTime}>{formatDate(post.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Post Content */}
                <div style={styles.postContent}>
                  <p style={styles.postText}>{post.text}</p>
                  
                  {/* Media */}
                  {post.media?.media_url && (
                    <div style={styles.mediaContainer}>
                      {post.media.media_url &&  (
                        <img 
                          src={post.media.media_url} 
                          alt="Post media"
                          style={styles.postImage}
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Post Stats */}
                <div style={styles.postStats}>
                  <span style={styles.statsText}>
                    {postlike[post._id].length} {postlike[post._id].length === 1 ? 'like' : 'likes'}
                  </span>
                  <span style={styles.statsText}>
                    {post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}
                  </span>
                </div>

                {/* Action Buttons */}
                <div style={styles.actionsContainer}>
                  <button 
                    onClick={() => handleLike(post._id)}
                    style={
                      styles.actionButton
                    }
                  >
                    
                    <span style={styles.actionText}>
                      {(postlike[post._id] && postlike[post._id].includes(curruser._id)) ? 'Liked' : 'Like it'}
                    </span>
                  </button>

<button 
  onClick={() => setShowComments(prev => ({
    ...prev, 
    [post._id]: !prev[post._id]
  }))}
  style={styles.actionButton}
>
  <span style={styles.actionText}>
    {showComments[post._id] ? 'Hide Comments' : 'Comment here'}
  </span>
</button>
             
             {post.owner._id===curruser._id && 
                  <button style={styles.actionButton}>
                    <Link to={`/editpost/${post._id}`} style={styles.actionText}>Edit it</Link>
                  </button>
            }
             {post.owner._id===curruser._id && 
                  <button style={styles.actionButton} type="button" onClick={()=>handeletepost(post._id)}>
                    <span>Delete it</span>
                  </button>
            }
                </div>

{showComments[post._id] && (
  <CommentsSection postId={post._id} />
)}

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f3f2ef',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  },
  feedWrapper: {
    maxWidth: '700px',
    margin: '0 auto'
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '20px'
  },
  noPosts: {
    backgroundColor: '#ffffff',
    padding: '40px',
    borderRadius: '8px',
    textAlign: 'center',
    color: '#666',
    fontSize: '16px'
  },
  postsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  postCard: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
    overflow: 'hidden'
  },
  postHeader: {
    padding: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  authorInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  avatar: {
    width: '48px',
    height: '48px'
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    objectFit: 'cover'
  },
  authorName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
    margin: 0
  },
  postTime: {
    fontSize: '13px',
    color: '#666',
    margin: 0
  },
  postContent: {
    padding: '0 16px 16px 16px'
  },
  postText: {
    fontSize: '15px',
    lineHeight: '1.6',
    color: '#333',
    margin: '0 0 12px 0',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  },
  mediaContainer: {
    marginTop: '12px',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  postImage: {
    width: '100%',
    maxHeight: '500px',
    objectFit: 'cover',
    display: 'block'
  },
  postStats: {
    padding: '8px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    borderTop: '1px solid #e0e0e0',
    borderBottom: '1px solid #e0e0e0'
  },
  statsText: {
    fontSize: '13px',
    color: '#666'
  },
  actionsContainer: {
    padding: '8px 16px',
    display: 'flex',
    gap: '8px'
  },
  actionButton: {
    flex: 1,
    padding: '10px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontSize: '15px',
    fontWeight: '500',
    color: '#666',
    transition: 'background-color 0.2s'
  },
  actionButtonActive: {
    color: '#0a66c2'
  },
  actionText: {
    fontSize: '15px'
  },
  
};