export interface Zone {
  zone_id: string
  name: string
  multiplier: number
  remote_fee: number
}

export interface ZoneFeature {
  type: 'Feature'
  properties: Zone
  geometry: {
    type: 'Polygon'
    coordinates: number[][][]
  }
}

export interface ZoneCollection {
  type: 'FeatureCollection'
  features: ZoneFeature[]
}

export interface PricingPreset {
  id: string
  label: string
  base_rate: number
  per_mile: number
  per_lb: number
  dim_divisor: number
  fuel_pct: number
  service_multiplier: {
    standard: number
    expedited: number
  }
  zone_multiplier_overrides: Record<string, number>
  residential_fee: number
  peak_pct: number
}

export interface Shipment {
  origin_zone: string
  dest_zone: string
  length_in: number
  width_in: number
  height_in: number
  weight_lb: number
  service: 'standard' | 'expedited'
  declared_value: number
  residential?: boolean
}

export interface PriceBreakdown {
  dim_weight: number
  billable_weight: number
  miles: number
  zone_factor: number
  service_factor: number
  variable_cost: number
  subtotal: number
  fuel_surcharge: number
  peak_surcharge: number
  fixed_fees: number
  insurance: number
  total: number
  confidence_band: number
}

export interface QuoteResult {
  shipment: Shipment
  breakdown: PriceBreakdown
  total: number
  band: number
}

export type DistanceMatrix = Record<string, Record<string, number>>
