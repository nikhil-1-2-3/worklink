import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ShieldCheck, Users, Briefcase, Star, TrendingUp, CheckCircle, ArrowRight, MessageCircle, PhoneCall, X, Quote, Target, Heart, Menu } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useMutation } from '@tanstack/react-query';
import api from '../lib/api';
import VantaDots from '../components/VantaDots';

const LandingPage = () => {
  const { user, logout } = useAuthStore();
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [callbackModalOpen, setCallbackModalOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  const submitCallbackMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/support/callback', { phoneNumber });
      return data;
    },
    onSuccess: () => {
      setCallbackModalOpen(false);
      setPhoneNumber('');
      alert("Request received! Our team will call you within 24 hours.");
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to submit request');
    }
  });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <div className="min-h-screen bg-slate-50 font-sans overflow-x-hidden">
      {/* Navbar */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50 py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                <Briefcase className="text-white w-5 h-5" />
              </div>
              <img src="/logo.png" alt="WorkLink Logo" className="h-16 object-contain" />
            </div>
            {/* Desktop Links */}
            <div className="hidden md:flex space-x-8 items-center">
              <a href="#features" className="text-slate-600 hover:text-brand-600 transition">Features</a>
              <a href="#how-it-works" className="text-slate-600 hover:text-brand-600 transition">How it Works</a>
            </div>
            
            {/* Desktop Auth */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <>
                  <Link to={user.role === 'admin' ? '/admin/dashboard' : user.role === 'employer' ? '/employer/dashboard' : '/worker/dashboard'} className="text-slate-600 hover:text-brand-600 font-medium transition">
                    Dashboard
                  </Link>
                  <button onClick={() => logout()} className="bg-slate-100 text-slate-700 px-5 py-2 rounded-full font-medium hover:bg-slate-200 transition shadow-sm">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/auth" className="text-slate-600 hover:text-brand-600 font-medium transition">Login</Link>
                  <Link to="/auth" className="bg-brand-600 text-white px-5 py-2 rounded-full font-medium hover:bg-brand-700 transition shadow-lg shadow-brand-500/30">
                    Join Now
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-600 hover:text-brand-600 focus:outline-none">
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-100 absolute w-full left-0 top-[100%] shadow-lg py-4 px-4 flex flex-col gap-4 z-50">
            <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-slate-700 font-medium block py-2 border-b border-slate-50">Features</a>
            <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="text-slate-700 font-medium block py-2 border-b border-slate-50">How it Works</a>
            
            <div className="pt-2 flex flex-col gap-3">
              {user ? (
                <>
                  <Link to={user.role === 'admin' ? '/admin/dashboard' : user.role === 'employer' ? '/employer/dashboard' : '/worker/dashboard'} className="text-center bg-slate-100 text-slate-800 py-3 rounded-lg font-bold">
                    Go to Dashboard
                  </Link>
                  <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="text-center text-red-500 py-3 font-bold border border-red-100 rounded-lg bg-red-50">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/auth" className="text-center text-brand-600 font-bold py-3 bg-brand-50 rounded-lg">Login</Link>
                  <Link to="/auth" className="text-center bg-brand-600 text-white font-bold py-3 rounded-lg shadow-md shadow-brand-500/30">Join Now</Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden min-h-screen flex items-center">
        <VantaDots />
        
        {/* Animated Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] opacity-40 pointer-events-none mix-blend-multiply z-0">
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-300 via-blue-200 to-purple-300 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '8s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="max-w-3xl">
            {/* Left Content */}
            <div className="text-center lg:text-left mx-auto lg:mx-0">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-brand-100 text-brand-600 font-bold text-sm mb-6 shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-ping"></span> Live in India
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 leading-[1.1]">
                The Smart <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-blue-500">Workforce</span> Engine.
              </h1>
              <p className="text-lg md:text-xl text-slate-700 font-medium mb-10 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Connect with verified skilled and semi-skilled workers instantly. Built with smart matching algorithms to eliminate middlemen and build trusted teams.
              </p>
              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                <Link to="/worker/dashboard" className="group px-8 py-4 bg-slate-900 text-white rounded-full font-bold text-lg hover:bg-slate-800 transition shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2">
                  I'm a Worker <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/employer/dashboard" className="px-8 py-4 bg-white/80 backdrop-blur-md text-slate-900 border border-slate-200 rounded-full font-bold text-lg hover:bg-white transition shadow-lg transform hover:-translate-y-1 flex items-center justify-center gap-2">
                  Hire Talent
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features / About Us */}
      <div id="features" className="py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight mb-6">About Us</h2>
            <p className="mt-4 text-xl md:text-2xl text-slate-600 max-w-4xl mx-auto font-medium leading-relaxed">
              We are revolutionizing the unorganized labor sector by bringing unparalleled transparency, trust, and real-time location intelligence to connect workers with verified employers instantly.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <ShieldCheck className="text-brand-600 w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">100% Verified</h3>
              <p className="text-slate-600">Every worker and employer goes through Aadhaar and document verification by our admins. No fake profiles.</p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <MapPin className="text-brand-600 w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Location Intelligence</h3>
              <p className="text-slate-600">Find jobs and workers within your preferred radius. Real-time mapping connects local demand with local supply.</p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <Users className="text-brand-600 w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Trust & Reputation</h3>
              <p className="text-slate-600">Build your digital work passport. Transparent ratings for both employers and workers ensure fair practices.</p>
            </div>
          </div>
        </div>
      </div>
      {/* Trusted By Section */}
      <div className="py-16 bg-white border-y border-slate-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <p className="text-center text-sm font-bold text-slate-400 uppercase tracking-widest">Trusted by industry leaders across India</p>
        </div>
        <div className="flex gap-16 items-center whitespace-nowrap animate-[scroll_30s_linear_infinite] opacity-50 px-8">
           {/* We duplicate the list to make the marquee seamless */}
           {[1,2].map((group) => (
             <React.Fragment key={group}>
               <h3 className="text-2xl font-black text-slate-400">L&T Construction</h3>
               <h3 className="text-2xl font-black text-slate-400">Tata Projects</h3>
               <h3 className="text-2xl font-black text-slate-400">Shapoorji Pallonji</h3>
               <h3 className="text-2xl font-black text-slate-400">Afcons Infrastructure</h3>
               <h3 className="text-2xl font-black text-slate-400">GMR Group</h3>
               <h3 className="text-2xl font-black text-slate-400">HCC Ltd</h3>
             </React.Fragment>
           ))}
        </div>
      </div>
      {/* How it Works */}
      <div id="how-it-works" className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">How WorkLink Works</h2>
            <p className="mt-4 text-slate-600 max-w-2xl mx-auto">Three simple steps to connect workers and employers directly.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-brand-100 via-brand-300 to-brand-100 z-0"></div>
            
            <div className="relative z-10 text-center">
              <div className="w-24 h-24 bg-brand-50 rounded-full border-4 border-white shadow-xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-black text-brand-600">1</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Create Digital Passport</h3>
              <p className="text-slate-600">Verify your Aadhaar, upload your skills, and get your profile approved by our admin team.</p>
            </div>
            <div className="relative z-10 text-center">
              <div className="w-24 h-24 bg-brand-50 rounded-full border-4 border-white shadow-xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-black text-brand-600">2</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Smart Matching</h3>
              <p className="text-slate-600">Our engine finds the perfect job or worker based on exact skill matches and preferred travel radius.</p>
            </div>
            <div className="relative z-10 text-center">
              <div className="w-24 h-24 bg-brand-50 rounded-full border-4 border-white shadow-xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-black text-brand-600">3</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Work & Get Rated</h3>
              <p className="text-slate-600">Complete the job, receive fair payment directly, and build your reputation with 5-star ratings.</p>
            </div>
          </div>
        </div>
      </div>

      {/* About Us / Mission */}
      <div id="about" className="py-24 bg-brand-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-96 h-96 bg-brand-600 rounded-full blur-[100px] opacity-50"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 font-bold text-sm mb-6 shadow-sm">
                <Heart className="w-4 h-4 text-brand-300"/> Our Mission
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">Organizing the Unorganized Sector.</h2>
              <p className="text-brand-100 text-lg mb-6 leading-relaxed">
                For decades, daily wage earners and semi-skilled workers have relied on physical "Labor Chowks" and middlemen who take massive unfair cuts from their hard-earned wages.
              </p>
              <p className="text-brand-100 text-lg mb-8 leading-relaxed">
                WorkLink was built to eliminate the Thekedar (middleman). We empower workers by giving them a verified digital identity, and we empower employers by giving them instant access to trusted talent. Fair wages, full transparency, zero exploitation.
              </p>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-brand-300" /> <span className="font-bold">Zero Middlemen</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-brand-300" /> <span className="font-bold">Fair Wages</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-[2rem] shadow-2xl transform rotate-2">
                <Quote className="w-12 h-12 text-brand-300 opacity-50 mb-6" />
                <p className="text-xl md:text-2xl font-medium leading-relaxed italic mb-8">
                  "Technology shouldn't just be for white-collar jobs. It's time we bring dignity and digital empowerment to the people who actually build our nation."
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center font-bold text-xl">W</div>
                  <div>
                    <div className="font-bold">Team WorkLink</div>
                    <div className="text-brand-300 text-sm">Founders</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-24 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Voices of Trust</h2>
            <p className="mt-4 text-slate-600 max-w-2xl mx-auto">Hear from the workers and employers who use WorkLink every day.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex gap-1 mb-4 text-amber-400">
                <Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" />
              </div>
              <p className="text-slate-700 italic mb-6">"I used to wait at the labor chowk every morning hoping for a job. Now, contractors send requests directly to my phone. I make 40% more because there's no middleman taking a cut."</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-500">R</div>
                <div>
                  <div className="font-bold text-slate-900">Rajesh Kumar</div>
                  <div className="text-sm text-slate-500">Verified Electrician</div>
                </div>
              </div>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex gap-1 mb-4 text-amber-400">
                <Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" />
              </div>
              <p className="text-slate-700 italic mb-6">"Hiring 50 verified construction workers used to take weeks of asking around and dealing with unreliable agents. With WorkLink, we posted a job and had a full team ready in 2 days."</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-500">T</div>
                <div>
                  <div className="font-bold text-slate-900">TechBuild Corp</div>
                  <div className="text-sm text-slate-500">Construction Firm</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div id="faq" className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Frequently Asked Questions</h2>
            <p className="mt-4 text-slate-600">Everything you need to know about WorkLink.</p>
          </div>
          
          <div className="space-y-4">
            <details className="group bg-slate-50 border border-slate-200 rounded-2xl [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between p-6 cursor-pointer font-bold text-slate-900">
                Do I have to pay to use WorkLink as a worker?
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="px-6 pb-6 text-slate-600">
                No, WorkLink is completely free for individual workers. There are no hidden charges or commission cuts from your wages if you apply directly to jobs.
              </div>
            </details>

            <details className="group bg-slate-50 border border-slate-200 rounded-2xl [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between p-6 cursor-pointer font-bold text-slate-900">
                How do employers know workers are verified?
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="px-6 pb-6 text-slate-600">
                Every worker must create a Digital Passport using their Aadhaar Number or Government ID. Our admin team manually verifies these documents before approving the profile.
              </div>
            </details>

            <details className="group bg-slate-50 border border-slate-200 rounded-2xl [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between p-6 cursor-pointer font-bold text-slate-900">
                Can I hire an entire team of workers at once?
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="px-6 pb-6 text-slate-600">
                Yes! We have verified Contractors/Agencies on the platform. When you post a job requiring multiple workers, Contractors can apply on behalf of their entire verified team, allowing you to hire 50+ workers with a single click.
              </div>
            </details>

            <details className="group bg-slate-50 border border-slate-200 rounded-2xl [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between p-6 cursor-pointer font-bold text-slate-900">
                How does the rating system work?
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="px-6 pb-6 text-slate-600">
                After a job is marked as "Completed", both the Employer and the Worker are prompted to leave a 1-5 star rating and feedback. This builds trust and helps the best workers get hired faster in the future.
              </div>
            </details>
          </div>
        </div>
      </div>

      {/* Talk to Us CTA */}
      <div id="contact" className="bg-white border-t border-slate-100 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center justify-center p-4 bg-brand-50 rounded-full mb-6">
            <MessageCircle className="w-8 h-8 text-brand-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Have questions? Let's talk.</h2>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            Whether you are a worker looking for your first job or an employer needing to hire 50 people, our support team is here to help you get started.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <a href="https://wa.me/919876543210?text=Hi%20WorkLink%2C%20I%20need%20help" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-green-500 text-white px-8 py-4 rounded-xl font-bold hover:bg-green-600 transition shadow-lg shadow-green-500/20 w-full sm:w-auto">
              <MessageCircle className="w-5 h-5" /> Chat on WhatsApp
            </a>
            <button onClick={() => setCallbackModalOpen(true)} className="flex items-center justify-center gap-2 bg-white text-slate-700 border-2 border-slate-200 px-8 py-4 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-300 transition w-full sm:w-auto">
              <PhoneCall className="w-5 h-5" /> Request a Call Back
            </button>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 border-b border-slate-800 pb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="w-6 h-6 text-brand-500" />
                <span className="text-xl font-bold text-white">WorkLink</span>
              </div>
              <p className="text-sm max-w-sm mb-6">
                Organizing the unorganized workforce. Building trust, transparency, and fair opportunities for India's daily wage earners.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#about" className="hover:text-brand-400 transition">About Us</a></li>
                <li><a href="#features" className="hover:text-brand-400 transition">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-brand-400 transition">How it Works</a></li>
                <li><a href="#contact" className="hover:text-brand-400 transition">Contact Support</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-brand-400 transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-brand-400 transition">Terms of Service</a></li>
                <li><a href="#" className="hover:text-brand-400 transition">Trust & Safety</a></li>
                <li><Link to="/admin/dashboard" className="hover:text-brand-400 transition underline">Admin Portal</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-slate-600">
            <p>&copy; {new Date().getFullYear()} WorkLink Inc. All rights reserved.</p>
            <p className="mt-2 md:mt-0">Made with ❤️ in India</p>
          </div>
        </div>
      </footer>

      {/* Call Back Modal */}
      {callbackModalOpen && (
        <div className="fixed inset-0 z-[3000] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-slate-800 flex items-center gap-2"><PhoneCall className="w-5 h-5 text-brand-600"/> Request Call Back</h2>
              <button onClick={() => setCallbackModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 space-y-4">
               <div>
                 <label className="block text-sm font-semibold text-slate-700 mb-1">Mobile Number</label>
                 <input 
                   type="tel"
                   placeholder="Enter your 10-digit number"
                   className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 outline-none focus:border-brand-500 text-lg"
                   value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
                 />
               </div>
               <button 
                 onClick={() => submitCallbackMutation.mutate()}
                 disabled={submitCallbackMutation.isPending || phoneNumber.length < 10}
                 className="w-full py-3 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 disabled:opacity-50 transition"
               >
                 {submitCallbackMutation.isPending ? 'Sending...' : 'Submit Request'}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
