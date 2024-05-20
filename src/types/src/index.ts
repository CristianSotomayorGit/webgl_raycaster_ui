export interface Map {
  rows: number;
  columns: number;
  cellSize: number;
  cellSizeNormalized: number;
  cells: number[];
}

export interface Ray {
  x: number;
  y: number;
  xOffset: number;
  yOffset: number;
  angle: number;
}

export interface Player {
  location: Point;
  locationDelta: Point;
  angle: number;
  depthOfField: number;
}

export interface Point {
  x: number;
  y: number;
}
