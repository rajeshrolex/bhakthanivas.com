import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard,
    Building2,
    CalendarDays,
    LogOut,
    User,
    Users,
    Menu,
    X,
    IndianRupee
} from 'lucide-react';

const AdminLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    const handleLogout = () => {
        logout();
        navigate('/admin/login');
    };

    const menuItems = [
        {
            label: 'Dashboard',
            path: '/admin/dashboard',
            icon: <LayoutDashboard size={20} />,
            roles: ['super_admin', 'admin']
        },
        {
            label: 'Bookings',
            path: '/admin/bookings',
            icon: <CalendarDays size={20} />,
            roles: ['super_admin', 'admin']
        },
        {
            label: 'Manage Lodges',
            path: '/admin/lodges',
            icon: <Building2 size={20} />,
            roles: ['super_admin']
        },
        {
            label: 'User Management',
            path: '/admin/users',
            icon: <Users size={20} />,
            roles: ['super_admin']
        },
        {
            label: 'My Lodge',
            path: '/admin/my-lodge',
            icon: <Building2 size={20} />,
            roles: ['admin']
        },
        {
            label: 'Temple Details',
            path: '/admin/temples',
            icon: <Building2 size={20} />,
            roles: ['super_admin']
        },
        {
            label: 'Price Calendar',
            path: '/admin/price-calendar',
            icon: <IndianRupee size={20} />,
            roles: ['super_admin', 'admin']
        }
    ];

    const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role));

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar for Desktop */}
            <aside className="hidden md:flex flex-col w-64 bg-white border-r">
                <div className="p-6 border-b">
                    <h1 className="text-xl font-bold text-indigo-900">Admin Panel</h1>
                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{user?.role === 'super_admin' ? 'Super Admin' : 'Lodge Admin'}</p>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {filteredMenu.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === item.path
                                ? 'bg-indigo-50 text-indigo-600 font-medium'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            {item.icon}
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t">
                    <div className="flex items-center gap-3 px-4 py-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                            <User size={16} />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2 w-full text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Mobile Header & Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile Header */}
                <header className="md:hidden bg-white border-b p-4 flex items-center justify-between">
                    <h1 className="font-bold text-indigo-900">Admin Panel</h1>
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-600">
                        {isSidebarOpen ? <X /> : <Menu />}
                    </button>
                </header>

                {/* Mobile Sidebar Overlay */}
                {isSidebarOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)}>
                        <div className="absolute left-0 top-0 bottom-0 w-64 bg-white z-50 flex flex-col" onClick={e => e.stopPropagation()}>
                            <div className="p-6 border-b flex justify-between items-center">
                                <div>
                                    <h1 className="text-xl font-bold text-indigo-900">Admin Panel</h1>
                                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{user?.role === 'super_admin' ? 'Super Admin' : 'Lodge Admin'}</p>
                                </div>
                                <button onClick={() => setIsSidebarOpen(false)}><X size={20} /></button>
                            </div>
                            <nav className="flex-1 p-4 space-y-1">
                                {filteredMenu.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setIsSidebarOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === item.path
                                            ? 'bg-indigo-50 text-indigo-600 font-medium'
                                            : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        {item.icon}
                                        {item.label}
                                    </Link>
                                ))}
                            </nav>
                            <div className="p-4 border-t">
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 px-4 py-2 w-full text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                                >
                                    <LogOut size={18} />
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <main className="flex-1 overflow-auto p-4 md:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
