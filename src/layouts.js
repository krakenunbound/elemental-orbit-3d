const TAU = Math.PI * 2;

// Every card must orbit outside this occlusion sphere; anything inside it is
// hidden by the relationship view's depth mask.
export const OCCLUSION_SPHERE_RADIUS = 7.82;
export const RELATIONSHIP_SHELL_RADIUS = 8.3;

export function periodLatitude(period) {
  return (4 - period) * 0.28;
}

// Ungrouped f-series elements reuse main-table column slots for spacing, but
// their cards are staggered half a slot so the layout does not imply false
// d/p-block family relationships. La and Ac deliberately remain unstaggered:
// under this table's traditional convention they are group 3 with Sc and Y.
const F_SERIES_COLUMN_STAGGER = 0.5;

function relationshipColumn(element) {
  return element.tableColumn + (element.tableRow >= 7 && element.group === null ? F_SERIES_COLUMN_STAGGER : 0);
}

export function relationshipCoordinate(element) {
  const isFSeriesRow = element.tableRow >= 7;
  const column = relationshipColumn(element);
  const latitude = periodLatitude(element.period) + (isFSeriesRow ? 0.13 : 0);
  const longitude = (column / 18) * TAU - Math.PI * 0.5;
  const radius = RELATIONSHIP_SHELL_RADIUS;
  const horizontalRadius = Math.cos(latitude) * radius;
  return {
    x: Math.cos(longitude) * horizontalRadius,
    y: Math.sin(latitude) * radius,
    z: Math.sin(longitude) * horizontalRadius,
    latitude,
    longitude,
    radius
  };
}

export function meridianArcCoordinates(column, radius = 8.08, segments = 72) {
  const longitude = (column / 18) * TAU - Math.PI * 0.5;
  return Array.from({ length: segments + 1 }, (_, index) => {
    const latitude = -Math.PI * 0.5 + (index / segments) * Math.PI;
    const horizontalRadius = Math.cos(latitude) * radius;
    return {
      x: Math.cos(longitude) * horizontalRadius,
      y: Math.sin(latitude) * radius,
      z: Math.sin(longitude) * horizontalRadius
    };
  });
}

// Cylindrical helix in the spirit of de Chancourtois' telluric screw: each
// period is one full turn on a constant-radius cylinder, so same-column
// elements must keep identical angles for family rails to stay straight
// vertical lines down the wall.
const SPIRAL_PITCH = 1.55;
const SPIRAL_APEX_Y = 5.4;
const SPIRAL_RADIUS = 6.6;
const SPIRAL_F_SERIES_DROP = 0.62;
const SPIRAL_F_SERIES_INSET = 0.55;

export function periodicSpiralCoordinate(element) {
  const isFSeriesRow = element.tableRow >= 7;
  const column = relationshipColumn(element);
  const angle = (column / 18) * TAU + Math.PI * 0.5;
  const turns = element.period - 1 + column / 18;
  const radius = SPIRAL_RADIUS - (isFSeriesRow ? SPIRAL_F_SERIES_INSET : 0);
  return {
    x: Math.cos(angle) * radius,
    y: SPIRAL_APEX_Y - turns * SPIRAL_PITCH - (isFSeriesRow ? SPIRAL_F_SERIES_DROP : 0),
    z: Math.sin(angle) * radius,
    angle,
    radius
  };
}
