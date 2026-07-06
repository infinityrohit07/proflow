import { Link } from 'react-router';
import { Sparkles, FolderKanban, Users, Bell, Bot, ArrowRight, Zap, Shield, CheckCircle, Home, Lock, Plus } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 font-sans relative overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* Background radial gradient blooms */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] rounded-full bg-indigo-600/5 blur-[150px]" />
      </div>

      {/* Header / Sticky Navigation Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#070a13]/85 border-b border-white/5 px-6 lg:px-16 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-gradient-to-tr from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-extrabold shadow-sm shadow-indigo-600/30">
            P
          </div>
          <span className="text-white font-bold tracking-tight text-lg">ProFlow Workspace</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#workflow" className="hover:text-white transition-colors">Workflow</a>
          <a href="#security" className="hover:text-white transition-colors">Security</a>
        </nav>

        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors px-4 py-2">
            Sign In
          </Link>
          <Link to="/register" className="inline-flex items-center gap-1 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all px-4 py-2 rounded-xl shadow-lg shadow-indigo-600/20 active:scale-98">
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-6 lg:px-16 max-w-7xl mx-auto text-center z-10">
        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.1] max-w-4xl mx-auto">
          The Next-Generation <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-300">Project Workspace</span>
        </h1>
        
        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Supercharge your team's workflow with visual kanban boards, real-time activity alerts, interactive team notes, and AI-powered intelligence.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link to="/register" className="inline-flex items-center gap-2 px-7 py-4 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-750 text-white font-bold rounded-xl shadow-xl shadow-indigo-500/30 transition-all active:scale-[0.98]">
            Get Started for Free
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link to="/login" className="inline-flex items-center gap-2 px-7 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-all active:scale-[0.98]">
            Explore Workspace
          </Link>
        </div>      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 lg:px-16 max-w-7xl mx-auto border-t border-white/5 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Everything you need to ship projects faster
          </h2>
          <p className="mt-4 text-slate-400 leading-relaxed">
            Eliminate communication gaps and coordinate tasks seamlessly with visual planning interfaces and intelligent alert dispatchers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="glass-card p-6 rounded-2xl border border-white/5 flex flex-col items-start hover:border-indigo-500/20 transition-all duration-300 group hover:-translate-y-1">
            <div className="h-10 w-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center mb-5 group-hover:bg-indigo-600 group-hover:text-white transition-all">
              <FolderKanban className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Kanban Boards</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Track task stages visually with drag-and-drop column states, clear priorities, and members assignees.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-card p-6 rounded-2xl border border-white/5 flex flex-col items-start hover:border-indigo-500/20 transition-all duration-300 group hover:-translate-y-1">
            <div className="h-10 w-10 bg-violet-500/10 text-violet-400 rounded-xl flex items-center justify-center mb-5 group-hover:bg-violet-600 group-hover:text-white transition-all">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Team Collaboration</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Assign team members, share notes instantly, and maintain absolute visibility across project activities.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-card p-6 rounded-2xl border border-white/5 flex flex-col items-start hover:border-indigo-500/20 transition-all duration-300 group hover:-translate-y-1">
            <div className="h-10 w-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center mb-5 group-hover:bg-indigo-550 group-hover:text-white transition-all">
              <Bell className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Smart Alerts</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Real-time in-app notification badges synced with optional SMTP email updates for important updates.
            </p>
          </div>

          {/* Card 4 */}
          <div className="glass-card p-6 rounded-2xl border border-white/5 flex flex-col items-start hover:border-indigo-500/20 transition-all duration-300 group hover:-translate-y-1">
            <div className="h-10 w-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center mb-5 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">AI Diagnostics</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Query the embedded Gemini AI assistant to get context-aware breakdowns, summaries, and scheduling advice.
            </p>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="py-20 px-6 lg:px-16 max-w-7xl mx-auto border-t border-white/5 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-semibold text-violet-300 mb-6">
              <Zap className="w-3.5 h-3.5 text-violet-400" />
              <span>Optimized Delivery</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              A workspace structured for speed and transparency
            </h2>
            <p className="mt-4 text-slate-400 leading-relaxed">
              Managing tasks should be friction-free. ProFlow Workspace coordinates your project planning, notifications, and code progress under a unified visual system.
            </p>

            <div className="mt-8 space-y-6">
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">1</div>
                <div>
                  <h4 className="text-base font-bold text-white">Define Projects & Invite Teams</h4>
                  <p className="text-sm text-slate-400 mt-1">Create separate boards, assign members, and share visual links securely.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">2</div>
                <div>
                  <h4 className="text-base font-bold text-white">Coordinate Tasks & Columns</h4>
                  <p className="text-sm text-slate-400 mt-1">Organize items into states, update priorities, and log notes synchronously.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">3</div>
                <div>
                  <h4 className="text-base font-bold text-white">Stay Updated Instantly</h4>
                  <p className="text-sm text-slate-400 mt-1">Recipients receive custom in-app indicators and SMTP backup email digests.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-8 rounded-2xl border border-white/5 space-y-6 bg-slate-900/30 backdrop-blur-3xl shadow-xl shadow-violet-500/5">
            <h3 className="text-xl font-bold text-white border-b border-white/5 pb-4">Activity Stream Preview</h3>
            
            <div className="space-y-4">
              <div className="flex gap-3 text-xs bg-[#0b0f19]/80 p-3.5 rounded-xl border border-white/5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div>
                  <span className="font-bold text-white">Aarav Sharma</span> completed task <span className="text-indigo-400 font-semibold">Google OAuth 2.0</span>
                  <span className="block text-[10px] text-slate-500 mt-1">2 minutes ago</span>
                </div>
              </div>
              
              <div className="flex gap-3 text-xs bg-[#0b0f19]/80 p-3.5 rounded-xl border border-white/5">
                <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <div>
                  <span className="font-bold text-white">Rohit Kumar</span> updated task state for <span className="text-indigo-400 font-semibold">Design Landing Page</span> to <span className="text-slate-300 font-medium">In Progress</span>
                  <span className="block text-[10px] text-slate-500 mt-1">15 minutes ago</span>
                </div>
              </div>

              <div className="flex gap-3 text-xs bg-[#0b0f19]/80 p-3.5 rounded-xl border border-white/5">
                <div className="w-2 h-2 rounded-full bg-violet-500 mt-1.5 shrink-0" />
                <div>
                  <span className="font-bold text-white">Pooja Patel</span> created new project notes for <span className="text-indigo-400 font-semibold">ProFlow Workspace Landing</span>
                  <span className="block text-[10px] text-slate-500 mt-1">1 hour ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-20 px-6 lg:px-16 max-w-7xl mx-auto border-t border-white/5 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-300 mb-4">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span>Hardened Operations</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Enterprise-Grade Protection Framework
          </h2>
          <p className="mt-4 text-slate-400 leading-relaxed">
            Your workspaces and access tokens are guarded by strict modern security standards at every tier.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card p-7 rounded-2xl border border-white/5 hover:border-white/10 transition-all bg-slate-900/20">
            <h4 className="text-base font-bold text-white flex items-center gap-2.5 mb-3">
              <Lock className="w-4.5 h-4.5 text-indigo-400" />
              Secure Identity Isolation
            </h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Integrated with Google OAuth 2.0 for passwordless login and JWT token auth storage in HTTP-Only cookies.
            </p>
          </div>

          <div className="glass-card p-7 rounded-2xl border border-white/5 hover:border-white/10 transition-all bg-slate-900/20">
            <h4 className="text-base font-bold text-white flex items-center gap-2.5 mb-3">
              <Shield className="w-4.5 h-4.5 text-indigo-400" />
              Helmet & CSP Protection
            </h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Robust HTTP security headers, clickjacking mitigation, and tight Content Security Policies blocking untrusted scripts.
            </p>
          </div>

          <div className="glass-card p-7 rounded-2xl border border-white/5 hover:border-white/10 transition-all bg-slate-900/20">
            <h4 className="text-base font-bold text-white flex items-center gap-2.5 mb-3">
              <Zap className="w-4.5 h-4.5 text-indigo-400" />
              Express Rate Limiting
            </h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              IP-based rate limits protecting auth and API endpoints against brute force attacks and request spamming.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/2 backdrop-blur-md border-y border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-16 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl font-extrabold text-white flex items-center justify-center gap-1.5 mb-2">
              <Zap className="w-7 h-7 text-indigo-400" />
              10x
            </div>
            <div className="text-sm text-slate-400 font-medium">Faster Deployment</div>
          </div>
          <div>
            <div className="text-4xl font-extrabold text-white flex items-center justify-center gap-1.5 mb-2">
              <Shield className="w-7 h-7 text-indigo-400" />
              99.9%
            </div>
            <div className="text-sm text-slate-400 font-medium">Uptime Guarantee</div>
          </div>
          <div>
            <div className="text-4xl font-extrabold text-white flex items-center justify-center gap-1.5 mb-2">
              <CheckCircle className="w-7 h-7 text-indigo-400" />
              250k+
            </div>
            <div className="text-sm text-slate-400 font-medium">Tasks Managed</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-16 pb-12 px-6 lg:px-16 max-w-7xl mx-auto relative z-10 border-t border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12 text-left">
          {/* Column 1: Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-gradient-to-tr from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-extrabold shadow-sm shadow-indigo-600/30 text-sm">
                P
              </div>
              <span className="text-white font-bold tracking-tight text-base">ProFlow Workspace</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
              The developer-first project management system designed for speed, security, and absolute team transparency.
            </p>
          </div>

          {/* Column 2: Platform Links */}
          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li><Link to="/login" className="hover:text-white transition-colors">Workspace Dashboard</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Sign Up Free</Link></li>
              <li><a href="#features" className="hover:text-white transition-colors">Core Features</a></li>
            </ul>
          </div>

          {/* Column 3: Security & Technology */}
          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4">Security</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li><a href="#security" className="hover:text-white transition-colors">OAuth Isolation</a></li>
              <li><a href="#security" className="hover:text-white transition-colors">Helmet Headers</a></li>
              <li><a href="#security" className="hover:text-white transition-colors">API Rate Limits</a></li>
            </ul>
          </div>

          {/* Column 4: Resources */}
          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4">Resources</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-slate-300">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-slate-300">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>&copy; {new Date().getFullYear()} ProFlow Workspace. All rights reserved.</span>
          <span className="text-[10px] text-slate-600">Built for production performance and security.</span>
        </div>
      </footer>
    </div>
  );
}
