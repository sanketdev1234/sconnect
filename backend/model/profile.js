const mongoose=require("mongoose");
const user=require("./user");
const Schema=mongoose.Schema;

const EducationSchema=new Schema({
// Name of the institution (University, College)
    school: {
        type: String,
        required: true,
        
    },
    // Degree obtained (e.g., B.Tech, M.S., Ph.D.)
    degree: {
        type: String,
        required: true
    },
    // Field of study (e.g., Computer Science, Electrical Engineering)
    field_of_study: {
        type: String,
        required: true
    },
    // Start date of attendance
    from: {
        type: Date,
        required: true
    },
    // Graduation date
    to: {
        type: Date
    },
    current: {
        type: Boolean,
        default: false
    },
    // Grades or GPA (optional)
    gpa: {
        type: Number,
    },
    // A brief note about activities or societies
    description: {
        type: String
    }

});

const WorkSchema=new Schema({
// Store the company name
    company: {
        type: String,
        required: true,
    },
    // The user's job title at the company
    title: {
        type: String,
        required: true,
    },
    // Location of the job (city, state, country)
    location: {
        type: String,
    },
    // Start date of the job
    from: {
        type: Date,
        required: true
    },
    // End date of the job (or null/undefined if current)
    to: {
        type: Date
    },
    // Is the user currently employed here? (Good for easy sorting)
    current: {
        type: Boolean,
        default: false
    },
    // A brief description of responsibilities/achievements
    description: {
        type: String
    }

});


const ProfileSchema=new Schema({
    owner:{
        type:Schema.Types.ObjectId,
        ref:"user",
        unique: true
    },
    // Core professional summary (like a LinkedIn "About" section)
    bio: {
        type: String,
        
    },

    // Professional headline (e.g., "Senior Node.js Developer")
    headline: {
        type: String,
        required: true,
        
    },

    // Optional: Location (can be derived from Work/Education but good for quick display)
    location: {
        type: String,
        
    },

    social: {
        twitter: { type: String },
        github: { type: String },
        linkedin: { type: String } // You can store the user's actual LinkedIn URL here
    },
    Education:
        [EducationSchema],
   
    Experience:
      [WorkSchema],

    // AI: 384-dim sentence-transformer embedding for semantic search
    embedding: {
        type: [Number],
        default: null,
        select: false,  // Don't return in normal queries (large array)
    },

});

const profile=mongoose.model("profile",ProfileSchema);
module.exports=profile;

