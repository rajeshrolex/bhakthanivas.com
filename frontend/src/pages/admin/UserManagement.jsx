import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { lodgeAPI, userAPI, API_BASE_URL } from '../../services/api';
import { UserPlus, Trash2, Edit2, X, Loader2, Building2, Shield, ShieldCheck } from 'lucide-react';

const UserManagement = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [lodges, setLodges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'admin',
        lodgeId: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            const [usersRes, lodgesData] = await Promise.all([
                userAPI.getAll(),
                lodgeAPI.getAll()
            ]);
            setUsers(usersRes.users || []);
            setLodges(Array.isArray(lodgesData) ? lodgesData : (lodgesData?.lodges || []));
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const handleOpenModal = (userToEdit = null) => {
        if (userToEdit) {
            setEditingUser(userToEdit);
            // Extract lodgeId - it might be populated object or plain string
            let lodgeIdValue = '';
            if (userToEdit.lodgeId) {
                lodgeIdValue = typeof userToEdit.lodgeId === 'object'
                    ? userToEdit.lodgeId._id
                    : userToEdit.lodgeId;
            }
            setFormData({
                name: userToEdit.name,
                email: userToEdit.email,
                password: '',
                role: userToEdit.role,
                lodgeId: lodgeIdValue
            });
        } else {
            setEditingUser(null);
            setFormData({
                name: '',
                email: '',
                password: '',
                role: 'admin',
                lodgeId: ''
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const payload = {
                name: formData.name,
                email: formData.email,
                role: formData.role,
                lodgeId: formData.role === 'admin' ? formData.lodgeId : null
            };

            if (formData.password) {
                payload.password = formData.password;
            }

            const result = editingUser
                ? await userAPI.update(editingUser._id, payload)
                : await userAPI.create(payload);

            if (result.success) {
                if (editingUser) {
                    setUsers(users.map(u => u._id === editingUser._id ? result.user : u));
                } else {
                    setUsers([...users, result.user]);
                }
                fetchData(false);
                setShowModal(false);
            } else {
                alert(result.message || 'Failed to save user');
            }
        } catch (error) {
            console.error('Error saving user:', error);
            alert(error.message || 'Error saving user');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (userId) => {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            const result = await userAPI.delete(userId);
            if (result.success) {
                setUsers(users.filter(u => u._id !== userId));
                fetchData(false);
            } else {
                alert(result.message || 'Failed to delete user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            alert(error.message || 'Error deleting user');
        }
    };

    const getLodgeName = (user) => {
        // If lodgeId is populated (object with name), return it directly
        if (user.lodgeId && typeof user.lodgeId === 'object' && user.lodgeId.name) {
            return user.lodgeId.name;
        }
        // Otherwise, look up in lodges array
        if (!user.lodgeId) return 'Not Assigned';
        const lodgeIdStr = typeof user.lodgeId === 'object' ? user.lodgeId._id : user.lodgeId;
        const lodge = lodges.find(l => l._id === lodgeIdStr || l._id.toString() === lodgeIdStr?.toString());
        return lodge?.name || 'Not Assigned';
    };

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
                    <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
                    <p className="text-gray-500">Manage admin users and their lodge assignments.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <UserPlus size={18} />
                    Add New Admin
                </button>
            </div>

            {/* Users List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-gray-100">
                    {users.map((u) => (
                        <div key={u._id} className="p-4 hover:bg-gray-50">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${u.role === 'super_admin' ? 'bg-purple-100 text-purple-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                        {u.role === 'super_admin' ? <ShieldCheck size={18} /> : <Shield size={18} />}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-medium text-gray-900 truncate">{u.name}</div>
                                        <div className="text-xs text-gray-400 truncate">{u.email}</div>
                                    </div>
                                </div>
                                <span className={`ml-2 flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${u.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {u.role === 'super_admin' ? 'Super Admin' : 'Lodge Admin'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <div className="text-sm text-gray-500 flex items-center gap-1">
                                    {u.role === 'super_admin' ? (
                                        <span className="italic text-gray-400">All Lodges</span>
                                    ) : (
                                        <><Building2 size={14} className="text-gray-400" /> {getLodgeName(u)}</>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => handleOpenModal(u)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit">
                                        <Edit2 size={16} />
                                    </button>
                                    {u._id !== user._id && (
                                        <button onClick={() => handleDelete(u._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium text-sm">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Assigned Lodge</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map((u) => (
                                <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${u.role === 'super_admin' ? 'bg-purple-100 text-purple-600' : 'bg-indigo-100 text-indigo-600'
                                                }`}>
                                                {u.role === 'super_admin' ? <ShieldCheck size={20} /> : <Shield size={20} />}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">{u.name}</div>
                                                <div className="text-xs text-gray-400">{u.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${u.role === 'super_admin'
                                            ? 'bg-purple-100 text-purple-700'
                                            : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {u.role === 'super_admin' ? 'Super Admin' : 'Lodge Admin'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {u.role === 'super_admin' ? (
                                            <span className="text-gray-400 italic">All Lodges</span>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                <Building2 size={16} className="text-gray-400" />
                                                {getLodgeName(u)}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenModal(u)}
                                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            {u._id !== user._id && (
                                                <button
                                                    onClick={() => handleDelete(u._id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full">
                        <div className="p-6 border-b flex justify-between items-center">
                            <h3 className="text-xl font-bold">
                                {editingUser ? 'Edit Admin' : 'Add New Admin'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Password {editingUser ? '(leave blank to keep current)' : '*'}
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required={!editingUser}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                                >
                                    <option value="admin">Lodge Admin</option>
                                    <option value="super_admin">Super Admin</option>
                                </select>
                            </div>
                            {formData.role === 'admin' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Assign Lodge * <span className="text-xs text-gray-400">({lodges.length} lodges available)</span>
                                    </label>
                                    <select
                                        value={formData.lodgeId}
                                        onChange={(e) => setFormData({ ...formData, lodgeId: e.target.value })}
                                        required
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                                    >
                                        <option value="">{lodges.length === 0 ? 'Loading lodges...' : 'Select a lodge...'}</option>
                                        {lodges.map((lodge) => (
                                            <option key={lodge._id} value={lodge._id}>
                                                {lodge.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        editingUser ? 'Update Admin' : 'Create Admin'
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
