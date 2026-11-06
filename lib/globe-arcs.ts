/* Extracted from the captured site's own chunk by scripts/extract-globe-data.mjs — do not edit. */
export interface Arc {
  order: number;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  arcAlt: number;
  color: string;
}

export const ARC_COLORS = ['#06b6d4', '#3b82f6', '#6366f1'];

const SEEDS: Arc[] = [
  { order: 1, startLat: -190.885592, startLng: -430.951191, endLat: -220.9068, endLng: -430.1729, arcAlt: 0.1, color: ARC_COLORS[Math.floor(Math.random() * (ARC_COLORS.length - 1))] },
  { order: 1, startLat: 280.6139, startLng: 770.209, endLat: 30.139, endLng: 1010.6869, arcAlt: 0.2, color: ARC_COLORS[Math.floor(Math.random() * (ARC_COLORS.length - 1))] },
  { order: 1, startLat: -190.885592, startLng: -430.951191, endLat: -10.303396, endLng: 360.852443, arcAlt: 0.5, color: ARC_COLORS[Math.floor(Math.random() * (ARC_COLORS.length - 1))] },
  { order: 2, startLat: 10.3521, startLng: 1030.8198, endLat: 350.6762, endLng: 1390.6503, arcAlt: 0.2, color: ARC_COLORS[Math.floor(Math.random() * (ARC_COLORS.length - 1))] },
  { order: 2, startLat: 510.5072, startLng: -0.1276, endLat: 30.139, endLng: 1010.6869, arcAlt: 0.3, color: ARC_COLORS[Math.floor(Math.random() * (ARC_COLORS.length - 1))] },
  { order: 2, startLat: -150.785493, startLng: -470.909029, endLat: 360.162809, endLng: -1150.119411, arcAlt: 0.3, color: ARC_COLORS[Math.floor(Math.random() * (ARC_COLORS.length - 1))] },
  { order: 3, startLat: -330.8688, startLng: 1510.2093, endLat: 220.3193, endLng: 1140.1694, arcAlt: 0.3, color: ARC_COLORS[Math.floor(Math.random() * (ARC_COLORS.length - 1))] },
  { order: 3, startLat: 210.3099, startLng: -1570.8581, endLat: 400.7128, endLng: -740.006, arcAlt: 0.3, color: ARC_COLORS[Math.floor(Math.random() * (ARC_COLORS.length - 1))] },
  { order: 3, startLat: -60.2088, startLng: 1060.8456, endLat: 510.5072, endLng: -0.1276, arcAlt: 0.3, color: ARC_COLORS[Math.floor(Math.random() * (ARC_COLORS.length - 1))] },
  { order: 4, startLat: 110.986597, startLng: 80.571831, endLat: -150.595412, endLng: -560.05918, arcAlt: 0.5, color: ARC_COLORS[Math.floor(Math.random() * (ARC_COLORS.length - 1))] },
  { order: 4, startLat: -340.6037, startLng: -580.3816, endLat: 220.3193, endLng: 1140.1694, arcAlt: 0.7, color: ARC_COLORS[Math.floor(Math.random() * (ARC_COLORS.length - 1))] },
  { order: 4, startLat: 510.5072, startLng: -0.1276, endLat: 480.8566, endLng: -20.3522, arcAlt: 0.1, color: ARC_COLORS[Math.floor(Math.random() * (ARC_COLORS.length - 1))] },
  { order: 5, startLat: 140.5995, startLng: 1200.9842, endLat: 510.5072, endLng: -0.1276, arcAlt: 0.3, color: ARC_COLORS[Math.floor(Math.random() * (ARC_COLORS.length - 1))] },
  { order: 5, startLat: 10.3521, startLng: 1030.8198, endLat: -330.8688, endLng: 1510.2093, arcAlt: 0.2, color: ARC_COLORS[Math.floor(Math.random() * (ARC_COLORS.length - 1))] },
  { order: 5, startLat: 340.0522, startLng: -1180.2437, endLat: 480.8566, endLng: -20.3522, arcAlt: 0.2, color: ARC_COLORS[Math.floor(Math.random() * (ARC_COLORS.length - 1))] },
  { order: 6, startLat: -150.432563, startLng: 280.315853, endLat: 10.094136, endLng: -630.34546, arcAlt: 0.7, color: ARC_COLORS[Math.floor(Math.random() * (ARC_COLORS.length - 1))] },
  { order: 6, startLat: 370.5665, startLng: 1260.978, endLat: 350.6762, endLng: 1390.6503, arcAlt: 0.1, color: ARC_COLORS[Math.floor(Math.random() * (ARC_COLORS.length - 1))] },
  { order: 6, startLat: 220.3193, startLng: 1140.1694, endLat: 510.5072, endLng: -0.1276, arcAlt: 0.3, color: ARC_COLORS[Math.floor(Math.random() * (ARC_COLORS.length - 1))] },
  { order: 7, startLat: -190.885592, startLng: -430.951191, endLat: -150.595412, endLng: -560.05918, arcAlt: 0.1, color: ARC_COLORS[Math.floor(Math.random() * (ARC_COLORS.length - 1))] },
  { order: 7, startLat: 480.8566, startLng: -20.3522, endLat: 520.52, endLng: 130.405, arcAlt: 0.1, color: ARC_COLORS[Math.floor(Math.random() * (ARC_COLORS.length - 1))] },
  { order: 7, startLat: 520.52, startLng: 130.405, endLat: 340.0522, endLng: -1180.2437, arcAlt: 0.2, color: ARC_COLORS[Math.floor(Math.random() * (ARC_COLORS.length - 1))] },
  { order: 8, startLat: -80.833221, startLng: 130.264837, endLat: -330.936138, endLng: 180.436529, arcAlt: 0.2, color: ARC_COLORS[Math.floor(Math.random() * (ARC_COLORS.length - 1))] },
  { order: 8, startLat: 490.2827, startLng: -1230.1207, endLat: 520.3676, endLng: 40.9041, arcAlt: 0.2, color: ARC_COLORS[Math.floor(Math.random() * (ARC_COLORS.length - 1))] },
  { order: 8, startLat: 10.3521, startLng: 1030.8198, endLat: 400.7128, endLng: -740.006, arcAlt: 0.5, color: ARC_COLORS[Math.floor(Math.random() * (ARC_COLORS.length - 1))] },
  { order: 9, startLat: 510.5072, startLng: -0.1276, endLat: 340.0522, endLng: -1180.2437, arcAlt: 0.2, color: ARC_COLORS[Math.floor(Math.random() * (ARC_COLORS.length - 1))] },
  { order: 9, startLat: 220.3193, startLng: 1140.1694, endLat: -220.9068, endLng: -430.1729, arcAlt: 0.7, color: ARC_COLORS[Math.floor(Math.random() * (ARC_COLORS.length - 1))] },
  { order: 9, startLat: 10.3521, startLng: 1030.8198, endLat: -340.6037, endLng: -580.3816, arcAlt: 0.5, color: ARC_COLORS[Math.floor(Math.random() * (ARC_COLORS.length - 1))] },
  { order: 10, startLat: -220.9068, startLng: -430.1729, endLat: 280.6139, endLng: 770.209, arcAlt: 0.7, color: ARC_COLORS[Math.floor(Math.random() * (ARC_COLORS.length - 1))] },
  { order: 10, startLat: 340.0522, startLng: -1180.2437, endLat: 310.2304, endLng: 1210.4737, arcAlt: 0.3, color: ARC_COLORS[Math.floor(Math.random() * (ARC_COLORS.length - 1))] },
  { order: 10, startLat: -60.2088, startLng: 1060.8456, endLat: 520.3676, endLng: 40.9041, arcAlt: 0.3, color: ARC_COLORS[Math.floor(Math.random() * (ARC_COLORS.length - 1))] },
  { order: 11, startLat: 410.9028, startLng: 120.4964, endLat: 340.0522, endLng: -1180.2437, arcAlt: 0.2, color: ARC_COLORS[Math.floor(Math.random() * (ARC_COLORS.length - 1))] },
  { order: 11, startLat: -60.2088, startLng: 1060.8456, endLat: 310.2304, endLng: 1210.4737, arcAlt: 0.2, color: ARC_COLORS[Math.floor(Math.random() * (ARC_COLORS.length - 1))] },
  { order: 11, startLat: 220.3193, startLng: 1140.1694, endLat: 10.3521, endLng: 1030.8198, arcAlt: 0.2, color: ARC_COLORS[Math.floor(Math.random() * (ARC_COLORS.length - 1))] },
  { order: 12, startLat: 340.0522, startLng: -1180.2437, endLat: 370.7749, endLng: -1220.4194, arcAlt: 0.1, color: ARC_COLORS[Math.floor(Math.random() * (ARC_COLORS.length - 1))] },
  { order: 12, startLat: 350.6762, startLng: 1390.6503, endLat: 220.3193, endLng: 1140.1694, arcAlt: 0.2, color: ARC_COLORS[Math.floor(Math.random() * (ARC_COLORS.length - 1))] },
  { order: 12, startLat: 220.3193, startLng: 1140.1694, endLat: 340.0522, endLng: -1180.2437, arcAlt: 0.3, color: ARC_COLORS[Math.floor(Math.random() * (ARC_COLORS.length - 1))] },
  { order: 13, startLat: 520.52, startLng: 130.405, endLat: 220.3193, endLng: 1140.1694, arcAlt: 0.3, color: ARC_COLORS[Math.floor(Math.random() * (ARC_COLORS.length - 1))] },
  { order: 13, startLat: 110.986597, startLng: 80.571831, endLat: 350.6762, endLng: 1390.6503, arcAlt: 0.3, color: ARC_COLORS[Math.floor(Math.random() * (ARC_COLORS.length - 1))] },
  { order: 13, startLat: -220.9068, startLng: -430.1729, endLat: -340.6037, endLng: -580.3816, arcAlt: 0.1, color: ARC_COLORS[Math.floor(Math.random() * (ARC_COLORS.length - 1))] },
  { order: 14, startLat: -330.936138, startLng: 180.436529, endLat: 210.395643, endLng: 390.883798, arcAlt: 0.3, color: ARC_COLORS[Math.floor(Math.random() * (ARC_COLORS.length - 1))] },
];

/** The reference picks each arc's colour at random from the first two on every load. */
export const arcs = (): Arc[] => SEEDS.map(seed => ({ ...seed, color: ARC_COLORS[Math.floor(Math.random() * (ARC_COLORS.length - 1))] }));
