import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { getImageUrl } from '../../services/api';

const PhotoGallery = ({ images = [], lodgeName }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    // Handle empty images array
    if (!images || images.length === 0) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
                <div className="md:col-span-2 relative aspect-[16/10] md:aspect-[16/9] rounded-xl overflow-hidden bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">No images available</span>
                </div>
            </div>
        );
    }

    const openLightbox = (index) => {
        setSelectedIndex(index);
        setIsLightboxOpen(true);
    };

    const closeLightbox = () => {
        setIsLightboxOpen(false);
    };

    const goToPrevious = () => {
        setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const goToNext = () => {
        setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    const resolvedImages = images.map(img => getImageUrl(img));

    return (
        <>
            {/* Gallery Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
                {/* Main Image */}
                <div
                    className="md:col-span-2 relative aspect-[16/10] md:aspect-[16/9] rounded-xl overflow-hidden cursor-pointer group"
                    onClick={() => openLightbox(0)}
                >
                    <img
                        src={resolvedImages[0]}
                        alt={`${lodgeName} - Main`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22400%22%20height%3D%22300%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22400%22%20height%3D%22300%22%20fill%3D%22%23eeeeee%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22%23999999%22%20font-family%3D%22sans-serif%22%20font-size%3D%2224%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E';
                        }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={32} />
                    </div>
                </div>

                {/* Thumbnail Grid */}
                <div className="grid grid-cols-2 md:grid-cols-1 gap-2 md:gap-4">
                    {resolvedImages.slice(1, 3).map((image, index) => (
                        <div
                            key={index + 1}
                            className="relative aspect-[4/3] md:aspect-[16/9] rounded-xl overflow-hidden cursor-pointer group"
                            onClick={() => openLightbox(index + 1)}
                        >
                            <img
                                src={image}
                                alt={`${lodgeName} - ${index + 2}`}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://placehold.co/400x300?text=No+Image';
                                }}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={24} />
                            </div>

                            {/* Show more overlay on last visible image */}
                            {index === 1 && resolvedImages.length > 3 && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <span className="text-white text-lg font-semibold">
                                        +{resolvedImages.length - 3} more
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Lightbox */}
            <AnimatePresence>
                {isLightboxOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
                        onClick={closeLightbox}
                    >
                        {/* Close Button */}
                        <button
                            onClick={closeLightbox}
                            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors z-10"
                        >
                            <X size={32} />
                        </button>

                        {/* Navigation Buttons */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                goToPrevious();
                            }}
                            className="absolute left-4 p-3 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all z-10"
                        >
                            <ChevronLeft size={32} />
                        </button>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                goToNext();
                            }}
                            className="absolute right-4 p-3 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all z-10"
                        >
                            <ChevronRight size={32} />
                        </button>

                        {/* Image */}
                        <motion.img
                            key={selectedIndex}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            src={resolvedImages[selectedIndex]}
                            alt={`${lodgeName} - ${selectedIndex + 1}`}
                            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22800%22%20height%3D%22600%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22800%22%20height%3D%22600%22%20fill%3D%22%23eeeeee%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22%23999999%22%20font-family%3D%22sans-serif%22%20font-size%3D%2248%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E';
                            }}
                        />

                        {/* Image Counter */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm">
                            {selectedIndex + 1} / {resolvedImages.length}
                        </div>

                        {/* Thumbnail Strip */}
                        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl">
                            {resolvedImages.map((image, index) => (
                                <button
                                    key={index}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedIndex(index);
                                    }}
                                    className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${index === selectedIndex
                                        ? 'border-white scale-110'
                                        : 'border-transparent opacity-60 hover:opacity-100'
                                        }`}
                                >
                                    <img
                                        src={image}
                                        alt={`Thumbnail ${index + 1}`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://placehold.co/400x300?text=No+Image';
                                        }}
                                    />
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default PhotoGallery;
