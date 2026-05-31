import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import type { Product, Address } from '../types';

interface DataContextType {
    products: Product[];
    addresses: Address[];
    history: any[];
    isLoadingProducts: boolean;
    isLoadingAddresses: boolean;
    isLoadingHistory: boolean;
    reloadProducts: () => Promise<void>;
    reloadAddresses: () => Promise<void>;
    reloadHistory: () => Promise<void>;
    loadAll: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [history, setHistory] = useState<any[]>([]);

    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    const reloadProducts = useCallback(async () => {
        setIsLoadingProducts(true);
        try {
            const data = await api.products.list();
            setProducts(data);
        } catch (err) {
            console.error('Failed to load products in cache:', err);
        } finally {
            setIsLoadingProducts(false);
        }
    }, []);

    const reloadAddresses = useCallback(async () => {
        setIsLoadingAddresses(true);
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
            console.error('Failed to load addresses in cache:', err);
        } finally {
            setIsLoadingAddresses(false);
        }
    }, []);

    const reloadHistory = useCallback(async () => {
        setIsLoadingHistory(true);
        try {
            const data = await api.history.list();
            setHistory(data);
        } catch (err) {
            console.error('Failed to load history in cache:', err);
        } finally {
            setIsLoadingHistory(false);
        }
    }, []);

    const loadAll = useCallback(async () => {
        await Promise.allSettled([
            reloadProducts(),
            reloadAddresses(),
            reloadHistory()
        ]);
    }, [reloadProducts, reloadAddresses, reloadHistory]);

    useEffect(() => {
        if (isAuthenticated) {
            loadAll();
        } else {
            // Reset state when logging out
            setProducts([]);
            setAddresses([]);
            setHistory([]);
        }
    }, [isAuthenticated, loadAll]);

    return (
        <DataContext.Provider
            value={{
                products,
                addresses,
                history,
                isLoadingProducts,
                isLoadingAddresses,
                isLoadingHistory,
                reloadProducts,
                reloadAddresses,
                reloadHistory,
                loadAll
            }}
        >
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
