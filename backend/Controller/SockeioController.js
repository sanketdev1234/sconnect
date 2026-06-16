const { Server } = require('socket.io');
const cors=require("cors");
const { set } = require('mongoose');
const userrooms=new Map();
const userset=new Set();

module.exports.SocketController = (server) => {
const io = new Server(server,{
    cors:{
        origin:["http://localhost:5173"],
        credentials:true,
        methods:["GET","POST","PATCH","PUT","DELETE"]
    },connectionStateRecovery: {}
});

io.on("connection",(socket)=>{
    console.log("A user connected ",socket.id);

    //list the msg sent by clien
    socket.on('Chat Msg',(msg)=>{
        // Broadcast msg to all users in the meeting (including sender)
        io.to(msg.joinid).emit('Chat Msg',msg);
        // Broadcast a notification to all users in the meeting except the sender
        socket.broadcast.to(msg.joinid).emit('New Notification', {
            joinid: msg.joinid,
            notification: 'New message received',
            from: msg.displayname
        });
    });

    // Listen for edit message event
    socket.on('Edit Msg',(msg)=>{
        io.to(msg.joinid).emit('Edit Msg',msg);
    });
    
    //Listen for deleted messages
    socket.on('Delete Msg',(msg)=>{
        io.to(msg.joinid).emit('Delete Msg',msg);
    });
    
    //listen the request to join meeting room
    socket.on('Join Meeting',({displayname,joinid})=>{
        socket.join(joinid);
        if(!userrooms.has(displayname))userrooms.set(displayname,new Set())
            userrooms.get(displayname).add(joinid);
        userset.add(displayname);
        console.log("the user rooms are",userrooms);
        console.log("the userset is",userset);
        console.log(`user ${displayname} joined the meeting of joining id ${joinid}`)
        io.to(joinid).emit('Online Users',Array.from(userset));
    });
    
    //listen the request to leave the meeting room
    socket.on('Leave Meet',({displayname,joinid})=>{
        socket.leave(joinid);
        if (userrooms.has(displayname)) userrooms.get(displayname).delete(joinid);
        userset.delete(displayname);
        console.log("the user rooms are",userrooms);
        console.log("the userset is",userset);
        console.log(`User ${displayname} left meeting ${joinid}`);
        io.to(joinid).emit('Online Users',Array.from(userset));
    });
    

    socket.on('Rejoin Meetings', ({ displayname }) => {
        const rooms = userrooms.get(displayname);
        if (rooms) {
        rooms.forEach(joinid => {
            socket.join(joinid);
            console.log(`user ${displayname} rejoined meeting ${joinid}`);
        });
        }
    });


});
return io;
}

