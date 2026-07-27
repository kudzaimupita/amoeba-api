import mongoose from 'mongoose';

/**
 * Optional hook for collection-level query tracking.
 */
export const installQueryPerformanceTracking = () => {
  if (!mongoose.connection.db) {
    return;
  }
};
