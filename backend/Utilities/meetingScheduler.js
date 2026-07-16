// Utilities/meetingScheduler.js
const cron = require("node-cron");
const meeting = require("../model/meeting");
const getIo = require("../Controller/SockeioController").getIo;
const { summarizeMeeting } = require("./aiSummarizer");

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

                    // Generate AI summary in background for auto-ended meetings
                    const populated = await meeting.findById(m._id).populate({
                        path: "Chats",
                        populate: { path: "Author", select: "display_name" },
                    });
                    if (populated && populated.Chats.length > 0) {
                        summarizeMeeting(populated.Chats)
                            .then(async (result) => {
                                populated.summary = {
                                    text: result.summary,
                                    messageCount: result.messageCount,
                                    generatedAt: result.generatedAt,
                                };
                                await populated.save();
                                console.log("[AI] Auto-end summary generated for:", m._id);
                            })
                            .catch((err) => console.error("[AI] Auto-end summary error:", err.message));
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