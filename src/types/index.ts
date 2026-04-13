export interface Product {
    id: string;
    name: string;
    sku?: string;
    description?: string;
}

export interface Address {
    id: string;
    name: string;
    email?: string;
    phone: string;
    addressLine: string;
}

export interface WorkOrderLine {
    id: string; // Internal unique ID for the line
    productId: string;
    productName: string;
    sku?: string;
    qty: number;
    unitsPerBox: number;
    labelPrint: number;
    brand?: string;
}

export interface WorkOrder {
    id: string;
    customerName: string;
    customerEmail?: string;
    customerPhone: string;
    customerAddress: string;
    lines: WorkOrderLine[];
    createdAt: string;
    status: 'pending' | 'completed';
}

export interface User {
    id: string;
    username: string;
    isAuthenticated: boolean;
}
