const isEmpty = (value) => {
  if (value instanceof Date) return false;
  return (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "") ||
    (Array.isArray(value) && value.length === 0) ||
    (typeof value === "object" &&
      !Array.isArray(value) &&
      Object.keys(value).length === 0)
  );
};

const sanitizeObject = (obj, fields) => {
  return Object.fromEntries(
    fields
      .map(([key, valueFn]) => {
        try {
          const value = valueFn(obj);
          return !isEmpty(value) ? [key, value] : null;
        } catch {
          return null;
        }
      })
      .filter(Boolean)
  );
};

export function sanitizeUser(user) {
  return sanitizeObject(user, [
    ["id", (u) => u._id],
    ["name", (u) => u.name],
    ["active", (u) => u.active],
    ["email", (u) => u.email],
    ["phone", (u) => u.phone],
    ["role", (u) => u.role],
    ["position", (u) => u.position],
    ["jobId", (u) => u.jobId],
    ["profileImage", (u) => u.profileImage],
  ]);
}

export function sanitizeDriver(driver) {
  return sanitizeObject(driver, [
    ["id", (d) => d._id],
    ["driverId", (d) => d.driverId],
    ["name", (d) => d.name],
    ["email", (d) => d.email],
    ["phone", (d) => d.phone],
    ["pricePerMile", (d) => d.pricePerMile],
    ["currency", (d) => d.currency],
    ["licenseNumber", (d) => d.licenseNumber],
    ["status", (d) => d.status],
    [
      "assignedTruck",
      (d) => (d.assignedTruck ? d.assignedTruck.plateNumber : undefined),
    ],
    ["hireDate", (d) => d.hireDate],
    [
      "createdBy",
      (d) => (d.createdBy && d.createdBy.name ? d.createdBy.name : undefined),
    ],
    [
      "updatedBy",
      (d) => (d.updatedBy && d.updatedBy.name ? d.updatedBy.name : undefined),
    ],
    ["user", (d) => d.user],
  ]);
}

export function sanitizeTruck(truck) {
  return sanitizeObject(truck, [
    ["id", (t) => t._id],
    ["truckId", (t) => t.truckId],
    ["plateNumber", (t) => t.plateNumber],
    ["model", (t) => t.model],
    ["type", (t) => t.type],
    ["source", (t) => t.source],
    ["year", (t) => t.year],
    ["capacity", (t) => t.capacity],
    ["fuelPerMile", (t) => t.fuelPerMile],
    ["status", (t) => t.status],
    [
      "assignedDriver",
      (t) =>
        t.assignedDriver
          ? {
              name: t.assignedDriver.name,
              driverId: t.assignedDriver.driverId,
            }
          : undefined,
    ],
    [
      "createdBy",
      (d) => (d.createdBy && d.createdBy.name ? d.createdBy.name : undefined),
    ],
    [
      "updatedBy",
      (d) => (d.updatedBy && d.updatedBy.name ? d.updatedBy.name : undefined),
    ],
  ]);
}

export function sanitizeLoad(load) {
  return sanitizeObject(load, [
    ["id", (l) => l._id],
    ["loadId", (l) => l.loadId],

    ["origin", (l) => l.origin?.address],
    ["DHO", (l) => l.DHO?.address],
    [
      "destination",
      (l) =>
        Array.isArray(l.destination) ? l.destination.map((d) => d.address) : [],
    ],

    ["pickupAt", (l) => l.pickupAt],
    ["completedAt", (l) => l.completedAt],
    ["arrivalAtShipper", (l) => l.arrivalAtShipper],
    ["leftShipper", (l) => l.leftShipper],
    ["arrivalAtReceiver", (l) => l.arrivalAtReceiver],
    ["leftReceiver", (l) => l.leftReceiver],
    ["deliveredAt", (l) => l.deliveredAt],
    ["cancelledAt", (l) => l.cancelledAt],

    ["truckType", (l) => l.truckType],
    ["truckTemp", (l) => l.truckTemp],

    ["distanceMiles", (l) => l.distanceMiles],
    ["pricePerMile", (l) => l.pricePerMile],
    ["totalPrice", (l) => l.totalPrice],
    ["feesNumber", (l) => l.feesNumber],
    ["currency", (l) => l.currency],
    ["status", (l) => l.status],

    [
      "driverId",
      (l) =>
        l.driverId
          ? {
              driverId: l.driverId.driverId,
              name: `${l.driverId.name}${
                l.driverId.jobId ? " (" + l.driverId.jobId + ")" : ""
              }`,
              phone: l.driverId.phone,
              user: l.driverId.user,
            }
          : undefined,
    ],

    [
      "truckId",
      (l) =>
        l.truckId
          ? {
              truckId: l.truckId.truckId,
              model: l.truckId.model,
              plateNumber: l.truckId.plateNumber,
              assignedBy: l.truckId.assignedBy
                ? `${l.truckId.assignedBy.name}${
                    l.truckId.assignedBy.jobId
                      ? " (" + l.truckId.assignedBy.jobId + ")"
                      : ""
                  }`
                : undefined,
            }
          : undefined,
    ],

    [
      "comments",
      (l) =>
        l.comments?.length
          ? l.comments.map((c) => ({
              text: c.text,
              type: c.type,
              addedBy: c.addedBy
                ? `${c.addedBy.name}${
                    c.addedBy.jobId ? " (" + c.addedBy.jobId + ")" : ""
                  }`
                : undefined,
              updatedBy: c.updatedBy
                ? `${c.updatedBy.name}${
                    c.updatedBy.jobId ? " (" + c.updatedBy.jobId + ")" : ""
                  }`
                : undefined,
              createdAt: c.createdAt,
            }))
          : [],
    ],
    [
      "documents",
      (l) =>
        l.documents?.length
          ? l.documents.map((d) => ({
              viewLink: d.viewLink,
              downloadLink: d.downloadLink,
            }))
          : [],
    ],
    [
      "documentsForDriver",
      (l) =>
        l.documentsForDriver?.length
          ? l.documentsForDriver.map((d) => ({
              viewLink: d.viewLink,
              downloadLink: d.downloadLink,
            }))
          : [],
    ],
    [
      "createdBy",
      (l) =>
        l.createdBy
          ? `${l.createdBy.name}${
              l.createdBy.jobId ? " (" + l.createdBy.jobId + ")" : ""
            }`
          : undefined,
    ],
    [
      "updatedBy",
      (l) =>
        l.updatedBy
          ? `${l.updatedBy.name}${
              l.updatedBy.jobId ? " (" + l.updatedBy.jobId + ")" : ""
            }`
          : undefined,
    ],
  ]);
}

