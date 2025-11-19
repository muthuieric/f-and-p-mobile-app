export type ShipmentStatus = 'Pending' | 'In Transit' | 'Delivered';

export interface Shipment {
  id: string;
  trackingNumber: string;
  status: ShipmentStatus;
  destination: string;
  receiverName?: string;
  receiverPhone?: string | null;
  sender?: string;
  type?: string; 
  createdAt?: string;
  deliveredAt?: string; // <--- Added this field
}