import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  CalendarDays,
  CheckCircle,
  Edit2,
  Loader2,
  MapPin,
  Plus,
  Trash2,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";

import { useAuth } from "../lib/AuthContext";
import {
  createEvent,
  deleteEvent,
  fetchAllEvents,
  fetchEventRegistrations,
  updateEvent,
  updateRegistrationStatus,
} from "../lib/api";
import { formatCurrency, formatDate, formatDateTime } from "../lib/format";
import { EmptyState } from "./EmptyState";
import { Modal } from "./Modal";
import {
  StatusBadge,
  getEventStatusVariant,
  getRegistrationStatusVariant,
} from "./StatusBadge";
import type {
  EventCategory,
  EventRegistration,
  EventStatus,
  RegistrationStatus,
  TechEvent,
} from "../types";

const EVENT_CATEGORIES: EventCategory[] = ["Bootcamp", "Workshop", "Seminar", "Other"];
const EVENT_STATUSES: EventStatus[] = ["Upcoming", "Ongoing", "Completed", "Cancelled"];
const LIMIT = 20;

// Convert a datetime-local input value (local time, no TZ) to a UTC ISO string
const localInputToISO = (dt: string) => new Date(dt).toISOString();

// Convert a UTC ISO string back to a datetime-local input value (local time)
const isoToLocalInput = (iso: string) => {
  const d = new Date(iso);
  const offsetMs = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 16);
};

