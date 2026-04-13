import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Printer, Loader2, Mail, Phone, MapPin, User, X, Pencil } from 'lucide-react';
import { toast } from 'react-toastify';
import type { Address } from '../../types';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const AddressManager: React.FC = () => {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [formData, setFormData] = useState<Partial<Address>>({ name: '', email: '', addressLine: '', phone: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadAddresses();
    }, []);

    const loadAddresses = async () => {
        setIsLoading(true);
        try {
            const data = await api.addresses.list();
            const formattedData: Address[] = data.map((item: any) => ({
                id: item._id,
                name: item.name,
                email: item.email,
                phone: item.phone_number,
                addressLine: item.address
            }));
            setAddresses(formattedData);
        } catch (err) {
            console.error("Failed to load addresses", err);
            toast.error('Failed to load addresses');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (address?: Address) => {
        if (address) {
            setEditingAddress(address);
            setFormData(address);
        } else {
            setEditingAddress(null);
            setFormData({ name: '', email: '', addressLine: '', phone: '' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingAddress(null);
        setFormData({ name: '', email: '', addressLine: '', phone: '' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const payload = {
                name: formData.name!,
                email: formData.email,
                phone_number: formData.phone!,
                address: formData.addressLine!
            };

            if (editingAddress) {
                const updated = await api.addresses.update(editingAddress.id, payload);
                const formatted: Address = {
                    id: updated._id,
                    name: updated.name,
                    email: updated.email,
                    phone: updated.phone_number,
                    addressLine: updated.address
                };
                setAddresses(prev => prev.map(a => a.id === formatted.id ? formatted : a));
                toast.success('Address updated successfully');
            } else {
                const created = await api.addresses.create(payload);
                const formatted: Address = {
                    id: created._id,
                    name: created.name,
                    email: created.email,
                    phone: created.phone_number,
                    addressLine: created.address
                };
                setAddresses(prev => [formatted, ...prev]);
                toast.success('Address created successfully');
            }
            handleCloseModal();
        } catch (err) {
            console.error("Failed to save address", err);
            toast.error('Failed to save address');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this address?')) {
            try {
                await api.addresses.delete(id);
                setAddresses(prev => prev.filter((a) => a.id !== id));
                toast.success('Address deleted successfully');
            } catch (err) {
                console.error("Failed to delete address", err);
                toast.error('Failed to delete address');
            }
        }
    };

    const handleGenerateLabel = (address: Address) => {
        navigate('/work-orders/new', { state: { prefillAddress: address } });
    };

    const filteredAddresses = addresses.filter((a) =>
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.addressLine.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.email && a.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (a.phone && a.phone.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Address Manager</h1>
                    <p className="text-gray-500">Manage customer addresses</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Add Address
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search addresses..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-medium">
                            <tr>
                                <th className="px-6 py-3">Customer Details</th>
                                <th className="px-6 py-3">Contact Info</th>
                                <th className="px-6 py-3">Address</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                                            <p className="text-gray-500 font-medium">Loading addresses...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredAddresses.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        {searchTerm ? 'No addresses match your search.' : 'No addresses saved yet. Add one to get started.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredAddresses.map((address) => (
                                    <tr key={address.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-900">{address.name}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                {address.email && (
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <Mail className="w-3.5 h-3.5" />
                                                        <span className="truncate max-w-[180px]">{address.email}</span>
                                                    </div>
                                                )}
                                                {address.phone && (
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <Phone className="w-3.5 h-3.5" />
                                                        <span>{address.phone}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-start gap-2 text-gray-600 max-w-xs">
                                                <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                                <span className="line-clamp-2">{address.addressLine}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleGenerateLabel(address)}
                                                    className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                    title="Create Work Order"
                                                >
                                                    <Printer className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenModal(address)}
                                                    className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                    title="Edit Address"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(address.id)}
                                                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete Address"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-gray-200">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                {editingAddress ? <Pencil className="w-5 h-5 text-primary-600" /> : <Plus className="w-5 h-5 text-primary-600" />}
                                {editingAddress ? 'Edit Address' : 'Add New Address'}
                            </h3>
                            <button
                                onClick={handleCloseModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <User className="w-4 h-4 text-gray-400" /> Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                        value={formData.name || ''}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Customer name"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-gray-400" /> Phone
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                        value={formData.phone || ''}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+1 (555) 000-0000"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-400" /> Email (Optional)
                                </label>
                                <input
                                    type="email"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    value={formData.email || ''}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="email@example.com"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-gray-400" /> Full Address
                                </label>
                                <textarea
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none h-28 resize-none transition-all"
                                    value={formData.addressLine || ''}
                                    onChange={(e) => setFormData({ ...formData, addressLine: e.target.value })}
                                    placeholder="Full street address, city, state, ZIP"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-6 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-2 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition-all shadow-sm flex items-center gap-2 disabled:opacity-70"
                                >
                                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editingAddress ? 'Save Changes' : 'Create Address'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddressManager;
