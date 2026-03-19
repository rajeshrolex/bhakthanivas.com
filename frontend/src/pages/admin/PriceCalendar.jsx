import React, { useState, useEffect } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Loader2,
    Save,
    X,
    CalendarDays,
    IndianRupee,
    RotateCcw,
    ShieldBan
} from 'lucide-react';
import { lodgeAPI, dailyPriceAPI, blockedDatesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ROOM_TYPES = ['Non-AC', 'AC', 'Family', 'Dormitory'];

const ROOM_COLORS = {
    'Non-AC': 'bg-blue-100 text-blue-800',
    'AC': 'bg-emerald-100 text-emerald-800',
    'Family': 'bg-purple-100 text-purple-800',
    'Dormitory': 'bg-orange-100 text-orange-800'
};

function getMonthMatrix(year, month) {
    // month: 0-indexed
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
}

function toYMD(year, month, day) {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
}

function toMonthStr(year, month) {
    return `${year}-${String(month + 1).padStart(2, '0')}`;
}

const PriceCalendar = () => {
    const today = new Date();
    const { user, isSuperAdmin } = useAuth();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());

    const [lodges, setLodges] = useState([]);
    const [selectedLodge, setSelectedLodge] = useState(null);

    // basePrices: { 'Non-AC': 800, 'AC': 1200, ... } from room data
    const [basePrices, setBasePrices] = useState({});

    // overrides: { 'YYYY-MM-DD': { 'Non-AC': { _id, price }, ... } }
    const [overrides, setOverrides] = useState({});

    // blockedDates: { 'YYYY-MM-DD': { _id, reason } }
    const [blockedDates, setBlockedDates] = useState({});

    // Selected day panel
    const [selectedDay, setSelectedDay] = useState(null);
    // editPrices: { 'Non-AC': price, ... }
    const [editPrices, setEditPrices] = useState({});
    // editRoomBlocks: { 'Non-AC': boolean, ... }
    const [editRoomBlocks, setEditRoomBlocks] = useState({});
    const [editBlocked, setEditBlocked] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loadingPrices, setLoadingPrices] = useState(false);

    // Load lodges on mount
    useEffect(() => {
        lodgeAPI.getAll().then(data => {
            if (Array.isArray(data) && data.length > 0) {
                // If regular admin, filter to only their lodge
                if (!isSuperAdmin() && user?.lodgeId) {
                    const filtered = data.filter(l => l._id === user.lodgeId);
                    setLodges(filtered);
                    setSelectedLodge(filtered[0] || null);
                } else {
                    setLodges(data);
                    setSelectedLodge(data[0]);
                }
            }
        });
    }, [user, isSuperAdmin]);

    // Load base prices from rooms when lodge changes
    useEffect(() => {
        if (!selectedLodge) return;
        const rooms = selectedLodge.rooms || [];
        const bp = {};
        for (const rt of ROOM_TYPES) {
            const room = rooms.find(r => r.type === rt);
            if (room) bp[rt] = room.price;
        }
        setBasePrices(bp);
        setSelectedDay(null);
        setOverrides({});
    }, [selectedLodge]);

    // Load overrides when lodge or month changes
    useEffect(() => {
        if (!selectedLodge) return;
        const monthStr = toMonthStr(year, month);
        setLoadingPrices(true);

        Promise.all([
            dailyPriceAPI.getByMonth(selectedLodge._id, monthStr),
            blockedDatesAPI.getByMonth(selectedLodge._id, monthStr)
        ]).then(([pricesData, blocksData]) => {
            const map = {};
            if (Array.isArray(pricesData)) {
                pricesData.forEach(item => {
                    if (!map[item.date]) map[item.date] = {};
                    map[item.date][item.roomType] = { 
                        _id: item._id, 
                        price: item.price,
                        isBlocked: item.isBlocked || false 
                    };
                });
            }
            setOverrides(map);

            const blockMap = {};
            if (Array.isArray(blocksData)) {
                blocksData.forEach(b => {
                    blockMap[b.date] = { _id: b._id, reason: b.reason };
                });
            }
            setBlockedDates(blockMap);
        })
            .catch(() => {
                setOverrides({});
                setBlockedDates({});
            })
            .finally(() => setLoadingPrices(false));
    }, [selectedLodge, year, month]);

    const prevMonth = () => {
        if (month === 0) { setYear(y => y - 1); setMonth(11); }
        else setMonth(m => m - 1);
        setSelectedDay(null);
    };

    const nextMonth = () => {
        if (month === 11) { setYear(y => y + 1); setMonth(0); }
        else setMonth(m => m + 1);
        setSelectedDay(null);
    };

    const handleDayClick = (day) => {
        if (!day) return;
        const dateStr = toYMD(year, month, day);
        setSelectedDay(dateStr);
        const dayOverrides = overrides[dateStr] || {};
        const prices = {};
        const roomBlocks = {};
        for (const rt of ROOM_TYPES) {
            prices[rt] = dayOverrides[rt]?.price != null ? String(dayOverrides[rt].price) : (basePrices[rt] != null ? String(basePrices[rt]) : '');
            roomBlocks[rt] = !!dayOverrides[rt]?.isBlocked;
        }
        setEditPrices(prices);
        setEditRoomBlocks(roomBlocks);
        setEditBlocked(!!blockedDates[dateStr]);
    };

    const handleSave = async () => {
        if (!selectedLodge || !selectedDay) return;
        setSaving(true);
        try {
            const newOverrides = { ...overrides };
            if (!newOverrides[selectedDay]) newOverrides[selectedDay] = {};

            for (const rt of ROOM_TYPES) {
                const val = editPrices[rt];
                const isRoomBlocked = editRoomBlocks[rt] || false;
                const numVal = parseFloat(val);
                
                // Only skip if there's no price input AND it's not blocked
                if ((val === '' || isNaN(numVal)) && !isRoomBlocked) continue;

                // Only save if different from base price, or already overridden, or blocked
                const currentOverride = overrides[selectedDay]?.[rt];
                
                if (val === '' && !isRoomBlocked) {
                    // If user cleared the input and it's not blocked, remove override if it exists
                    if (currentOverride) {
                        await dailyPriceAPI.remove(currentOverride._id);
                        delete newOverrides[selectedDay][rt];
                    }
                    continue;
                }

                if (!currentOverride && numVal === basePrices[rt] && !isRoomBlocked) {
                    // Don't create an override if it matches base price, isn't blocked, and doesn't exist yet
                    continue;
                }

                const doc = await dailyPriceAPI.upsert({
                    lodgeId: selectedLodge._id,
                    date: selectedDay,
                    roomType: rt,
                    price: isNaN(numVal) ? undefined : numVal,
                    isBlocked: isRoomBlocked
                });
                newOverrides[selectedDay][rt] = { 
                    _id: doc._id, 
                    price: doc.price,
                    isBlocked: doc.isBlocked
                };
            }
            
            if (newOverrides[selectedDay] && Object.keys(newOverrides[selectedDay]).length === 0) {
                delete newOverrides[selectedDay];
            }
            setOverrides(newOverrides);

            // Handle block toggles
            const wasBlocked = !!blockedDates[selectedDay];
            if (editBlocked && !wasBlocked) {
                const doc = await blockedDatesAPI.block({ lodgeId: selectedLodge._id, date: selectedDay });
                setBlockedDates(prev => ({ ...prev, [selectedDay]: { _id: doc._id, reason: doc.reason } }));
            } else if (!editBlocked && wasBlocked) {
                const existingBlockId = blockedDates[selectedDay]._id;
                await blockedDatesAPI.unblock(existingBlockId);
                setBlockedDates(prev => {
                    const newBlocks = { ...prev };
                    delete newBlocks[selectedDay];
                    return newBlocks;
                });
            }

        } catch (err) {
            alert('Failed to save prices: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async (rt) => {
        if (!selectedLodge || !selectedDay) return;
        const existing = overrides[selectedDay]?.[rt];
        if (!existing) return; // nothing to reset
        try {
            await dailyPriceAPI.remove(existing._id);
            const newOverrides = { ...overrides };
            delete newOverrides[selectedDay][rt];
            if (Object.keys(newOverrides[selectedDay]).length === 0) {
                delete newOverrides[selectedDay];
            }
            setOverrides(newOverrides);
            // Reset edit price to base and unblock
            setEditPrices(prev => ({ ...prev, [rt]: basePrices[rt] != null ? String(basePrices[rt]) : '' }));
            setEditRoomBlocks(prev => ({ ...prev, [rt]: false }));
        } catch (err) {
            alert('Failed to reset price: ' + err.message);
        }
    };

    const cells = getMonthMatrix(year, month);
    const monthName = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });

    const getDayPrices = (day) => {
        if (!day) return null;
        const dateStr = toYMD(year, month, day);
        return overrides[dateStr] || null;
    };

    const isToday = (day) => {
        const t = new Date();
        return day === t.getDate() && month === t.getMonth() && year === t.getFullYear();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <CalendarDays size={24} className="text-indigo-600" />
                        Price Calendar
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Set daily room prices for any date. Dates without override use the default room price.</p>
                </div>

                {/* Lodge selector */}
                {isSuperAdmin() ? (
                    <select
                        className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm bg-white shadow-sm"
                        value={selectedLodge?._id || ''}
                        onChange={e => {
                            const lodge = lodges.find(l => l._id === e.target.value);
                            setSelectedLodge(lodge || null);
                        }}
                    >
                        {lodges.map(l => (
                            <option key={l._id} value={l._id}>{l.name}</option>
                        ))}
                    </select>
                ) : (
                    <div className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium border border-indigo-100">
                        {selectedLodge?.name || 'Loading Lodge...'}
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-2 text-xs">
                {ROOM_TYPES.map(rt => (
                    <span key={rt} className={`px-2 py-1 rounded-full font-medium ${ROOM_COLORS[rt]}`}>
                        {rt}
                    </span>
                ))}
                <span className="text-gray-400 ml-2 self-center">— shown on overridden dates</span>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Calendar */}
                <div className="bg-white rounded-2xl shadow-sm border flex-1 overflow-hidden">
                    {/* Month nav */}
                    <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
                        <button onClick={prevMonth} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                            <ChevronLeft size={18} />
                        </button>
                        <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-gray-800">{monthName}</h3>
                            {loadingPrices && <Loader2 size={16} className="animate-spin text-indigo-500" />}
                        </div>
                        <button onClick={nextMonth} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    {/* Day headers */}
                    <div className="grid grid-cols-7 border-b">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} className="text-center py-2 text-xs font-semibold text-gray-400 uppercase">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Cells */}
                    <div className="grid grid-cols-7">
                        {cells.map((day, idx) => {
                            const dateStr = day ? toYMD(year, month, day) : null;
                            const dayPrices = getDayPrices(day);
                            const isSelected = dateStr === selectedDay;
                            const isLodgeBlocked = dateStr && blockedDates[dateStr];
                            const todayFlag = day && isToday(day);

                            return (
                                <div
                                    key={idx}
                                    onClick={() => handleDayClick(day)}
                                    className={`min-h-[72px] p-1.5 border-b border-r cursor-pointer transition-colors relative
                                        ${!day ? 'bg-gray-50 cursor-default' : 'hover:bg-indigo-50'}
                                        ${isSelected ? 'bg-indigo-100 ring-2 ring-indigo-400 ring-inset' : ''}
                                        ${isLodgeBlocked ? 'bg-red-50' : ''}
                                    `}
                                >
                                    {day && (
                                        <>
                                            <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1
                                                ${todayFlag ? (isLodgeBlocked ? 'bg-red-600 text-white' : 'bg-indigo-600 text-white') : (isLodgeBlocked ? 'text-red-700' : 'text-gray-700')}`}>
                                                {day}
                                            </span>
                                            {isLodgeBlocked ? (
                                                <div className="flex flex-col gap-0.5 items-center justify-center mt-2 text-red-500">
                                                    <ShieldBan size={16} />
                                                    <span className="text-[10px] font-bold uppercase tracking-wider">Blocked</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-0.5">
                                                    {ROOM_TYPES.map(rt => {
                                                        const override = dayPrices?.[rt];
                                                        const basePrice = basePrices[rt];
                                                        
                                                        // Only show if we have either an override or a base price
                                                        if (!override && (basePrice === undefined || basePrice === null)) return null;
                                                        
                                                        const displayPrice = override ? override.price : basePrice;
                                                        const isOverride = !!override;
                                                        const isRoomBlocked = override?.isBlocked;

                                                        return (
                                                            <span 
                                                                key={rt} 
                                                                className={`text-[10px] px-1 py-0.5 rounded font-medium truncate flex items-center justify-between ${ROOM_COLORS[rt]} ${!isOverride ? 'opacity-70' : 'ring-1 ring-inset ring-current/20'} ${isRoomBlocked ? 'opacity-50 line-through' : ''}`}
                                                                title={isRoomBlocked ? 'Room Blocked' : (isOverride ? 'Custom Price' : 'Default Room Price')}
                                                            >
                                                                <span>{rt.slice(0, 1)}: {isRoomBlocked ? 'Blocked' : (isOverride && displayPrice != null ? `₹${displayPrice}` : (displayPrice != null ? `₹${displayPrice}` : '—'))}</span>
                                                                {!isOverride && !isRoomBlocked && <span className="text-[8px] opacity-40 ml-1">def</span>}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Edit Panel */}
                {selectedDay ? (
                    <div className="bg-white rounded-2xl shadow-sm border w-full lg:w-72 p-5 self-start">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-gray-800">
                                {new Date(selectedDay + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </h4>
                            <button onClick={() => setSelectedDay(null)} className="p-1 text-gray-400 hover:text-gray-600">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="mb-4">
                            <label className="flex items-center gap-2 cursor-pointer p-3 bg-red-50 border border-red-100 rounded-lg select-none">
                                <input
                                    type="checkbox"
                                    checked={editBlocked}
                                    onChange={(e) => setEditBlocked(e.target.checked)}
                                    className="w-4 h-4 text-red-600 rounded focus:ring-red-500 cursor-pointer"
                                />
                                <span className="text-sm font-semibold text-red-700 flex items-center gap-1">
                                    <ShieldBan size={14} /> Block Lodge on this Day
                                </span>
                            </label>
                            {editBlocked && <p className="text-xs text-red-600 mt-1 ml-1">Lodge will not be bookable on this date.</p>}
                        </div>

                        {!editBlocked && (
                            <div className="space-y-3">
                                {ROOM_TYPES.map(rt => {
                                    const isOverridden = !!overrides[selectedDay]?.[rt];
                                    return (
                                        <div key={rt}>
                                            <div className="flex items-center justify-between mb-1">
                                                <label className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROOM_COLORS[rt]}`}>
                                                    {rt}
                                                </label>
                                                {isOverridden && (
                                                    <button
                                                        onClick={() => handleReset(rt)}
                                                        title="Reset to default price"
                                                        className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
                                                    >
                                                        <RotateCcw size={11} /> Reset
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                                    <input
                                                        type="checkbox"
                                                        checked={editRoomBlocks[rt] || false}
                                                        onChange={(e) => setEditRoomBlocks(prev => ({ ...prev, [rt]: e.target.checked }))}
                                                        className="w-3.5 h-3.5 text-red-500 rounded focus:ring-red-500 border-gray-300 cursor-pointer"
                                                    />
                                                    <span className="text-[11px] font-medium text-gray-600">Block</span>
                                                </label>
                                            </div>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                    <IndianRupee size={14} />
                                                </span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    disabled={editRoomBlocks[rt]}
                                                    value={overrides[selectedDay]?.[rt]?.price != null ? editPrices[rt] : (editPrices[rt] === String(basePrices[rt]) ? '' : editPrices[rt])}
                                                    onChange={e => setEditPrices(prev => ({ ...prev, [rt]: e.target.value }))}
                                                    placeholder={basePrices[rt] ? `${basePrices[rt]}` : 'Enter price'}
                                                    className={`w-full pl-8 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                                                        ${isOverridden ? 'border-indigo-300 bg-indigo-50' : ''} ${editRoomBlocks[rt] ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}`}
                                                />
                                            </div>
                                            {isOverridden && !editRoomBlocks[rt] && (
                                                <p className="text-[10px] text-indigo-500 mt-0.5 ml-1">Custom price active</p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Save Prices
                        </button>

                        {Object.keys(basePrices).length > 0 && (
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                                <p className="text-xs font-semibold text-gray-500 mb-2">Default Prices (base)</p>
                                {ROOM_TYPES.filter(rt => basePrices[rt] != null).map(rt => (
                                    <div key={rt} className="flex justify-between text-xs text-gray-600">
                                        <span>{rt}</span>
                                        <span className="font-medium">₹{basePrices[rt]}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border w-full lg:w-72 p-5 self-start flex flex-col items-center justify-center text-center text-gray-400 min-h-[200px]">
                        <CalendarDays size={36} className="mb-3 text-gray-300" />
                        <p className="text-sm font-medium">Click any date</p>
                        <p className="text-xs mt-1">to set custom prices for that day</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PriceCalendar;
