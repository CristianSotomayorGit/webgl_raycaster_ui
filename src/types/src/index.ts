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

  horizontalCheck: {
    x: number,
    y: number,
    distance: number,
  }

  verticalCheck: {
    x: number,
    y: number,
    distance: number,
  }

  projection : {
    height: number;
    width: number;
    offset: number;
    coordinates: number[];
  }

  hit: {
    distance: number
    plane: 'HORIZONTAL' | 'VERTICAL' | ''
  }
}

export interface Player {
  location: Point;
  locationDelta: Point;
  angle: number;
  depthOfField: number;
  speed: number;
}

export interface Point {
  x: number;
  y: number;
}
