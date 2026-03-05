import { Types } from "mongoose";

export type CellItemType = {
    row: number;
    col: number;
    name: string;
    price: number;
    quantity: number;
}

export type VendingMachineSchemaType = {
    name: string;
    location: string;
    items: CellItemType[];
    institute_id: Types.ObjectId;
    role: string;
}

export type VendingMachineUpdateDetailsType = {
    name: string;
    location: string;
    institute_id: Types.ObjectId;
}

export type VendingMachineUpdateStockType = {
    items: CellItemType[];
}

export type VendingMachineCreationType = {
    name: string;
    location?: string;
    institute_id: Types.ObjectId;
}
