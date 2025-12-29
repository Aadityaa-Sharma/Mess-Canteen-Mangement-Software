const mongoose = require('mongoose');

const auditLogSchema = mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    tableName: { type: String, required: true }, // Keeping 'tableName' conceptual property for consistency
    recordId: { type: String }, // ObjectId as string or generic ID
    oldValues: { type: Object },
    newValues: { type: Object },
    ipAddress: { type: String },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: false }
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

// Helper to match usage
const createAuditLog = async (logData) => {
    return await AuditLog.create(logData);
};

module.exports = { AuditLog, createAuditLog };
