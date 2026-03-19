import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dashboardAPI } from '../../services/api';
import { Building2, Users, IndianRupee, CalendarCheck, User, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                // Pass lodgeId if user is not super_admin
                const lodgeId = user?.role === 'super_admin' ? null : user?.lodgeId;
                const data = await dashboardAPI.getStats(lodgeId);
                setStats(data);
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [user]);

    const StatCard = ({ title, value, icon: Icon, color }) => (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-2">{value}</h3>
                </div>
                <div className={`p-3 rounded-lg ${color}`}>
                    <Icon size={24} className="text-white" />
                </div>
            </div>
        </div>
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
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
                <p className="text-gray-500">Overview of {user?.role === 'super_admin' ? 'all operations' : 'your lodge performance'}.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Revenue"
                    value={`₹${(stats?.totalRevenue || 0).toLocaleString()}`}
                    icon={IndianRupee}
                    color="bg-green-500"
                />
                <StatCard
                    title="Total Bookings"
                    value={stats?.totalBookings || 0}
                    icon={CalendarCheck}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Occupancy Rate"
                    value={`${stats?.occupancyRate || 0}%`}
                    icon={Users}
                    color="bg-purple-500"
                />
                <StatCard
                    title={user?.role === 'super_admin' ? "Active Lodges" : "Total Rooms"}
                    value={user?.role === 'super_admin' ? stats?.totalLodges : stats?.totalRooms}
                    icon={Building2}
                    color="bg-orange-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-4">Recent Bookings</h3>
                    <div className="space-y-4">
                        {stats?.recentBookings?.length > 0 ? (
                            stats.recentBookings.map((booking) => (
                                <div key={booking._id} className="flex items-center justify-between py-2 border-b last:border-0 border-gray-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                            <User size={18} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{booking.customerDetails?.name}</p>
                                            <p className="text-xs text-gray-400">
                                                {booking.createdAt ? format(new Date(booking.createdAt), 'MMM dd, yyyy') : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`text-xs font-medium px-2 py-1 rounded ${booking.status === 'confirmed' ? 'bg-green-50 text-green-600' :
                                        booking.status === 'pending' ? 'bg-yellow-50 text-yellow-600' :
                                            'bg-blue-50 text-blue-600'
                                        }`}>
                                        {booking.status}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-center py-4">No recent bookings</p>
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-4">Quick Stats</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                            <span className="text-green-700">Today's Revenue</span>
                            <span className="font-bold text-green-700">₹{(stats?.todayRevenue || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                            <span className="text-yellow-700">Pending Bookings</span>
                            <span className="font-bold text-yellow-700">{stats?.pendingBookings || 0}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                            <span className="text-blue-700">Today's Check-ins</span>
                            <span className="font-bold text-blue-700">{stats?.todayCheckIns || 0}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-600">Avg. Booking Value</span>
                            <span className="font-bold text-gray-900">
                                ₹{stats?.totalBookings > 0 ? Math.round(stats.totalRevenue / stats.totalBookings).toLocaleString() : 0}
                            </span>
                        </div>
                        {user?.role === 'super_admin' && (
                            <>
                                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                                    <span className="text-purple-700">Total Lodges</span>
                                    <span className="font-bold text-purple-700">{stats?.totalLodges || 0}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
                                    <span className="text-indigo-700">Total Rooms</span>
                                    <span className="font-bold text-indigo-700">{stats?.totalRooms || 0}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
