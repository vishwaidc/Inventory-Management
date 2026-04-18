const Joi = require('joi');

// --- Auth Schemas ---
const registerSchema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
        .messages({ 'string.min': 'Password must be at least 6 characters' }),
    role: Joi.string().valid('customer', 'mechanic', 'admin').required()
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});


// --- Equipment Schemas ---
const equipmentSchema = Joi.object({
    equipment_name: Joi.string().max(255).required(),
    model_number: Joi.string().max(100).allow('', null),
    serial_number: Joi.string().max(100).allow('', null),
    manufacturer: Joi.string().max(255).allow('', null),
    department: Joi.string().max(255).allow('', null),
    installation_date: Joi.date().iso().allow('', null),
    warranty_expiry: Joi.date().iso().allow('', null)
});


// --- Service History Schemas ---
const serviceSchema = Joi.object({
    equipment_id: Joi.string().uuid().required(),
    service_type: Joi.string().max(100).allow('', null),
    issue_reported: Joi.string().allow('', null),
    work_done: Joi.string().allow('', null),
    parts_replaced: Joi.string().allow('', null),
    status: Joi.string().valid('pending', 'in-progress', 'completed').default('completed')
});

const serviceUpdateSchema = Joi.object({
    service_type: Joi.string().max(100).allow('', null),
    issue_reported: Joi.string().allow('', null),
    work_done: Joi.string().allow('', null),
    parts_replaced: Joi.string().allow('', null),
    status: Joi.string().valid('pending', 'in-progress', 'completed'),
    next_service_due: Joi.date().iso().allow('', null)
});


module.exports = {
    registerSchema,
    loginSchema,
    equipmentSchema,
    serviceSchema,
    serviceUpdateSchema
};
