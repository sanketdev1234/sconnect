// Utilities/meetingScheduler.js
const cron = require("node-cron");
const meeting = require("../model/meeting");
const getIo = require("../Controller/SockeioController").getIo;

function startMeetingScheduler() {
    cron.schedule("* * * * *", async () => {
        try {
            const now = new Date();
            const endingMeetings = await meeting.find({
    isEnded: false,
    EndAt: { 
        $exists: true, 
        $ne: null, 
        $lte: now // Combines all conditions smoothly
    }
});

            if (endingMeetings.length > 0) {
                const io = getIo();
                for (const m of endingMeetings) {
                    m.isEnded = true;
                    await m.save();
                    if (io) {
                        io.to(m.Joining_id).emit("Meeting Ended", {
                            joinid: m.Joining_id,
                            meetid: m._id.toString(),
                        });
                    }
                }
                console.log(`Auto-ended ${endingMeetings.length} meeting(s)`);
            }
        } catch (err) {
            console.log("Meeting scheduler error:", err);
        }
    });
    console.log("Meeting auto-end scheduler started");
}

module.exports = startMeetingScheduler;