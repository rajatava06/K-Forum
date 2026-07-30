import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Gamepad2, PlusSquare, Search, User, Menu, X, Shield, Calendar, Users, Mail, Code2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import TrendingHashtags from '../TrendingHashtags';
import BuddyConnect from '../BuddyConnect';
import DevelopersModal from '../DevelopersModal';

const MobileHeader = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isDevModalOpen, setIsDevModalOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const navigate = useNavigate();

    const toggleMenu = () => setIsOpen(!isOpen);
    const closeMenu = () => setIsOpen(false);

    // Scroll direction detector to hide/show top navbar on scroll (District app style)
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            
            if (currentScrollY > 30 && currentScrollY > lastScrollY) {
                // Scrolling down -> hide navbar
                setIsVisible(false);
            } else {
                // Scrolling up or at top -> show navbar
                setIsVisible(true);
            }
            
            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    const handleTagClick = (tag) => {
        closeMenu();
        navigate(`/?search=${encodeURIComponent('#' + tag)}`);
    };

    const navItems = [
        { path: '/', icon: Home, label: 'Home' },
        { path: '/messages', icon: Mail, label: 'Chat' },
        { path: '/create-post', icon: PlusSquare, label: 'Create Post' },
        { path: '/calendar', icon: Calendar, label: 'Calendar' },
        { path: '/buddy-connect', icon: Users, label: 'Buddy Connect' },
        { path: '/wordle', icon: Gamepad2, label: 'K-Wordle' },
        { path: '/profile', icon: User, label: 'Profile' }
    ];

    if (user?.role === 'admin') {
        navItems.push({ path: '/admin', icon: Shield, label: 'Admin Dashboard' });
    }

    return (
        <>
            {/* Top Bar (Navbar glow restored, hides on scroll down, shows on scroll up) */}
            <div 
                className={`md:hidden fixed top-3 left-3 right-3 z-[60] bg-gradient-to-r from-emerald-500/20 via-[#0f1115]/90 to-[#0f1115]/95 border border-emerald-500/30 rounded-2xl px-4 py-3 flex items-center justify-between backdrop-blur-xl shadow-lg shadow-black/35 transition-transform duration-300 ease-in-out ${
                    (isVisible || isOpen) ? 'translate-y-0' : '-translate-y-24'
                }`}
            >
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 shrink-0 bg-white/5 rounded-lg flex items-center justify-center border border-white/10 overflow-hidden">
                        <img src="/logo.png" alt="K-Forum Logo" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-lg font-bold">
                        <span className="text-white">K</span>
                        <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">-Forum</span>
                    </span>
                </div>

                <button
                    onClick={toggleMenu}
                    className="p-2 text-gray-300 hover:text-white transition-colors active:scale-95"
                    aria-label="Toggle Navigation Menu"
                >
                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Menu Drawer (Solid background with light green ambient glow) */}
            <div
                className={`md:hidden fixed inset-0 z-[55] bg-[#0f172a] transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none'
                }`}
            >
                {/* Light Green Ambient Background Glow */}
                <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-10 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="relative flex flex-col h-full pt-24 px-6 pb-8 overflow-y-auto custom-scrollbar">
                    {/* User Profile */}
                    {user && (
                        <div className="flex items-center gap-4 mb-6 p-4 bg-white/5 rounded-2xl border border-white/10 shadow-lg shrink-0">
                            <img
                                src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=10b981&color=fff`}
                                alt={user.name}
                                className="w-12 h-12 rounded-full border-2 border-emerald-500/40 object-cover"
                            />
                            <div className="min-w-0">
                                <h3 className="text-white font-bold text-lg truncate">{user.name}</h3>
                                <p className="text-emerald-400 text-sm font-medium truncate">@{user.studentId}</p>
                            </div>
                        </div>
                    )}

                    {/* Nav Links with top gap on Home button */}
                    <nav className="space-y-2.5 mb-8 mt-2 shrink-0">
                        {navItems.map((item, idx) => (
                            <NavLink
                                key={item.label}
                                to={item.path}
                                onClick={closeMenu}
                                className={({ isActive }) => `
                                    flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 border
                                    ${idx === 0 ? 'mt-1' : ''}
                                    ${isActive
                                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                        : 'bg-white/[0.03] text-gray-300 border-white/5 hover:bg-white/10 hover:text-white hover:border-white/10'
                                    }
                                `}
                            >
                                {({ isActive }) => (
                                    <>
                                        <item.icon className={`w-6 h-6 ${isActive ? 'text-emerald-400' : 'text-gray-400'}`} strokeWidth={2.5} />
                                        <span className="font-bold text-lg">{item.label}</span>
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Trending Section */}
                    <div className="mt-2 pt-6 border-t border-white/10 relative">
                        <TrendingHashtags onTagClick={handleTagClick} />
                        
                        {/* Meet the Developers Button (No background glow tint, clean neutral style) */}
                        <div className="mt-4 pt-2">
                            <button
                                onClick={() => setIsDevModalOpen(true)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 font-bold text-sm transition-all duration-300 active:scale-98 group"
                            >
                                <Code2 className="w-5 h-5 text-emerald-400 group-hover:rotate-12 transition-transform" />
                                <span>Meet the Developers</span>
                            </button>
                        </div>
                    </div>

                    <div className="mt-8">
                        <BuddyConnect />
                    </div>

                    <p className="text-center text-gray-500 text-xs mt-8 pb-4 shrink-0">
                        K-Forum v2.0 • Made with ❤️
                    </p>
                </div>
            </div>

            {/* Meet the Developers Modal */}
            <DevelopersModal 
                isOpen={isDevModalOpen} 
                onClose={() => setIsDevModalOpen(false)} 
            />
        </>
    );
};

export default MobileHeader;
