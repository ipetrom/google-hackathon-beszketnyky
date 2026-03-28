export interface PhotoNote {
  detected_room: string;
  notes: string;
}

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
  photo_notes: PhotoNote[] | null;
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
  object_type: string | null;
  color: string | null;
  material: string | null;
  condition: string | null;
  position: string | null;
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

export interface MoveoutApartment {
  id: string;
  address: string;
  city: string;
  rooms: number;
  sqm: number;
  status: string;
  inventory_count: number;
  moveout_date: string;
}

export interface RoomItems {
  room_name: string;
  items: {
    id: string;
    item_type: string;
    object_type: string | null;
    color: string | null;
    material: string | null;
    condition: string | null;
    condition_notes: string | null;
  }[];
}

export interface ValidationResult {
  detected_items: string[];
  missing_items: string[];
  notes: string;
  photo_url: string | null;
  photo_storage_url: string | null;
}

export interface DamageAssessmentItem {
  item_name: string;
  original_condition: string | null;
  current_status: string; // ok, damaged, missing
  damage_description: string | null;
  action: string | null; // repair, replace, null
  estimated_cost_pln: number;
}

export interface RoomAssessment {
  room: string;
  assessments: DamageAssessmentItem[];
  room_notes: string | null;
  move_out_photo_url: string | null;
}

export interface DamageReportData {
  apartment_id: string;
  apartment_address: string;
  moveout_date: string;
  inspection_date: string;
  rooms: RoomAssessment[];
  summary: {
    total_items: number;
    ok_items: number;
    damaged_items: number;
    missing_items: number;
    total_estimated_cost_pln: number;
  };
  landlord_notes: string;
}
