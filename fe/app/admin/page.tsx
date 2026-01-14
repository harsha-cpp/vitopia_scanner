"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  BarChart3,
  Users,
  Ticket,
  DollarSign,
  Calendar,
  MapPin,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import {
  getEvents,
  getEventStats,
  Event,
  EventStats,
} from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function AdminPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    date: "",
    time: "",
    venue: "",
    capacity: 100,
    price: 0,
  });

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      loadStats(selectedEvent);
      const interval = setInterval(() => loadStats(selectedEvent), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedEvent]);

  async function loadEvents() {
    setLoading(true);
    try {
      const data = await getEvents();
      setEvents(data);
      if (data.length > 0 && !selectedEvent) {
        setSelectedEvent(data[0]._id);
      }
    } catch (error) {
      console.error("Failed to load events:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadStats(eventId: string) {
    try {
      const data = await getEventStats(eventId);
      setStats(data);
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  }

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    try {
      const dateTime = new Date(`${formData.date}T${formData.time}`).getTime();
      
      const response = await fetch(`${API_URL}/api/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          date: dateTime,
          venue: formData.venue,
          capacity: formData.capacity,
          price: Math.round(formData.price * 100), // Convert to cents
        }),
      });

      if (response.ok) {
        setShowCreateForm(false);
        setFormData({
          name: "",
          description: "",
          date: "",
          time: "",
          venue: "",
          capacity: 100,
          price: 0,
        });
        await loadEvents();
      } else {
        alert("Failed to create event");
      }
    } catch (error) {
      console.error("Create event error:", error);
      alert("Failed to create event");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Admin Dashboard
              </h1>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Event
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Events Yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create your first event to get started.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Event
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Event List */}
            <div className="lg:col-span-1">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Events
              </h2>
              <div className="space-y-2">
                {events.map((event) => (
                  <button
                    key={event._id}
                    onClick={() => setSelectedEvent(event._id)}
                    className={`w-full text-left p-4 rounded-xl transition-colors ${
                      selectedEvent === event._id
                        ? "bg-indigo-100 dark:bg-indigo-900/30 border-2 border-indigo-500"
                        : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-indigo-300"
                    }`}
                  >
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {event.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(event.date).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Stats Dashboard */}
            <div className="lg:col-span-3">
              {stats ? (
                <>
                  {/* Event Header */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                          {stats.event.name}
                        </h2>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(stats.event.date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {stats.event.venue}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => selectedEvent && loadStats(selectedEvent)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        title="Refresh stats"
                      >
                        <RefreshCw className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatCard
                      icon={<Ticket className="w-6 h-6" />}
                      label="Tickets Sold"
                      value={stats.totalTicketsSold}
                      color="indigo"
                    />
                    <StatCard
                      icon={<Users className="w-6 h-6" />}
                      label="Checked In"
                      value={stats.totalCheckedIn}
                      color="green"
                    />
                    <StatCard
                      icon={<DollarSign className="w-6 h-6" />}
                      label="Revenue"
                      value={`$${(stats.totalRevenue / 100).toFixed(0)}`}
                      color="yellow"
                    />
                    <StatCard
                      icon={<BarChart3 className="w-6 h-6" />}
                      label="Capacity Left"
                      value={stats.capacityRemaining}
                      color="blue"
                    />
                  </div>

                  {/* Progress Bar */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Check-in Progress
                    </h3>
                    <div className="relative h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-green-500 transition-all duration-500"
                        style={{
                          width: `${
                            stats.totalTicketsSold > 0
                              ? (stats.totalCheckedIn / stats.totalTicketsSold) * 100
                              : 0
                          }%`,
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-sm font-medium">
                        {stats.totalCheckedIn} / {stats.totalTicketsSold} checked in
                        {stats.totalTicketsSold > 0 && (
                          <span className="ml-2 text-gray-500">
                            (
                            {Math.round(
                              (stats.totalCheckedIn / stats.totalTicketsSold) * 100
                            )}
                            %)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Capacity Progress */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Ticket Sales
                    </h3>
                    <div className="relative h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-indigo-500 transition-all duration-500"
                        style={{
                          width: `${
                            stats.event.capacity > 0
                              ? (stats.totalTicketsSold / stats.event.capacity) * 100
                              : 0
                          }%`,
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-sm font-medium">
                        {stats.totalTicketsSold} / {stats.event.capacity} sold
                        {stats.event.capacity > 0 && (
                          <span className="ml-2 text-gray-500">
                            (
                            {Math.round(
                              (stats.totalTicketsSold / stats.event.capacity) * 100
                            )}
                            %)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-20">
                  <p className="text-gray-500 dark:text-gray-400">
                    Select an event to view statistics
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Create Event Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Create New Event
              </h2>
            </div>
            <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Event Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Annual Tech Fest"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                  placeholder="Describe your event..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Venue *
                </label>
                <input
                  type="text"
                  required
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Main Auditorium"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Capacity *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({ ...formData, capacity: parseInt(e.target.value) })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Price ($) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: parseFloat(e.target.value) })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: "indigo" | "green" | "yellow" | "blue";
}) {
  const colorClasses = {
    indigo: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400",
    green: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    yellow: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
      <div
        className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${colorClasses[color]}`}
      >
        {icon}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
        {value}
      </p>
    </div>
  );
}
