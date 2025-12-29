'use client';
import { useEffect, useState } from 'react';
import API from '@/lib/api';
import { Plus, Trash2, Edit2, Calendar, Utensils, Sun, Moon } from 'lucide-react';
import { format } from 'date-fns';

interface Student {
    id: number;
    name: string;
    mobile: string;
    monthly_fee: string;
    status: string;
    meals_per_day: number;
    meal_slot: 'AFTERNOON' | 'NIGHT' | 'BOTH';
    joinedAt: string; // Backend sends camelCase
}

// Meal slot options with details
const MEAL_SLOTS = {
    'BOTH': { label: 'Both Meals', fee: 2700, freeHolidays: 2, desc: 'Afternoon + Night' },
    'NIGHT': { label: 'Night Only', fee: 1400, freeHolidays: 2, desc: 'Dinner only' },
    'AFTERNOON': { label: 'Afternoon Only', fee: 1400, freeHolidays: 0, desc: 'Lunch only' }
};

export default function StudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        password: 'password123',
        meal_slot: 'BOTH' as 'AFTERNOON' | 'NIGHT' | 'BOTH',
        joined_at: format(new Date(), 'yyyy-MM-dd')
    });

    const [editingId, setEditingId] = useState<number | null>(null);

    const fetchStudents = async () => {
        try {
            const { data } = await API.get('/students');
            setStudents(data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    const handleSaveStudent = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate all mandatory fields
        if (!formData.name.trim()) {
            alert('Please enter student name');
            return;
        }
        if (!formData.mobile || formData.mobile.length !== 10) {
            alert('Please enter a valid 10-digit mobile number');
            return;
        }
        if (!editingId && !formData.password) {
            alert('Please enter a password');
            return;
        }
        if (!formData.joined_at) {
            alert('Please select join date');
            return;
        }

        try {
            const apiPayload = {
                name: formData.name,
                mobile: formData.mobile,
                meal_slot: formData.meal_slot,
                joined_at: formData.joined_at,
                ...(editingId && !formData.password ? {} : { password: formData.password })
            };

            if (editingId) {
                await API.put(`/students/${editingId}`, apiPayload);
            } else {
                await API.post('/students', apiPayload);
            }
            fetchStudents();
            closeModal();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            alert(err?.response?.data?.message || 'Failed to save student');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to remove this student?')) return;
        try {
            await API.delete(`/students/${id}`);
            fetchStudents();
        } catch {
            alert('Failed to remove student');
        }
    };

    const openEditModal = (student: Student) => {
        setEditingId(student.id);

        // Backend now returns simple YYYY-MM-DD string
        // Only default to today if it's a NEW student (no ID), otherwise respect existing value
        const joinedAtStr = student.joinedAt || (student.id ? '' : format(new Date(), 'yyyy-MM-dd'));

        // Ensure it's not a full ISO string (just in case of legacy data)
        const displayDate = joinedAtStr && joinedAtStr.includes('T') ? joinedAtStr.split('T')[0] : joinedAtStr;

        setFormData({
            name: student.name,
            mobile: student.mobile,
            password: '',
            meal_slot: student.meal_slot || 'BOTH',
            joined_at: displayDate
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setFormData({
            name: '',
            mobile: '',
            password: 'password123',
            meal_slot: 'BOTH',
            joined_at: format(new Date(), 'yyyy-MM-dd')
        });
    };

    const getSlotIcon = (slot: string) => {
        if (slot === 'AFTERNOON') return <Sun className="w-4 h-4 text-orange-500" />;
        if (slot === 'NIGHT') return <Moon className="w-4 h-4 text-indigo-500" />;
        return <Utensils className="w-4 h-4 text-green-600" />;
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-[#0A0A0A]">Students</h1>
                    <p className="text-neutral-500 text-sm mt-1">Manage mess subscribers ({students.length} active)</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add Student
                </button>
            </div>

            {/* Student Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {students.map((student) => {
                    const slot = student.meal_slot || 'BOTH';
                    const slotInfo = MEAL_SLOTS[slot];

                    return (
                        <div key={student.id} className="card hover:border-neutral-300 transition-colors">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <p className="font-bold text-[#0A0A0A]">{student.name}</p>
                                    <p className="text-sm text-neutral-500">{student.mobile}</p>
                                </div>
                                <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${student.status === 'ACTIVE'
                                    ? 'bg-[#C8FF00]/20 text-[#0A0A0A]'
                                    : 'bg-red-50 text-red-600'
                                    }`}>
                                    {student.status}
                                </span>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-neutral-500">Meal Plan</span>
                                    <span className="font-medium flex items-center gap-2">
                                        {getSlotIcon(slot)}
                                        {slotInfo.label}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-neutral-500">Monthly Fee</span>
                                    <span className="font-bold text-[#0A0A0A]">₹{slotInfo.fee}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-neutral-500">Free Holidays</span>
                                    <span className="font-medium text-green-600">{slotInfo.freeHolidays}/month</span>
                                </div>
                                {student.joinedAt && (
                                    <div className="flex justify-between">
                                        <span className="text-neutral-500">Joined</span>
                                        <span className="font-medium">
                                            {student.joinedAt ? format(new Date(student.joinedAt), 'd MMM yyyy') : 'N/A'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2 mt-4 pt-4 border-t border-neutral-100">
                                <button onClick={() => openEditModal(student)} className="flex-1 text-xs font-semibold py-2 rounded-lg border border-neutral-200 hover:border-[#0A0A0A] transition-colors flex items-center justify-center gap-1">
                                    <Edit2 className="w-3 h-3" /> Edit
                                </button>
                                <button onClick={() => handleDelete(student.id)} className="text-xs font-semibold px-3 py-2 rounded-lg border border-neutral-200 hover:border-red-500 hover:text-red-500 transition-colors">
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {students.length === 0 && (
                <div className="text-center py-16 text-neutral-500">No students added yet.</div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-6">{editingId ? 'Edit Student' : 'Add New Student'}</h2>
                        <form onSubmit={handleSaveStudent} className="space-y-5">
                            {/* Name */}
                            <div>
                                <label className="text-xs font-semibold text-neutral-500 mb-2 block">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    placeholder="Enter student's full name"
                                    className="input-field"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Mobile */}
                            <div>
                                <label className="text-xs font-semibold text-neutral-500 mb-2 block">
                                    Mobile Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    placeholder="10-digit mobile number"
                                    className="input-field"
                                    value={formData.mobile}
                                    onChange={e => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                    maxLength={10}
                                    required
                                />
                            </div>

                            {/* Meal Slot Selection */}
                            <div>
                                <label className="text-xs font-semibold text-neutral-500 mb-3 block">
                                    Meal Plan <span className="text-red-500">*</span>
                                </label>
                                <div className="space-y-3">
                                    {(['BOTH', 'NIGHT', 'AFTERNOON'] as const).map((slot) => {
                                        const info = MEAL_SLOTS[slot];
                                        const isSelected = formData.meal_slot === slot;

                                        return (
                                            <button
                                                key={slot}
                                                type="button"
                                                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${isSelected
                                                    ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                                                    : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'
                                                    }`}
                                                onClick={() => setFormData({ ...formData, meal_slot: slot })}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-white/20' : 'bg-neutral-100'}`}>
                                                            {slot === 'AFTERNOON' && <Sun className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-orange-500'}`} />}
                                                            {slot === 'NIGHT' && <Moon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-indigo-500'}`} />}
                                                            {slot === 'BOTH' && <Utensils className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-green-600'}`} />}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold">{info.label}</p>
                                                            <p className={`text-xs ${isSelected ? 'text-white/70' : 'text-neutral-500'}`}>{info.desc}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-lg">₹{info.fee}</p>
                                                        <p className={`text-xs ${isSelected ? 'text-[#C8FF00]' : 'text-green-600'}`}>
                                                            {info.freeHolidays} free {info.freeHolidays === 1 ? 'holiday' : 'holidays'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Join Date */}
                            <div>
                                <label className="text-xs font-semibold text-neutral-500 mb-2 block">
                                    Joined On <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    className="input-field"
                                    value={formData.joined_at}
                                    onChange={e => setFormData({ ...formData, joined_at: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label className="text-xs font-semibold text-neutral-500 mb-2 block">
                                    Password {!editingId && <span className="text-red-500">*</span>}
                                </label>
                                <input
                                    placeholder={editingId ? "Leave blank to keep current" : "Login password"}
                                    className="input-field"
                                    type="password"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    {...(!editingId && { required: true })}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">{editingId ? 'Update' : 'Add'} Student</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
