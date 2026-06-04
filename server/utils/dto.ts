function idOf(value: unknown) {
  if (value && typeof value === "object" && "_id" in value) {
    return String((value as { _id: unknown })._id);
  }
  return String(value);
}

function dateOf(value: unknown) {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : new Date(String(value)).toISOString();
}

function textFieldOf(value: unknown, field: string) {
  if (value && typeof value === "object" && field in value) {
    return String((value as Record<string, unknown>)[field] ?? "");
  }
  return undefined;
}

export function userDto(user: any) {
  return {
    id: idOf(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    specialization: user.specialization,
    createdAt: dateOf(user.createdAt),
    updatedAt: dateOf(user.updatedAt)
  };
}

export function serviceDto(service: any) {
  return {
    id: idOf(service._id),
    name: service.name,
    description: service.description,
    price: service.price,
    duration: service.duration,
    status: service.status,
    createdAt: dateOf(service.createdAt),
    updatedAt: dateOf(service.updatedAt)
  };
}

export function scheduleDto(schedule: any) {
  return {
    id: idOf(schedule._id),
    barberId: idOf(schedule.barberId),
    workDays: schedule.workDays,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    status: schedule.status,
    createdAt: dateOf(schedule.createdAt),
    updatedAt: dateOf(schedule.updatedAt)
  };
}

export function reservationDto(reservation: any) {
  return {
    id: idOf(reservation._id),
    customerId: idOf(reservation.customerId),
    barberId: idOf(reservation.barberId),
    serviceId: idOf(reservation.serviceId),
    customerName: textFieldOf(reservation.customerId, "name"),
    customerPhone: textFieldOf(reservation.customerId, "phone"),
    barberName: textFieldOf(reservation.barberId, "name"),
    serviceName: textFieldOf(reservation.serviceId, "name"),
    reservationDate: reservation.reservationDate,
    startTime: reservation.startTime,
    endTime: reservation.endTime,
    status: reservation.status,
    totalPrice: reservation.totalPrice,
    paymentType: reservation.paymentType,
    paymentStatus: reservation.paymentStatus,
    paymentAmount: reservation.paymentAmount ?? reservation.paidAmount,
    paymentProof: reservation.paymentProof,
    paymentRejectedReason: reservation.paymentRejectedReason,
    paymentReviewedBy: reservation.paymentReviewedBy ? idOf(reservation.paymentReviewedBy) : undefined,
    paymentReviewedAt: dateOf(reservation.paymentReviewedAt),
    paidAmount: reservation.paymentAmount ?? reservation.paidAmount,
    isNoShow: reservation.isNoShow,
    cancelledBy: reservation.cancelledBy,
    cancellationReason: reservation.cancellationReason,
    cancelAction: reservation.cancelAction,
    suggestedDate: reservation.suggestedDate,
    suggestedTime: reservation.suggestedTime,
    suggestedBarberId: reservation.suggestedBarberId ? idOf(reservation.suggestedBarberId) : undefined,
    refundStatus: reservation.refundStatus,
    barberCompletionRequested: reservation.barberCompletionRequested,
    barberCompletedAt: dateOf(reservation.barberCompletedAt),
    barberCompletionNote: reservation.barberCompletionNote,
    adminCompletedAt: dateOf(reservation.adminCompletedAt),
    createdAt: dateOf(reservation.createdAt),
    updatedAt: dateOf(reservation.updatedAt)
  };
}

export function messageDto(message: any) {
  return {
    id: idOf(message._id),
    customerId: idOf(message.customerId),
    reservationId: message.reservationId ? idOf(message.reservationId) : undefined,
    senderId: message.senderId ? idOf(message.senderId) : undefined,
    title: message.title,
    message: message.message,
    messageType: message.messageType,
    isRead: message.isRead,
    createdAt: dateOf(message.createdAt),
    updatedAt: dateOf(message.updatedAt)
  };
}
