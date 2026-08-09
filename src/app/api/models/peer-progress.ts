export interface PeerMedianPoint {
  date: string;
  /**
   * Median proportion of target task weight still remaining across the cohort,
   * 0..1. This is the same scale the burndown's own series use before they are
   * converted to a percentage for display.
   */
  remaining: number;
}

export interface PeerProgressResponse {
  project_id: number;
  /** The median covers students in this unit targeting this same grade. */
  target_grade: number;
  /** How many students the median was taken across. */
  cohort_size: number;
  /** One point per week, on the same weekly grid the burndown plots. */
  median_burndown: PeerMedianPoint[];
}
