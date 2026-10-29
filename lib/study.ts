// Study design: scenarios, conditions, screener options and random assignment.

export const SCENARIOS = {
  dodge: {
    id: "dodge",
    title: "Gym after studying",
    prompt:
      "You finish studying at 5pm and head to Dodge Fitness Center for an hour-long workout. You have your laptop and backpack with you. Where could you leave them during the workout, and what do you need to do to get it?",
  },
  butler: {
    id: "butler",
    title: "A locker for the semester",
    prompt:
      "It's late October. You'll be studying in Butler Library most days this semester and want a locker there so you can stop carrying your books and charger. Can you get one right now? If so, how?",
  },
} as const;

export type ScenarioId = keyof typeof SCENARIOS;
export const SCENARIO_IDS = ["dodge", "butler"] as const satisfies readonly ScenarioId[];

export const CONDITIONS = {
  status_quo: {
    id: "status_quo",
    label: "Status quo",
    instructions:
      "Find the answer the way you normally would: Google, Columbia websites, apps, anything on your phone. Switch tabs freely, then come back and type what you found.",
  },
  prototype: {
    id: "prototype",
    label: "Prototype",
    instructions: "Use LionLocker to find the answer. It's an early version of our idea.",
  },
} as const;

export type ConditionId = keyof typeof CONDITIONS;
export const CONDITION_IDS = ["status_quo", "prototype"] as const satisfies readonly ConditionId[];

export const TASK_ORDERS = ["status_quo_first", "prototype_first"] as const;
export type TaskOrder = (typeof TASK_ORDERS)[number];

export const SCREENER = {
  is_grad: {
    question: "Are you a Columbia graduate student?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  days_on_campus: {
    question: "How many days a week are you on campus for 6+ hours?",
    options: [
      { value: "0", label: "0" },
      { value: "1-2", label: "1-2" },
      { value: "3-4", label: "3-4" },
      { value: "5+", label: "5+" },
    ],
  },
  carries_laptop: {
    question: "Do you usually carry a laptop on those days?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  source: {
    question: "How did you get to this page?",
    options: [
      { value: "team_member", label: "A team member handed me this" },
      { value: "class_group", label: "Class or department group" },
      { value: "friend", label: "A friend sent it" },
      { value: "other", label: "Other" },
    ],
  },
} as const;

type OptionValues<K extends keyof typeof SCREENER> =
  (typeof SCREENER)[K]["options"][number]["value"];

export type IsGrad = OptionValues<"is_grad">;
export type DaysOnCampus = OptionValues<"days_on_campus">;
export type CarriesLaptop = OptionValues<"carries_laptop">;
export type Source = OptionValues<"source">;

export const IS_GRAD_VALUES = ["yes", "no"] as const satisfies readonly IsGrad[];
export const DAYS_VALUES = ["0", "1-2", "3-4", "5+"] as const satisfies readonly DaysOnCampus[];
export const LAPTOP_VALUES = ["yes", "no"] as const satisfies readonly CarriesLaptop[];
export const SOURCE_VALUES = [
  "team_member",
  "class_group",
  "friend",
  "other",
] as const satisfies readonly Source[];

export const WOULD_USE_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "maybe", label: "Maybe" },
  { value: "no", label: "No" },
] as const;
export type WouldUse = (typeof WOULD_USE_OPTIONS)[number]["value"];
export const WOULD_USE_VALUES = ["yes", "maybe", "no"] as const satisfies readonly WouldUse[];

export interface ScreenerAnswers {
  readonly is_grad: IsGrad;
  readonly days_on_campus: DaysOnCampus;
  readonly carries_laptop: CarriesLaptop;
  readonly source: Source;
}

export function isEligible(answers: ScreenerAnswers): boolean {
  return (
    answers.is_grad === "yes" &&
    answers.carries_laptop === "yes" &&
    answers.days_on_campus !== "0"
  );
}

export interface TaskAssignment {
  readonly condition: ConditionId;
  readonly scenario: ScenarioId;
}

export interface Assignment {
  readonly order: TaskOrder;
  readonly tasks: readonly [TaskAssignment, TaskAssignment];
}

/**
 * Randomly picks (a) which condition goes first and (b) which scenario pairs
 * with which condition. Each is an independent coin flip.
 * `random` returns a number in [0, 1) and is injectable for tests.
 */
export function assignTasks(random: () => number): Assignment {
  const prototypeFirst = random() < 0.5;
  const dodgeWithStatusQuo = random() < 0.5;

  const statusQuo: TaskAssignment = {
    condition: "status_quo",
    scenario: dodgeWithStatusQuo ? "dodge" : "butler",
  };
  const prototype: TaskAssignment = {
    condition: "prototype",
    scenario: dodgeWithStatusQuo ? "butler" : "dodge",
  };

  return prototypeFirst
    ? { order: "prototype_first", tasks: [prototype, statusQuo] }
    : { order: "status_quo_first", tasks: [statusQuo, prototype] };
}

/** Uniform random number in [0, 1) from the Web Crypto API. */
export function cryptoRandom(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] / 2 ** 32;
}

export const CONFIDENCE_SCALE = [1, 2, 3, 4, 5] as const;
export const MIN_ANSWER_LENGTH = 3;
export const MAX_ANSWER_LENGTH = 4000;
export const MAX_BLOCKER_LENGTH = 2000;
