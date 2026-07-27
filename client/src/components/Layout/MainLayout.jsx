import React, { useState } from 'react';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';
import SignInPromptModal from '../SignInPromptModal';
import PwaInstallPrompt from '../PwaInstallPrompt';

const MainLayout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <div className="min-h-screen bg-[#0f1115] text-gray-100 font-sans selection:bg-emerald-500/30">
            {/* Desktop Background Ambience */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                {/* Dim green glow from top-left corner */}
                <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-emerald-500/[0.06] rounded-full blur-[150px]" />
                {/* Dim green glow from middle-left corner */}
                <div className="absolute top-[35%] left-[-20%] w-[45%] h-[45%] bg-emerald-500/[0.04] rounded-full blur-[140px]" />
                {/* Subtle blue glow from bottom-right corner */}
                <div className="absolute bottom-[-15%] right-[-15%] w-[45%] h-[45%] bg-blue-600/[0.05] rounded-full blur-[150px]" />
            </div>

            {/* Navigation */}
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            <MobileHeader />

            {/* Global Prompts */}
            <SignInPromptModal />
            <PwaInstallPrompt />

            {/* Main Content Area */}
            <main className={`
                relative z-10 
                pt-[72px] md:pt-8 
                px-4 md:px-8 
                pb-20 md:pb-0
                min-h-screen
                transition-all duration-300 ease-in-out
                ${isSidebarOpen ? 'md:pl-80' : 'md:pl-32 lg:pl-40'}
            `}>
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
