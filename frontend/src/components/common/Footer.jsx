import React from 'react';
import { Link } from 'react-router-dom';
import {
    Phone,
    Mail,
    MapPin,
    MessageCircle,
    Facebook,
    Instagram,
    Twitter,
    Heart
} from 'lucide-react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    const quickLinks = [
        { label: 'Home', path: '/' },
        { label: 'Find Lodges', path: '/lodges' },
        { label: 'About Us', path: '/about' },
        { label: 'Contact', path: '/contact' },
    ];

    const lodgeLinks = [
        { label: 'Near Temple', path: '/lodges?distance=walkable' },
        { label: 'Budget Lodges', path: '/lodges?sort=priceLow' },
        { label: 'Premium Stays', path: '/lodges?sort=priceHigh' },
        { label: 'Family Rooms', path: '/lodges?type=family' },
    ];

    return (
        <footer className="bg-gray-900 text-white">
            {/* Main Footer */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
                    {/* Brand Section */}
                    <div className="lg:col-span-1">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                                <span className="text-2xl">🙏</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Bhakta Nivas</h3>
                                <p className="text-xs text-gray-400">Private Lodges & Hotels for Devotees</p>
                            </div>
                        </div>
                        <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                            Your trusted platform for booking private lodges near Sri Raghavendra Swamy Mutt.
                            Comfortable stays for devotees at affordable prices.
                        </p>
                        <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700 mb-6">
                            <p className="text-xs text-gray-400 leading-relaxed text-justify">
                                <span className="text-gray-300 font-semibold block mb-1">Disclaimer:</span>
                                This website is a private accommodation booking platform created to help devotees find nearby lodges and hotels easily.
                                We are not an official website of Sri Raghavendra Swamy Mutt, Mantralayam, and we have no affiliation with the Mutt or its management.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-800 hover:bg-primary-600 flex items-center justify-center transition-colors">
                                <Facebook size={18} />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-800 hover:bg-primary-600 flex items-center justify-center transition-colors">
                                <Instagram size={18} />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-800 hover:bg-primary-600 flex items-center justify-center transition-colors">
                                <Twitter size={18} />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
                        <ul className="space-y-3">
                            {quickLinks.map(({ label, path }) => (
                                <li key={path}>
                                    <Link
                                        to={path}
                                        className="text-gray-400 hover:text-primary-400 text-sm transition-colors"
                                    >
                                        {label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Lodge Categories */}
                    <div>
                        <h4 className="text-lg font-semibold mb-4">Find Lodges</h4>
                        <ul className="space-y-3">
                            {lodgeLinks.map(({ label, path }) => (
                                <li key={path}>
                                    <Link
                                        to={path}
                                        className="text-gray-400 hover:text-primary-400 text-sm transition-colors"
                                    >
                                        {label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
                        <ul className="space-y-4">
                            <li>
                                <a
                                    href="tel:+919876543210"
                                    className="flex items-start gap-3 text-gray-400 hover:text-primary-400 text-sm transition-colors"
                                >
                                    <Phone size={18} className="mt-0.5 flex-shrink-0" />
                                    <span>+91 98765 43210<br />+91 98765 43211</span>
                                </a>
                            </li>
                            <li>
                                <a
                                    href="mailto:info@bhakthanivas.com"
                                    className="flex items-start gap-3 text-gray-400 hover:text-primary-400 text-sm transition-colors"
                                >
                                    <Mail size={18} className="mt-0.5 flex-shrink-0" />
                                    <span>info@bhakthanivas.com</span>
                                </a>
                            </li>
                            <li>
                                <div className="flex items-start gap-3 text-gray-400 text-sm">
                                    <MapPin size={18} className="mt-0.5 flex-shrink-0" />
                                    <span>Mantralayam, Kurnool District,<br />Andhra Pradesh - 518345</span>
                                </div>
                            </li>
                        </ul>

                        {/* WhatsApp CTA */}
                        <a
                            href="https://wa.me/919876543210?text=Hi, I want to book a lodge in Mantralayam"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            <MessageCircle size={18} />
                            Chat on WhatsApp
                        </a>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-gray-400 text-sm text-center md:text-left">
                            © {currentYear} Bhakta Nivas. All rights reserved.
                        </p>
                        <p className="text-gray-500 text-sm flex items-center gap-1">
                            Made with <Heart size={14} className="text-red-500" /> for Devotees
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
