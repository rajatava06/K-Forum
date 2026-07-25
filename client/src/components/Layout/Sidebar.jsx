import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, Mail, Flame, User, Settings, Shield, PlusSquare, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = ({ isOpen, setIsOpen }) => {
    const { user } = useAuth();

    const getOrdinalYear = (year) => {
        const y = parseInt(year);
        if (y === 1) return '1st';
        if (y === 2) return '2nd';
        if (y === 3) return '3rd';
        if (y === 4) return '4th';
        return `${year}th`;
    };

    const navItems = [
        { icon: Home, label: 'Home', path: '/' },
        // { icon: Search, label: 'Search', path: '/search' },
        { icon: PlusSquare, label: 'Create', path: '/create-post' },
        { icon: Flame, label: 'Wordle', path: '/wordle', highlight: true },
        { icon: Users, label: 'Buddies', path: '/buddy-connect' },
        { icon: Mail, label: 'Chat', path: '/messages' },
        { icon: User, label: 'Profile', path: '/profile' },
    ];

    if (user?.role === 'admin') {
        navItems.push({ icon: Shield, label: 'Admin', path: '/admin' });
    }

    return (
        <div className={`
            hidden md:flex flex-col 
            ${isOpen ? 'w-64' : 'w-20'} 
            h-[96vh] fixed left-4 top-[2vh] 
            glass-dock rounded-3xl border border-gray-700/50 
            z-50 py-8 shadow-2xl 
            transition-all duration-300 ease-in-out
        `}>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="absolute -right-3 top-[56px] -translate-y-1/2 bg-gray-800 border border-white/10 text-gray-300 p-1 rounded-full hover:bg-gray-700 hover:scale-110 transition-all z-50"
            >
                {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>

            {/* Minimal Logo */}
            <div className={`flex items-center ${isOpen ? 'justify-start px-4' : 'justify-center px-4'} mb-12 transition-all duration-300`}>
                <div className="w-12 h-12 shrink-0 bg-white/5 backdrop-blur-md rounded-2xl flex items-center justify-center border-2 border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.1)] overflow-hidden">
                    <img src="/logo.png" alt="K-Forum Logo" className="w-full h-full object-cover" />
                </div>
                <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'ml-4 w-auto opacity-100' : 'ml-0 w-0 opacity-0'}`}>
                    <span className="text-xl font-bold whitespace-nowrap">
                        <span className="text-white">K</span>
                        <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">-Forum</span>
                    </span>
                </div>
            </div>

            {/* Navigation Icons */}
            <nav className="flex-1 flex flex-col gap-4 w-full px-4">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `
                            relative flex items-center group rounded-2xl transition-all duration-300 overflow-hidden
                            ${isOpen ? 'w-full px-4 py-3 justify-start' : 'w-12 h-12 justify-center'}
                            ${isActive
                                ? 'bg-gradient-to-br from-emerald-500 to-teal-400 text-white'
                                : 'text-gray-400 hover:bg-white/10 hover:text-white'
                            }
                        `}
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon
                                    strokeWidth={isActive ? 2.5 : 2}
                                    className={`w-6 h-6 shrink-0 transition-transform ${!isOpen && 'group-hover:rotate-6'}`}
                                />

                                <span className={`ml-3 font-semibold whitespace-nowrap transition-all duration-300 ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10 absolute'}`}>
                                    {item.label}
                                </span>

                                {/* Hover Tooltip (Only when collapsed) */}
                                {!isOpen && (
                                    <span className="absolute left-16 px-4 py-2 bg-gray-900 border border-white/10 text-gray-200 text-sm font-bold rounded-xl opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 backdrop-blur-md">
                                        {item.label}
                                    </span>
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* User Profile Bubble */}
            {user && (
                <div className={`mt-auto relative w-full transition-all duration-300 flex items-center ${isOpen ? 'gap-3 px-6' : 'justify-center px-0'}`}>
                    <div className="relative group/avatar w-10 h-10 shrink-0 rounded-full border-2 border-emerald-500/30 p-[2px] cursor-pointer hover:border-emerald-400 transition-colors">
                        <img
                            src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=10b981&color=fff`}
                            alt={user.name}
                            className="w-full h-full rounded-full object-cover"
                        />

                        {/* Profile Tooltip (Tinted Glass Popover) */}
                        <div className={`
                            absolute p-3 rounded-xl w-48 shadow-2xl z-50
                            bg-emerald-950/50 border border-emerald-500/35 backdrop-blur-xl 
                            shadow-[0_0_20px_rgba(16,185,129,0.2)]
                            opacity-0 group-hover/avatar:opacity-100 translate-y-2 group-hover/avatar:translate-y-0 
                            transition-all duration-300 pointer-events-none bottom-12 -left-2 text-left
                        `}>
                            <p className="font-bold text-sm truncate bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">{user.name}</p>
                            <p className="text-[10px] text-emerald-400/80 truncate">@{user.studentId}</p>
                            {user.branch && (
                                <p className="text-[10px] text-gray-300 mt-1 truncate">{user.branch}</p>
                            )}
                            {user.year && (
                                <p className="text-[10px] text-gray-400">{getOrdinalYear(user.year)} Year</p>
                            )}
                            <div className="mt-2 pt-1.5 border-t border-emerald-500/10 flex items-center justify-between text-[9px] text-emerald-400 font-mono">
                                <span>ONLINE</span>
                                <span className="bg-emerald-500/10 px-1.5 py-0.5 rounded text-emerald-300 font-semibold uppercase">{user.role || 'student'}</span>
                            </div>
                        </div>
                    </div>

                    <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
                        <p className="font-bold text-sm truncate text-white">{user.name}</p>
                        <p className="text-xs text-gray-400 truncate">@{user.studentId}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sidebar;