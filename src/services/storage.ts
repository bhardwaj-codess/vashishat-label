import type { Product, Address, WorkOrder } from '../types';

const STORAGE_KEYS = {
    PRODUCTS: 'label_gen_products',
    ADDRESSES: 'label_gen_addresses',
    WORK_ORDERS: 'label_gen_work_orders',
};

export const storage = {
    getProducts: (): Product[] => {
        const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
        return data ? JSON.parse(data) : [];
    },
    saveProducts: (products: Product[]) => {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    },

    getAddresses: (): Address[] => {
        const data = localStorage.getItem(STORAGE_KEYS.ADDRESSES);
        return data ? JSON.parse(data) : [];
    },
    saveAddresses: (addresses: Address[]) => {
        localStorage.setItem(STORAGE_KEYS.ADDRESSES, JSON.stringify(addresses));
    },

    getWorkOrders: (): WorkOrder[] => {
        const data = localStorage.getItem(STORAGE_KEYS.WORK_ORDERS);
        if (!data) return [];
        const orders = JSON.parse(data);
        
        // Migrate legacy orders that don't have 'lines'
        return orders.map((order: any) => {
            if (!order.lines) {
                return {
                    ...order,
                    lines: [{
                        id: crypto.randomUUID(),
                        productId: order.productId || '',
                        productName: order.productName || 'Legacy Product',
                        sku: order.sku || '',
                        qty: order.boxCount * order.unitsPerBox || 0,
                        unitsPerBox: order.unitsPerBox || 1,
                        labelPrint: order.totalLabels || 0,
                        brand: ''
                    }]
                };
            }
            return order;
        });
    },
    saveWorkOrders: (orders: WorkOrder[]) => {
        localStorage.setItem(STORAGE_KEYS.WORK_ORDERS, JSON.stringify(orders));
    },
};
