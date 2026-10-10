export const workoutPlanExportFormatVersion = 1;

export type WorkoutPlanExportFile = {
  formatVersion: number;
  planId: string;
  planVersion: number;
  planName: string;
  clientDisplayName?: string;
  exportedAt: string;
  days: Array<{
    id: string;
    name: string;
    order: number;
    exercises: Array<{
      id: string;
      exerciseId: string;
      name: string;
      muscleGroup: string;
      sets: number;
      repetitions: string;
      restSeconds: number;
      notes?: string;
      order: number;
    }>;
  }>;
  customExercises: Array<{
    id: string;
    name: string;
    muscleGroup: string;
    description?: string;
  }>;
};
