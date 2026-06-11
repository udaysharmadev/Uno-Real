/**
 * Rebuilt seating utility for the 2.5D UNO Real tabletop layout.
 * Defines 6 fixed visual seat coordinates as percentages of the table viewport.
 */

export interface SeatCoords {
  left: string;
  top: string;
  rotation: number; // rotation in degrees
}

// 6 Fixed static visual slots around the HTML felt table border
const STATIC_SEATS: Record<number, { left: string; top: string; rotation: number }> = {
  1: { left: '50%', top: '88%', rotation: 0 },    // Bottom Center (Visual Slot 1 - always local player)
  2: { left: '85%', top: '68%', rotation: -12 },  // Bottom Right (Visual Slot 2)
  3: { left: '85%', top: '32%', rotation: 12 },   // Top Right (Visual Slot 3)
  4: { left: '50%', top: '12%', rotation: 0 },    // Top Center (Visual Slot 4)
  5: { left: '15%', top: '32%', rotation: -12 },  // Top Left (Visual Slot 5)
  6: { left: '15%', top: '68%', rotation: 12 },   // Bottom Left (Visual Slot 6)
};

/**
 * Maps a player's seat number (1-6) from the server to one of the 6 fixed visual slots.
 * Ensures the local player is always rendered at bottom-center (Slot 1), and others
 * are mapped sequentially without rotating the table coordinates.
 * 
 * @param seatNumber Player's seat number (1 to 6)
 * @param localSeatNumber The seat number of the local user (1 to 6)
 */
export const getSeatCoords = (
  seatNumber: number,
  localSeatNumber: number
): SeatCoords => {
  const visualSlot = ((seatNumber - localSeatNumber + 6) % 6) + 1;
  return STATIC_SEATS[visualSlot];
};

/**
 * Returns all static visual slot coordinates.
 */
export const getAllVisualSlots = (): Record<number, { left: string; top: string; rotation: number }> => {
  return STATIC_SEATS;
};

