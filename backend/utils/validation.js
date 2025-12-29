const Joi = require('joi');

const schemas = {
    login: Joi.object({
        mobile: Joi.string().required(),
        password: Joi.string().required()
    }),
    studentAdd: Joi.object({
        name: Joi.string().required(),
        mobile: Joi.string().pattern(/^[0-9]+$/).length(10).required(),
        password: Joi.string().min(6).required(),
        meal_slot: Joi.string().valid('AFTERNOON', 'NIGHT', 'BOTH').required(),
        joined_at: Joi.alternatives().try(Joi.date(), Joi.string()).required()
    }),
    studentEdit: Joi.object({
        name: Joi.string().optional(),
        mobile: Joi.string().pattern(/^[0-9]+$/).length(10).optional(),
        password: Joi.string().min(6).optional().allow(null, ''),
        status: Joi.string().valid('ACTIVE', 'INACTIVE').optional(),
        meal_slot: Joi.string().valid('AFTERNOON', 'NIGHT', 'BOTH').optional(),
        joined_at: Joi.alternatives().try(Joi.date(), Joi.string()).optional().allow(null, '')
    }),
    generateBill: Joi.object({
        month: Joi.string().required(),
        year: Joi.number().integer().required()
    })
};

const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
        res.status(400);
        throw new Error(error.details[0].message);
    }
    next();
};

module.exports = { schemas, validate };