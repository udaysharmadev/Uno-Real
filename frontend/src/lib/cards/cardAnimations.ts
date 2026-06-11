import { getSeatCoords } from '../../utils/seating';
import { generatePhase3DemoHand } from './mockCards';
import { CardItem, createCard } from './cardEngine';

interface SeatPlayer {
  seatNumber: number;
  id: string;
}

/**
 * Handles the round-robin dealer sequence:
 * Deals 7 cards to each seated player one-by-one (Seat 1 -> Seat 2 -> ... -> Seat 6).
 */
export const triggerDealerSequence = (
  players: SeatPlayer[],
  localSeatNumber: number,
  actions: {
    clearAllCards: () => void;
    setDrawPileCount: (count: number) => void;
    setDiscardPile: (cards: CardItem[]) => void;
    addCardToPlayer: (seatNumber: number, card: CardItem) => void;
  }
) => {
  // 1. Reset Board
  actions.clearAllCards();
  actions.setDrawPileCount(54);
  
  // Place initial green 7 discard card after a small delay
  setTimeout(() => {
    actions.setDiscardPile([createCard('green', '7')]);
  }, 400);

  if (players.length === 0) return;

  // 2. Sort players by seat number so dealer starts at Seat 1 (or lowest)
  const sortedPlayers = [...players].sort((a, b) => a.seatNumber - b.seatNumber);

  // 3. Generate the exact 7 demo cards for the local player
  const localDemoHand = generatePhase3DemoHand();

  // Draw pile coordinate (3D starting point)
  const deckPos: [number, number, number] = [-0.72, 0.08, 0];
  const deckRot: [number, number, number] = [0, 0, 0];

  const cardsPerPlayer = 7;
  let throwIndex = 0;

  // Stagger throws (Seat 1 -> Seat 2 -> ... round by round)
  for (let round = 0; round < cardsPerPlayer; round++) {
    for (const player of sortedPlayers) {
      const seatNo = player.seatNumber;
      const isLocal = seatNo === localSeatNumber;
      const delay = throwIndex * 150; // 150ms delay between consecutive card throws

      setTimeout(() => {
        const triggerDealCard = (window as any).triggerDealCard;
        if (!triggerDealCard) return;

        // Generate card details
        let card: CardItem;
        if (isLocal) {
          // Use the specific requested demo card for this round
          card = localDemoHand[round] || createCard('red', '5');
        } else {
          // Opponents receive random cards (backs are shown anyway)
          const colors = ['red', 'blue', 'green', 'yellow'] as const;
          const color = colors[Math.floor(Math.random() * colors.length)];
          const value = String(Math.floor(Math.random() * 10)) as any;
          card = createCard(color, value);
        }

        // Determine destination coordinates in 3D Canvas
        // Opponents: float above seat. Local player: fly to Visual Slot 1 (bottom center avatar)
        const transform = getSeatCoords(seatNo, localSeatNumber);
        
        // Opponents receive card backs at their seat
        // Local player cards fly to bottom center seat, then join the bottom panel
        const endPos: [number, number, number] = [
          transform.position[0],
          transform.position[1] + (isLocal ? 0.05 : 0.22), // Elevate opponent cards
          transform.position[2] - (isLocal ? 0.05 : 0.1), // Pull slightly in front
        ];
        
        const endRot: [number, number, number] = [
          isLocal ? -Math.PI / 8 : 0.1, 
          0, 
          0
        ];

        // Trigger the 3D flying card mesh
        triggerDealCard(
          card.color,
          card.value,
          deckPos,
          endPos,
          deckRot,
          endRot,
          isLocal, // Face up only for local player
          2.2, // Speed factor
          () => {
            // Callback: append card to hand and update deck count
            actions.addCardToPlayer(seatNo, card);
            actions.setDrawPileCount(Math.max(0, 54 - throwIndex));
          }
        );

      }, delay);

      throwIndex++;
    }
  }
};
