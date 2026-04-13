import type { Product } from '../types';

const API_BASE_URL = 'https://label-backend-hbli.onrender.com/api';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

const handleResponse = async (res: Response) => {
    if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('is_authenticated');
        window.location.href = '/login';
        throw new Error('Session expired. Please log in again.');
    }
    return res;
};

export const api = {
    auth: {
        login: async (email: string, password: string) => {
            const res = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            if (!res.ok) throw new Error('Login failed');
            return res.json();
        },
        getCurrentUser: async () => {
            const res = await handleResponse(await fetch(`${API_BASE_URL}/auth/me`, {
                headers: getHeaders(),
            }));
            if (!res.ok) throw new Error('Failed to fetch user');
            return res.json();
        }
    },
    products: {
        list: async (): Promise<Product[]> => {
            const res = await handleResponse(await fetch(`${API_BASE_URL}/products`, {
                headers: getHeaders(),
            }));
            if (!res.ok) throw new Error('Failed to fetch products');
            const data = await res.json();
            return data.map((p: any) => ({
                id: p._id,
                name: p.name,
                sku: p.catalogueNumber,
                description: p.description || ''
            }));
        },
        create: async (product: Omit<Product, 'id'>) => {
            const res = await handleResponse(await fetch(`${API_BASE_URL}/products/create`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({
                    name: product.name,
                    catalogueNumber: product.sku,
                    description: product.description
                }),
            }));
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to create product');
            }
            return res.json();
        },
        update: async (id: string, product: Partial<Product>) => {
            const res = await handleResponse(await fetch(`${API_BASE_URL}/products/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({
                    name: product.name,
                    catalogueNumber: product.sku,
                    description: product.description
                }),
            }));
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to update product');
            }
            return res.json();
        },
        delete: async (id: string) => {
            const res = await handleResponse(await fetch(`${API_BASE_URL}/products/${id}`, {
                method: 'DELETE',
                headers: getHeaders(),
            }));
            if (!res.ok) throw new Error('Failed to delete product');
            return res.json();
        }
    },
    labels: {
        generatePdf: async (
            lines: { productId: string; totalQuantity: number; numLabels: number; brand?: string; qty?: number }[],
            customerData?: { customerName: string; customerPhone: string; customerAddress: string },
            skipHistory: boolean = false
        ) => {
            const res = await handleResponse(await fetch(`${API_BASE_URL}/labels/pdf`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ 
                    lines,
                    skipHistory,
                    ...customerData 
                }),
            }));
            if (!res.ok) throw new Error('Failed to generate PDF');
            return res.blob();
        },
    },
    history: {
        list: async (): Promise<any[]> => {
            const res = await handleResponse(await fetch(`${API_BASE_URL}/history`, {
                headers: getHeaders(),
            }));
            if (!res.ok) throw new Error('Failed to fetch history');
            return res.json();
        }
    },
    addresses: {
        list: async (): Promise<any[]> => {
            const res = await handleResponse(await fetch(`${API_BASE_URL}/addresses`, {
                headers: getHeaders(),
            }));
            if (!res.ok) throw new Error('Failed to fetch addresses');
            return res.json();
        },
        create: async (address: Omit<any, '_id'>) => {
            const res = await handleResponse(await fetch(`${API_BASE_URL}/addresses/create`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(address),
            }));
            if (!res.ok) throw new Error('Failed to create address');
            return res.json();
        },
        update: async (id: string, address: Partial<any>) => {
            const res = await handleResponse(await fetch(`${API_BASE_URL}/addresses/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(address),
            }));
            if (!res.ok) throw new Error('Failed to update address');
            return res.json();
        },
        delete: async (id: string) => {
            const res = await handleResponse(await fetch(`${API_BASE_URL}/addresses/${id}`, {
                method: 'DELETE',
                headers: getHeaders(),
            }));
            if (!res.ok) throw new Error('Failed to delete address');
            return res.json();
        }
    }
};
