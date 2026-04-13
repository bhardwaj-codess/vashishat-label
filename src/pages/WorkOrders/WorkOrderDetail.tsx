import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Calendar, User, Phone, MapPin, Package, Download, Loader2, Mail } from 'lucide-react';
import { api } from '../../services/api';
import type { WorkOrder } from '../../types';

const WorkOrderDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [order, setOrder] = useState<WorkOrder | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            if (id) {
                try {
                    const history = await api.history.list();
                    const found = history.find((h: any) => h._id === id);
                    if (found) {
                        setOrder({
                            id: found._id,
                            customerName: found.customerName,
                            customerEmail: found.customerEmail,
                            customerPhone: found.customerPhone,
                            customerAddress: found.customerAddress,
                            lines: found.lines || [],
                            createdAt: found.createdAt,
                            status: found.status
                        });
                    }
                } catch (err) {
                    console.error("Failed to fetch order detail", err);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        fetchOrder();
    }, [id]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
                <p className="text-gray-500 font-medium">Loading order details...</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="text-gray-500 text-lg">Work order not found.</div>
                <Link to="/work-orders" className="text-primary-600 hover:underline flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to History
                </Link>
            </div>
        );
    }

    const handleDownloadLabels = async () => {
        setIsGenerating(true);
        try {
            const lines = order.lines.map(line => ({
                productId: line.productId,
                totalQuantity: Number(line.unitsPerBox),
                numLabels: Number(line.labelPrint),
                brand: line.brand,
                qty: line.qty
            }));

            const customerData = {
                customerName: order.customerName,
                customerEmail: order.customerEmail,
                customerPhone: order.customerPhone,
                customerAddress: order.customerAddress
            };

            const blob = await api.labels.generatePdf(lines, customerData, true);
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `Labels-${order.customerName}-${new Date(order.createdAt).getTime()}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast.success('Labels re-generated successfully');
        } catch (err) {
            console.error("Failed to generate PDF", err);
            toast.error('Failed to generate PDF');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[calc(100vh-120px)] pb-12">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                    <Link to="/work-orders" className="text-sm text-gray-500 hover:text-primary-600 flex items-center gap-1 transition-colors mb-2">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Work Orders
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(order.createdAt).toLocaleDateString(undefined, { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </span>
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium uppercase tracking-wider">
                            {order.status}
                        </span>
                    </div>
                </div>
                <button
                    onClick={handleDownloadLabels}
                    disabled={isGenerating}
                    className="bg-primary-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 hover:bg-primary-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                >
                    {isGenerating ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Download className="w-5 h-5" />
                    )}
                    Re-generate Labels
                </button>
            </div>

            <div className="flex flex-col gap-8">
                {/* Customer Info Card */}
                <div className="w-full">
                    <div className="bg-white p-6 xl:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-8">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b border-gray-50 pb-6">
                            <User className="w-5 h-5 text-primary-500" />
                            Customer Information
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Full Name</p>
                                <p className="text-gray-900 font-medium">{order.customerName || 'N/A'}</p>
                            </div>

                            {order.customerEmail && (
                                 <div className="space-y-1">
                                     <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email Address</p>
                                     <div className="flex items-center gap-2 text-gray-900 font-medium">
                                         <Mail className="w-4 h-4 text-gray-400" />
                                         {order.customerEmail}
                                     </div>
                                 </div>
                             )}
                            
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Phone Number</p>
                                <div className="flex items-center gap-2 text-gray-900 font-medium">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    {order.customerPhone || 'N/A'}
                                </div>
                            </div>
                            
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Delivery Address</p>
                                <div className="flex items-start gap-2 text-gray-900 font-medium leading-relaxed">
                                    <MapPin className="w-4 h-4 text-gray-400 mt-1 shrink-0" />
                                    {order.customerAddress || 'N/A'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Products Table Card */}
                <div className="w-full">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 xl:p-8 border-b border-gray-50 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Package className="w-5 h-5 text-primary-500" />
                                Order Items
                            </h3>
                            <span className="text-sm font-medium text-gray-500 bg-gray-50 px-3 py-1 rounded-lg">
                                {order.lines.length} {order.lines.length === 1 ? 'Product' : 'Products'}
                            </span>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Product Name</th>
                                        <th className="px-6 py-4 text-center">Total Qty</th>
                                        <th className="px-6 py-4 text-center">Units/Label</th>
                                        <th className="px-6 py-4 text-center">Labels</th>
                                        <th className="px-6 py-4">Brand</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 text-sm">
                                    {order.lines.map((line) => (
                                        <tr key={line.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900">{line.productName}</div>
                                                {line.sku && <div className="text-xs text-gray-400 mt-0.5">SKU: {line.sku}</div>}
                                            </td>
                                            <td className="px-6 py-4 text-center font-medium text-gray-700">
                                                {line.qty}
                                            </td>
                                            <td className="px-6 py-4 text-center font-medium text-gray-700">
                                                {line.unitsPerBox}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-50 text-primary-700">
                                                    {line.labelPrint}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 italic">
                                                {line.brand || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50/30 font-bold">
                                    <tr>
                                        <td className="px-6 py-4 text-gray-900">Total</td>
                                        <td className="px-6 py-4 text-center text-gray-900">
                                            {order.lines.reduce((acc, l) => acc + (Number(l.qty) || 0), 0)}
                                        </td>
                                        <td></td>
                                        <td className="px-6 py-4 text-center text-primary-700">
                                            {order.lines.reduce((acc, l) => acc + (Number(l.labelPrint) || 0), 0)}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkOrderDetail;
