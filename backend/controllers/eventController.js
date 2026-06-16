const Event = require("../models/Event");
const EventRegistration = require("../models/EventRegistration");
const asyncHandler = require("../utils/asyncHandler");

// ─── PUBLIC ────────────────────────────────────────────────────────────────

const getEvents = asyncHandler(async (req, res) => {
  await Event.syncStatuses();

  const status = req.query.status || "Upcoming";
  const filter = status === "all" ? {} : { status };

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const [events, totalCount] = await Promise.all([
    Event.find(filter).sort({ date: 1 }).skip(skip).limit(limit).select("-createdBy"),
    Event.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: events.length,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    page,
    data: events,
  });
});

const getEventBySlug = asyncHandler(async (req, res) => {
  const event = await Event.findOne({ slug: req.params.slug }).select("-createdBy");

  if (!event) {
    res.status(404);
    throw new Error("Event not found.");
  }

  res.status(200).json({ success: true, data: event });
});

const registerForEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    res.status(404);
    throw new Error("Event not found.");
  }

  if (event.status !== "Upcoming" && event.status !== "Ongoing") {
    res.status(400);
    throw new Error("Registrations are closed for this event.");
  }

  if (event.registrationDeadline && new Date() > event.registrationDeadline) {
    res.status(400);
    throw new Error("Registration deadline has passed.");
  }

  if (event.capacity) {
    const registrationCount = await EventRegistration.countDocuments({ event: event._id });
    if (registrationCount >= event.capacity) {
      res.status(400);
      throw new Error("This event has reached maximum capacity.");
    }
  }

  try {
    const registration = await EventRegistration.create({
      event: event._id,
      ...req.body,
    });

    res.status(201).json({
      success: true,
      message: "Registration successful! We look forward to seeing you.",
      data: {
        registrationId: registration._id,
        eventTitle: event.title,
        eventDate: event.date,
        name: registration.name,
        email: registration.email,
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      res.status(409);
      throw new Error("This email is already registered for this event.");
    }
    throw err;
  }
});

// ─── ADMIN ─────────────────────────────────────────────────────────────────

const createEvent = asyncHandler(async (req, res) => {
  const event = await Event.create({ ...req.body, createdBy: req.user._id });

  res.status(201).json({
    success: true,
    message: "Event created successfully.",
    data: event,
  });
});

const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    res.status(404);
    throw new Error("Event not found.");
  }

  // Slug is auto-managed; createdBy is immutable
  delete req.body.slug;
  delete req.body.createdBy;

  Object.assign(event, req.body);
  await event.save();

  res.status(200).json({
    success: true,
    message: "Event updated successfully.",
    data: event,
  });
});

const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    res.status(404);
    throw new Error("Event not found.");
  }

  await Promise.all([event.deleteOne(), EventRegistration.deleteMany({ event: event._id })]);

  res.status(200).json({
    success: true,
    message: "Event and all its registrations deleted.",
  });
});

const getEventRegistrations = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    res.status(404);
    throw new Error("Event not found.");
  }

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
  const skip = (page - 1) * limit;

  const filter = { event: event._id };
  if (req.query.status) filter.status = req.query.status;

  const [registrations, totalCount] = await Promise.all([
    EventRegistration.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    EventRegistration.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: registrations.length,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    page,
    eventTitle: event.title,
    data: registrations,
  });
});

const updateRegistrationStatus = asyncHandler(async (req, res) => {
  const registration = await EventRegistration.findById(req.params.regId);

  if (!registration) {
    res.status(404);
    throw new Error("Registration not found.");
  }

  registration.status = req.body.status;
  await registration.save();

  res.status(200).json({
    success: true,
    message: "Registration status updated.",
    data: registration,
  });
});

module.exports = {
  getEvents,
  getEventBySlug,
  registerForEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventRegistrations,
  updateRegistrationStatus,
};
