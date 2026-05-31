import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Search, X, Loader2, Upload, FileSpreadsheet, FileText } from 'lucide-react';
import { toast } from 'react-toastify';
import type { Product } from '../../types';
import { api } from '../../services/api';
import { useData } from '../../context/DataContext';

const ProductManager: React.FC = () => {
    const { products, isLoadingProducts: isLoading, reloadProducts } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState<Partial<Product>>({ name: '', sku: '', description: '' });
    const [searchTerm, setSearchTerm] = useState('');

    // States for Excel upload functionality
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [importReport, setImportReport] = useState<{ totalRecordsImported: number; totalRecordsSkipped: number; errors: any[] } | null>(null);

    const handleCloseUploadModal = () => {
        setIsUploadModalOpen(false);
        setSelectedFile(null);
        setImportReport(null);
    };

    const overrideOpenModal = (product?: Product) => {
        setError(null);
        if (product) {
            setEditingProduct(product);
            setFormData(product);
        } else {
            setEditingProduct(null);
            setFormData({ name: '', sku: '', description: '' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            if (editingProduct) {
                await api.products.update(editingProduct.id, formData);
                toast.success('Product updated successfully');
            } else {
                await api.products.create(formData as Omit<Product, 'id'>);
                toast.success('Product created successfully');
            }
            await reloadProducts();
            handleCloseModal();
        } catch (err: any) {
            setError(err.message || 'An error occurred while saving the product.');
            toast.error(err.message || 'Failed to save product');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await api.products.delete(id);
                toast.success('Product deleted successfully');
                await reloadProducts();
            } catch (err) {
                toast.error('Failed to delete product');
                console.error(err);
            }
        }
    };

    // Excel upload handlers
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            
            // Validation: Verify Extension
            const fileExtension = file.name.split('.').pop()?.toLowerCase();
            if (fileExtension !== 'xlsx' && fileExtension !== 'xls') {
                toast.error('Only Excel files (.xlsx or .xls) are allowed.');
                return;
            }
            
            // Validation: Enforce 10MB limit (matching backend limits)
            if (file.size > 10 * 1024 * 1024) {
                toast.error('File size exceeds the 10MB limit.');
                return;
            }
            
            setSelectedFile(file);
            setImportReport(null); // Clear previous reports on new drop
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            // Validation: Verify Extension
            const fileExtension = file.name.split('.').pop()?.toLowerCase();
            if (fileExtension !== 'xlsx' && fileExtension !== 'xls') {
                toast.error('Only Excel files (.xlsx or .xls) are allowed.');
                return;
            }
            
            // Validation: Enforce 10MB limit (matching backend limits)
            if (file.size > 10 * 1024 * 1024) {
                toast.error('File size exceeds the 10MB limit.');
                return;
            }
            
            setSelectedFile(file);
            setImportReport(null); // Clear previous reports on selection
        }
    };

    const handleUploadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) return;
        setIsUploading(true);
        setImportReport(null);
        try {
            // Trigger the real ETL Import API
            const result = await api.products.import(selectedFile);
            
            // Provide rich user telemetry
            toast.success(
                `Import complete! Imported: ${result.totalRecordsImported}, Skipped: ${result.totalRecordsSkipped} (in ${result.durationMs}ms)`
            );

            // Display spreadsheet validation details if rows were skipped
            if (result.errors && result.errors.length > 0) {
                setImportReport(result);
                result.errors.forEach((err: any) => {
                    toast.warn(err.error, { autoClose: 6000 });
                });
            } else {
                // If clean import, close modal
                setSelectedFile(null);
                setIsUploadModalOpen(false);
            }
            
            // Instantly reload product grid from the database
            await reloadProducts();
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'Excel parsing or upload failed.');
        } finally {
            setIsUploading(false);
        }
    };

    const filteredProducts = products.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Product Manager</h1>
                    <p className="text-gray-500">Manage your product inventory</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <Upload className="w-4 h-4 text-gray-500" />
                        <span>Upload Excel File</span>
                    </button>
                    <button
                        onClick={() => overrideOpenModal()}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Add Product
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search products..."
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
                                <th className="px-6 py-3 font-medium">SKU</th>
                                <th className="px-6 py-3 font-medium">Product Name</th>
                                <th className="px-6 py-3 font-medium">Description</th>
                                <th className="px-6 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        <div className="flex items-center justify-center gap-2">
                                            <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
                                            Loading products...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        No products found. Add one to get started.
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product, index) => (
                                    <tr key={product.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                                        <td className="px-6 py-4 text-gray-500">{product.sku || '-'}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{product.name}</td>
                                        <td className="px-6 py-4 text-gray-500 truncate max-w-xs">{product.description || '-'}</td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                                            <button
                                                onClick={() => overrideOpenModal(product)}
                                                className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product.id)}
                                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {editingProduct ? 'Edit Product' : 'Add New Product'}
                            </h3>
                            <button
                                onClick={handleCloseModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Product Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    SKU (Optional)
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                    value={formData.sku}
                                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none h-24"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editingProduct ? 'Save Changes' : 'Create Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Upload Excel Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg animate-in fade-in zoom-in duration-200 overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-gray-200">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Upload Your Data</h3>
                                <p className="text-sm text-gray-500 mt-1">Drag and drop your Excel (.xlsx, .xls) file below to import records.</p>
                            </div>
                            <button
                                onClick={handleCloseUploadModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleUploadSubmit} className="p-6 space-y-6">
                            {/* Drag and Drop Box */}
                            <div
                                onDragEnter={handleDrag}
                                onDragOver={handleDrag}
                                onDragLeave={handleDrag}
                                onDrop={handleDrop}
                                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 flex flex-col items-center justify-center cursor-pointer
                                    ${dragActive 
                                        ? 'border-primary-500 bg-primary-50/50 scale-[1.01]' 
                                        : 'border-gray-300 hover:border-primary-400 bg-gray-50/50'
                                    }`}
                            >
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    disabled={isUploading}
                                />
                                
                                {!selectedFile ? (
                                    <>
                                        <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 mb-4 transition-transform hover:scale-105 duration-200">
                                            <FileSpreadsheet className="w-8 h-8" />
                                        </div>
                                        <p className="text-base font-semibold text-gray-800">
                                            Drag & drop your Excel file here
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            or <span className="text-primary-600 font-semibold underline">click to browse</span> from computer
                                        </p>
                                        <p className="text-xs text-gray-400 mt-3 font-medium">
                                            Max size: 10MB | Supported formats: .xlsx, .xls
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mb-4 animate-bounce">
                                            <FileText className="w-8 h-8" />
                                        </div>
                                        <p className="text-base font-semibold text-gray-800 truncate max-w-xs">
                                            {selectedFile.name}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {(selectedFile.size / 1024).toFixed(1)} KB • Ready to upload
                                        </p>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setSelectedFile(null);
                                            }}
                                            className="mt-4 text-xs font-semibold text-red-600 hover:text-red-800 transition-colors bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg"
                                        >
                                            Remove File
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Import Report Warnings */}
                            {importReport && importReport.errors && importReport.errors.length > 0 && (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 max-h-40 overflow-y-auto space-y-2">
                                    <h4 className="font-semibold text-amber-900 text-xs flex items-center gap-1.5">
                                        ⚠️ Import Warnings ({importReport.totalRecordsSkipped} skipped rows):
                                    </h4>
                                    <ul className="text-xs text-amber-800 list-disc pl-4 space-y-1">
                                        {importReport.errors.map((err, i) => (
                                            <li key={i}>{err.error || err.message || String(err)}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Footer Buttons */}
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={handleCloseUploadModal}
                                    disabled={isUploading}
                                    className="px-5 py-2.5 text-gray-700 font-semibold hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!selectedFile || isUploading}
                                    className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[100px] justify-center"
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Uploading...</span>
                                        </>
                                    ) : (
                                        <span>Submit</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductManager;
