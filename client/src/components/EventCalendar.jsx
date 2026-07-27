import React, { useState, useEffect } from 'react';
import axios from '../services/axiosSetup';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const EventCalendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const response = await axios.get('/api/posts/events');
            if (Array.isArray(response.data)) {
                setEvents(response.data);
            } else if (response.data && Array.isArray(response.data.posts)) {
                setEvents(response.data.posts);
            } else {
                setEvents([]);
            }
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const year = currentDate.getFullYear();
    const today = new Date();

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const hasEvent = (day) => {
        const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        checkDate.setHours(0, 0, 0, 0);

        return events.some(event => {
            const eventDate = new Date(event.eventDate);
            eventDate.setHours(0, 0, 0, 0);
            return eventDate.getTime() === checkDate.getTime();
        });
    };

    const isToday = (day) => {
        return day === today.getDate() &&
            currentDate.getMonth() === today.getMonth() &&
            currentDate.getFullYear() === today.getFullYear();
    };

    if (loading) {
        return (
            <div className="glass-panel rounded-3xl p-3 w-full animate-pulse">
                <div className="h-6 w-32 bg-white/5 rounded mb-4"></div>
                <div className="grid grid-cols-7 gap-1">
                    {[...Array(35)].map((_, i) => (
                        <div key={i} className="h-11 md:h-8 w-full bg-white/5 rounded-xl md:rounded-lg"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="glass-panel rounded-3xl p-3 relative overflow-hidden w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 md:mb-3">
                <h3 className="font-bold text-white flex items-center gap-2.5 md:gap-2 text-base md:text-sm">
                    <CalendarIcon className="w-5 h-5 md:w-4 md:h-4 text-emerald-400" />
                    Calendar
                </h3>
                <div className="flex items-center gap-2 md:gap-1">
                    <button onClick={prevMonth} className="p-2 md:p-1 hover:bg-white/10 active:bg-white/15 rounded-full transition-colors">
                        <ChevronLeft className="w-5 h-5 md:w-4 md:h-4 text-gray-400" />
                    </button>
                    <span className="text-sm md:text-xs font-bold text-gray-200 w-28 md:w-20 text-center">
                        {monthName} {year}
                    </span>
                    <button onClick={nextMonth} className="p-2 md:p-1 hover:bg-white/10 active:bg-white/15 rounded-full transition-colors">
                        <ChevronRight className="w-5 h-5 md:w-4 md:h-4 text-gray-400" />
                    </button>
                </div>
            </div>

            {/* Day-of-week Headers */}
            <div className="grid grid-cols-7 gap-1.5 md:gap-1 text-center relative z-0 w-full mb-1 md:mb-0">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                    <div key={day} className="text-xs md:text-[10px] font-bold text-gray-500 py-1.5 md:py-1">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1.5 md:gap-1 text-center relative z-0 w-full">
                {Array(firstDay).fill(null).map((_, i) => (
                    <div key={`empty-${i}`} className="min-h-[44px] md:min-h-[32px]" />
                ))}
                {Array(daysInMonth).fill(null).map((_, i) => {
                    const day = i + 1;
                    const dayEvents = (events || []).filter(e => {
                        const d = new Date(e.eventDate);
                        return d.getDate() === day && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
                    });
                    const hasEvent = dayEvents.length > 0;
                    const isTodayDay = isToday(day);

                    return (
                        <div
                            key={day}
                            className={`
                                w-full py-2.5 md:py-2 flex items-center justify-center text-sm md:text-xs rounded-xl md:rounded-lg relative group cursor-pointer min-h-[44px] md:min-h-[32px] transition-all duration-150
                                ${isTodayDay
                                    ? 'bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/30 md:shadow-emerald-500/20 ring-2 ring-emerald-400/30 md:ring-0'
                                    : 'text-gray-300 hover:bg-white/5 active:bg-white/10'}
                                ${hasEvent && !isTodayDay
                                    ? 'text-emerald-400 font-bold bg-emerald-500/10 md:bg-emerald-500/5 border border-emerald-500/25 md:border-emerald-500/20'
                                    : ''}
                            `}
                            onClick={(e) => {
                                if (hasEvent) {
                                    window.location.href = `/post/${dayEvents[0]._id}`;
                                }
                            }}
                        >
                            {day}
                            {hasEvent && !isTodayDay && (
                                <div className="absolute bottom-1 md:bottom-0.5 w-1.5 h-1.5 md:w-1 md:h-1 bg-emerald-400 rounded-full" />
                            )}

                            {/* Hover Tooltip */}
                            {hasEvent && (
                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-50 w-max max-w-[180px] md:max-w-[150px]">
                                    <div className="bg-gray-900 border border-emerald-500/30 rounded-xl p-2.5 md:p-2 shadow-xl whitespace-normal text-left">
                                        {dayEvents.map(ev => (
                                            <div key={ev._id} className="text-xs md:text-[10px] text-emerald-400 font-bold truncate">
                                                • {ev.title}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default EventCalendar;
