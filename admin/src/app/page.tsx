"use client";

import React, { useState, useMemo } from "react";
import { 
  Users, 
  Ticket, 
  CheckCircle2, 
  Search,
  Edit,
  Trash2,
  Filter,
  ArrowRight,
  QrCode,
  Activity
} from "lucide-react";

// Mock Data
const MOCK_ORDERS = [
  { id: "INV-1001", name: "Alex Chen", email: "alex@example.com", day: "Day-1", scanned: true, entered: true },
  { id: "INV-1002", name: "Sarah Miller", email: "sarah@example.com", day: "Day-2", scanned: true, entered: false },
  { id: "INV-1003", name: "James Wilson", email: "james@example.com", day: "Day-1", scanned: false, entered: false },
  { id: "INV-1004", name: "Emily Davis", email: "emily@example.com", day: "Both", scanned: true, entered: true },
  { id: "INV-1005", name: "Michael Chang", email: "mike@example.com", day: "Day-2", scanned: false, entered: false },
  { id: "INV-1006", name: "Jessica Taylor", email: "jess@example.com", day: "Day-1", scanned: true, entered: true },
  { id: "INV-1007", name: "David Smith", email: "david@example.com", day: "Day-2", scanned: true, entered: true },
];

export default function AdminDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dayFilter, setDayFilter] = useState("All");
  const [orders, setOrders] = useState(MOCK_ORDERS);

  // Analytics Computation
  const totalRegistrations = orders.length;
  const day1Reg = orders.filter(o => o.day === "Day-1" || o.day === "Both").length;
  const day2Reg = orders.filter(o => o.day === "Day-2" || o.day === "Both").length;

  const day1Scanned = orders.filter(o => (o.day === "Day-1" || o.day === "Both") && o.scanned).length;
  const day1Entered = orders.filter(o => (o.day === "Day-1" || o.day === "Both") && o.entered).length;

  const day2Scanned = orders.filter(o => (o.day === "Day-2" || o.day === "Both") && o.scanned).length;
  const day2Entered = orders.filter(o => (o.day === "Day-2" || o.day === "Both") && o.entered).length;

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        order.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDay = dayFilter === "All" || order.day === dayFilter || order.day === "Both";

      return matchesSearch && matchesDay;
    });
  }, [searchQuery, dayFilter, orders]);

  const handleDelete = (id: string) => {
    setOrders(orders.filter(o => o.id !== id));
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 font-sans selection:bg-[#9AE600] selection:text-black">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#9AE600]/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-[#9AE600]/5 blur-[100px] rounded-full" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-6">
          <div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase font-heading text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">
              Nexus <span className="text-[#9AE600]">Admin</span>
            </h1>
            <p className="text-zinc-400 mt-2 text-lg">Central command & event analytics</p>
          </div>
          <div className="mt-6 md:mt-0 flex items-center gap-4 bg-zinc-900/50 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-full">
            <div className="w-2 h-2 rounded-full bg-[#9AE600] animate-pulse glow-primary" />
            <span className="text-sm font-medium tracking-widest uppercase text-zinc-300">System Online</span>
          </div>
        </header>

        {/* Global Stats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Total Registrations" 
            value={totalRegistrations} 
            icon={<Users className="w-6 h-6 text-[#9AE600]" />}
            trend="+12% this week"
          />
          <StatCard 
            title="Day-1 Passes" 
            value={day1Reg} 
            icon={<Ticket className="w-6 h-6 text-[#9AE600]" />}
          />
          <StatCard 
            title="Day-2 Passes" 
            value={day2Reg} 
            icon={<Ticket className="w-6 h-6 text-[#9AE600]" />}
          />
        </section>

        {/* Analytics Breakdown */}
        <section>
          <h2 className="text-2xl font-bold uppercase tracking-wider font-heading mb-6 flex items-center gap-3">
            <Activity className="w-6 h-6 text-[#9AE600]" />
            Gate Analytics
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnalyticsCard 
              day="Day 1" 
              scanned={day1Scanned} 
              entered={day1Entered} 
              total={day1Reg} 
            />
            <AnalyticsCard 
              day="Day 2" 
              scanned={day2Scanned} 
              entered={day2Entered} 
              total={day2Reg} 
            />
          </div>
        </section>

        {/* Orders Management */}
        <section className="bg-zinc-900/40 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
          <div className="p-6 md:p-8 border-b border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <h2 className="text-2xl font-bold uppercase tracking-wider font-heading">
              Order Directory
            </h2>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input 
                  type="text" 
                  placeholder="Search orders..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-full py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-[#9AE600]/50 focus:ring-1 focus:ring-[#9AE600]/50 transition-all text-white placeholder:text-zinc-600"
                />
              </div>
              
              <div className="relative w-full sm:w-auto flex items-center gap-2 bg-black/50 border border-white/10 rounded-full px-4 py-2.5">
                <Filter className="w-4 h-4 text-zinc-500" />
                <select 
                  value={dayFilter}
                  onChange={(e) => setDayFilter(e.target.value)}
                  className="bg-transparent border-none text-sm focus:outline-none text-white appearance-none pr-4 cursor-pointer"
                >
                  <option value="All" className="bg-zinc-900">All Days</option>
                  <option value="Day-1" className="bg-zinc-900">Day 1</option>
                  <option value="Day-2" className="bg-zinc-900">Day 2</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-zinc-500 text-xs uppercase tracking-widest bg-black/20">
                  <th className="p-6 font-medium">Invoice ID</th>
                  <th className="p-6 font-medium">Attendee</th>
                  <th className="p-6 font-medium">Access</th>
                  <th className="p-6 font-medium">Status</th>
                  <th className="p-6 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {filteredOrders.length > 0 ? filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-6 font-mono text-zinc-300">{order.id}</td>
                    <td className="p-6">
                      <div className="font-medium text-white">{order.name}</div>
                      <div className="text-zinc-500 text-xs mt-1">{order.email}</div>
                    </td>
                    <td className="p-6">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 border border-white/5">
                        {order.day}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <StatusBadge active={order.scanned} label="Scanned" />
                        <ArrowRight className="w-3 h-3 text-zinc-600" />
                        <StatusBadge active={order.entered} label="Entered" />
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-zinc-400 hover:text-red-400" 
                          title="Delete"
                          onClick={() => handleDelete(order.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-zinc-500">
                      No matching orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

// Subcomponents

function StatCard({ title, value, icon, trend }: { title: string, value: number, icon: React.ReactNode, trend?: string }) {
  return (
    <div className="bg-zinc-900/40 border border-white/10 p-6 rounded-3xl backdrop-blur-xl relative overflow-hidden group hover:border-[#9AE600]/30 transition-colors">
      <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500">
        {icon}
      </div>
      <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-widest">{title}</h3>
      <div className="mt-4 flex items-end gap-4">
        <span className="text-5xl font-bold font-heading">{value}</span>
        {trend && <span className="text-[#9AE600] text-xs font-medium mb-1">{trend}</span>}
      </div>
    </div>
  );
}

function AnalyticsCard({ day, scanned, entered, total }: { day: string, scanned: number, entered: number, total: number }) {
  const scanPct = total > 0 ? Math.round((scanned / total) * 100) : 0;
  const enterPct = total > 0 ? Math.round((entered / total) * 100) : 0;

  return (
    <div className="bg-zinc-900/40 border border-white/10 p-6 rounded-3xl backdrop-blur-xl flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-xl">{day} Overview</h3>
        <span className="text-xs font-medium uppercase tracking-widest text-zinc-500">{total} Total</span>
      </div>
      
      <div className="space-y-5">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-zinc-400 flex items-center gap-2"><QrCode className="w-4 h-4"/> Scanned</span>
            <span className="font-mono">{scanned} / {total} <span className="text-zinc-600">({scanPct}%)</span></span>
          </div>
          <div className="h-2 w-full bg-black rounded-full overflow-hidden border border-white/5">
            <div className="h-full bg-white transition-all duration-1000 ease-out" style={{ width: `${scanPct}%` }} />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[#9AE600] flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> Gate Entered</span>
            <span className="font-mono">{entered} / {total} <span className="text-zinc-600">({enterPct}%)</span></span>
          </div>
          <div className="h-2 w-full bg-black rounded-full overflow-hidden border border-white/5 relative">
            <div className="absolute inset-y-0 left-0 bg-[#9AE600] transition-all duration-1000 ease-out glow-primary" style={{ width: `${enterPct}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ active, label }: { active: boolean, label: string }) {
  if (active) {
    return (
      <div className="flex items-center gap-1.5 text-xs font-medium text-[#9AE600] bg-[#1a2e00] px-2 py-1 rounded-md border border-[#9AE600]/20">
        <div className="w-1.5 h-1.5 rounded-full bg-[#9AE600] animate-pulse-success" />
        {label}
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 bg-black px-2 py-1 rounded-md border border-white/10">
      <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
      Pending
    </div>
  );
}
