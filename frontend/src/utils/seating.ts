/**
 * Rebuilt seating utility for the 2.5D UNO Real tabletop layout.
 * Defines 6 fixed visual seat coordinates around the expanded oval table.
 */

export interface SeatCoords {
  position: [number, number, number];
  rotationY: number;
}

// 6 Fixed static visual slots around the expanded oval table
// Adjusted to match the larger table scale so seats sit perfectly on the border
const STATIC_SEATS: Record<number, [number, number, number]> = {
  1: [0, 0.05, 2.05],    // Bottom Center (Visual Slot 1 - always local player)
  2: [2.5, 0.05, 1.0],   // Bottom Right (Visual Slot 2)
  3: [2.5, 0.05, -1.0],  // Top Right (Visual Slot 3)
  4: [0, 0.05, -2.05],   // Top Center (Visual Slot 4)
  5: [-2.5, 0.05, -1.0], // Top Left (Visual Slot 5)
  6: [-2.5, 0.05, 1.0],  // Bottom Left (Visual Slot 6)
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
