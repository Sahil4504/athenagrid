// Derives a farmer-facing status for a marketplace order from its linked
// transport job + trip, so the confirmation page and the My orders list agree.
//
// Flow: OPEN with no bids -> "Collecting bids"; OPEN with bids -> "Choose driver";
// awarded -> "Driver assigned" / "In transit"; trip DELIVERED -> "Delivered".

export type OrderStatusKey = 'PLACED' | 'COLLECTING' | 'CHOOSE' | 'AWARDED' | 'TRANSIT' | 'DELIVERED';

export type OrderStatus = {
  key: OrderStatusKey;
  label: string;
  badge: 'collect' | 'choose' | 'transit' | 'delivered';
};

export function orderStatus(o: any): OrderStatus {
  const job = o?.job;
  const trip = job?.trip;
  const tripStatus: string | undefined = trip?.status;
  const awarded = !!o?.bill?.transportAwarded || job?.status === 'AWARDED' || job?.status === 'IN_TRANSIT' || !!trip;

  if (tripStatus === 'DELIVERED' || job?.status === 'DELIVERED')
    return { key: 'DELIVERED', label: 'Delivered', badge: 'delivered' };

  if (awarded) {
    const moving = job?.status === 'IN_TRANSIT' || (tripStatus && tripStatus !== 'ASSIGNED');
    return moving
      ? { key: 'TRANSIT', label: 'In transit', badge: 'transit' }
      : { key: 'AWARDED', label: 'Driver assigned', badge: 'transit' };
  }

  if (!job) return { key: 'PLACED', label: 'Placed', badge: 'collect' };
  const bidCount = job?.bids?.length ?? 0;
  return bidCount > 0
    ? { key: 'CHOOSE', label: 'Choose driver', badge: 'choose' }
    : { key: 'COLLECTING', label: 'Collecting bids', badge: 'collect' };
}
