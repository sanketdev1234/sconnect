const connection=require("../model/connections");

module.exports.connection_send_new=async(req,res)=>{
const senderid=req.user._id;
const receiverid=req.params.receiverId;
if (senderid.toString() === receiverid) {
            return res.status(400).send("You cannot send a request to yourself.");
        }
try{
const new_connection=await connection.insertOne({sender:senderid , receiver:receiverid ,status:"pending"});
console.log(new_connection);
res.send(`connection request sent ${new_connection}`);
}
catch(err){
    console.log(err);
    return res.send(err);
}
}

module.exports.get_all_accepted_connections=async(req,res)=>{
    const userid=req.user._id;
    try{
    const mynetworks=await connection.find({$or:[{sender:userid} , {receiver:userid}] , status:"accepted"}).populate("sender").populate("receiver");
    console.log("this are my networks",mynetworks)
    const all_accepted_connections=mynetworks.map((conn)=>(conn.sender._id.toString()===userid.toString())?conn.receiver:conn.sender)
    console.log("this is my connection",all_accepted_connections);
    // res.send(`yours all accepted connection ${all_accepted_connections}`);
    res.status(200).json({
        message:"all connections sent",
        connections:all_accepted_connections,
        status:true
    });

    }
catch(err){
    console.log(err);
    return res.send(err);
}
}

module.exports.get_all_pending_connections=async(req,res)=>{
    const userid=req.user._id;
    try{
    const mypendingconnections=await connection.find( {receiver:userid , status:"pending"}).populate("sender");
    console.log(mypendingconnections)
    // res.send(`yours all pending connection ${mypendingconnections}`);
    res.status(200).json({
        message:"all incoming connections sent",
        requests:mypendingconnections,
        status:true
    });
    }
catch(err){
    console.log(err);
    return res.send(err);
}
}

module.exports.accept_connection=async(req,res)=>{
    const senderid=req.params.senderId;
    const receiverid=req.user._id;
    try{
     const updated_curr_connection = await connection.findOneAndUpdate(
            { sender: senderid, receiver: receiverid, status: "pending" },
            { status: "accepted" },
            { new: true }
        );
    if(!updated_curr_connection) return res.status(404).send("Request not found");
        // res.send(`connection accepted ${updated_curr_connection}`);
    res.status(200).json({
        message:"all incoming connections sent",
        requests:updated_curr_connection,
        status:true
    });

    }
catch(err){
    console.log(err);
    return res.send(err);
}
}


module.exports.delete_connection=async(req,res)=>{
    const senderid=req.params.senderId;
    const receiverid=req.user._id;
    try{
     const deleted_curr_connection = await connection.findOneAndDelete({
            $or:[{ sender: senderid, receiver: receiverid}, { sender: receiverid, receiver: senderid}]
    });
    if(!deleted_curr_connection ) return res.status(404).send("connection not found");
        // res.send(`connection removed ${deleted_curr_connection }`);
        res.status(200).json({
        message:"connections removed",
        connections:deleted_curr_connection,
        status:true
    });
    
    }
catch(err){
    console.log(err);
    return res.send(err);
}
}

