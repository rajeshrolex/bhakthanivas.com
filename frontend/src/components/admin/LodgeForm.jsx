import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Loader2, Image } from 'lucide-react';
import { uploadAPI, getImageUrl } from '../../services/api';

const LodgeForm = ({ lodge, onSave, onClose, isSubmitting }) => {
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        tagline: '',
        description: '',
        address: '',
        phone: '',
        whatsapp: '',
        distance: '',
        distanceType: 'walkable',
        priceStarting: '',
        rating: '',
        reviewCount: '',
        availability: 'available',
        featured: false,
        amenities: [],
        images: [''],
        rooms: [],
        terms: ''
    });

    useEffect(() => {
        if (lodge) {
            setFormData({
                name: lodge.name || '',
                slug: lodge.slug || '',
                tagline: lodge.tagline || '',
                description: lodge.description || '',
                address: lodge.address || '',
                phone: lodge.phone || '',
                whatsapp: lodge.whatsapp || '',
                distance: lodge.distance || '',
                distanceType: lodge.distanceType || 'walkable',
                priceStarting: lodge.priceStarting || '',
                rating: lodge.rating || '',
                reviewCount: lodge.reviewCount || '',
                availability: lodge.availability || 'available',
                featured: lodge.featured || false,
                amenities: lodge.amenities || [],
                images: lodge.images?.length ? lodge.images : [''],
                rooms: lodge.rooms || [],
                terms: lodge.terms || ''
            });
        }
    }, [lodge]);

    // Auto-calculate starting price from rooms
    useEffect(() => {
        if (formData.rooms && formData.rooms.length > 0) {
            const prices = formData.rooms
                .map(r => Number(r.price))
                .filter(p => !isNaN(p) && p > 0);
            
            if (prices.length > 0) {
                const minPrice = Math.min(...prices);
                if (Number(formData.priceStarting) !== minPrice) {
                    setFormData(prev => ({ ...prev, priceStarting: String(minPrice) }));
                }
            }
        }
    }, [formData.rooms]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSlugGenerate = () => {
        const slug = formData.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        setFormData(prev => ({ ...prev, slug }));
    };

    const handleAmenityToggle = (amenity) => {
        setFormData(prev => ({
            ...prev,
            amenities: prev.amenities.includes(amenity)
                ? prev.amenities.filter(a => a !== amenity)
                : [...prev.amenities, amenity]
        }));
    };

    const [uploadingIndex, setUploadingIndex] = useState(null);

    const handleImageChange = (index, value) => {
        const newImages = [...formData.images];
        newImages[index] = value;
        setFormData(prev => ({ ...prev, images: newImages }));
    };

    const handleFileUpload = async (index, file) => {
        if (!file) return;

        try {
            setUploadingIndex(index);
            const result = await uploadAPI.uploadImage(file);

            // Store only the relative path (e.g. 'uploads/...')
            // getImageUrl() will handle the prefixing when displaying
            handleImageChange(index, result.imageUrl);
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload image: ' + error.message);
        } finally {
            setUploadingIndex(null);
        }
    };

    const addImage = () => {
        setFormData(prev => ({ ...prev, images: [...prev.images, ''] }));
    };

    const removeImage = (index) => {
        const newImages = formData.images.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, images: newImages.length ? newImages : [''] }));
    };

    const handleRoomChange = (index, field, value) => {
        const newRooms = [...formData.rooms];
        newRooms[index] = { ...newRooms[index], [field]: value };
        setFormData(prev => ({ ...prev, rooms: newRooms }));
    };

    const addRoom = () => {
        setFormData(prev => ({
            ...prev,
            rooms: [
                ...prev.rooms,
                {
                    type: 'Non-AC',
                    name: '',
                    price: '',
                    baseGuests: 2,
                    extraGuestPrice: 0,
                    maxOccupancy: 2,
                    available: 0,
                    totalRooms: 0,
                    amenities: []
                }
            ]
        }));
    };

    const removeRoom = (index) => {
        setFormData(prev => ({
            ...prev,
            rooms: prev.rooms.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const dataToSave = {
            ...formData,
            priceStarting: Number(formData.priceStarting),
            rating: formData.rating ? Number(formData.rating) : 0,
            reviewCount: formData.reviewCount ? Number(formData.reviewCount) : 0,
            images: formData.images.filter(img => img.trim()),
            rooms: formData.rooms.map(room => {
                const maxOcc = Number(room.maxOccupancy) || 1;
                // Default: 2 guests included (or maxOcc if room smaller)
                const defaultBase = Math.min(2, maxOcc);
                const baseGuests = room.baseGuests !== undefined && room.baseGuests !== null && room.baseGuests !== ''
                    ? Number(room.baseGuests)
                    : defaultBase;

                return {
                    ...room,
                    price: Number(room.price),
                    baseGuests,
                    extraGuestPrice: room.extraGuestPrice ? Number(room.extraGuestPrice) : 0,
                    maxOccupancy: maxOcc,
                    available: Number(room.available),
                    totalRooms: Number(room.totalRooms) || Number(room.available) || 0
                };
            })
        };
        onSave(dataToSave);
    };

    const amenityOptions = ['wifi', 'parking', 'hotWater', 'powerBackup', 'ac', 'lift', 'restaurant', 'tv'];
    const roomTypes = ['Non-AC', 'AC', 'Family', 'Dormitory'];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">
                        {lodge ? 'Edit Lodge' : 'Add New Lodge'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-800">Basic Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Lodge Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        name="slug"
                                        value={formData.slug}
                                        onChange={handleChange}
                                        required
                                        className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <button type="button" onClick={handleSlugGenerate} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm">
                                        Generate
                                    </button>
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
                                <input
                                    type="text"
                                    name="tagline"
                                    value={formData.tagline}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contact & Location */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-800">Contact & Location</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                                <input
                                    type="text"
                                    name="whatsapp"
                                    value={formData.whatsapp}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Distance from Mutt</label>
                                <input
                                    type="text"
                                    name="distance"
                                    value={formData.distance}
                                    onChange={handleChange}
                                    placeholder="e.g., 200m or 1.2km"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Distance Type</label>
                                <select
                                    name="distanceType"
                                    value={formData.distanceType}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="walkable">Walkable</option>
                                    <option value="auto">Auto Required</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Pricing & Status */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-800">Pricing & Status</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <input
                                    type="number"
                                    name="priceStarting"
                                    value={formData.priceStarting}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                                    placeholder="Calculated from rooms"
                                />
                                <span className="text-[10px] text-gray-400 mt-1">Automatically set to lowest room price</span>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                                <select
                                    name="availability"
                                    value={formData.availability}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="available">Available</option>
                                    <option value="limited">Limited</option>
                                    <option value="full">Full</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rating (0-5)</label>
                                <input
                                    type="number"
                                    name="rating"
                                    value={formData.rating}
                                    onChange={handleChange}
                                    min="0"
                                    max="5"
                                    step="0.1"
                                    placeholder="e.g., 4.5"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Review Count</label>
                                <input
                                    type="number"
                                    name="reviewCount"
                                    value={formData.reviewCount}
                                    onChange={handleChange}
                                    min="0"
                                    placeholder="e.g., 89"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="flex items-center pt-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="featured"
                                        checked={formData.featured}
                                        onChange={handleChange}
                                        className="w-4 h-4 rounded border-gray-300"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Featured Lodge</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Amenities */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-800">Amenities</h3>
                        <div className="flex flex-wrap gap-2">
                            {amenityOptions.map(amenity => (
                                <button
                                    key={amenity}
                                    type="button"
                                    onClick={() => handleAmenityToggle(amenity)}
                                    className={`px-3 py-1.5 rounded-full text-sm capitalize transition-colors ${formData.amenities.includes(amenity)
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {amenity}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Images */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-gray-800">Images</h3>
                            <button type="button" onClick={addImage} className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700">
                                <Plus size={16} /> Add Image
                            </button>
                        </div>
                        <div className="space-y-4">
                            {formData.images.map((img, index) => (
                                <div key={index} className="p-4 border rounded-lg bg-gray-50">
                                    <div className="flex items-start gap-4">
                                        {/* Image Preview */}
                                        <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                            {img ? (
                                                <img
                                                    src={getImageUrl(img)}
                                                    alt={`Preview ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22400%22%20height%3D%22300%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22400%22%20height%3D%22300%22%20fill%3D%22%23eeeeee%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22%23999999%22%20font-family%3D%22sans-serif%22%20font-size%3D%2224%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E';
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <Image size={32} />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 space-y-3">
                                            {/* File Upload */}
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Upload Image File</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="file"
                                                        accept="image/jpeg,image/png,image/webp"
                                                        onChange={(e) => handleFileUpload(index, e.target.files[0])}
                                                        disabled={uploadingIndex === index}
                                                        className="flex-1 text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-100 file:text-indigo-700 file:cursor-pointer hover:file:bg-indigo-200"
                                                    />
                                                    {uploadingIndex === index && (
                                                        <div className="flex items-center text-indigo-600">
                                                            <Loader2 size={20} className="animate-spin" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* OR URL Input */}
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Or paste image URL</label>
                                                <input
                                                    type="url"
                                                    value={img}
                                                    onChange={(e) => handleImageChange(index, e.target.value)}
                                                    placeholder="https://example.com/image.jpg"
                                                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                                                />
                                            </div>
                                        </div>

                                        {/* Remove Button */}
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg flex-shrink-0"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Rooms */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-gray-800">Rooms</h3>
                            <button type="button" onClick={addRoom} className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700">
                                <Plus size={16} /> Add Room
                            </button>
                        </div>
                        <div className="space-y-4">
                            {formData.rooms.map((room, index) => (
                                <div key={index} className="p-4 border rounded-lg bg-gray-50">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="font-medium text-gray-700">Room {index + 1}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeRoom(index)}
                                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Type</label>
                                            <select
                                                value={room.type}
                                                onChange={(e) => handleRoomChange(index, 'type', e.target.value)}
                                                className="w-full px-3 py-1.5 border rounded text-sm"
                                            >
                                                {roomTypes.map(t => (
                                                    <option key={t} value={t}>{t}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Name</label>
                                            <input
                                                type="text"
                                                value={room.name}
                                                onChange={(e) => handleRoomChange(index, 'name', e.target.value)}
                                                className="w-full px-3 py-1.5 border rounded text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Price (₹)</label>
                                            <input
                                                type="number"
                                                value={room.price}
                                                onChange={(e) => handleRoomChange(index, 'price', e.target.value)}
                                                className="w-full px-3 py-1.5 border rounded text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Base Guests</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={room.baseGuests ?? room.maxOccupancy ?? 2}
                                                onChange={(e) => handleRoomChange(index, 'baseGuests', e.target.value)}
                                                className="w-full px-3 py-1.5 border rounded text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Extra Guest (₹)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={room.extraGuestPrice ?? 0}
                                                onChange={(e) => handleRoomChange(index, 'extraGuestPrice', e.target.value)}
                                                className="w-full px-3 py-1.5 border rounded text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Max Guests</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={room.maxOccupancy ?? 2}
                                                onChange={(e) => handleRoomChange(index, 'maxOccupancy', e.target.value)}
                                                className="w-full px-3 py-1.5 border rounded text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Total</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={room.totalRooms ?? room.available ?? 0}
                                                onChange={(e) => handleRoomChange(index, 'totalRooms', e.target.value)}
                                                className="w-full px-3 py-1.5 border rounded text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Available</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={room.available}
                                                onChange={(e) => handleRoomChange(index, 'available', e.target.value)}
                                                className="w-full px-3 py-1.5 border rounded text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {formData.rooms.length === 0 && (
                                <p className="text-sm text-gray-500 text-center py-4">No rooms added yet. Click "Add Room" to add room types.</p>
                            )}
                        </div>
                    </div>

                    {/* Terms & Conditions */}
                    <div className="space-y-4 py-4 border-t">
                        <h3 className="font-semibold text-gray-800">Terms & Conditions</h3>
                        <textarea
                            name="terms"
                            value={formData.terms}
                            onChange={handleChange}
                            rows={4}
                            placeholder="Enter terms and conditions for this lodge..."
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                        <p className="text-[10px] text-gray-400">These terms will be shown on the booking page and included in emails/invoices.</p>
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving...' : (lodge ? 'Update Lodge' : 'Create Lodge')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LodgeForm;
