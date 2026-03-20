import React, { useState, useEffect } from 'react';
import {
    Plus,
    Pencil,
    Trash2,
    X,
    Save,
    Loader2,
    MapPin,
    Clock,
    Star,
    Train,
    Bus,
    Image as ImageIcon,
    Upload,
    AlertCircle
} from 'lucide-react';
import { templeAPI, uploadAPI, BASE_URL, getImageUrl } from '../../services/api';

const emptyTemple = {
    name: '',
    location: '',
    googleMapsLink: '',
    distance: '',
    darshanTimings: '',
    specialDarshanTimings: '',
    nearbyRailwayStationTitle: 'Nearby Railway Station',
    nearbyRailwayStation: '',
    busTimingsTitle: 'Bus Timings',
    busTimings: '',
    description: '',
    additionalInfo: '',
    images: []
};

const ManageTemples = () => {
    const [temples, setTemples] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ ...emptyTemple });
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);
    const [repairing, setRepairing] = useState(false);

    useEffect(() => {
        fetchTemples();
    }, []);

    const fetchTemples = async () => {
        try {
            const data = await templeAPI.getAll();
            setTemples(Array.isArray(data) ? data : []);
            setError('');
        } catch (err) {
            console.error('Error fetching temples:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRepairDatabase = async () => {
        if (!window.confirm('This will attempt to create missing database tables. Continue?')) return;
        setRepairing(true);
        setError('');
        try {
            await systemAPI.migrate();
            alert('Database repaired successfully!');
            await fetchTemples();
        } catch (err) {
            setError('Repair failed: ' + err.message);
        } finally {
            setRepairing(false);
        }
    };

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const result = await uploadAPI.uploadImage(file);
            if (result && result.imageUrl) {
                const imageUrl = result.imageUrl.startsWith('http') ? result.imageUrl : `${BASE_URL}${result.imageUrl}`;
                setFormData(prev => ({
                    ...prev,
                    images: [...prev.images, imageUrl]
                }));
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (err) {
            setError('Failed to upload image: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setError('Temple name is required.');
            return;
        }

        setSaving(true);
        setError('');
        try {
            if (editingId) {
                await templeAPI.update(editingId, formData);
            } else {
                await templeAPI.create(formData);
            }
            setShowForm(false);
            setEditingId(null);
            setFormData({ ...emptyTemple });
            await fetchTemples();
        } catch (err) {
            setError('Failed to save temple: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (temple) => {
        setFormData({
            name: temple.name || '',
            location: temple.location || '',
            googleMapsLink: temple.googleMapsLink || '',
            distance: temple.distance || '',
            darshanTimings: temple.darshanTimings || '',
            specialDarshanTimings: temple.specialDarshanTimings || '',
            nearbyRailwayStationTitle: temple.nearbyRailwayStationTitle || 'Nearby Railway Station',
            nearbyRailwayStation: temple.nearbyRailwayStation || '',
            busTimingsTitle: temple.busTimingsTitle || 'Bus Timings',
            busTimings: temple.busTimings || '',
            description: temple.description || '',
            additionalInfo: temple.additionalInfo || '',
            images: temple.images || []
        });
        setEditingId(temple._id);
        setShowForm(true);
        setError('');
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this temple?')) return;
        try {
            await templeAPI.delete(id);
            await fetchTemples();
        } catch (err) {
            setError('Failed to delete temple: ' + err.message);
        }
    };

    const openAddForm = () => {
        setFormData({ ...emptyTemple });
        setEditingId(null);
        setShowForm(true);
        setError('');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Temple Details</h1>
                    <p className="text-sm text-gray-500">Manage temple information displayed on the website</p>
                </div>
                {!showForm && (
                    <button
                        onClick={openAddForm}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                    >
                        <Plus size={18} />
                        Add Temple
                    </button>
                )}
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex flex-col gap-3 text-red-700 text-sm">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={16} />
                        <span className="font-medium">{error}</span>
                    </div>
                    {error.includes("doesn't exist") && (
                        <div className="flex items-center gap-3 mt-1 pl-6">
                            <p className="text-red-600 italic">It looks like the database table is missing.</p>
                            <button
                                onClick={handleRepairDatabase}
                                disabled={repairing}
                                className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                            >
                                {repairing ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        Repairing...
                                    </>
                                ) : (
                                    'Repair Database'
                                )}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Form */}
            {showForm && (
                <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">{editingId ? 'Edit Temple' : 'Add New Temple'}</h2>
                        <button
                            onClick={() => { setShowForm(false); setEditingId(null); setError(''); }}
                            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Temple Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    placeholder="e.g. Sri Raghavendra Swamy Mutt"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    placeholder="e.g. Mantralayam, Andhra Pradesh"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Google Maps Link</label>
                                <input
                                    type="url"
                                    name="googleMapsLink"
                                    value={formData.googleMapsLink}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    placeholder="https://maps.google.com/..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Distance (e.g. from Railway Station)</label>
                                <input
                                    type="text"
                                    name="distance"
                                    value={formData.distance}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    placeholder="e.g. 16 km"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Darshan Timings</label>
                                <textarea
                                    name="darshanTimings"
                                    value={formData.darshanTimings}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    placeholder="e.g. Morning: 6:00 AM - 1:00 PM&#10;Evening: 4:00 PM - 8:00 PM"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Special / VIP Darshan Timings</label>
                                <textarea
                                    name="specialDarshanTimings"
                                    value={formData.specialDarshanTimings}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    placeholder="e.g. VIP Darshan: 7:00 AM - 9:00 AM"
                                />
                            </div>
                            <div>
                                <input
                                    type="text"
                                    name="nearbyRailwayStationTitle"
                                    value={formData.nearbyRailwayStationTitle}
                                    onChange={handleChange}
                                    className="block text-sm font-medium text-gray-700 mb-1 border-b border-dashed border-gray-300 focus:outline-none focus:border-indigo-500 bg-transparent w-full"
                                    placeholder="Title (e.g. Nearby Railway Station)"
                                />
                                <textarea
                                    name="nearbyRailwayStation"
                                    value={formData.nearbyRailwayStation}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    placeholder="e.g. Mantralayam Road (MAYE) - 15 km"
                                />
                            </div>
                            <div>
                                <input
                                    type="text"
                                    name="busTimingsTitle"
                                    value={formData.busTimingsTitle}
                                    onChange={handleChange}
                                    className="block text-sm font-medium text-gray-700 mb-1 border-b border-dashed border-gray-300 focus:outline-none focus:border-indigo-500 bg-transparent w-full"
                                    placeholder="Title (e.g. Bus Timings)"
                                />
                                <textarea
                                    name="busTimings"
                                    value={formData.busTimings}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    placeholder="e.g. APSRTC buses from Kurnool, Hyderabad"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    placeholder="Detailed description about the temple..."
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Information</label>
                                <textarea
                                    name="additionalInfo"
                                    value={formData.additionalInfo}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    placeholder="Any extra details, package costs, special notes..."
                                />
                            </div>
                        </div>

                        {/* Image Upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>
                            <div className="flex flex-wrap gap-3 mb-3">
                                {formData.images.map((img, i) => (
                                    <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border group">
                                        <img src={img} alt={`Temple ${i + 1}`} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(i)}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                                <label className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 transition-colors">
                                    {uploading ? (
                                        <Loader2 size={20} className="animate-spin text-gray-400" />
                                    ) : (
                                        <>
                                            <Upload size={20} className="text-gray-400 mb-1" />
                                            <span className="text-xs text-gray-400">Upload</span>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageUpload}
                                        disabled={uploading}
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                {editingId ? 'Update Temple' : 'Save Temple'}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setShowForm(false); setEditingId(null); setError(''); }}
                                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Temple Table */}
            {temples.length === 0 && !showForm ? (
                <div className="text-center py-16 text-gray-500 bg-white rounded-xl shadow-sm border">
                    <MapPin size={48} className="mx-auto mb-3 text-gray-300" />
                    <h3 className="font-medium text-lg">No Temples Added Yet</h3>
                    <p className="text-sm mt-1">Click "Add Temple" to create your first temple entry.</p>
                </div>
            ) : !showForm && (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full whitespace-nowrap">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Temple</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distance</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Darshan Timings</th>
                                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {temples.map((temple) => (
                                    <tr key={temple._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                {temple.images && temple.images.length > 0 ? (
                                                    <img
                                                        src={getImageUrl(temple.images[0])}
                                                        alt={temple.name}
                                                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 border">
                                                        <ImageIcon size={20} className="text-gray-300" />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-semibold text-gray-900">{temple.name}</div>
                                                    {temple.location && (
                                                        <div className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                                                            <MapPin size={12} /> {temple.location}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {temple.distance ? (
                                                <span className="text-sm text-gray-900">{temple.distance}</span>
                                            ) : (
                                                <span className="text-sm text-gray-400">Not specified</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {temple.darshanTimings ? (
                                                <span className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-2 max-w-xs block">
                                                    {temple.darshanTimings}
                                                </span>
                                            ) : (
                                                <span className="text-sm text-gray-400">Not specified</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 flex flex-col gap-1">
                                            {temple.nearbyRailwayStation && (
                                                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1 w-fit">
                                                    <Train size={12} /> {temple.nearbyRailwayStationTitle || 'Railway'}
                                                </span>
                                            )}
                                            {temple.busTimings && (
                                                <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full flex items-center gap-1 w-fit">
                                                    <Bus size={12} /> {temple.busTimingsTitle || 'Bus'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(temple)}
                                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(temple._id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageTemples;
