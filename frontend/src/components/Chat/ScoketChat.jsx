import React from "react";
import {useState , useEffect , useRef} from "react";
import { Send, Users, Pencil,Trash2, Smile, Paperclip, CircleCheckBig } from 'lucide-react';
import {io} from "socket.io-client";
import axios from "axios"
import { useParams } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./ScoketChat.css";
// import VideoCallLauncher from "./VideoCallLauncher";
const socket=io("http://localhost:8080",{withCredentials:true});

function SocketChat(){
const [user,setuser]=useState({});
const {meetid,joinid}=useParams();
const [displayname,setdisplayname]=useState("");
const [onlineUsers,setonlineUsers] = useState(new Set());
const [Messages,setMessages]=useState([]);
const [Input,setInput]=useState("");
const messagesEndRef=useRef(null);
const [isEditing,setisEditing]=useState(false);
const [editInput,seteditInput]=useState("");

useEffect(()=>{
  async function checkuser(){
  await axios.get("/auth/authstatus",{withCredentials: true}).then((response)=>{
  console.log("the response is ", response.data);
  setuser(response.data);
  setdisplayname(response.data.user.display_name);
  console.log(user);

  }).catch((err)=>{
    console.log("the error is ",err);
    Navigate("/pagenotfound")
  });
  }
  checkuser();
},[displayname]);




useEffect(()=>{

    // Join the meeting room
    socket.emit("Join Meeting",{displayname,joinid});
    // Listen for chat messages
    socket.on("Chat Msg",(msg)=>{
    setMessages((prev)=>[...prev,msg]);
    });
    
    //Listen for onlineUsers
    socket.on("Online Users",(data)=>{
      console.log("the data is",data);
      setonlineUsers(new Set(data));
    });

    // Listen for notifications
    socket.on("New Notification",(data)=>{
        toast.success(data.notification+"from"+data.from);
    });

    // Listen for edited messages
    socket.on("Edit Msg",(msg)=>{
      console.log("the message is edited",msg);
      setMessages((prev)=>{
        const updatedMessage=prev.map((message)=>{
          if(message.chatid===msg.chatid){
            return msg;
          }
          return message;
        });
        return updatedMessage;
      });
    });
    
    //Listen for deleted messages
    socket.on("Delete Msg",(msg)=>{
      console.log("the message is deleted",msg);
      setMessages((prev)=>{
        return prev.filter((message)=>message.chatid!==msg.chatid);
      });
    });

    // Rejoin rooms on reconnect
    socket.on("connect",()=>{
    socket.emit("Rejoin Meet",({displayname}));
    });

    // Cleanup on unmount(Leave)
    return ()=>{
        socket.emit("Leave Meet",{displayname,joinid});
        socket.off("New Notification");
        socket.off("Chat Msg");
        socket.off("Edit Msg");
        setonlineUsers(new Set());
    };

},[displayname,joinid,onlineUsers.length]);

useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [Messages]);

  const sendMessage=async (e)=>{
    e.preventDefault();
    if (Input.trim()) {
        const response=await axios.post(`/meeting/${meetid}/chat/new`,{Content:Input}, {
          headers: {
            'Content-Type': 'application/json'
          },
          withCredentials: true
        });
        console.log("the response is sending message",response.data);

        socket.emit("Chat Msg", { meetid,joinid, chatid:response.data._id,displayname, content: Input,time:new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })});
        setInput("");
      }
  };

  const editMessage=(message)=>{
    setisEditing(true);
    seteditInput({...message});
  }
  const editMessagesend=async (e,chatid,meetid,content)=>{
    e.preventDefault();
    try{  
    const response=await axios.patch(`/meeting/${meetid}/chat/${chatid}/edit`,{Content:content}, {
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });
    console.log("the response is editing message",response.data);

    socket.emit("Edit Msg", { meetid,joinid, chatid,displayname, content: content,time:new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })});

    setisEditing(false);
    seteditInput("");
    }
    catch(err){
      console.log("the error is editing message",err);
    }
  }

  const deleteMessage=async (chatid,meetid)=>{
    try{
    const response=await axios.delete(`/meeting/${meetid}/chat/${chatid}/delete`, {
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });
    console.log("the response is deleting message",response.data);
  
    socket.emit("Delete Msg", { meetid,joinid, chatid,displayname, time:new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })});

    }
    catch(err){
      console.log("the error is deleting message",err);
    }
  }
  
