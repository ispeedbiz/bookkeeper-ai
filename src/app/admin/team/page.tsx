"use client";

import { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import {
  UserPlus,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

interface TeamMember {
  name: string;
  role: string;
  email: string;
  phone: string;
  location: string;
  tasks: number;
  accuracy: string;
  status: "Active" | "Break" | "Offline";
  load: number;
  avatar: string;
}

const teamMembers: TeamMember[] = [
  {
    name: "Priya Sharma",
    role: "Senior Bookkeeper",
    email: "priya@sms360s.com",
    phone: "+91 98765 43210",
    location: "Ahmedabad, India",
    tasks: 45,
    accuracy: "98.5%",
    status: "Active",
    load: 85,
    avatar: "PS",
  },
  {
    name: "Rahul Mehta",
    role: "Bookkeeper",
    email: "rahul@sms360s.com",
    phone: "+91 98765 43211",
    location: "Ahmedabad, India",
    tasks: 38,
    accuracy: "97.2%",
    status: "Active",
    load: 72,
    avatar: "RM",
  },
  {
    name: "Anjali Kumar",
    role: "Senior Bookkeeper",
    email: "anjali@sms360s.com",
    phone: "+91 98765 43212",
    location: "Ahmedabad, India",
    tasks: 42,
    accuracy: "99.1%",
    status: "Active",
    load: 90,
    avatar: "AK",
  },
  {
    name: "Vikram Patel",
    role: "Bookkeeper",
    email: "vikram@sms360s.com",
    phone: "+91 98765 43213",
    location: "Ahmedabad, India",
    tasks: 35,
    accuracy: "96.8%",
    status: "Break",
    load: 0,
    avatar: "VP",
  },
  {
    name: "Neha Desai",
    role: "Tax Specialist",
    email: "neha@sms360s.com",
    phone: "+91 98765 43214",
    location: "Ahmedabad, India",
    tasks: 40,
    accuracy: "98.0%",
    status: "Active",
    load: 78,
    avatar: "ND",
  },
  {
    name: "Jagdish Lade",
    role: "CEO & Lead CA",
    email: "catchjagdish@gmail.com",
    phone: "+1 (347) 479 1767",
    location: "Canada",
    tasks: 12,
    accuracy: "99.9%",
    status: "Active",
    load: 45,
    avatar: "JL",
  },
  {
    name: "Hardik Mehta",
    role: "Operations Partner",
    email: "accounts@sms360s.com",
    phone: "+91 95 575 99 575",
    location: "Ahmedabad, India",
    tasks: 15,
    accuracy: "99.5%",
    status: "Active",
    load: 55,
    avatar: "HM",
  },
];

export default function AdminTeam() {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const activeCount = teamMembers.filter((m) => m.status === "Active").length;
  const avgAccuracy =
    teamMembers.reduce((sum, m) => sum + parseFloat(m.accuracy), 0) /
    teamMembers.length;
  const totalTasks = teamMembers.reduce((sum, m) => sum + m.tasks, 0);

  return (
    <div className="flex min-h-screen bg-navy-950">
      <AdminSidebar active="Team" />
      <main className="ml-64 flex-1 p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Team Management</h1>
            <p className="mt-1 text-slate-400">
              SMS360S LLP — Offshore Bookkeeping Team
            </p>
          </div>
          <button className="flex items-center gap-2 rounded-xl bg-teal-400 px-4 py-2.5 text-sm font-medium text-navy-950 hover:bg-teal-300 transition-colors">
            <UserPlus className="h-4 w-4" />
            Add Member
          </button>
        </div>

        {/* Team Stats */}
        <div className="mb-6 grid grid-cols-4 gap-4">
          <div className="glass-card rounded-xl p-4">
            <p className="text-xs text-slate-500">Total Team</p>
            <p className="mt-1 text-2xl font-bold text-white">{teamMembers.length}</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-xs text-slate-500">Active Now</p>
            <p className="mt-1 text-2xl font-bold text-teal-400">{activeCount}</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-xs text-slate-500">Avg Accuracy</p>
            <p className="mt-1 text-2xl font-bold text-cyan-400">{avgAccuracy.toFixed(1)}%</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-xs text-slate-500">Tasks (MTD)</p>
            <p className="mt-1 text-2xl font-bold text-gold-400">{totalTasks}</p>
          </div>
        </div>

        {/* Team Grid */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {teamMembers.map((member) => (
            <div
              key={member.name}
              onClick={() => setSelectedMember(member)}
              className="glass-card rounded-xl p-5 cursor-pointer transition-all hover:border-teal-400/30"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-500/20 text-sm font-bold text-teal-400">
                  {member.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">{member.name}</h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        member.status === "Active"
                          ? "bg-teal-500/10 text-teal-400"
                          : member.status === "Break"
                            ? "bg-gold-400/10 text-gold-400"
                            : "bg-slate-400/10 text-slate-500"
                      }`}
                    >
                      {member.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">{member.role}</p>
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-slate-500">Tasks</p>
                      <p className="text-sm font-semibold text-white">{member.tasks}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Accuracy</p>
                      <p className="text-sm font-semibold text-teal-400">{member.accuracy}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Load</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <div className="h-1.5 flex-1 rounded-full bg-navy-800">
                          <div
                            className={`h-1.5 rounded-full ${
                              member.load > 85
                                ? "bg-coral-400"
                                : member.load > 60
                                  ? "bg-gold-400"
                                  : "bg-teal-400"
                            }`}
                            style={{ width: `${member.load}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">{member.load}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Member Detail Panel */}
        {selectedMember && (
          <div className="fixed inset-y-0 right-0 z-50 w-96 border-l border-navy-700/50 bg-navy-900 p-6 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Team Member</h3>
              <button
                onClick={() => setSelectedMember(null)}
                className="text-slate-400 hover:text-white text-xl"
              >
                &times;
              </button>
            </div>
            <div className="flex flex-col items-center mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-500/20 text-lg font-bold text-teal-400">
                {selectedMember.avatar}
              </div>
              <h4 className="mt-3 text-lg font-semibold text-white">{selectedMember.name}</h4>
              <p className="text-sm text-slate-400">{selectedMember.role}</p>
              <span
                className={`mt-2 rounded-full px-3 py-1 text-xs font-medium ${
                  selectedMember.status === "Active"
                    ? "bg-teal-500/10 text-teal-400"
                    : "bg-gold-400/10 text-gold-400"
                }`}
              >
                {selectedMember.status}
              </span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg bg-navy-800/50 p-3">
                <Mail className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-white">{selectedMember.email}</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-navy-800/50 p-3">
                <Phone className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-white">{selectedMember.phone}</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-navy-800/50 p-3">
                <MapPin className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-white">{selectedMember.location}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="glass-card rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-white">{selectedMember.tasks}</p>
                  <p className="text-xs text-slate-500">Tasks (MTD)</p>
                </div>
                <div className="glass-card rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-teal-400">{selectedMember.accuracy}</p>
                  <p className="text-xs text-slate-500">Accuracy</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
