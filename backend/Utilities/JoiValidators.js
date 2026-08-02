const joi=require("joi");

const Education=joi.object({
    school:joi.string().required(),
    degree:joi.string().required(),
    field_of_study:joi.string().required(),
    from:joi.date().required(),
    to:joi.date().allow(null, ''),
    current:joi.boolean().allow(null, ''),
    gpa:joi.number().min(0).max(10.0).allow(null, ''),
    description:joi.string().allow(null, ''),
});

const Experience=joi.object({
    company:joi.string().required(),
    title:joi.string().required(),
    location:joi.string().allow(null, ''),
    from:joi.date().required(),
    to:joi.date().allow(null, ''),
    current:joi.boolean().allow(null, ''),
    description:joi.string().allow(null, '')
});

const profile_validator=joi.object({
    bio:joi.string().allow(null, ''),
    headline:joi.string().required(),
    location:joi.string().allow(null, ''),
    social:joi.object({
        twitter:joi.string().allow(null, ''),
        github:joi.string().allow(null, ''),
        linkedin:joi.string().allow(null, '')
    }),

    Education:joi.array().items(Education),
    Experience:joi.array().items(Experience)
});

const profile_validator_update=joi.object({
    bio:joi.string().allow(null, '').optional(),
    headline:joi.string().optional(),
    location:joi.string().allow(null, '').optional(),
    social:joi.object({
        twitter:joi.string().allow(null, '').optional(),
        github:joi.string().allow(null, '').optional(),
        linkedin:joi.string().allow(null, '').optional()
    }).optional(),

    Education:joi.array().items(Education).optional(),
    Experience:joi.array().items(Experience).optional()
});

module.exports={profile_validator,profile_validator_update};


