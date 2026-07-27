import mongoose from 'mongoose';

/**
 * Optional hook for collection-level query tracking.
 * Boilerplate ships with a no-op implementation.
 */
export const installQueryPerformanceTracking = () => {
  if (!mongoose.connection.db) {
    return;
  }
};
