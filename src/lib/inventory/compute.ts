/**
 * PURE FUNCTIONS for inventory position computation.
 *
 * CRITICAL RULES:
 *   on_hand_units = sum(ro_shopify_inventory_levels.available)
 *                   joined through ro_inventory_locations where include_in_on_hand = true
 *                   via shopify_location_id
 *
 *   reserved_units = sum(ro_reserved_inventory.units WHERE is_active = true) for that SKU
 *
 *   available_units = max(on_hand_units - reserved_units, 0)
 *
 *   on_order_units = sum(ro_supply_po_line_items.quantity - ro_supply_po_line_items.received_quantity)
 *                    WHERE PO status IN (sent, acknowledged, in_production, shipped)
 *
 *   in_transit_units = sum of on_order for POs with shipment status = 'in_transit'
 */

interface InventoryLevelInput {
  shopify_location_id: number;
  available: number;
}

interface LocationConfig {
  shopify_location_id: number;
  location_name: string;
  include_in_on_hand: boolean;
}

interface ReservationInput {
  units: number;
  is_active: boolean;
}

interface POLineInput {
  quantity: number;
  received_quantity: number;
  po_status: string;
  shipment_status?: string | null;
}

// ─── Core computations ───────────────────────────────────────────────

/**
 * Compute on-hand units from Shopify inventory levels,
 * filtered by locations that include_in_on_hand.
 */
export function computeOnHand(
  levels: InventoryLevelInput[],
  locations: LocationConfig[]
): number {
  const includedLocationIds = new Set(
    locations
      .filter((loc) => loc.include_in_on_hand)
      .map((loc) => loc.shopify_location_id)
  );

  return levels
    .filter((l) => includedLocationIds.has(l.shopify_location_id))
    .reduce((sum, l) => sum + l.available, 0);
}

/**
 * Compute reserved units from active reservations.
 */
export function computeReserved(reservations: ReservationInput[]): number {
  return reservations
    .filter((r) => r.is_active)
    .reduce((sum, r) => sum + r.units, 0);
}

/**
 * Compute available units: max(on_hand - reserved, 0).
 * NEVER negative.
 */
export function computeAvailable(
  onHand: number,
  reserved: number
): number {
  return Math.max(onHand - reserved, 0);
}

/**
 * Compute on-order units from open supply PO line items.
 * Only includes POs with status: sent, acknowledged, in_production, shipped.
 */
export function computeOnOrder(poLines: POLineInput[]): number {
  const openStatuses = new Set([
    "sent",
    "acknowledged",
    "in_production",
    "shipped",
  ]);

  return poLines
    .filter((l) => openStatuses.has(l.po_status))
    .reduce((sum, l) => sum + Math.max(l.quantity - l.received_quantity, 0), 0);
}

/**
 * Compute in-transit units from supply PO lines where shipment is in_transit.
 */
export function computeInTransit(poLines: POLineInput[]): number {
  return poLines
    .filter((l) => l.shipment_status === "in_transit")
    .reduce((sum, l) => sum + Math.max(l.quantity - l.received_quantity, 0), 0);
}

/**
 * Compute per-location breakdown.
 */
export function computeLocationBreakdown(
  levels: InventoryLevelInput[],
  locations: LocationConfig[]
): Array<{
  location_name: string;
  shopify_location_id: number;
  available: number;
  include_in_on_hand: boolean;
}> {
  const locMap = new Map(
    locations.map((l) => [l.shopify_location_id, l])
  );

  return levels.map((l) => {
    const loc = locMap.get(l.shopify_location_id);
    return {
      location_name: loc?.location_name || `Location ${l.shopify_location_id}`,
      shopify_location_id: l.shopify_location_id,
      available: l.available,
      include_in_on_hand: loc?.include_in_on_hand ?? true,
    };
  });
}

/**
 * Compute full position for a SKU.
 */
export function computePosition(input: {
  sku: string;
  levels: InventoryLevelInput[];
  locations: LocationConfig[];
  reservations: ReservationInput[];
  poLines: POLineInput[];
}): {
  sku: string;
  on_hand_units: number;
  reserved_units: number;
  available_units: number;
  on_order_units: number;
  in_transit_units: number;
  breakdown: Array<{
    location_name: string;
    shopify_location_id: number;
    available: number;
    include_in_on_hand: boolean;
  }>;
} {
  const onHand = computeOnHand(input.levels, input.locations);
  const reserved = computeReserved(input.reservations);
  const available = computeAvailable(onHand, reserved);
  const onOrder = computeOnOrder(input.poLines);
  const inTransit = computeInTransit(input.poLines);
  const breakdown = computeLocationBreakdown(input.levels, input.locations);

  return {
    sku: input.sku,
    on_hand_units: onHand,
    reserved_units: reserved,
    available_units: available,
    on_order_units: onOrder,
    in_transit_units: inTransit,
    breakdown,
  };
}