export function EventsScreen() {
  const { token } = useAuth();
  const [events, setEvents] = useState<TechEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TechEvent | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<TechEvent | null>(null);
  const [viewingEvent, setViewingEvent] = useState<TechEvent | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(
    async (targetPage = page) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const result = await fetchAllEvents(token, targetPage, LIMIT);
        setEvents(result.data);
        setTotalPages(result.totalPages);
        setTotalCount(result.totalCount);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load events.");
      } finally {
        setLoading(false);
      }
    },
    [token, page]
  );

  useEffect(() => {
    load();
  }, [load]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    load(newPage);
  };

  const handleDelete = async () => {
    if (!token || !deletingEvent) return;
    setDeleteLoading(true);
    try {
      await deleteEvent(token, deletingEvent._id);
      setDeletingEvent(null);
      setPage(1);
      load(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event.");
      setDeletingEvent(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="section-kicker">Events</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Academy Events</h1>
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus className="h-4 w-4" />
          New Event
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        </div>
      ) : error ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
          <XCircle className="h-10 w-10 text-rose-400" />
          <p className="text-sm text-rose-300">{error}</p>
          <button type="button" className="secondary-button" onClick={() => load()}>
            Retry
          </button>
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          title="No events yet"
          description="Create your first academy event to get started."
          icon={<CalendarDays className="h-6 w-6 text-slate-400" />}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Category</th>
                <th className="hidden px-4 py-3 md:table-cell">Date</th>
                <th className="hidden px-4 py-3 lg:table-cell">Price</th>
                <th className="hidden px-4 py-3 lg:table-cell">Capacity</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr
                  key={event._id}
                  className="border-b border-white/5 transition hover:bg-white/[0.03]"
                >
                  <td className="max-w-[220px] px-4 py-3">
                    <p className="truncate font-medium text-white">{event.title}</p>
                    {event.venue ? (
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        <MapPin className="mr-0.5 inline h-3 w-3" />
                        {event.venue}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-300">{event.category}</td>
                  <td className="hidden px-4 py-3 text-slate-400 md:table-cell">
                    {formatDate(event.date)}
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    {event.price === 0 ? (
                      <span className="text-xs font-semibold text-emerald-400">Free</span>
                    ) : (
                      <span className="text-xs font-medium text-white">
                        {formatCurrency(event.price)}
                      </span>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-slate-400 lg:table-cell">
                    {event.capacity ?? <span className="text-slate-600">Unlimited</span>}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={event.status}
                      variant={getEventStatusVariant(event.status)}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        title="View Registrations"
                        className="icon-button text-indigo-400 hover:text-indigo-200"
                        onClick={() => setViewingEvent(event)}
                      >
                        <Users className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Edit Event"
                        className="icon-button text-slate-400 hover:text-white"
                        onClick={() => setEditingEvent(event)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Delete Event"
                        className="icon-button text-slate-400 hover:text-rose-400"
                        onClick={() => setDeletingEvent(event)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-white/8 pt-4">
          <p className="text-xs text-slate-500">
            Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, totalCount)} of{" "}
            {totalCount} events
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="secondary-button px-3 py-2 text-xs disabled:opacity-40"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1 || loading}
            >
              ← Prev
            </button>
            <span className="text-xs text-slate-400">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              className="secondary-button px-3 py-2 text-xs disabled:opacity-40"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages || loading}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Create modal */}
      <EventFormModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSaved={() => {
          setIsCreateOpen(false);
          setPage(1);
          load(1);
        }}
      />

      {/* Edit modal */}
      <EventFormModal
        open={editingEvent !== null}
        initial={editingEvent ?? undefined}
        onClose={() => setEditingEvent(null)}
        onSaved={() => {
          setEditingEvent(null);
          load();
        }}
      />

      {/* Registrations modal */}
      <ViewRegistrationsModal
        event={viewingEvent}
        onClose={() => setViewingEvent(null)}
      />

      {/* Delete confirmation */}
      <Modal
        title="Delete Event"
        description={`"${deletingEvent?.title}" and all its registrations will be permanently removed.`}
        open={deletingEvent !== null}
        onClose={() => setDeletingEvent(null)}
        footer={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setDeletingEvent(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="primary-button !from-rose-500 !via-rose-500 !to-pink-500"
              disabled={deleteLoading}
              onClick={handleDelete}
            >
              {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-300">This action cannot be undone.</p>
      </Modal>
    </div>
  );
}

/* ─── Event Form Modal (Create + Edit) ──────────────────────────────────── */

function EventFormModal({
  open,
  initial,
  onClose,
  onSaved,
}: {
  open: boolean;
  initial?: TechEvent;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { token } = useAuth();
  const isEditing = Boolean(initial);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<EventCategory>("Bootcamp");
  const [date, setDate] = useState("");
  const [regDeadline, setRegDeadline] = useState("");
  const [venue, setVenue] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [capacity, setCapacity] = useState("");
  const [status, setStatus] = useState<EventStatus>("Upcoming");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? "");
      setCategory(initial?.category ?? "Bootcamp");
      setDate(initial ? isoToLocalInput(initial.date) : "");
      setRegDeadline(initial?.registrationDeadline ? isoToLocalInput(initial.registrationDeadline).slice(0, 10) : "");
      setVenue(initial?.venue ?? "");
      setDescription(initial?.description ?? "");
      setPrice(initial ? String(initial.price) : "0");
      setCapacity(initial?.capacity ? String(initial.capacity) : "");
      setStatus(initial?.status ?? "Upcoming");
      setError(null);
    }
  }, [open, initial]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!title.trim()) { setError("Title is required."); return; }
    if (!date) { setError("Event date is required."); return; }

    const numericPrice = Math.max(0, Number(price) || 0);
    const numericCapacity = capacity ? Math.max(1, Number(capacity)) : undefined;

    setSubmitting(true);
    setError(null);

    const payload = {
      title: title.trim(),
      category,
      date: localInputToISO(date),
      registrationDeadline: regDeadline ? localInputToISO(regDeadline + "T00:00") : undefined,
      venue: venue.trim() || undefined,
      description: description.trim() || undefined,
      price: numericPrice,
      capacity: numericCapacity,
      status,
    };

    try {
      if (isEditing && initial) {
        await updateEvent({ token, id: initial._id, ...payload });
      } else {
        await createEvent({ token, ...payload });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save event.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={isEditing ? "Edit Event" : "New Event"}
      description={
        isEditing
          ? "Update the event details below."
          : "Fill in the details to create a new academy event."
      }
      open={open}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-3">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="event-form"
            className="primary-button"
            disabled={submitting}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? "Saving..." : isEditing ? "Save Changes" : "Create Event"}
          </button>
        </div>
      }
    >
      <form id="event-form" className="space-y-4" onSubmit={handleSubmit}>
        {error ? (
          <p className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </p>
        ) : null}

        {/* Title */}
        <div>
          <label className="label-text" htmlFor="ev-title">
            Title
          </label>
          <input
            id="ev-title"
            type="text"
            className="input-field"
            maxLength={150}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Python Bootcamp July 2026"
            required
          />
        </div>

        {/* Category + Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-text" htmlFor="ev-category">
              Category
            </label>
            <select
              id="ev-category"
              className="input-field"
              value={category}
              onChange={(e) => setCategory(e.target.value as EventCategory)}
            >
              {EVENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-text" htmlFor="ev-status">
              Status
            </label>
            <select
              id="ev-status"
              className="input-field"
              value={status}
              onChange={(e) => setStatus(e.target.value as EventStatus)}
            >
              {EVENT_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Date + Deadline */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-text" htmlFor="ev-date">
              Event Date
            </label>
            <input
              id="ev-date"
              type="datetime-local"
              className="input-field"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label-text" htmlFor="ev-deadline">
              Reg. Deadline (optional)
            </label>
            <input
              id="ev-deadline"
              type="date"
              className="input-field"
              value={regDeadline}
              onChange={(e) => setRegDeadline(e.target.value)}
            />
          </div>
        </div>

        {/* Venue */}
        <div>
          <label className="label-text" htmlFor="ev-venue">
            Venue (optional)
          </label>
          <input
            id="ev-venue"
            type="text"
            className="input-field"
            maxLength={200}
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="e.g. TechMinds Academy, Abuja"
          />
        </div>

        {/* Price + Capacity */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-text" htmlFor="ev-price">
              Price ₦ (0 = Free)
            </label>
            <input
              id="ev-price"
              type="number"
              min="0"
              className="input-field"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div>
            <label className="label-text" htmlFor="ev-capacity">
              Capacity (optional)
            </label>
            <input
              id="ev-capacity"
              type="number"
              min="1"
              className="input-field"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="Unlimited"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="label-text" htmlFor="ev-description">
            Description (optional)
          </label>
          <textarea
            id="ev-description"
            className="input-field resize-none"
            rows={3}
            maxLength={1000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief overview of what attendees can expect..."
          />
        </div>
      </form>
    </Modal>
  );
}

/* ─── View Registrations Modal ───────────────────────────────────────────── */

function ViewRegistrationsModal({
  event,
  onClose,
}: {
  event: TechEvent | null;
  onClose: () => void;
}) {
  const { token } = useAuth();
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const REG_LIMIT = 25;

  const load = useCallback(
    async (targetPage = 1) => {
      if (!token || !event) return;
      setLoading(true);
      setError(null);
      try {
        const result = await fetchEventRegistrations(token, event._id, targetPage, REG_LIMIT);
        setRegistrations(result.data);
        setTotalPages(result.totalPages);
        setTotalCount(result.totalCount);
        setPage(targetPage);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load registrations.");
      } finally {
        setLoading(false);
      }
    },
    [token, event]
  );

  useEffect(() => {
    if (event) load(1);
  }, [event, load]);

  const handleStatusUpdate = async (regId: string, newStatus: RegistrationStatus) => {
    if (!token) return;
    setUpdatingId(regId);
    try {
      await updateRegistrationStatus(token, regId, newStatus);
      setRegistrations((prev) =>
        prev.map((r) => (r._id === regId ? { ...r, status: newStatus } : r))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Modal
      title="Registrations"
      description={
        event
          ? `${event.title} — ${totalCount} registrant${totalCount !== 1 ? "s" : ""}`
          : ""
      }
      open={event !== null}
      onClose={onClose}
    >
      {loading ? (
        <div className="flex min-h-[20vh] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <XCircle className="h-8 w-8 text-rose-400" />
          <p className="text-sm text-rose-300">{error}</p>
          <button type="button" className="secondary-button" onClick={() => load()}>
            Retry
          </button>
        </div>
      ) : registrations.length === 0 ? (
        <EmptyState
          title="No registrations yet"
          description="Registrations will appear here once people sign up."
          icon={<Users className="h-5 w-5 text-slate-400" />}
        />
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-400">
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Contact</th>
                  <th className="hidden px-3 py-2 md:table-cell">Registered</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((reg) => (
                  <tr key={reg._id} className="border-b border-white/5">
                    <td className="max-w-[140px] px-3 py-3">
                      <p className="truncate font-medium text-white">{reg.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{reg.source}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-xs text-slate-300">{reg.email}</p>
                      <p className="text-xs text-slate-500">{reg.phone}</p>
                    </td>
                    <td className="hidden px-3 py-3 text-xs text-slate-400 md:table-cell">
                      {formatDateTime(reg.createdAt)}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge
                        label={reg.status}
                        variant={getRegistrationStatusVariant(reg.status)}
                      />
                    </td>
                    <td className="px-3 py-3 text-right">
                      {updatingId === reg._id ? (
                        <Loader2 className="inline h-4 w-4 animate-spin text-indigo-400" />
                      ) : (
                        <div className="inline-flex gap-1">
                          {reg.status === "Pending" && (
                            <button
                              type="button"
                              title="Confirm"
                              className="icon-button text-blue-400 hover:text-blue-300"
                              onClick={() => handleStatusUpdate(reg._id, "Confirmed")}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          {reg.status === "Confirmed" && (
                            <button
                              type="button"
                              title="Mark as Attended"
                              className="icon-button text-emerald-400 hover:text-emerald-300"
                              onClick={() => handleStatusUpdate(reg._id, "Attended")}
                            >
                              <UserCheck className="h-4 w-4" />
                            </button>
                          )}
                          {(reg.status === "Pending" || reg.status === "Confirmed") && (
                            <button
                              type="button"
                              title="Cancel Registration"
                              className="icon-button text-slate-500 hover:text-rose-400"
                              onClick={() => handleStatusUpdate(reg._id, "Cancelled")}
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-slate-500">{totalCount} total registrants</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="secondary-button px-3 py-1.5 text-xs disabled:opacity-40"
                  onClick={() => load(page - 1)}
                  disabled={page <= 1 || loading}
                >
                  ← Prev
                </button>
                <span className="text-xs text-slate-400">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  className="secondary-button px-3 py-1.5 text-xs disabled:opacity-40"
                  onClick={() => load(page + 1)}
                  disabled={page >= totalPages || loading}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