export function sanitizeDriverLoad(load) {
  return sanitizeObject(load, [
    ["id", (l) => l._id],
    ["loadId", (l) => l.loadId],
    ["truckId", (l) => l.truckId],
    ["truckTemp", (l) => l.truckTemp],

    ["origin", (l) => l.origin?.address],
    ["DHO", (l) => l.DHO?.address],
    [
      "destination",
      (l) =>
        Array.isArray(l.destination) ? l.destination.map((d) => d.address) : [],
    ],

    ["pickupAt", (l) => l.pickupAt],
    ["completedAt", (l) => l.completedAt],
    ["arrivalAtShipper", (l) => l.arrivalAtShipper],
    ["leftShipper", (l) => l.leftShipper],
    ["arrivalAtReceiver", (l) => l.arrivalAtReceiver],
    ["leftReceiver", (l) => l.leftReceiver],
    ["deliveredAt", (l) => l.deliveredAt],
    ["cancelledAt", (l) => l.cancelledAt],

    ["distanceMiles", (l) => l.distanceMiles],
    ["status", (l) => l.status],

    [
      "comments",
      (l) =>
        l.comments?.length
          ? l.comments
              .filter((c) => c.type === "driver")
              .map((c) => ({
                text: c.text,
                createdAt: c.createdAt,
              }))
          : [],
    ],

    [
      "documentsForDriver",
      (l) =>
        l.documentsForDriver?.length
          ? l.documentsForDriver.map((d) => ({
              viewLink: d.viewLink,
              downloadLink: d.downloadLink,
            }))
          : [],
    ],
  ]);
}

export function sanitizeSetting(setting) {
  return sanitizeObject(setting, [
    ["id", (s) => s._id],
    ["key", (s) => s.key],
    ["value", (s) => s.value],
  ]);
}

export function sanitizeNotification(notification) {
  return sanitizeObject(notification, [
    ["id", (n) => n._id],
    ["title", (n) => n.title],
    ["refId", (n) => n.refId],
    ["message", (n) => n.message],
    ["module", (n) => n.module],
    ["importance", (n) => n.importance],
    [
      "from",
      (n) =>
        n.from
          ? `${n.from.name}${n.from.jobId ? " (" + n.from.jobId + ")" : ""}`
          : undefined,
    ],
    [
      "toUser",
      (n) =>
        Array.isArray(n.toUser)
          ? n.toUser.map((u) =>
              u ? `${u.name}${u.jobId ? " (" + u.jobId + ")" : ""}` : undefined
            )
          : [],
    ],
    ["toRole", (n) => n.toRole],
    ["status", (n) => n.status],
    ["createdAt", (n) => n.createdAt],
    ["updatedAt", (n) => n.updatedAt],
  ]);
}

export function sanitizeJobApplication(application) {
  return sanitizeObject(application, [
    ["id", (a) => a._id],
    ["fullName", (a) => a.fullName],
    ["email", (a) => a.email],
    ["phone", (a) => a.phone],
    ["jobTitle", (a) => a.jobTitle],
    ["location", (a) => a.location],
    ["experienceYears", (a) => a.experienceYears],
    ["skills", (a) => a.skills],
    ["cvLink", (a) => a.cvLink],
    ["notes", (a) => a.notes],
    ["status", (a) => a.status],
    [
      "reviewedBy",
      (a) =>
        a.reviewedBy
          ? `${a.reviewedBy.name}${
              a.reviewedBy.jobId ? " (" + a.reviewedBy.jobId + ")" : ""
            }`
          : undefined,
    ],
    ["createdAt", (a) => a.createdAt],
    ["updatedAt", (a) => a.updatedAt],
  ]);
}

