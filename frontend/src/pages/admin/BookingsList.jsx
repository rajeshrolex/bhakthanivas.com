import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { bookingAPI } from '../../services/api';
import { Search, Eye, Loader2, X, Check, Clock, LogIn, LogOut, Banknote, CreditCard, RefreshCw, Timer } from 'lucide-react';
import { format } from 'date-fns';
import { formatTo12Hour, calculateCheckOutTime } from '../../utils/timeUtils';

// Live elapsed timer for checked-in bookings
const LiveTimer = ({ checkInDate, checkInTime }) => {
    const [elapsed, setElapsed] = useState('');

    useEffect(() => {
        if (!checkInDate) return;

        const getStartMs = () => {
            try {
                const [h, m] = (checkInTime || '12:00').split(':').map(Number);
                const d = new Date(checkInDate);
                d.setHours(h, m, 0, 0);
                return d.getTime();
            } catch {
                return new Date(checkInDate).getTime();
            }
        };

        const startMs = getStartMs();

        const tick = () => {
            const diffMs = Date.now() - startMs;
            if (diffMs < 0) { setElapsed('Not started'); return; }
            const totalSecs = Math.floor(diffMs / 1000);
            const hrs = Math.floor(totalSecs / 3600);
            const mins = Math.floor((totalSecs % 3600) / 60);
            const secs = totalSecs % 60;
            setElapsed(
                `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
            );
        };

        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [checkInDate, checkInTime]);

    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-mono font-bold animate-pulse">
            <Timer size={11} />
            {elapsed}
        </span>
    );
};

const BookingsList = () => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [updatingStatus, setUpdatingStatus] = useState(null);
    const [updatingPayment, setUpdatingPayment] = useState(null);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);

    // Auto-refresh every 10 seconds
    useEffect(() => {
        fetchBookings(); // Initial fetch

        const interval = setInterval(() => {
            fetchBookingsQuietly(); // Auto-refresh
        }, 10000); // 10 seconds

        return () => clearInterval(interval); // Cleanup
    }, [statusFilter, user]);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const filters = {};
            if (statusFilter !== 'all') {
                filters.status = statusFilter;
            }
            // If user is lodge admin, filter by their lodge
            if (user?.lodgeId) {
                filters.lodgeId = user.lodgeId;
            }
            const data = await bookingAPI.getAll(filters);
            setBookings(data);
            setLastRefresh(new Date());
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    // Silent refresh without loading spinner
    const fetchBookingsQuietly = async () => {
        try {
            setIsAutoRefreshing(true);
            const filters = {};
            if (statusFilter !== 'all') {
                filters.status = statusFilter;
            }
            if (user?.lodgeId) {
                filters.lodgeId = user.lodgeId;
            }
            const data = await bookingAPI.getAll(filters);
            setBookings(data);
            setLastRefresh(new Date());
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setIsAutoRefreshing(false);
        }
    };

    const handleStatusUpdate = async (bookingId, newStatus) => {
        setUpdatingStatus(bookingId);
        try {
            await bookingAPI.updateStatus(bookingId, newStatus);
            // Update local state
            setBookings(bookings.map(b =>
                b._id === bookingId ? { ...b, status: newStatus } : b
            ));
            if (selectedBooking?._id === bookingId) {
                setSelectedBooking({ ...selectedBooking, status: newStatus });
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status. Please try again.');
        } finally {
            setUpdatingStatus(null);
        }
    };

    const handlePaymentUpdate = async (booking, paymentStatus) => {
        const id = booking._id || booking.bookingId;
        setUpdatingPayment(id);
        try {
            await bookingAPI.updatePaymentStatus(id, {
                paymentStatus,
                paymentMethod: paymentStatus === 'paid' ? 'payAtLodge' : booking.paymentMethod
            });
            // Update local state
            setBookings(bookings.map(b =>
                b._id === booking._id ? { ...b, paymentStatus } : b
            ));
            if (selectedBooking?._id === booking._id) {
                setSelectedBooking({ ...selectedBooking, paymentStatus });
            }
        } catch (error) {
            console.error('Error updating payment status:', error);
            alert('Failed to update payment. Please try again.');
        } finally {
            setUpdatingPayment(null);
        }
    };

    const filteredBookings = bookings.filter(b =>
        searchTerm === '' ||
        b.bookingId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.customerDetails?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed': return 'bg-green-100 text-green-700';
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'checked-in': return 'bg-blue-100 text-blue-700';
            case 'checked-out': return 'bg-gray-100 text-gray-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getNextActions = (status) => {
        switch (status) {
            case 'pending':
                return [
                    { label: 'Confirm', status: 'confirmed', icon: Check, color: 'text-green-600 hover:bg-green-50' },
                    { label: 'Cancel', status: 'cancelled', icon: X, color: 'text-red-600 hover:bg-red-50' }
                ];
            case 'confirmed':
                return [
                    { label: 'Check In', status: 'checked-in', icon: LogIn, color: 'text-blue-600 hover:bg-blue-50' },
                    { label: 'Cancel', status: 'cancelled', icon: X, color: 'text-red-600 hover:bg-red-50' }
                ];
            case 'checked-in':
                return [
                    { label: 'Check Out', status: 'checked-out', icon: LogOut, color: 'text-purple-600 hover:bg-purple-50' }
                ];
            default:
                return [];
        }
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
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        Bookings
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Live
                        </span>
                    </h2>
                    <p className="text-gray-500 flex items-center gap-2">
                        Manage all incoming booking requests.
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                            {isAutoRefreshing && <RefreshCw size={12} className="animate-spin" />}
                            Updated {format(lastRefresh, 'h:mm:ss a')}
                        </span>
                    </p>
                </div>
                <button
                    onClick={fetchBookings}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b flex flex-col md:flex-row gap-4 justify-between">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by ID or Name..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="checked-in">Checked In</option>
                            <option value="checked-out">Checked Out</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-gray-100">
                    {filteredBookings.length > 0 ? (
                        filteredBookings.map((booking) => (
                            <div key={booking._id} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 truncate">{booking.customerDetails?.name}</p>
                                        <p className="text-xs text-gray-500">{booking.customerDetails?.mobile}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize flex-shrink-0 ml-2 ${getStatusColor(booking.status)}`}>
                                        {booking.status}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <span className="text-xs text-indigo-600 font-mono bg-indigo-50 px-2 py-0.5 rounded">{booking.bookingId}</span>
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${booking.paymentMethod === 'upi' || booking.paymentMethod === 'online'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-orange-100 text-orange-700'
                                        }`}>
                                        {booking.paymentMethod === 'upi' || booking.paymentMethod === 'online' ? (
                                            <><CreditCard size={10} /> Online</>
                                        ) : (
                                            <><Banknote size={10} /> Cash</>
                                        )}
                                    </span>
                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${booking.paymentStatus === 'paid'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {booking.paymentStatus === 'paid' ? 'Payment: Paid' : 'Payment: Pending'}
                                    </span>

                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <div className="text-gray-600">
                                        <span>{booking.checkIn ? format(new Date(booking.checkIn), 'dd MMM') : 'N/A'}</span>
                                        <span className="mx-1">→</span>
                                        <span>{booking.checkOut ? format(new Date(booking.checkOut), 'dd MMM') : 'N/A'}</span>
                                    </div>
                                    <span className="font-bold text-gray-900">₹{booking.totalAmount?.toLocaleString() || 0}</span>
                                </div>

                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                                    <button
                                        onClick={() => setSelectedBooking(booking)}
                                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                                    >
                                        <Eye size={14} /> View
                                    </button>
                                    {booking.paymentStatus !== 'paid' && (
                                        <button
                                            onClick={() => handlePaymentUpdate(booking, 'paid')}
                                            disabled={updatingPayment === booking._id}
                                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                                        >
                                            {updatingPayment === booking._id ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                <><Banknote size={14} /> Mark Paid</>
                                            )}
                                        </button>
                                    )}
                                    {getNextActions(booking.status).map((action) => (
                                        <button
                                            key={action.status}
                                            onClick={() => handleStatusUpdate(booking._id, action.status)}
                                            disabled={updatingStatus === booking._id}
                                            className={`flex items-center justify-center gap-1 px-3 py-2 text-sm rounded-lg transition-colors disabled:opacity-50 ${action.color}`}
                                            title={action.label}
                                        >
                                            {updatingStatus === booking._id ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                <action.icon size={14} />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 px-4">
                            <p className="text-gray-500">No bookings found</p>
                        </div>
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium text-sm">
                            <tr>
                                <th className="px-6 py-4">Booking ID</th>
                                <th className="px-6 py-4">Guest</th>
                                <th className="px-6 py-4">Lodge</th>
                                <th className="px-6 py-4">Dates</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Payment</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredBookings.length > 0 ? (
                                filteredBookings.map((booking) => (
                                    <tr key={booking._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-sm text-indigo-600 font-medium">
                                            {booking.bookingId}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{booking.customerDetails?.name}</div>
                                            <div className="text-xs text-gray-400">{booking.customerDetails?.mobile}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {booking.lodgeName || booking.lodge?.name || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {/* Check-in date + time */}
                                            <div className="font-medium">{booking.checkIn ? format(new Date(booking.checkIn), 'MMM dd, yyyy') : 'N/A'}</div>
                                            {booking.checkInTime && (
                                                <div className="text-xs text-primary-600 flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {formatTo12Hour(booking.checkInTime)}
                                                </div>
                                            )}
                                            {/* Arrow and computed check-out date + time */}
                                            <div className="text-gray-400 text-xs my-0.5">↓</div>
                                            {(() => {
                                                const co = calculateCheckOutTime(booking.checkIn, booking.checkInTime || '12:00', booking.checkOut);
                                                return (
                                                    <>
                                                        <div className="font-medium">{co.checkOutDate ? format(co.checkOutDate, 'MMM dd, yyyy') : (booking.checkOut ? format(new Date(booking.checkOut), 'MMM dd, yyyy') : 'N/A')}</div>
                                                        <div className="text-xs text-purple-600 flex items-center gap-1">
                                                            <Clock size={12} />
                                                            {formatTo12Hour(co.checkOutTime)} (checkout)
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                            {booking.status === 'checked-in' && (
                                                <div className="mt-1">
                                                    <LiveTimer checkInDate={booking.checkIn} checkInTime={booking.checkInTime} />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            ₹{booking.totalAmount?.toLocaleString() || 0}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                {/* Payment Method */}
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${booking.paymentMethod === 'upi' || booking.paymentMethod === 'online'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-orange-100 text-orange-700'
                                                    }`}>
                                                    {booking.paymentMethod === 'upi' || booking.paymentMethod === 'online' ? (
                                                        <><CreditCard size={12} /> Online</>
                                                    ) : (
                                                        <><Banknote size={12} /> Cash</>
                                                    )}
                                                </span>
                                                {/* Payment Status */}
                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${booking.paymentStatus === 'paid'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {booking.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                                                </span>

                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(booking.status)}`}>
                                                {booking.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* View Details */}
                                                <button
                                                    onClick={() => setSelectedBooking(booking)}
                                                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                {/* Mark as Paid - Quick Action */}
                                                {booking.paymentStatus !== 'paid' && (
                                                    <button
                                                        onClick={() => handlePaymentUpdate(booking, 'paid')}
                                                        disabled={updatingPayment === booking._id}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Mark as Paid (Cash Received)"
                                                    >
                                                        {updatingPayment === booking._id ? (
                                                            <Loader2 size={18} className="animate-spin" />
                                                        ) : (
                                                            <Banknote size={18} />
                                                        )}
                                                    </button>
                                                )}
                                                {/* Quick Actions */}
                                                {getNextActions(booking.status).map((action) => (
                                                    <button
                                                        key={action.status}
                                                        onClick={() => handleStatusUpdate(booking._id, action.status)}
                                                        disabled={updatingStatus === booking._id}
                                                        className={`p-2 rounded-lg transition-colors ${action.color} disabled:opacity-50`}
                                                        title={action.label}
                                                    >
                                                        {updatingStatus === booking._id ? (
                                                            <Loader2 size={18} className="animate-spin" />
                                                        ) : (
                                                            <action.icon size={18} />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                        No bookings found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Booking Details Modal */}
            {selectedBooking && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
                            <h3 className="text-xl font-bold">Booking Details</h3>
                            <button onClick={() => setSelectedBooking(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Booking Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Booking ID</p>
                                    <p className="font-mono font-bold text-indigo-600">{selectedBooking.bookingId}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Status</p>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(selectedBooking.status)}`}>
                                        {selectedBooking.status}
                                    </span>
                                </div>
                            </div>

                            {/* Guest Details */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-semibold mb-3">Guest Information</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-500">Name</p>
                                        <p className="font-medium">{selectedBooking.customerDetails?.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Mobile</p>
                                        <p className="font-medium">{selectedBooking.customerDetails?.mobile}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Email</p>
                                        <p className="font-medium">{selectedBooking.customerDetails?.email || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Guests</p>
                                        <p className="font-medium">{selectedBooking.guests || 1}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Stay Details */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-semibold mb-3">Stay Details</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-500">Lodge</p>
                                        <p className="font-medium">{selectedBooking.lodgeName || selectedBooking.lodge?.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Room</p>
                                        <p className="font-medium">{selectedBooking.roomName || selectedBooking.roomType || 'Standard'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Check In</p>
                                        <p className="font-medium">
                                            {selectedBooking.checkIn ? format(new Date(selectedBooking.checkIn), 'MMM dd, yyyy') : 'N/A'}
                                        </p>
                                        {selectedBooking.checkInTime && (
                                            <p className="text-xs text-primary-600 flex items-center gap-1 mt-1">
                                                <Clock size={12} />
                                                {formatTo12Hour(selectedBooking.checkInTime)}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Check Out (auto 23h)</p>
                                        {(() => {
                                            const co = calculateCheckOutTime(selectedBooking.checkIn, selectedBooking.checkInTime || '12:00', selectedBooking.checkOut);
                                            return (
                                                <>
                                                    <p className="font-medium">
                                                        {co.checkOutDate ? format(co.checkOutDate, 'MMM dd, yyyy') : (selectedBooking.checkOut ? format(new Date(selectedBooking.checkOut), 'MMM dd, yyyy') : 'N/A')}
                                                    </p>
                                                    <p className="text-xs text-purple-600 flex items-center gap-1 mt-1">
                                                        <Clock size={12} />
                                                        {formatTo12Hour(co.checkOutTime)} (auto)
                                                    </p>
                                                </>
                                            );
                                        })()}
                                        {selectedBooking.status === 'checked-in' && (
                                            <div className="mt-2">
                                                <p className="text-xs text-gray-500 mb-1">Time elapsed since check-in:</p>
                                                <LiveTimer checkInDate={selectedBooking.checkIn} checkInTime={selectedBooking.checkInTime} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* ID Proof Details */}
                            {(selectedBooking.idType || selectedBooking.idNumber || selectedBooking.customerDetails?.idType) && (
                                <div className="bg-amber-50 p-4 rounded-lg">
                                    <h4 className="font-semibold mb-3 text-amber-800">ID Proof Details</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-amber-700">ID Type</p>
                                            <p className="font-medium text-amber-900">{selectedBooking.idType || selectedBooking.customerDetails?.idType || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-amber-700">ID Number</p>
                                            <p className="font-medium font-mono text-amber-900">{selectedBooking.idNumber || selectedBooking.customerDetails?.idNumber || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Payment Details */}
                            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                <h4 className="font-semibold mb-3 text-green-800">Payment Information</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                    <div>
                                        <p className="text-green-700">Payment Method</p>
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${selectedBooking.paymentMethod === 'upi' || selectedBooking.paymentMethod === 'online'
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-orange-100 text-orange-700'
                                            }`}>
                                            {selectedBooking.paymentMethod === 'upi' || selectedBooking.paymentMethod === 'online' ? (
                                                <><CreditCard size={14} /> Online Payment</>
                                            ) : (
                                                <><Banknote size={14} /> Pay at Lodge (Cash)</>
                                            )}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-green-700">Payment Status</p>
                                        {(() => {
                                            const hasBal = selectedBooking.balanceAmount > 0;
                                            const isPaid = selectedBooking.paymentStatus === 'paid';
                                            if (isPaid && !hasBal) {
                                                return <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-200 text-green-800">✅ Fully Paid</span>;
                                            } else if (isPaid && hasBal) {
                                                return <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-200 text-blue-800">💳 Partially Paid</span>;
                                            } else {
                                                return <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-yellow-200 text-yellow-800">⏳ Pending</span>;
                                            }
                                        })()}
                                    </div>
                                    {selectedBooking.paymentId && (
                                        <div className="col-span-2">
                                            <p className="text-green-700">Payment ID</p>
                                            <p className="font-mono text-xs text-green-900 bg-green-100 p-2 rounded mt-1">
                                                {selectedBooking.paymentId}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Amount Breakdown */}
                                <div className="space-y-2 pt-3 border-t border-green-200">
                                    {selectedBooking.amountPaid > 0 && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-green-700">Paid Online</span>
                                            <span className="font-semibold text-green-700">₹{selectedBooking.amountPaid?.toLocaleString()} ✅</span>
                                        </div>
                                    )}
                                    {selectedBooking.balanceAmount > 0 && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-red-600">Balance Due</span>
                                            <span className="font-semibold text-red-600">₹{selectedBooking.balanceAmount?.toLocaleString()} 💰</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center pt-2">
                                        <span className="font-semibold text-green-800">Total Amount</span>
                                        <span className="text-2xl font-bold text-green-700">
                                            ₹{selectedBooking.totalAmount?.toLocaleString() || 0}
                                        </span>
                                    </div>
                                </div>

                                {/* Balance Warning */}
                                {selectedBooking.balanceAmount > 0 && (
                                    <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                                        <p className="text-xs text-amber-800 font-medium">
                                            💰 Balance of <strong>₹{selectedBooking.balanceAmount?.toLocaleString()}</strong> to be collected at lodge during check-in.
                                        </p>
                                    </div>
                                )}

                                {/* Payment Action Button */}
                                {selectedBooking.paymentStatus !== 'paid' && (
                                    <button
                                        onClick={() => handlePaymentUpdate(selectedBooking, 'paid')}
                                        disabled={updatingPayment === selectedBooking._id}
                                        className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                                    >
                                        {updatingPayment === selectedBooking._id ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <Banknote size={18} />
                                        )}
                                        Mark as Paid (Cash Received)
                                    </button>
                                )}
                            </div>

                            {/* Booking Timestamps */}
                            <div className="flex gap-4 text-xs text-gray-400">
                                <span>Created: {selectedBooking.createdAt ? format(new Date(selectedBooking.createdAt), 'MMM dd, yyyy hh:mm a') : 'N/A'}</span>
                                {selectedBooking.updatedAt && selectedBooking.updatedAt !== selectedBooking.createdAt && (
                                    <span>Updated: {format(new Date(selectedBooking.updatedAt), 'MMM dd, yyyy hh:mm a')}</span>
                                )}
                            </div>

                            {/* Special Requests */}
                            {selectedBooking.specialRequests && (
                                <div>
                                    <h4 className="font-semibold mb-2">Special Requests</h4>
                                    <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg">
                                        {selectedBooking.specialRequests}
                                    </p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 border-t">
                                {getNextActions(selectedBooking.status).map((action) => (
                                    <button
                                        key={action.status}
                                        onClick={() => handleStatusUpdate(selectedBooking._id, action.status)}
                                        disabled={updatingStatus === selectedBooking._id}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${action.status === 'cancelled'
                                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                            } disabled:opacity-50`}
                                    >
                                        {updatingStatus === selectedBooking._id ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <action.icon size={18} />
                                        )}
                                        {action.label}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setSelectedBooking(null)}
                                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 ml-auto"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingsList;
