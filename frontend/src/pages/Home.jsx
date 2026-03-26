import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
    Phone,
    MessageCircle,
    Shield,
    Clock,
    Users,
    ChevronRight
} from 'lucide-react';
import LodgeCard from '../components/lodge/LodgeCard';
import SearchWidget from '../components/common/SearchWidget';
import { lodgeAPI } from '../services/api';
import { mainContact } from '../data/mockData';

// Hero images - you can replace these with your actual images
const heroImages = [
    '/hero1.png',
    '/hero2.png',
    '/hero3.png'
];

const Home = () => {
    const today = new Date();
    const [lodges, setLodges] = useState([]);
    const [currentSlide, setCurrentSlide] = useState(0);

    // Fetch lodges from API
    useEffect(() => {
        const fetchLodges = async () => {
            try {
                const data = await lodgeAPI.getAll();
                setLodges(data);
            } catch (error) {
                console.error('Error fetching lodges:', error);
            }
        };
        fetchLodges();
    }, []);

    // Filter lodges
    const todayStr = format(today, 'yyyy-MM-dd');
    const activeLodges = (Array.isArray(lodges) ? lodges : []).filter(l =>
        !l.isBlocked && !(l.blockedDates && l.blockedDates.includes(todayStr))
    );
    const availableLodges = activeLodges.filter(l => l.availability === 'available' || l.availability === 'limited');
    const walkableLodges = activeLodges.filter(l => l.distanceType === 'walkable');

    // Auto-scroll images every 4 seconds
    useEffect(() => {
        document.title = "Bhakta Nivas – Private Lodge Booking Near Sri Raghavendra Swamy Mutt, Mantralayam";
        // Update meta description
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.setAttribute("content", "Book verified private lodges near Sri Raghavendra Swamy Mutt, Mantralayam. Clean rooms, instant booking, and walkable distance for devotees.");
        }

        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % heroImages.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    // Structured Data (JSON-LD)
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Bhakta Nivas",
        "url": "https://bhakthanivas.com/",
        "description": "Premium private lodge booking platform in Mantralayam"
    };

    return (
        <div className="min-h-screen bg-gray-50 overflow-x-hidden">
            {/* Structured Data Script */}
            <script type="application/ld+json">
                {JSON.stringify(structuredData)}
            </script>

            {/* Hero Section with Image Slider */}
            <section className="relative min-h-[600px] lg:h-[620px] overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0">
                    <img
                        src={heroImages[currentSlide]}
                        alt={`Sri Raghavendra Swamy Mutt View - ${currentSlide + 1}`}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Dark gradient overlay for better readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/70 to-black/30" />

                {/* Slide indicators */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                    {heroImages.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`h-2.5 rounded-full transition-all ${index === currentSlide
                                ? 'bg-white w-8'
                                : 'bg-white/50 hover:bg-white/80 w-2.5'
                                }`}
                        />
                    ))}
                </div>

                {/* Hero Content */}
                <div className="relative z-10 h-full">
                    <div className="max-w-7xl mx-auto h-full flex flex-col justify-center px-4 sm:px-6 lg:px-8 pt-20 pb-10">
                        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr,1.1fr] items-center gap-10">
                            {/* Left: Copy & highlights */}
                            <div className="text-white">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm text-xs font-medium mb-4">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    24/7 Mantralayam private lodge booking
                                </div>

                                <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] xl:text-[2.9rem] font-semibold leading-tight mb-3">
                                    Find trusted rooms near
                                    <span className="block text-primary-200 font-bold">
                                        Sri Raghavendra Swamy Mutt
                                    </span>
                                </h1>

                                <p className="text-sm sm:text-base text-gray-100/80 max-w-xl mb-6">
                                    Clean, verified private lodges at walking distance from the temple.
                                    Book in a few simple steps with instant confirmation.
                                </p>

                                <div className="flex flex-wrap gap-6 text-xs sm:text-sm text-gray-100/80">
                                    <div>
                                        <div className="font-semibold text-white">5000+ pilgrims</div>
                                        <div className="text-gray-200/80">helped with comfortable stay</div>
                                    </div>
                                    <div className="h-10 w-px bg-white/15 hidden sm:block" />
                                    <div className="flex items-center gap-2">
                                        <Shield size={18} className="text-emerald-300" />
                                        <div>
                                            <div className="font-semibold text-white">Verified properties</div>
                                            <div className="text-gray-200/80">safe & elder friendly</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Search card */}
                            <div className="w-full max-w-md lg:ml-auto mt-6 lg:mt-0">
                                <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl shadow-black/30 border border-white/40 p-4 sm:p-5">
                                    <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                                        Check rooms & availability
                                    </h2>
                                    <p className="text-xs sm:text-sm text-gray-500 mb-4">
                                        Enter your dates to see real-time availability and pricing.
                                    </p>

                                    <SearchWidget />

                                    <p className="mt-3 text-[11px] sm:text-xs text-gray-500 flex items-center gap-2">
                                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-semibold">
                                            i
                                        </span>
                                        No online payment needed for enquiry bookings. Our team will confirm over call/WhatsApp.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            {/* Walking Distance Lodges */}
            <section className="py-12 md:py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="section-title">Walking Distance from Mutt</h2>
                            <p className="section-subtitle">Lodges within 500m from Sri Raghavendra Swamy Mutt</p>
                        </div>
                        <Link
                            to="/lodges?distance=walkable"
                            className="hidden sm:flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium"
                        >
                            View All
                            <ChevronRight size={20} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {walkableLodges.slice(0, 3).map((lodge, index) => (
                            <LodgeCard key={lodge.id} lodge={lodge} index={index} />
                        ))}
                    </div>

                    <Link
                        to="/lodges?distance=walkable"
                        className="sm:hidden flex items-center justify-center gap-1 text-primary-600 hover:text-primary-700 font-medium mt-6 relative z-10 py-3"
                    >
                        View All Walking Distance Lodges
                        <ChevronRight size={20} />
                    </Link>
                </div>
            </section>

            {/* Today's Available Rooms */}
            <section className="py-12 md:py-16 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="section-title">Today's Available Rooms</h2>
                            <p className="section-subtitle">Book now for instant confirmation</p>
                        </div>
                        <Link
                            to="/lodges"
                            className="hidden sm:flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium"
                        >
                            View All Lodges
                            <ChevronRight size={20} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {availableLodges.slice(0, 6).map((lodge, index) => (
                            <LodgeCard key={lodge.id} lodge={lodge} index={index} />
                        ))}
                    </div>

                    <div className="text-center mt-10 relative z-10">
                        <Link
                            to="/lodges"
                            className="btn-primary inline-flex py-3"
                        >
                            Explore All Lodges
                            <ChevronRight size={20} />
                        </Link>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default Home;
