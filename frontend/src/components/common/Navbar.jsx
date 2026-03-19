import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Menu,
    X,
    Phone,
    MessageCircle,
    Home,
    Building2
} from 'lucide-react';
import { mainContact } from '../../data/mockData';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setIsOpen(false);
    }, [location]);

    const navLinks = [
        { path: '/', label: 'Home', icon: Home },
        { path: '/lodges', label: 'Find Lodges', icon: Building2 },
        { path: '/temple-details', label: 'Details', icon: Building2 },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <>
            <nav
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                    ? 'bg-white/95 backdrop-blur-md shadow-soft'
                    : 'bg-white shadow-sm'
                    }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-14 sm:h-16 md:h-20">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2 group">
                            <img src="/logo.png" alt="Bhakta Nivas" className="w-10 h-10 md:w-12 md:h-12 object-contain" />
                            <div className="hidden sm:block">
                                <h1 className="text-lg md:text-xl font-bold text-gray-900 leading-tight">
                                    Bhakta Nivas
                                </h1>
                                <p className="text-[10px] md:text-xs text-primary-600 font-medium -mt-0.5">
                                    Private Lodges & Hotels for Devotees
                                </p>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-8">
                            {navLinks.map(({ path, label, icon: Icon }) => (
                                <Link
                                    key={path}
                                    to={path}
                                    className={`flex items-center gap-2 text-sm font-medium transition-colors ${isActive(path)
                                        ? 'text-primary-600'
                                        : 'text-gray-600 hover:text-primary-600'
                                        }`}
                                >
                                    <Icon size={18} />
                                    {label}
                                </Link>
                            ))}
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-2 md:gap-4">
                            {/* Mobile Menu Toggle */}
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="md:hidden p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                {isOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
                        >
                            <div className="px-4 py-4 space-y-2">
                                {navLinks.map(({ path, label, icon: Icon }) => (
                                    <Link
                                        key={path}
                                        to={path}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors ${isActive(path)
                                            ? 'bg-primary-50 text-primary-600'
                                            : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        <Icon size={20} />
                                        {label}
                                    </Link>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* Spacer */}
            <div className="h-16 md:h-20" />
        </>
    );
};

export default Navbar;
