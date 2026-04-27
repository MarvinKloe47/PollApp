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
 * Represents a poll together with its answer options.
 */
export interface Poll {
  id: string;
  title: string;
  description: string;
  deadline: string;
  category: string;
  allow_multiple: boolean;
  createdAt?: string;
  options: PollOption[];
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
  deadline: string;
  category: string;
  allow_multiple: boolean;
  options: string[];
}
