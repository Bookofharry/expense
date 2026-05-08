const AuditLog = require("../models/AuditLog");

const logAuditAction = async ({ req, action, targetModel, targetId, payload }) => {
  try {
    // Determine the actor ID
    // If during registration, the user might not be in req.user yet, but usually we use req.user._id
    let actorId = req.user ? req.user._id : null;
    
    // In some cases (like initial admin registration), we might pass the newly created user as the actor
    if (!actorId && payload && payload.user && payload.user._id) {
      actorId = payload.user._id;
    }

    if (!actorId) {
      console.warn("Audit Log Warning: No actor ID found for action", action);
      // Fallback: we might skip or record a SYSTEM action if needed, but we expect an actor
      return;
    }

    const ipAddress = req.ip || req.connection.remoteAddress || "Unknown";
    const userAgent = req.headers["user-agent"] || "Unknown";

    await AuditLog.create({
      actor: actorId,
      action,
      targetModel: targetModel || "None",
      targetId: targetId || null,
      payload: payload || {},
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error("Critical: Failed to write audit log:", error);
    // We intentionally don't throw to avoid breaking the main business flow if audit logging fails
  }
};

module.exports = { logAuditAction };
