/**
 * Represents a selectable answer option that belongs to a poll.
 */
export interface PollOption {
  id: string;
  pollId: string;
  text: string;
  vote_count: number;
  createdAt?: string;
}

/**
 * Represents one question in a poll and its answer options.
 */
export interface PollQuestion {
  id: string;
  text: string;
  allow_multiple: boolean;
  options: PollOption[];
}

/**
 * Represents a poll together with its answer options.
 */
export interface Poll {
  id: string;
  title: string;
  description: string;
  deadline: string | null;
  category: string;
  allow_multiple: boolean;
  createdAt?: string;
  options: PollOption[];
  questions: PollQuestion[];
}

/**
 * Payload question used while creating a poll.
 */
export interface CreatePollQuestionData {
  text: string;
  allow_multiple: boolean;
  options: string[];
}

/**
 * Represents a single vote submitted by one participant.
 */
export interface Vote {
  id: string;
  pollId: string;
  optionId: string;
  voterIdentifier: string;
  createdAt?: string;
}

/**
 * Payload required to create a new poll and its options.
 */
export interface CreatePollData {
  title: string;
  description: string;
  deadline: string | null;
  category: string;
  questions: CreatePollQuestionData[];
}
