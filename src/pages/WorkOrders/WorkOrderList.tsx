import React, { useState, useEffect } from 'react';
import { Plus, Search, ArrowRight, Loader2 } from 'lucide-react';
import type { WorkOrder } from '../../types';
import { api } from '../../services/api';
import { Link } from 'react-router-dom';

const WorkOrderList: React.FC = () => {
    const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                console.log("Fetching work order history...");
                const data = await api.history.list();
                console.log("Received history data:", data);
                
                // Map API data to WorkOrder type if needed
                const formattedData: WorkOrder[] = data.map((item: any) => {
                    // Log individual item if it's missing lines to debug
                    if (!item.lines || item.lines.length === 0) {
                        console.warn("History item missing lines:", item);
                    }
                    return {
                        id: item._id,
                        customerName: item.customerName || 'No Name',
                        customerEmail: item.customerEmail,
                        customerPhone: item.customerPhone || 'No Phone',
                        customerAddress: item.customerAddress || 'No Address',
                        lines: item.lines || [],
                        createdAt: item.createdAt,
                        status: item.status || 'completed'
                    };
                });
                
                console.log("Formatted history data:", formattedData);
                setWorkOrders(formattedData);
            } catch (err) {
                console.error("Failed to fetch history in component:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, []);

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
                                <th className="px-6 py-3 font-medium">Date</th>
                                <th className="px-6 py-3 font-medium">Customer</th>
                                <th className="px-6 py-3 font-medium">Products</th>
                                <th className="px-6 py-3 font-medium">Total Labels</th>
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
                                filteredOrders.map((order) => {
                                    const lines = order.lines || [];
                                    const totalLabels = lines.reduce((acc, line) => acc + (line.labelPrint || 0), 0);
                                    const productDisplay = lines.length > 1 
                                        ? `${lines[0]?.productName || 'Unknown'} and ${lines.length - 1} more`
                                        : lines[0]?.productName || 'No products';

                                    return (
                                        <tr key={order.id} className="hover:bg-gray-50 group">
                                            <td className="px-6 py-4 text-gray-500">
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{order.customerName}</div>
                                                <div className="text-xs text-gray-400">{order.customerPhone}</div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">{productDisplay}</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {totalLabels} Labels
                                                </span>
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
