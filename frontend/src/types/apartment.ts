export interface Apartment {
  id: string;
  address: string;
  building: string | null;
  apartment_number: string | null;
  city: string;
  rooms: number;
  sqm: number;
  floor: number | null;
  specifications: Record<string, boolean> | null;
  status: 'vacant' | 'listed' | 'rented' | 'move-out';
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApartmentCreate {
  address: string;
  building?: string;
  apartment_number?: string;
  city: string;
  rooms: number;
  sqm: number;
  floor?: number;
  specifications?: Record<string, boolean>;
}

export interface Photo {
  id: string;
  apartment_id: string;
  storage_url: string;
  room_type: string | null;
  photo_type: 'move-in' | 'move-out';
  uploaded_at: string;
}

export interface InventoryItem {
  id: string;
  apartment_id: string;
  room_type: string | null;
  item_type: string;
  condition_notes: string | null;
  photo_id: string | null;
  created_at: string;
}

export interface Listing {
  id: string;
  apartment_id: string;
  platform: string;
  title: string;
  description: string;
  amenities: Record<string, any> | null;
  price: number | null;
  rental_type: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface LeasePeriod {
  id: string;
  apartment_id: string;
  tenant_name: string | null;
  start_date: string;
  end_date: string;
  rental_type: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  apartment_id: string;
  tenant_name: string | null;
  platform_source: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender: string;
  message_text: string;
  timestamp: string;
}
