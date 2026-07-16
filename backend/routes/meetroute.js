const express=require("express");
const router=express.Router();

const getallmeeting=require("../Controller/meetcontroller").getallmeeting;
const create_new_meet=require("../Controller/meetcontroller").create_new_meet;
const getmeetdetail=require("../Controller/meetcontroller").getmeetdetail;
const deletemeet=require("../Controller/meetcontroller").deletemeet;
const iscorrect_owner=require("../middleware/authmiddleware").iscorrect_owner;
const joinmeet=require("../Controller/meetcontroller").joinmeet;
const endmeetingnow = require("../Controller/meetcontroller").endmeetingnow;
const getMeetingSummary = require("../Controller/meetcontroller").getMeetingSummary;
const generateMeetingSummary = require("../Controller/meetcontroller").generateMeetingSummary;

router.get("/all",getallmeeting);
router.get("/:joinid/join",joinmeet);
router.post("/new",create_new_meet);
router.get("/:meetid/detail",iscorrect_owner,getmeetdetail);
router.delete("/:meetid/delete",iscorrect_owner,deletemeet);
router.patch("/:meetid/end", iscorrect_owner, endmeetingnow);
router.get("/:meetid/summary", iscorrect_owner, getMeetingSummary);
router.post("/:meetid/summary/generate", iscorrect_owner, generateMeetingSummary);

module.exports=router;