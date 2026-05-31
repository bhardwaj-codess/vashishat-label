import React, { useState } from 'react';
import { Plus, Search, Loader2, ArrowRight } from 'lucide-react';
import type { WorkOrder } from '../../types';
import { Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';

const WorkOrderList: React.FC = () => {
    const { history, isLoadingHistory: isLoading } = useData();
    const [searchTerm, setSearchTerm] = useState('');

    const workOrders: WorkOrder[] = history.map((item: any) => ({
        id: item._id,
        customerName: item.customerName || 'No Name',
        customerPhone: item.customerPhone || 'No Phone',
        customerAddress: item.customerAddress || 'No Address',
        clientCode: item.clientCode || '-',
        workOrderDate: item.woReceiveDate || item.createdAt,
        lines: item.lines || [],
        createdAt: item.createdAt,
        status: item.status || 'completed'
    }));

    const filteredOrders = workOrders
        .filter((order) =>
            order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.lines && order.lines.some(line => line.productName.toLowerCase().includes(searchTerm.toLowerCase())))
        )
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Work Orders</h1>
                    <p className="text-gray-500">Manage order history and generate labels</p>
                </div>
                <Link
                    to="/work-orders/new"
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Order
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500">
                            <tr>
                                <th className="px-6 py-3 font-medium">S. No.</th>
                                <th className="px-6 py-3 font-medium">Work Order Date</th>
                                <th className="px-6 py-3 font-medium">Client Code</th>
                                <th className="px-6 py-3 font-medium">Client Name</th>
                                <th className="px-6 py-3 font-medium">Address</th>
                                <th className="px-6 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                                            <p className="text-gray-500 font-medium">Loading history...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        No work orders found. Create one to get started.
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order, index) => {
                                    return (
                                        <tr key={order.id} className="hover:bg-gray-50 group">
                                            <td className="px-6 py-4 text-gray-500">
                                                {index + 1}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">
                                                {new Date((order as any).workOrderDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {(order as any).clientCode}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Link
                                                    to={`/work-orders/${order.id}`}
                                                    className="font-medium text-primary-600 hover:text-primary-800"
                                                >
                                                    {order.customerName}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 max-w-xs truncate" title={order.customerAddress}>
                                                {order.customerAddress}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link
                                                    to={`/work-orders/${order.id}`}
                                                    className="inline-flex items-center gap-1 text-primary-600 font-medium hover:text-primary-700"
                                                >
                                                    View
                                                    <ArrowRight className="w-4 h-4" />
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default WorkOrderList;