return (
  <div className=" vh-100 gradient-bg">
    {/* Sidebar Chat Section */}
    <div className="sidebar-bg border-end">
      {/* Chat Header */}
      <div className="p-3 border-bottom gradient-bg">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            <div className="user-avatar-bg d-flex align-items-center justify-content-center me-2">
              <Users size={20} color="white" />
            </div>
            <div>
              <h2 className="text-white mb-0" style={{ fontSize: '1.25rem' }}>Team Chat</h2>
              <p className="text-white-50 mb-0" style={{ fontSize: '0.9rem' }}>{Array.from(onlineUsers).length} members online</p>
            </div>
          </div>
          {/* <VideoCallLauncher meetid={meetid} joinid={joinid} /> */}
        </div>
      </div>
      {/* Online Users */}
      <div className="p-3 border-bottom gradient-bg2">
        <h3 className="text-white-50 mb-2" style={{ fontSize: '1rem', fontWeight: '500' }}>Online Now</h3>
        <div className="d-flex flex-wrap gap-2">
            {Array.from(onlineUsers).map((user, idx) => (
            <span key={idx} className="d-flex align-items-center user-pill me-2 mb-2 px-3 py-1 rounded-pill">
              <span className="online-dot me-2"></span>
              <span className="text-white" style={{ fontSize: '0.96rem' }}>{user}</span>
            </span>
          ))}
        </div>
      </div>
      {/* Messages Area */}
      <div className="flex-grow-1 position-relative overflow-auto p-3 messages-area">

        <div className="position-relative z-1">
          {Messages.map((message,idx) => (
            <div key={idx} className={`d-flex mb-3 ${message.displayname==displayname ? 'justify-content-end' : 'justify-content-start'}`}>
              <div className={`message-bubble ${message.displayname==displayname ? 'own-msg' : 'other-msg'}`}>
                {message.displayname!=displayname && (
                  <p className="text-white-50 mb-1" style={{ fontSize: '0.8rem', fontWeight: 500 }}>{message.displayname}</p>
                )}
                <div>
                  {!isEditing && (<p className="mb-1" style={{ fontSize: '1rem' }}>{message.content}</p>)}

                  {isEditing && message.chatid!==editInput.chatid && (<p className="mb-1" style={{ fontSize: '1rem' }}>{message.content}</p>)}
                  
                  {isEditing && message.chatid===editInput.chatid && (
                    <form onSubmit={(e)=>editMessagesend(e,message.chatid,message.meetid,editInput.content)}>
                    <input type="text" value={editInput.content} onChange={e => seteditInput({...editInput,content:e.target.value})}  className="form-control bg-transparent text-black message-input" />
                    
                    <button type="submit" className="btn btn-dark btn-sm">Confirm</button>
                    </form>
                    )}

                

                  <span className={`d-block text-end`} style={{ fontSize: '0.8rem', color: message.displayname==displayname ? '#d1c4e9' : '#b0b0b0' }}>{message.time}</span>
                </div>  
                {message.displayname==displayname && (
                  <div className="d-flex align-items-center justify-content-end">
                    
                      {isEditing && (
                        <button className="icon-btn"><CircleCheckBig size={20} color="black"  /></button>
                      )}
                      {!isEditing && (
                        <button className="icon-btn"><Pencil size={20} color="black"onClick={(e) => editMessage(message)} /></button>
                      )}
                      <button className="icon-btn"><Trash2 size={20} color="black" onClick={(e) => deleteMessage(message.chatid,message.meetid)} /></button>
                    
                  </div>
                )} 
              </div> {/*bubble end*/}
            </div>
          ))}
          <div ref={messagesEndRef}></div>{/*end of messages*/}
        </div>
      </div>
      {/* Message Input */}
      <form className="p-3 border-top gradient-bg2" onSubmit={sendMessage} autoComplete="off">
        <div className="d-flex align-items-center gap-2">
          <button type="button" className="icon-btn"><Paperclip size={20} color="#dee2e6" /></button>
          <button type="button" className="icon-btn"><Smile size={20} color="#dee2e6" /></button>
          <input
            type="text"
            value={Input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && sendMessage(e)}
            placeholder="Type your message..."
            className="form-control bg-transparent text-white message-input"
          />
          <button 
            type="submit"
            className="btn send-btn d-flex align-items-center justify-content-center ms-1"
            disabled={!Input.trim()}
          >
            <Send size={20} color="white" />
          </button>
        </div>
      </form>
    </div>
    <ToastContainer position="top-right" autoClose={3000} /> 
  </div>
);
};

export default SocketChat;
