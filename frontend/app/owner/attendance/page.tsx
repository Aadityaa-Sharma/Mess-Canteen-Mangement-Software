'use client';
import { useEffect, useState, useCallback } from 'react';
import API from '@/lib/api';
import { format, getDaysInMonth } from 'date-fns';
import { Check, X, Save, ChevronLeft, ChevronRight, Calendar, Plus, AlertTriangle, History, Sun, Moon } from 'lucide-react';

interface Student {
    id: string;
    name: string;
    mobile: string;
    mealSlot: 'AFTERNOON' | 'NIGHT' | 'BOTH';
    joinedAt: string;
}

interface Holiday {
    id: string;
    date: string;
    name: string;
}

interface AttendanceRecord {
    afternoonStatus: 'PRESENT' | 'ABSENT' | null;
    nightStatus: 'PRESENT' | 'ABSENT' | null;
}

interface HistoryRecord {
    date: string;
    afternoonStatus: 'PRESENT' | 'ABSENT' | null;
    nightStatus: 'PRESENT' | 'ABSENT' | null;
}

export default function AttendancePage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceRecord>>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [showHolidayModal, setShowHolidayModal] = useState(false);
    const [holidayName, setHolidayName] = useState('');
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [missingDates, setMissingDates] = useState<string[]>([]);

    // History modal
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyStudent, setHistoryStudent] = useState<Student | null>(null);
    const [historyData, setHistoryData] = useState<{ attendance: HistoryRecord[]; holidays: { date: string; name: string }[] }>({ attendance: [], holidays: [] });

    const isHoliday = holidays.some(h => h.date === selectedDate);

    // Fetch students eligible for selected date (joined on or before)
    const fetchStudents = useCallback(async () => {
        try {
            const { data } = await API.get(`/attendance/students?date=${selectedDate}`);
            setStudents(data);
        } catch (error) {
            console.error(error);
        }
    }, [selectedDate]);

    const fetchHolidays = useCallback(async () => {
        try {
            const date = new Date(selectedDate);
            const { data } = await API.get(`/holidays?year=${date.getFullYear()}&month=${date.getMonth() + 1}`);
            setHolidays(data);
        } catch {
            console.log('Could not fetch holidays');
        }
    }, [selectedDate]);

    const fetchAttendance = useCallback(async () => {
        if (students.length === 0) return;
        setLoading(true);
        try {
            const { data } = await API.get(`/attendance?date=${selectedDate}`);
            const map: Record<string, AttendanceRecord> = {};

            // Initialize all students with defaults based on their slot
            students.forEach(s => {
                map[s.id] = {
                    afternoonStatus: (s.mealSlot === 'AFTERNOON' || s.mealSlot === 'BOTH') ? 'PRESENT' : null,
                    nightStatus: (s.mealSlot === 'NIGHT' || s.mealSlot === 'BOTH') ? 'PRESENT' : null
                };
            });

            // Override with existing records
            data.forEach((r: { studentId: { id: string } | string; afternoonStatus: string; nightStatus: string }) => {
                const studentId = typeof r.studentId === 'object' ? r.studentId.id : r.studentId;
                if (map[studentId]) {
                    map[studentId] = {
                        afternoonStatus: r.afternoonStatus as 'PRESENT' | 'ABSENT' | null,
                        nightStatus: r.nightStatus as 'PRESENT' | 'ABSENT' | null
                    };
                }
            });

            setAttendanceMap(map);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [selectedDate, students]);

    const fetchMissingDates = useCallback(async () => {
        try {
            const { data } = await API.get('/attendance/missing');
            setMissingDates(data.missingDates || []);
        } catch {
            console.log('Could not fetch missing dates');
        }
    }, []);

    useEffect(() => {
        fetchStudents();
        fetchHolidays();
        fetchMissingDates();
    }, [fetchStudents, fetchHolidays, fetchMissingDates]);

    useEffect(() => {
        if (students.length > 0) {
            fetchAttendance();
        }
    }, [students, fetchAttendance]);

    const toggleStatus = (studentId: string, slot: 'afternoon' | 'night') => {
        if (isHoliday) return;
        setAttendanceMap(prev => {
            const current = prev[studentId];
            if (!current) return prev;

            if (slot === 'afternoon' && current.afternoonStatus !== null) {
                return {
                    ...prev,
                    [studentId]: {
                        ...current,
                        afternoonStatus: current.afternoonStatus === 'PRESENT' ? 'ABSENT' : 'PRESENT'
                    }
                };
            } else if (slot === 'night' && current.nightStatus !== null) {
                return {
                    ...prev,
                    [studentId]: {
                        ...current,
                        nightStatus: current.nightStatus === 'PRESENT' ? 'ABSENT' : 'PRESENT'
                    }
                };
            }
            return prev;
        });
    };

    const saveAttendance = async () => {
        if (isHoliday) return;
        setSaving(true);
        setSaveMessage(null);
        try {
            const attendanceData = Object.entries(attendanceMap).map(([studentId, record]) => ({
                studentId,
                afternoonStatus: record.afternoonStatus,
                nightStatus: record.nightStatus
            }));
            await API.post('/attendance', { date: selectedDate, attendanceData });
            setSaveMessage({ type: 'success', text: `✅ Attendance saved for ${format(new Date(selectedDate), 'MMM d, yyyy')}` });
            fetchMissingDates();
            setTimeout(() => setSaveMessage(null), 3000);
        } catch (error) {
            console.error('Failed to save');
            setSaveMessage({ type: 'error', text: '❌ Failed to save attendance' });
        } finally {
            setSaving(false);
        }
    };

    const addHoliday = async () => {
        if (!holidayName.trim()) return;
        try {
            await API.post('/holidays', { date: selectedDate, name: holidayName });
            setHolidayName('');
            setShowHolidayModal(false);
            fetchHolidays();
            fetchMissingDates();
            setSaveMessage({ type: 'success', text: `🎉 Holiday "${holidayName}" added` });
            setTimeout(() => setSaveMessage(null), 3000);
        } catch {
            setSaveMessage({ type: 'error', text: '❌ Failed to add holiday' });
        }
    };

    const removeHoliday = async (id: string) => {
        if (!confirm('Remove this holiday?')) return;
        try {
            await API.delete(`/holidays/${id}`);
            fetchHolidays();
            fetchMissingDates();
        } catch {
            setSaveMessage({ type: 'error', text: '❌ Failed to remove holiday' });
        }
    };

    const changeDate = (days: number) => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + days);
        setSelectedDate(format(date, 'yyyy-MM-dd'));
    };

    const openHistory = async (student: Student) => {
        setHistoryStudent(student);
        setShowHistoryModal(true);
        try {
            const date = new Date(selectedDate);
            const { data } = await API.get(`/attendance/history?studentId=${student.id}&year=${date.getFullYear()}&month=${date.getMonth() + 1}`);
            setHistoryData(data);
        } catch {
            setHistoryData({ attendance: [], holidays: [] });
        }
    };

    // Counts
    const afternoonPresent = Object.values(attendanceMap).filter(r => r.afternoonStatus === 'PRESENT').length;
    const afternoonAbsent = Object.values(attendanceMap).filter(r => r.afternoonStatus === 'ABSENT').length;
    const nightPresent = Object.values(attendanceMap).filter(r => r.nightStatus === 'PRESENT').length;
    const nightAbsent = Object.values(attendanceMap).filter(r => r.nightStatus === 'ABSENT').length;
    const daysInMonth = getDaysInMonth(new Date(selectedDate));
    const currentDay = new Date(selectedDate).getDate();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-[#0A0A0A]">Attendance</h1>
                    <p className="text-neutral-500 text-sm mt-1">
                        Day {currentDay} of {daysInMonth} • {students.length} students eligible
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowHolidayModal(true)} className="btn-secondary flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Mark Holiday
                    </button>
                    <button onClick={saveAttendance} disabled={saving || isHoliday} className="btn-primary flex items-center gap-2">
                        {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> Save</>}
                    </button>
                </div>
            </div>

            {/* Missing Attendance Alert */}
            {missingDates.length > 0 && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-red-800">Missing Attendance!</p>
                        <p className="text-sm text-red-600 mt-1">
                            {missingDates.length} day(s) without attendance this month: {missingDates.slice(0, 5).map(d => format(new Date(d), 'MMM d')).join(', ')}
                            {missingDates.length > 5 && ` and ${missingDates.length - 5} more...`}
                        </p>
                    </div>
                </div>
            )}

            {/* Date Navigator */}
            <div className="flex items-center gap-4">
                <button onClick={() => changeDate(-1)} className="p-2 rounded-lg border border-neutral-200 hover:border-[#0A0A0A] transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <input type="date" className="input-field max-w-[180px] text-center" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                <button onClick={() => changeDate(1)} className="p-2 rounded-lg border border-neutral-200 hover:border-[#0A0A0A] transition-colors">
                    <ChevronRight className="w-5 h-5" />
                </button>

                <div className="ml-auto flex items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm">
                            <Sun className="w-4 h-4 text-orange-500" />
                            <span className="font-semibold text-green-600">{afternoonPresent}</span>
                            <span className="text-neutral-400">/</span>
                            <span className="font-semibold text-red-500">{afternoonAbsent}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Moon className="w-4 h-4 text-indigo-500" />
                            <span className="font-semibold text-green-600">{nightPresent}</span>
                            <span className="text-neutral-400">/</span>
                            <span className="font-semibold text-red-500">{nightAbsent}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Holiday Banner */}
            {isHoliday && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-amber-600" />
                        <div>
                            <p className="font-semibold text-amber-800">{holidays.find(h => h.date === selectedDate)?.name || 'Holiday'}</p>
                            <p className="text-xs text-amber-600">Attendance marking disabled</p>
                        </div>
                    </div>
                    <button onClick={() => { const h = holidays.find(h => h.date === selectedDate); if (h) removeHoliday(h.id); }} className="text-xs font-semibold text-amber-700 hover:text-amber-900">
                        Remove Holiday
                    </button>
                </div>
            )}

            {/* Quick Actions */}
            {!isHoliday && (
                <div className="flex gap-2 flex-wrap">
                    <button onClick={() => {
                        const newMap = { ...attendanceMap };
                        students.forEach(s => {
                            if (newMap[s.id]) {
                                if (s.mealSlot === 'AFTERNOON' || s.mealSlot === 'BOTH') newMap[s.id].afternoonStatus = 'PRESENT';
                                if (s.mealSlot === 'NIGHT' || s.mealSlot === 'BOTH') newMap[s.id].nightStatus = 'PRESENT';
                            }
                        });
                        setAttendanceMap(newMap);
                    }} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-neutral-200 hover:border-green-500 hover:text-green-600 transition-colors">
                        All Present
                    </button>
                    <button onClick={() => {
                        const newMap = { ...attendanceMap };
                        students.forEach(s => {
                            if (newMap[s.id]) {
                                if (s.mealSlot === 'AFTERNOON' || s.mealSlot === 'BOTH') newMap[s.id].afternoonStatus = 'ABSENT';
                                if (s.mealSlot === 'NIGHT' || s.mealSlot === 'BOTH') newMap[s.id].nightStatus = 'ABSENT';
                            }
                        });
                        setAttendanceMap(newMap);
                    }} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-neutral-200 hover:border-red-500 hover:text-red-500 transition-colors">
                        All Absent
                    </button>
                </div>
            )}

            {/* Students Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="w-6 h-6 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {students.map(student => {
                        const record = attendanceMap[student.id] || { afternoonStatus: null, nightStatus: null };
                        const showAfternoon = student.mealSlot === 'AFTERNOON' || student.mealSlot === 'BOTH';
                        const showNight = student.mealSlot === 'NIGHT' || student.mealSlot === 'BOTH';

                        return (
                            <div key={student.id} className={`p-4 rounded-xl border-2 transition-all ${isHoliday ? 'border-neutral-100 bg-neutral-50 opacity-50' : 'border-neutral-200 bg-white hover:border-neutral-300'}`}>
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="font-semibold text-[#0A0A0A]">{student.name}</p>
                                        <p className="text-xs text-neutral-500">{student.mobile}</p>
                                    </div>
                                    <button onClick={() => openHistory(student)} className="text-neutral-400 hover:text-[#0A0A0A] transition-colors" title="View History">
                                        <History className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex gap-2">
                                    {showAfternoon && (
                                        <button
                                            onClick={() => toggleStatus(student.id, 'afternoon')}
                                            disabled={isHoliday}
                                            className={`flex-1 p-3 rounded-lg flex items-center justify-center gap-2 transition-all ${record.afternoonStatus === 'PRESENT'
                                                ? 'bg-orange-100 border-2 border-orange-300 text-orange-700'
                                                : 'bg-neutral-100 border-2 border-neutral-200 text-neutral-500'
                                                }`}
                                        >
                                            <Sun className="w-4 h-4" />
                                            {record.afternoonStatus === 'PRESENT' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                        </button>
                                    )}
                                    {showNight && (
                                        <button
                                            onClick={() => toggleStatus(student.id, 'night')}
                                            disabled={isHoliday}
                                            className={`flex-1 p-3 rounded-lg flex items-center justify-center gap-2 transition-all ${record.nightStatus === 'PRESENT'
                                                ? 'bg-indigo-100 border-2 border-indigo-300 text-indigo-700'
                                                : 'bg-neutral-100 border-2 border-neutral-200 text-neutral-500'
                                                }`}
                                        >
                                            <Moon className="w-4 h-4" />
                                            {record.nightStatus === 'PRESENT' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {students.length === 0 && !loading && (
                <div className="text-center py-16 text-neutral-500">No students joined on or before this date.</div>
            )}

            {/* Holiday Modal */}
            {showHolidayModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm">
                        <h2 className="text-xl font-bold mb-4">Mark as Holiday</h2>
                        <p className="text-sm text-neutral-500 mb-4">{format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}</p>
                        <input placeholder="Holiday name" className="input-field mb-4" value={holidayName} onChange={e => setHolidayName(e.target.value)} />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowHolidayModal(false)} className="btn-secondary">Cancel</button>
                            <button onClick={addHoliday} className="btn-primary"><Plus className="w-4 h-4 mr-1" /> Add</button>
                        </div>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {showHistoryModal && historyStudent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-xl font-bold">{historyStudent.name}</h2>
                                <p className="text-sm text-neutral-500">Attendance History - {format(new Date(selectedDate), 'MMMM yyyy')}</p>
                            </div>
                            <button onClick={() => setShowHistoryModal(false)} className="text-neutral-400 hover:text-neutral-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-2">
                            {Array.from({ length: getDaysInMonth(new Date(selectedDate)) }, (_, i) => {
                                // Construct YYYY-MM-DD string directly
                                const [selYear, selMonth] = selectedDate.split('-').map(Number);
                                const currentDay = i + 1;
                                const dateStr = `${selYear}-${String(selMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;

                                // Create date object ONLY for display purposes (day of week)
                                const displayDate = new Date(selYear, selMonth - 1, currentDay);

                                const holiday = historyData.holidays.find(h => h.date === dateStr);
                                const att = historyData.attendance.find(a => a.date === dateStr);

                                // Simple string comparison for joined date
                                let isJoinedAfter = false;
                                if (historyStudent.joinedAt) {
                                    const joinedStr = historyStudent.joinedAt.includes('T')
                                        ? historyStudent.joinedAt.split('T')[0]
                                        : historyStudent.joinedAt;
                                    isJoinedAfter = dateStr < joinedStr;
                                }

                                const todayStr = format(new Date(), 'yyyy-MM-dd');
                                const isFuture = dateStr > todayStr;

                                return (
                                    <div key={i} className={`p-3 rounded-lg flex items-center justify-between ${holiday ? 'bg-amber-50' : isJoinedAfter ? 'bg-neutral-50' : isFuture ? 'bg-neutral-50' : 'bg-white border border-neutral-200'}`}>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-medium w-16">{format(displayDate, 'MMM d')}</span>
                                            <span className="text-xs text-neutral-500">{format(displayDate, 'EEE')}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {holiday ? (
                                                <span className="text-xs font-medium text-amber-600">🎉 {holiday.name}</span>
                                            ) : isJoinedAfter ? (
                                                <span className="text-xs text-neutral-400">Not enrolled</span>
                                            ) : isFuture ? (
                                                <span className="text-xs text-neutral-400">Upcoming</span>
                                            ) : (
                                                <>
                                                    {(historyStudent.mealSlot === 'AFTERNOON' || historyStudent.mealSlot === 'BOTH') && (
                                                        <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${att?.afternoonStatus === 'PRESENT' ? 'bg-green-100 text-green-700' : att?.afternoonStatus === 'ABSENT' ? 'bg-red-100 text-red-600' : 'bg-neutral-100 text-neutral-400'}`}>
                                                            <Sun className="w-3 h-3" />
                                                            {att?.afternoonStatus === 'PRESENT' ? '✓' : att?.afternoonStatus === 'ABSENT' ? '✗' : '-'}
                                                        </span>
                                                    )}
                                                    {(historyStudent.mealSlot === 'NIGHT' || historyStudent.mealSlot === 'BOTH') && (
                                                        <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${att?.nightStatus === 'PRESENT' ? 'bg-green-100 text-green-700' : att?.nightStatus === 'ABSENT' ? 'bg-red-100 text-red-600' : 'bg-neutral-100 text-neutral-400'}`}>
                                                            <Moon className="w-3 h-3" />
                                                            {att?.nightStatus === 'PRESENT' ? '✓' : att?.nightStatus === 'ABSENT' ? '✗' : '-'}
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Save Status Message */}
            {saveMessage && (
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-lg ${saveMessage.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
                    <p className="font-medium text-sm">{saveMessage.text}</p>
                </div>
            )}
        </div>
    );
}
