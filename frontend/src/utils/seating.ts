/**
 * Rebuilt seating utility for the 2.5D UNO Real tabletop layout.
 * Defines 6 fixed visual seat coordinates around the oval table.
 */

export interface SeatCoords {
  position: [number, number, number];
  rotationY: number;
}

// 6 Fixed static visual slots around the oval table
// Table center is [0, 0, 0]
// X represents left/right, Z represents top/bottom (toward/away from camera)
const STATIC_SEATS: Record<number, [number, number, number]> = {
  1: [0, 0.05, 1.45],   // Bottom Center (Visual Slot 1 - always local player)
  2: [1.9, 0.05, 0.7],  // Bottom Right (Visual Slot 2)
  3: [1.9, 0.05, -0.7], // Top Right (Visual Slot 3)
  4: [0, 0.05, -1.45],  // Top Center (Visual Slot 4)
  5: [-1.9, 0.05, -0.7],// Top Left (Visual Slot 5)
  6: [-1.9, 0.05, 0.7], // Bottom Left (Visual Slot 6)
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
  // Determine relative visual slot (1 to 6)
  // Local player maps to 1, next player to 2, etc.
  const visualSlot = ((seatNumber - localSeatNumber + 6) % 6) + 1;
  const position = STATIC_SEATS[visualSlot];

  return {
    position,
    rotationY: 0, // Flat facing the screen for maximum 2.5D readability
  };
};

/**
 * Returns all static visual slot coordinates.
 */
export const getAllVisualSlots = (): Record<number, [number, number, number]> => {
  return STATIC_SEATS;
};