export function sanitizeCustomer(customer) {
  return sanitizeObject(customer, [
    ["id", (c) => c._id],
    ["name", (c) => c.name],
    ["phone", (c) => c.phone],
    ["email", (c) => c.email],
    ["address", (c) => c.address],
    ["type", (c) => c.type],
    ["feedback", (c) => c.feedback],
    ["customerId", (c) => c.customerId],
    ["createdBy", (c) => c.createdBy?.name],
    ["updatedBy", (c) => c.updatedBy?.name],
    ["createdAt", (c) => c.createdAt],
    ["updatedAt", (c) => c.updatedAt],
  ]);
}

export function sanitizeTimeOff(timeOff) {
  return sanitizeObject(timeOff, [
    ["id", (t) => t._id],
    ["requestId", (t) => t.requestId],
    [
      "driver",
      (t) =>
        t.driver
          ? `${t.driver.name || ""}${
              t.driver.driverId ? " (" + t.driver.driverId + ")" : ""
            }`
          : undefined,
    ],
    ["phone", (t) => t.driver.phone],
    ["from", (t) => t.from],
    ["to", (t) => t.to],
    ["reason", (t) => t.reason],
    ["status", (t) => t.status],
    ["adminNote", (t) => t.adminNote],
    [
      "approvedBy",
      (t) =>
        t.approvedBy
          ? `${t.approvedBy.name}${
              t.approvedBy.jobId ? " (" + t.approvedBy.jobId + ")" : ""
            }`
          : undefined,
    ],
    [
      "rejectedBy",
      (t) =>
        t.rejectedBy
          ? `${t.rejectedBy.name}${
              t.rejectedBy.jobId ? " (" + t.rejectedBy.jobId + ")" : ""
            }`
          : undefined,
    ],
    ["createdAt", (t) => t.createdAt],
    ["updatedAt", (t) => t.updatedAt],
  ]);
}

export function sanitizeConversation(conv) {
  return sanitizeObject(conv, [
    ["id", (c) => c._id],
    [
      "members",
      (c) =>
        Array.isArray(c.members)
          ? c.members.map((u) => ({ id: u._id, name: u.name }))
          : [],
    ],
    [
      "lastMessage",
      (c) =>
        c.lastMessage
          ? {
              text: c.lastMessage.text,
              sender: c.lastMessage.sender
                ? {
                    id: c.lastMessage.sender._id,
                    name: c.lastMessage.sender.name,
                  }
                : null,
              createdAt: c.lastMessage.createdAt,
            }
          : null,
    ],
    ["createdAt", (c) => c.createdAt],
    ["updatedAt", (c) => c.updatedAt],
  ]);
}

export function sanitizeMessage(msg) {
  return sanitizeObject(msg, [
    ["id", (m) => m._id],
    ["conversationId", (m) => m.conversationId],
    ["text", (m) => m.text],
    [
      "sender",
      (m) => (m.sender ? { id: m.sender._id, name: m.sender.name } : null),
    ],
    ["seen", (m) => m.seen],
    ["createdAt", (m) => m.createdAt],
    ["updatedAt", (m) => m.updatedAt],
  ]);
}

export function sanitizeMaintenance(m) {
  return sanitizeObject(m, [
    ["id", (m) => m._id],
    ["type", (m) => m.type],
    ["repeatBy", (m) => m.repeatBy],
    ["intervalDays", (m) => m.intervalDays],
    ["intervalMile", (m) => m.intervalMile],
    ["remindBeforeDays", (m) => m.remindBeforeDays],
    ["remindBeforeMile", (m) => m.remindBeforeMile],
    ["createdBy", (m) => m.createdBy?.name],
    ["updatedBy", (m) => m.updatedBy?.name],
    [
      "statusPerTruck",
      (m) =>
        Array.isArray(m.statusPerTruck) && m.statusPerTruck.length
          ? m.statusPerTruck
              .map((t) => {
                if (!t.truck) return null;
                const obj = {
                  truckId: t.truck._id,
                  plateNumber: t.truck.plateNumber,
                  totalMileage: t.truck.totalMileage,
                  status: t.status,
                  nextDueDate: t.nextDueDate,
                  nextDueMile: t.nextDueMile,
                  lastDoneAt: t.lastDoneAt,
                  lastDoneMile: t.lastDoneMile,
                };
                return Object.fromEntries(
                  Object.entries(obj).filter(
                    ([_, v]) => v !== undefined && v !== null
                  )
                );
              })
              .filter(Boolean)
          : [],
    ],
    ["createdAt", (m) => m.createdAt],
    ["updatedAt", (m) => m.updatedAt],
  ]);
}
