import AuditLog from '../modules/audit/audit.model.js';

/**
 * Log an action to the audit log
 * @param {string} actionType 
 * @param {string} userId 
 * @param {string} propertyId 
 * @param {object} payload 
 */
export const logAudit = async (actionType, userId, propertyId, payload) => {
  try {
    await AuditLog.create({
      actionType,
      userId,
      propertyId,
      payload,
    });
  } catch (error) {
    console.error('Audit Log Error:', error);
    // We don't throw here to avoid failing the main request if logging fails
  }
};
