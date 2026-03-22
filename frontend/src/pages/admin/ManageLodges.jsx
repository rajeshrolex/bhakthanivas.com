import React, { useState, useEffect } from 'react';
import { lodgeAPI } from '../../services/api';
import { MapPin, Star, Edit, Trash2, Plus, Loader2, ShieldAlert, ShieldCheck } from 'lucide-react';
import LodgeForm from '../../components/admin/LodgeForm';

const ManageLodges = () => {
    const [lodges, setLodges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingLodge, setEditingLodge] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [updatingBlockId, setUpdatingBlockId] = useState(null);

    useEffect(() => {
        fetchLodges();
    }, []);

    const fetchLodges = async () => {
        try {
            setLoading(true);
            const data = await lodgeAPI.getAll();
            setLodges(data);
        } catch (error) {
            console.error('Error fetching lodges:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this lodge?')) {
            try {
                await lodgeAPI.delete(id);
                setLodges(lodges.filter(l => l._id !== id));
            } catch (error) {
                console.error('Error deleting lodge:', error);
                alert('Failed to delete lodge. Please try again.');
            }
        }
    };

    const handleBlockToggle = async (lodge) => {
        const action = lodge.isBlocked ? 'unblock' : 'block';
        if (window.confirm(`Are you sure you want to ${action} ${lodge.name}?`)) {
            try {
                setUpdatingBlockId(lodge._id);
                const result = await lodgeAPI.toggleBlock(lodge._id);
                setLodges(lodges.map(l =>
                    l._id === lodge._id ? { ...l, isBlocked: result.isBlocked } : l
                ));
            } catch (error) {
                console.error(`Error ${action}ing lodge:`, error);
                alert(`Failed to ${action} lodge. Please try again.`);
            } finally {
                setUpdatingBlockId(null);
            }
        }
    };

    const handleAddNew = () => {
        setEditingLodge(null);
        setShowForm(true);
    };

    const handleEdit = (lodge) => {
        setEditingLodge(lodge);
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditingLodge(null);
    };

    const handleSave = async (lodgeData) => {
        setIsSubmitting(true);
        try {
            console.log('Saving lodge data:', lodgeData);
            if (editingLodge) {
                // Update existing lodge
                const updated = await lodgeAPI.update(editingLodge._id, lodgeData);
                setLodges(lodges.map(l => l._id === editingLodge._id ? updated : l));
            } else {
                // Create new lodge
                const created = await lodgeAPI.create(lodgeData);
                setLodges([...lodges, created]);
            }
            handleCloseForm();
        } catch (error) {
            console.error('Error saving lodge:', error);
            console.error('Error details:', error.response?.data || error.message);
            alert(`Failed to save lodge: ${error.response?.data?.message || error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Filter lodges based on search
    const filteredLodges = lodges.filter(lodge =>
        lodge.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lodge.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Manage Lodges</h2>
                    <p className="text-gray-500">View and manage all partner lodges.</p>
                </div>
                <button
                    onClick={handleAddNew}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={18} />
                    Add New Lodge
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b">
                    <input
                        type="text"
                        placeholder="Search lodges..."
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-gray-100">
                    {filteredLodges.length > 0 ? filteredLodges.map((lodge) => (
                        <div key={lodge._id} className="p-4 hover:bg-gray-50">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-gray-900 truncate">{lodge.name}</div>
                                    <div className="text-xs text-gray-400">Slug: {lodge.slug}</div>
                                </div>
                                <div className="flex flex-col gap-1 ml-2 items-end flex-shrink-0">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${lodge.availability === 'available' ? 'bg-green-100 text-green-700' : lodge.availability === 'limited' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                                        {lodge.availability === 'available' ? 'Active' : lodge.availability}
                                    </span>
                                    {lodge.isBlocked && (
                                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700 flex items-center gap-1">
                                            <ShieldAlert size={10} /> Blocked
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-1 text-gray-500 text-sm mb-1">
                                <MapPin size={13} />
                                <span className="truncate">{lodge.address}</span>
                            </div>
                            <div className="flex items-center justify-between mt-3">
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                                        {lodge.rooms?.map(room => (
                                            <span key={room._id} className="text-xs font-semibold text-indigo-600">
                                                {room.type}: ₹{room.price}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleBlockToggle(lodge)}
                                        disabled={updatingBlockId === lodge._id}
                                        className={`p-2 rounded-lg transition-colors ${lodge.isBlocked ? 'text-green-600 hover:bg-green-50' : 'text-amber-600 hover:bg-amber-50'}`}
                                        title={lodge.isBlocked ? 'Unblock' : 'Block'}
                                    >
                                        {updatingBlockId === lodge._id ? <Loader2 size={16} className="animate-spin" /> : lodge.isBlocked ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                                    </button>
                                    <button onClick={() => handleEdit(lodge)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Edit">
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(lodge._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-12 text-gray-500 px-4">
                            {searchTerm ? 'No lodges found.' : 'No lodges yet. Click "Add New Lodge" to create one.'}
                        </div>
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium text-sm">
                            <tr>
                                <th className="px-6 py-4">Lodge Name</th>
                                <th className="px-6 py-4">Location</th>
                                <th className="px-6 py-4">Room Prices</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredLodges.length > 0 ? (
                                filteredLodges.map((lodge) => (
                                    <tr key={lodge._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-900">{lodge.name}</div>
                                            <div className="text-xs text-gray-400">Slug: {lodge.slug}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1 text-gray-500">
                                                <MapPin size={14} />
                                                <span className="text-sm truncate max-w-[150px]">{lodge.address}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                {lodge.rooms?.map(room => (
                                                    <div key={room._id} className="text-xs whitespace-nowrap">
                                                        <span className="text-gray-500">{room.type}:</span>
                                                        <span className="ml-1 font-bold text-indigo-600">₹{room.price}</span>
                                                    </div>
                                                ))}
                                                {(!lodge.rooms || lodge.rooms.length === 0) && (
                                                    <span className="text-xs text-gray-400 italic">No rooms set</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${lodge.availability === 'available' ? 'bg-green-100 text-green-700' :
                                                    lodge.availability === 'limited' ? 'bg-orange-100 text-orange-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                    {lodge.availability === 'available' ? 'Active' : lodge.availability}
                                                </span>
                                                {lodge.isBlocked && (
                                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700 flex items-center gap-1 justify-center">
                                                        <ShieldAlert size={10} />
                                                        Blocked
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleBlockToggle(lodge)}
                                                    disabled={updatingBlockId === lodge._id}
                                                    className={`p-2 rounded-lg transition-colors ${lodge.isBlocked
                                                        ? 'text-green-600 hover:bg-green-50'
                                                        : 'text-amber-600 hover:bg-amber-50'}`}
                                                    title={lodge.isBlocked ? "Unblock Lodge" : "Block Lodge"}
                                                >
                                                    {updatingBlockId === lodge._id ? (
                                                        <Loader2 size={18} className="animate-spin" />
                                                    ) : lodge.isBlocked ? (
                                                        <ShieldCheck size={18} />
                                                    ) : (
                                                        <ShieldAlert size={18} />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(lodge)}
                                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                                    title="Edit"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                    title="Delete"
                                                    onClick={() => handleDelete(lodge._id)}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                        {searchTerm ? 'No lodges found matching your search.' : 'No lodges available. Click "Add New Lodge" to create one.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>


            {/* Lodge Form Modal */}
            {showForm && (
                <LodgeForm
                    lodge={editingLodge}
                    onSave={handleSave}
                    onClose={handleCloseForm}
                    isSubmitting={isSubmitting}
                />
            )}
        </div>
    );
};

export default ManageLodges;

