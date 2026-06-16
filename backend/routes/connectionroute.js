const router=require("express").Router({mergerParams:true});

const connectioncontroller=require("../Controller/connectioncontroller");

// send a connection from req.user to receiverId
router.get("/newrequestsend/:receiverId",connectioncontroller.connection_send_new);

//get my all connections of req.user._id ie status=accepted
router.get("/myconnections",connectioncontroller.get_all_accepted_connections);

//get all connection of req.user._id ie that i new to accept/decline
router.get("/newincomingrequest" , connectioncontroller.get_all_pending_connections);

//req.user._id accept the connection sent by senderId
router.get("/acceptconnection/:senderId",connectioncontroller.accept_connection);

//req.user._id decline the incoming connection sent by senderId ie delete {receiver:req.user._id , senderId} document 
router.delete("/declineconnection/:senderId",connectioncontroller.delete_connection);

module.exports=router;