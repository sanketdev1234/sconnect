const profile=require("../model/profile");
const connection=require("../model/connections");
const post=require("../model/post")
module.exports.search_by_profile = async (req, res) => {
  const { query } = req.query;
  try {
    const require_profile = await profile.find({
      $or: [
        { headline: { $regex: query, $options: "i" } },
        { bio: { $regex: query, $options: "i" } },
        { location: { $regex: query, $options: "i" } }
      ]
    }).populate("owner");

    res.status(200).json({ results: require_profile, status: true });  // ✅ JSON
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error });
  }
};

module.exports.suggestions=async(req,res)=>{
    const userid=req.user._id;
    try{
    const excluded_connection=await connection.find({$or:[{sender:userid},{receiver:userid}]});
    const excludedid=excluded_connection.map((conn)=>(conn.sender.toString()===userid.toString())?conn.receiver:conn.sender);
    excludedid.push(userid);

    const user_profile=await profile.find({owner:userid});
    if(!user_profile){
        res.send("create a profile to get the suggestion");
    }
   
    const suggestions=await profile.findOne({  
        owner:{$nin:excludedid},
        $or:[{location:user_profile.location},{"Education.school":{$in:user_profile.Education.map((e)=>e.school)}},
            {"Education.degree":{$in:user_profile.Education?.map((e)=>e.degree) || []}},
            {"Education.field_of_study":{$in:user_profile.Education?.map((e)=>e.field_of_study) || []}},
             {"Experience.company":{$in:user_profile.Experience?.map((e)=>e.company) || []}},
              {"Experience.title":{$in:user_profile.Experience?.map((e)=>e.title) || []}},
        ]
    }).limit(10).populate("owner")
   
    if(!suggestions || suggestions.length === 0){
        res.send("oops no suggestion matching your profile")
    }
    res.send(`suggested profile ${suggestions}`);
    }
    catch(error){
        console.log(error);
        return res.send(error);
    }
}


module.exports.get_personalized_feed = async (req, res) => {
    try {
        const userId = req.user._id;

        // 1. Get IDs of all accepted connections
        const friendsDocs = await connection.find({
            $or: [{ sender: userId }, { receiver: userId }],
            status: "accepted"
        });

        // 2. Create an array of IDs (Friends + Yourself)
        const followedIds = friendsDocs.map(conn => 
            conn.sender.toString() === userId.toString() ? conn.receiver : conn.sender
        );
        followedIds.push(userId); 

        // 3. Find posts from anyone in that list
        const feed = await post.find({ owner: { $in: followedIds } })
            .sort({ createdAt: -1 }) // Newest first
            .populate("owner")
            .populate({
                path: "comments",
                populate: { path: "Author" }
            });

        res.status(200).json(feed);
    } catch (err) {
        res.status(500).send(err.message);
    }
};