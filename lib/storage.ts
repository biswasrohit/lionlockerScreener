// Hand-prepared storage answers shown by the LionLocker prototype.
// Edit the cards below to change what participants see. Every fact should
// come from an official Columbia page listed in `sources`.

export const BUILDINGS = [
  { id: "butler", label: "Butler Library" },
  { id: "dodge", label: "Dodge Fitness Center" },
  { id: "lerner", label: "Lerner Hall" },
  { id: "mudd", label: "Mudd" },
  { id: "uris", label: "Uris" },
] as const;

export const DURATIONS = [
  { id: "now", label: "Right now" },
  { id: "later_today", label: "Later today" },
  { id: "semester", label: "Rest of the semester" },
] as const;

export type BuildingId = (typeof BUILDINGS)[number]["id"];
export type DurationId = (typeof DURATIONS)[number]["id"];

export const BUILDING_IDS = BUILDINGS.map((b) => b.id) as [BuildingId, ...BuildingId[]];
export const DURATION_IDS = DURATIONS.map((d) => d.id) as [DurationId, ...DurationId[]];

export type TagTone = "default" | "warning";

export interface StorageTag {
  readonly label: string;
  readonly tone: TagTone;
}

export interface StorageSource {
  readonly label: string;
  readonly url: string;
}

export interface StorageCard {
  readonly id: string;
  readonly building: BuildingId;
  readonly durations: readonly DurationId[];
  readonly title: string;
  readonly tags: readonly StorageTag[];
  readonly steps: readonly string[];
  readonly sources: readonly StorageSource[];
}

const BUTLER_LOCKERS_SOURCE: StorageSource = {
  label: "Butler Library lockers",
  url: "https://library.columbia.edu/using-libraries/lio/butler-lockers.html",
};

export const STORAGE_CARDS: readonly StorageCard[] = [
  {
    id: "dodge-daily-locker",
    building: "dodge",
    durations: ["now", "later_today"],
    title: "Dodge daily locker",
    tags: [
      { label: "Free with locker service", tone: "default" },
      { label: "During your workout", tone: "default" },
    ],
    steps: [
      "Bring your CUID to the Equipment Room in Dodge.",
      "Show it to get a daily locker key.",
      "Use the key. Don't bring your own lock.",
      "Return the key before you leave the gym. Unreturned keys are charged.",
    ],
    sources: [
      { label: "PE&Rec policies", url: "https://perec.columbia.edu/policies" },
      {
        label: "Equipment check-out",
        url: "https://perec.columbia.edu/content/equipment-check-out",
      },
    ],
  },
  {
    id: "dodge-overnight-box",
    building: "dodge",
    durations: ["semester"],
    title: "Dodge overnight box locker",
    tags: [
      { label: "Rental", tone: "default" },
      { label: "Semester", tone: "default" },
    ],
    steps: [
      "Ask the Recreation Operations Office in Dodge about rental price and availability.",
      "Rentals include daily towel and locker service.",
    ],
    sources: [
      {
        label: "PE&Rec memberships",
        url: "https://perec.columbia.edu/content/memberships-cloned",
      },
    ],
  },
  {
    id: "butler-grad-locker",
    building: "butler",
    durations: ["semester"],
    title: "Butler graduate locker",
    tags: [
      { label: "Closed for 2026-27", tone: "warning" },
      { label: "Lottery, grad students", tone: "default" },
    ],
    steps: [
      "Grad lockers are assigned by a yearly lottery.",
      "This year's lottery ran Aug 11 to Sept 18, 2026, so no lockers are open now.",
      "The next lottery opens next August.",
      "The library supplies the lock.",
      "Students with a Butler study carrel are not eligible.",
    ],
    sources: [BUTLER_LOCKERS_SOURCE],
  },
  {
    id: "butler-day-storage",
    building: "butler",
    durations: ["now", "later_today"],
    title: "Butler day storage",
    tags: [{ label: "None found", tone: "warning" }],
    steps: [
      "We couldn't find day-use lockers in Butler.",
      "Lockers here are only through the yearly lottery.",
    ],
    sources: [BUTLER_LOCKERS_SOURCE],
  },
];

export type StorageLookup =
  | { readonly kind: "results"; readonly cards: readonly StorageCard[] }
  | { readonly kind: "not_mapped" }
  | { readonly kind: "none_for_duration" };

export function findStorage(
  building: BuildingId,
  duration: DurationId,
  cards: readonly StorageCard[] = STORAGE_CARDS,
): StorageLookup {
  const atBuilding = cards.filter((card) => card.building === building);
  if (atBuilding.length === 0) {
    return { kind: "not_mapped" };
  }
  const matches = atBuilding.filter((card) => card.durations.includes(duration));
  if (matches.length === 0) {
    return { kind: "none_for_duration" };
  }
  return { kind: "results", cards: matches };
}

export function buildingLabel(id: BuildingId): string {
  return BUILDINGS.find((b) => b.id === id)?.label ?? id;
}

export function durationLabel(id: DurationId): string {
  return DURATIONS.find((d) => d.id === id)?.label ?? id;
}
