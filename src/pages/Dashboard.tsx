import React, { useState, useEffect } from 'react';
import { Package, Truck, FileText, Plus, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { WorkOrder } from '../types';

const Dashboard: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        totalOrders: 0,
        totalProducts: 0,
        totalAddresses: 0,
        recentOrders: [] as WorkOrder[]
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [history, products] = await Promise.all([
                    api.history.list(),
                    api.products.list()
                ]);

                // We don't have a direct address list API in the current snippet but we can count from history or leave at 0
                // For now let's focus on integrating the history API properly
                const formattedHistory: WorkOrder[] = history.map((item: any) => ({
                    id: item._id,
                    customerName: item.customerName,
                    customerPhone: item.customerPhone,
                    customerAddress: item.customerAddress,
                    lines: item.lines || [],
                    createdAt: item.createdAt,
                    status: item.status
                }));

                setStats({
                    totalOrders: formattedHistory.length,
                    totalProducts: products.length,
                    totalAddresses: 0, // Need address API if desired
                    recentOrders: formattedHistory.slice(0, 5)
                });
            } catch (err) {
                console.error("Failed to fetch dashboard data", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500">Welcome to your label generation command center</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative">
                        <p className="text-sm font-medium text-gray-500">Total Work Orders</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.totalOrders}</h3>
                    </div>
                    <div className="relative bg-blue-100 p-2 rounded-lg">
                        <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative">
                        <p className="text-sm font-medium text-gray-500">Active Products</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.totalProducts}</h3>
                    </div>
                    <div className="relative bg-purple-100 p-2 rounded-lg">
                        <Package className="w-6 h-6 text-purple-600" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-green-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative">
                        <p className="text-sm font-medium text-gray-500">Saved Addresses</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.totalAddresses}</h3>
                    </div>
                    <div className="relative bg-green-100 p-2 rounded-lg">
                        <Truck className="w-6 h-6 text-green-600" />
                    </div>
                </div>
            </div>

            {/* Quick Actions & Recent Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900">Recent Work Orders</h3>
                        <Link to="/work-orders" className="text-sm text-primary-600 hover:text-primary-700 font-medium">View All</Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Customer</th>
                                    <th className="px-6 py-3 font-medium">Products</th>
                                    <th className="px-6 py-3 font-medium">Labels</th>
                                    <th className="px-6 py-3 font-medium text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                                                <p className="text-gray-500 font-medium">Loading history...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : stats.recentOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                            No recent orders.
                                        </td>
                                    </tr>
                                ) : (
                                    stats.recentOrders.map((order) => {
                                        const lines = order.lines || [];
                                        const totalLabels = lines.reduce((acc, line) => acc + (line.labelPrint || 0), 0);
                                        const productDisplay = lines.length > 1 
                                            ? `${lines[0]?.productName || 'Unknown'} and ${lines.length - 1} more`
                                            : lines[0]?.productName || 'No products';

                                        return (
                                            <tr key={order.id} className="hover:bg-gray-50 group">
                                                <td className="px-6 py-4 font-medium text-gray-900">{order.customerName}</td>
                                                <td className="px-6 py-4 text-gray-500">{productDisplay}</td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                        {totalLabels}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Link 
                                                        to={`/work-orders/${order.id}`}
                                                        className="text-primary-600 hover:text-primary-700 font-medium text-xs flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        View
                                                        <ArrowRight className="w-3 h-3" />
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

                <div className="lg:col-span-1 space-y-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>

                    <Link to="/work-orders/new" className="block p-4 bg-white border border-gray-200 rounded-xl hover:border-primary-500 hover:shadow-md transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                                <Plus className="w-6 h-6 text-primary-600" />
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">Create New Order</h4>
                                <p className="text-sm text-gray-500">Generate labels instantly</p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-300 ml-auto group-hover:text-primary-600 transition-colors" />
                        </div>
                    </Link>

                    <Link to="/products" className="block p-4 bg-white border border-gray-200 rounded-xl hover:border-purple-500 hover:shadow-md transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                                <Package className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">Manage Products</h4>
                                <p className="text-sm text-gray-500">Add or edit inventory</p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-300 ml-auto group-hover:text-purple-600 transition-colors" />
                        </div>
                    </Link>

                    <Link to="/addresses" className="block p-4 bg-white border border-gray-200 rounded-xl hover:border-green-500 hover:shadow-md transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition-colors">
                                <Truck className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">Address Book</h4>
                                <p className="text-sm text-gray-500">Manage customer list</p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-300 ml-auto group-hover:text-green-600 transition-colors" />
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
