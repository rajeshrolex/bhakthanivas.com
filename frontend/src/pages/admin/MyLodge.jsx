import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { lodgeAPI, getImageUrl } from '../../services/api';
import { MapPin, Star, Phone, MessageCircle, Wifi, Car, Droplets, Zap, Wind, Building, Loader2, Edit } from 'lucide-react';
import LodgeForm from '../../components/admin/LodgeForm';

const MyLodge = () => {
    const { user } = useAuth();
    const [lodge, setLodge] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showEditForm, setShowEditForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchMyLodge = async () => {
            if (!user?.lodgeId) {
                setError('No lodge assigned to your account.');
                setLoading(false);
                return;
            }

            try {
                // Fetch all lodges and find the one matching user's lodgeId
                const lodges = await lodgeAPI.getAll();
                const myLodge = lodges.find(l => l._id === user.lodgeId);

                if (myLodge) {
                    setLodge(myLodge);
                } else {
                    setError('Lodge not found.');
                }
            } catch (err) {
                console.error('Error fetching lodge:', err);
                setError('Failed to load lodge details.');
            } finally {
                setLoading(false);
            }
        };

        fetchMyLodge();
    }, [user?.lodgeId]);

    const handleSave = async (lodgeData) => {
        setIsSubmitting(true);
        try {
            const updated = await lodgeAPI.update(lodge._id, lodgeData);
            setLodge(updated);
            setShowEditForm(false);
        } catch (error) {
            console.error('Error updating lodge:', error);
            alert('Failed to update lodge. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const amenityIcons = {
        wifi: <Wifi size={16} />,
        parking: <Car size={16} />,
        hotWater: <Droplets size={16} />,
        powerBackup: <Zap size={16} />,
        ac: <Wind size={16} />,
        lift: <Building size={16} />
    };

    const amenityLabels = {
        wifi: 'Free WiFi',
        parking: 'Parking',
        hotWater: 'Hot Water',
        powerBackup: 'Power Backup',
        ac: 'Air Conditioning',
        lift: 'Lift'
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <p className="text-red-600">{error}</p>
                <p className="text-sm text-gray-500 mt-2">Please contact the super admin to assign a lodge to your account.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">My Lodge</h2>
                    <p className="text-gray-500">Manage your lodge details and settings.</p>
                </div>
                <button
                    onClick={() => setShowEditForm(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Edit size={18} />
                    Edit Lodge Details
                </button>
            </div>

            {/* Lodge Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Images */}
                {lodge.images && lodge.images.length > 0 && (
                    <div className="grid grid-cols-3 gap-1 h-48">
                        {lodge.images.slice(0, 3).map((img, idx) => (
                            <img
                                key={idx}
                                src={getImageUrl(img)}
                                alt={`${lodge.name} ${idx + 1}`}
                                className="w-full h-48 object-cover"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22400%22%20height%3D%22300%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22400%22%20height%3D%22300%22%20fill%3D%22%23eeeeee%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22%23999999%22%20font-family%3D%22sans-serif%22%20font-size%3D%2224%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E';
                                }}
                            />
                        ))}
                    </div>
                )}

                <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">{lodge.name}</h3>
                            {lodge.tagline && (
                                <p className="text-gray-500 italic">{lodge.tagline}</p>
                            )}
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 text-orange-500">
                                <Star size={18} fill="currentColor" />
                                <span className="font-bold">{lodge.rating || 'N/A'}</span>
                                <span className="text-gray-400 text-sm">({lodge.reviewCount || 0} reviews)</span>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${lodge.availability === 'available' ? 'bg-green-100 text-green-700' :
                                lodge.availability === 'limited' ? 'bg-orange-100 text-orange-700' :
                                    'bg-red-100 text-red-700'
                                }`}>
                                {lodge.availability === 'available' ? 'Available' :
                                    lodge.availability === 'limited' ? 'Limited' : 'Full'}
                            </span>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Contact Info */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900 border-b pb-2">Contact Information</h4>
                            <div className="flex items-start gap-3">
                                <MapPin size={18} className="text-gray-400 mt-0.5" />
                                <span className="text-gray-600">{lodge.address}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone size={18} className="text-gray-400" />
                                <span className="text-gray-600">{lodge.phone}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <MessageCircle size={18} className="text-gray-400" />
                                <span className="text-gray-600">{lodge.whatsapp}</span>
                            </div>
                        </div>

                        {/* Pricing & Distance */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900 border-b pb-2">Pricing & Location</h4>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Starting Price</span>
                                <span className="font-bold text-green-600">₹{lodge.priceStarting?.toLocaleString()}/night</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Distance from Temple</span>
                                <span className="font-medium">{lodge.distance}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Distance Type</span>
                                <span className="font-medium capitalize">{lodge.distanceType}</span>
                            </div>
                        </div>
                    </div>

                    {/* Amenities */}
                    <div className="mt-6">
                        <h4 className="font-semibold text-gray-900 border-b pb-2 mb-4">Amenities</h4>
                        <div className="flex flex-wrap gap-3">
                            {lodge.amenities?.map((amenity) => (
                                <span
                                    key={amenity}
                                    className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg text-sm text-gray-700"
                                >
                                    {amenityIcons[amenity] || <Building size={16} />}
                                    {amenityLabels[amenity] || amenity}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    {lodge.description && (
                        <div className="mt-6">
                            <h4 className="font-semibold text-gray-900 border-b pb-2 mb-4">Description</h4>
                            <p className="text-gray-600">{lodge.description}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Rooms */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-4">Room Types ({lodge.rooms?.length || 0})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {lodge.rooms?.map((room, idx) => (
                        <div key={idx} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="font-semibold text-gray-900">{room.name}</h4>
                                    <span className="text-xs text-gray-500">{room.type}</span>
                                </div>
                                <span className="font-bold text-green-600">₹{room.price}</span>
                            </div>
                            <div className="text-sm text-gray-500 space-y-1">
                                <p>Max Occupancy: {room.maxOccupancy} guests</p>
                                <p>Available: {room.available} rooms</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Edit Form Modal */}
            {showEditForm && (
                <LodgeForm
                    lodge={lodge}
                    onSave={handleSave}
                    onClose={() => setShowEditForm(false)}
                    isSubmitting={isSubmitting}
                />
            )}
        </div>
    );
};

export default MyLodge;
