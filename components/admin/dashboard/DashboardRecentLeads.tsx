import React from 'react';
import Link from 'next/link';
import { Users, ChevronRight, FileSpreadsheet } from 'lucide-react';

interface RecentLead {
  id: string;
  leadCode: string;
  name: string;
  phoneNumber: string;
  email: string | null;
  company: string | null;
  status: string;
  createdAt: Date | string;
  assignedEmployee?: {
    id: string;
    name: string;
    employeeCode: string;
  } | null;
}

interface DashboardRecentLeadsProps {
  recentLeads: RecentLead[];
  totalLeads: number;
  statusBadgeStyles: Record<string, string>;
}

export default function DashboardRecentLeads({
  recentLeads,
  totalLeads,
  statusBadgeStyles,
}: DashboardRecentLeadsProps) {
  return (
    <div className="bg-card text-card-foreground rounded-xl border border-border shadow-2xs overflow-hidden flex flex-col">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-foreground tracking-tight">Recent Leads</h2>
          <p className="text-xs text-muted-foreground">Latest student inquiries from web and campaigns</p>
        </div>
        <Link 
          href="/admin/leads" 
          className="text-xs font-bold text-primary hover:opacity-80 flex items-center gap-0.5 group"
        >
          <span>View all ({totalLeads})</span>
          <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="divide-y divide-border flex-1">
        {recentLeads.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center mx-auto">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-foreground">No leads registered yet</h3>
              <p className="text-[11px] text-muted-foreground max-w-xs mx-auto mt-0.5">
                Import leads via CSV or manually record new student inquiries.
              </p>
            </div>
            <div className="pt-1">
              <Link
                href="/admin/leads"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary-foreground bg-primary hover:opacity-90 rounded-lg transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Add / Import Leads</span>
              </Link>
            </div>
          </div>
        ) : (
          recentLeads.map((lead) => (
            <Link 
              key={lead.id} 
              href={`/admin/leads?search=${encodeURIComponent(lead.leadCode)}`}
              className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-muted/50 transition-colors group block"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center font-bold text-xs text-foreground group-hover:bg-primary/10 group-hover:text-primary shrink-0 transition-colors">
                  {lead.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-2 truncate">
                    <span className="truncate">{lead.name}</span>
                    <span className="font-mono text-[10px] text-muted-foreground font-semibold">{lead.leadCode}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {lead.company || lead.email || lead.phoneNumber}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${statusBadgeStyles[lead.status] || 'bg-muted text-muted-foreground border-border'}`}>
                  {lead.status}
                </span>
                <span className="text-[11px] font-mono text-muted-foreground hidden sm:inline">
                  {new Date(lead.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
