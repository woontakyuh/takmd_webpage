export interface ScheduleOverride {
  readonly name?: string;
  readonly place?: string;
  readonly topics?: readonly string[];
  readonly url?: string;
}

interface SchedulePresentation {
  readonly date: string;
  readonly name: string;
  readonly place: string;
  readonly topics: readonly string[];
  readonly url: string;
}

export function applyOverrides<T extends SchedulePresentation>(
  presentation: T,
  overrides: Readonly<Record<string, ScheduleOverride>>,
) {
  const override = overrides[presentation.date];
  return {
    ...presentation,
    name: override?.name ?? presentation.name,
    place: override?.place ?? presentation.place,
    topics: override?.topics ? [...override.topics] : presentation.topics,
    url: override?.url ?? presentation.url,
  };
}
