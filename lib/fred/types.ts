export type FredObservation = {
  date: string;
  value: number;
};

export type FredObservationsResult = {
  seriesId: string;
  observations: FredObservation[];
};

export type FredFetchObservationsParams = {
  seriesId: string;
  observationStart: string;
};
