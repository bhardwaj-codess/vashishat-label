import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Printer, Trash2, Search, X, Eye, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import type { Product, Address, WorkOrderLine } from '../../types';
import { api } from '../../services/api';
import { useData } from '../../context/DataContext';

const WorkOrderForm: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const prefillAddress = (location.state as any)?.prefillAddress as Address | undefined;

    const { products: allProducts, addresses: allAddresses, isLoadingProducts: dataLoading, reloadHistory } = useData();
    const isLoadingProducts = dataLoading;

    const [customerData, setCustomerData] = useState({
        customerName: prefillAddress?.name || '',
        customerPhone: prefillAddress?.phone || '',
        customerAddress: prefillAddress?.addressLine || '',
        clientCode: '',
        workOrderDateFrom: '',
        workOrderDateTo: '',
        workOrderNo: '',
        woReceiveDate: '',
    });

    const [orderLines, setOrderLines] = useState<WorkOrderLine[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isAddressDropdownOpen, setIsAddressDropdownOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
    const [isGeneratingDownload, setIsGeneratingDownload] = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const addressDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
            if (addressDropdownRef.current && !addressDropdownRef.current.contains(event.target as Node)) {
                setIsAddressDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCustomerData(prev => ({ ...prev, [name]: value }));
        
        if (name === 'customerName') {
            setIsAddressDropdownOpen(true);
        }
    };

    const selectAddress = (address: Address) => {
        setCustomerData(prev => ({
            ...prev,
            customerName: address.name,
            customerPhone: address.phone || '',
            customerAddress: address.addressLine || '',
        }));
        setIsAddressDropdownOpen(false);
    };

    const addProductToOrder = (product: Product) => {
        const newLine: WorkOrderLine = {
            id: crypto.randomUUID(),
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            qty: 0,
            unitsPerBox: 1,
            labelPrint: 0,
            brand: ''
        };
        setOrderLines(prev => [...prev, newLine]);
        setSearchTerm('');
        setIsDropdownOpen(false);
    };

    const updateLine = (id: string, field: keyof WorkOrderLine, value: any) => {
        setOrderLines(prev => prev.map(line => {
            if (line.id === id) {
                const updatedLine = { ...line, [field]: value };
                // Auto-calculate Label Print if Qty or Units in Box changes
                if (field === 'qty' || field === 'unitsPerBox') {
                    const qty = field === 'qty' ? Number(value) : line.qty;
                    const units = field === 'unitsPerBox' ? Number(value) : line.unitsPerBox;
                    // Label Count = Qty / Units per Box (Handling division by zero)
                    updatedLine.labelPrint = units > 0 ? Math.ceil(qty / units) : 0;
                }
                return updatedLine;
            }
            return line;
        }));
    };

    const removeLine = (id: string) => {
        setOrderLines(prev => prev.filter(line => line.id !== id));
    };

    const generatePdf = async (preview: boolean = false) => {
        if (orderLines.length === 0) {
            toast.warning('Please add at least one product');
            return;
        }

        if (preview) setIsGeneratingPreview(true);
        else setIsGeneratingDownload(true);

        try {
            const lines = orderLines.map(line => ({
                productId: line.productId,
                totalQuantity: Number(line.unitsPerBox), // Quantity per label
                numLabels: Number(line.labelPrint),      // Number of labels
                brand: line.brand,
                qty: line.qty
            }));

            const body = {
                lines,
                customerName: customerData.customerName,
                customerPhone: customerData.customerPhone,
                customerAddress: customerData.customerAddress,
                clientCode: customerData.clientCode,
                workOrderDateFrom: customerData.workOrderDateFrom,
                workOrderDateTo: customerData.workOrderDateTo,
                workOrderNo: customerData.workOrderNo,
                woReceiveDate: customerData.woReceiveDate,
                skipHistory: preview
            };

            const blob = await api.labels.generatePdf(body.lines, {
                customerName: body.customerName,
                customerPhone: body.customerPhone,
                customerAddress: body.customerAddress,
                clientCode: body.clientCode,
                workOrderDateFrom: body.workOrderDateFrom,
                workOrderDateTo: body.workOrderDateTo,
                workOrderNo: body.workOrderNo,
                woReceiveDate: body.woReceiveDate,
            }, body.skipHistory);
            const url = URL.createObjectURL(blob);

            if (preview) {
                setPreviewUrl(url);
                setIsPreviewOpen(true);
                toast.info('Label preview generated');
            } else {
                const link = document.createElement('a');
                link.href = url;
                link.download = `Labels-${new Date().getTime()}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                toast.success('Labels generated and download started');
                // No need to manually save to storage anymore, as the backend now handles history
                await reloadHistory();
                navigate('/work-orders');
            }
        } catch (err) {
            console.error("Failed to generate PDF", err);
            toast.error('Failed to generate PDF');
        } finally {
            if (preview) setIsGeneratingPreview(false);
            else setIsGeneratingDownload(false);
        }
    };

    const filteredProducts = allProducts.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    ).filter(p => !orderLines.some(line => line.productId === p.id));

    const filteredAddresses = allAddresses.filter(a =>
        a.name.toLowerCase().includes(customerData.customerName.toLowerCase())
    );

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 min-h-[calc(100vh-120px)] pb-12">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                    <Link to="/work-orders" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Create Work Order</h1>
                        <p className="text-gray-500">Add products and generate labels</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => generatePdf(true)}
                        disabled={isGeneratingPreview || isGeneratingDownload || orderLines.length === 0}
                        className="bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 flex items-center gap-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        {isGeneratingPreview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                        Preview Labels
                    </button>
                    <button
                        onClick={() => generatePdf(false)}
                        disabled={isGeneratingPreview || isGeneratingDownload || orderLines.length === 0}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700 transition-colors disabled:opacity-50"
                    >
                        {isGeneratingDownload ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                        Generate & Download
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-8">
                {/* Customer Details */}
                <div className="w-full">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 xl:p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Customer Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="relative" ref={addressDropdownRef}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    name="customerName"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    value={customerData.customerName}
                                    onChange={handleCustomerChange}
                                    autoComplete="off"
                                />
                                {isAddressDropdownOpen && customerData.customerName && filteredAddresses.length > 0 && (
                                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                                        {filteredAddresses.map(address => (
                                            <button
                                                key={address.id}
                                                className="w-full text-left px-4 py-2 hover:bg-primary-50 transition-colors flex flex-col border-b border-gray-50 last:border-0"
                                                onClick={() => selectAddress(address)}
                                            >
                                                <span className="font-medium text-gray-900">{address.name}</span>
                                                {address.addressLine && (
                                                    <span className="text-xs text-gray-500 truncate">{address.addressLine}</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Work Order No.</label>
                                <input
                                    type="text"
                                    name="workOrderNo"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    value={customerData.workOrderNo}
                                    onChange={handleCustomerChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">WO Receive Date</label>
                                <input
                                    type="date"
                                    name="woReceiveDate"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    value={customerData.woReceiveDate}
                                    onChange={handleCustomerChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input
                                    type="tel"
                                    name="customerPhone"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    value={customerData.customerPhone}
                                    onChange={handleCustomerChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <textarea
                                    name="customerAddress"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none h-[42px] resize-none"
                                    value={customerData.customerAddress}
                                    onChange={handleCustomerChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Client Code</label>
                                <input
                                    type="text"
                                    name="clientCode"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    value={customerData.clientCode}
                                    onChange={handleCustomerChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Work Order Date (From)</label>
                                <input
                                    type="date"
                                    name="workOrderDateFrom"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    value={customerData.workOrderDateFrom}
                                    onChange={handleCustomerChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Work Order Date (To)</label>
                                <input
                                    type="date"
                                    name="workOrderDateTo"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    value={customerData.workOrderDateTo}
                                    onChange={handleCustomerChange}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Product Selection and Table */}
                <div className="w-full">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 xl:p-8">
                        <div className="flex flex-col gap-6">
                            <h2 className="text-xl font-bold text-gray-900">Select Products</h2>
                            <div className="relative" ref={dropdownRef}>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Search products by name or SKU..."
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        value={searchTerm}
                                        onFocus={() => setIsDropdownOpen(true)}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setIsDropdownOpen(true);
                                        }}
                                    />
                                </div>

                                {isDropdownOpen && searchTerm && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                                        {isLoadingProducts ? (
                                            <div className="p-4 text-center text-gray-500">Loading...</div>
                                        ) : filteredProducts.length === 0 ? (
                                            <div className="p-4 text-center text-gray-500">No products found</div>
                                        ) : (
                                            filteredProducts.map(product => (
                                                <button
                                                    key={product.id}
                                                    className="w-full text-left px-4 py-2 hover:bg-primary-50 transition-colors flex flex-col border-b border-gray-50 last:border-0"
                                                    onClick={() => addProductToOrder(product)}
                                                >
                                                    <span className="font-medium text-gray-900">{product.name}</span>
                                                    {product.sku && <span className="text-xs text-gray-500">SKU: {product.sku}</span>}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-600 text-sm uppercase">
                                        <th className="px-4 py-3 border text-left font-semibold">Product Name</th>
                                        <th className="px-4 py-3 border text-center font-semibold w-24">Qty</th>
                                        <th className="px-4 py-3 border text-center font-semibold w-32">Units in Box</th>
                                        <th className="px-4 py-3 border text-center font-semibold w-24">Label Count</th>
                                        <th className="px-4 py-3 border text-center font-semibold w-40">Brand</th>
                                        <th className="px-4 py-3 border text-center font-semibold w-16"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orderLines.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                                                No products added yet. Use the search bar above to add products.
                                            </td>
                                        </tr>
                                    ) : (
                                        orderLines.map((line) => (
                                            <tr key={line.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 border text-sm text-gray-900 font-medium">
                                                    {line.productName}
                                                    {line.sku && <div className="text-xs text-gray-500">({line.sku})</div>}
                                                </td>
                                                <td className="px-4 py-3 border">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        className="w-full text-center p-1 border rounded focus:ring-1 focus:ring-primary-500 outline-none"
                                                        value={line.qty}
                                                        onChange={(e) => updateLine(line.id, 'qty', e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-4 py-3 border">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        className="w-full text-center p-1 border rounded focus:ring-1 focus:ring-primary-500 outline-none"
                                                        value={line.unitsPerBox}
                                                        onChange={(e) => updateLine(line.id, 'unitsPerBox', e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-4 py-3 border">
                                                    <input
                                                        type="number"
                                                        className="w-full text-center p-1 border rounded bg-gray-50 font-semibold text-primary-700 outline-none"
                                                        value={line.labelPrint}
                                                        readOnly
                                                        tabIndex={-1}
                                                    />
                                                </td>
                                                <td className="px-4 py-3 border">
                                                    <input
                                                        type="text"
                                                        className="w-full text-center p-1 border rounded focus:ring-1 focus:ring-primary-500 outline-none"
                                                        value={line.brand}
                                                        onChange={(e) => updateLine(line.id, 'brand', e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-4 py-3 border text-center">
                                                    <button
                                                        onClick={() => removeLine(line.id)}
                                                        className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview Modal */}
            {isPreviewOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[100]">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-lg font-bold text-gray-900">Label Preview</h3>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => generatePdf(false)}
                                    className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700 transition-colors"
                                >
                                    <Printer className="w-4 h-4" />
                                    Download PDF
                                </button>
                                <button
                                    onClick={() => {
                                        setIsPreviewOpen(false);
                                        if (previewUrl) URL.revokeObjectURL(previewUrl);
                                        setPreviewUrl(null);
                                    }}
                                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 bg-gray-100 p-4">
                            {previewUrl && (
                                <iframe
                                    src={previewUrl}
                                    className="w-full h-full border-0 rounded shadow-sm"
                                    title="PDF Preview"
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkOrderForm;
