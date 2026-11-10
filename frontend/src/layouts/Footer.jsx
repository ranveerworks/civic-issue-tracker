import React from 'react';
import { ShieldCheck, PhoneCall, Mail, MapPin, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="bg-navy-950 text-slate-300 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Col 1: About Platform */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-navy-950 font-bold">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white text-base tracking-tight">CIVIC ISSUE TRACKER</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Empowering citizens to report local civic infrastructure defects directly to municipal authorities. Transparent tracking and accountable governance.
            </p>
            <div className="inline-block bg-navy-900 border border-slate-800 rounded-lg p-2.5 text-[11px] text-teal-300">
              <span className="font-semibold block text-white">Sharda University PBL</span>
              CSCR2600 – Project-Based Learning
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Platform Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="hover:text-teal-400 transition-colors">Home Page</Link>
              </li>
              <li>
                <Link to="/report" className="hover:text-teal-400 transition-colors">Report New Complaint</Link>
              </li>
              <li>
                <Link to="/track" className="hover:text-teal-400 transition-colors">Track Complaint Status</Link>
              </li>
              <li>
                <Link to="/complaints" className="hover:text-teal-400 transition-colors">Public Civic Feed</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-teal-400 transition-colors">Citizen & Admin Login</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Categories */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Issue Categories</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>Road & Potholes</li>
              <li>Garbage & Waste Management</li>
              <li>Water Leakage & Supply</li>
              <li>Drainage & Sewage Hazard</li>
              <li>Broken Streetlights</li>
              <li>Public Infrastructure</li>
            </ul>
          </div>

          {/* Col 4: Civic Helplines & Contact */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Emergency Helplines</h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <PhoneCall className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Municipal Control: <strong>1533 / 1916</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <PhoneCall className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>National Emergency: <strong>112</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>support@civictracker.gov.in</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Greater Noida / Delhi-NCR Region</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800/80 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 Civic Issue Tracker. All rights reserved. Built for Sharda University Academic PBL.</p>
          <p className="flex items-center gap-1">
            Built with React, Tailwind CSS, FastAPI & MySQL.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
