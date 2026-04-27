export interface PollOption {
  id: string;
  pollId: string;
  text: string;
  vote_count: number;
  createdAt?: string;
}

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

export interface Vote {
  id: string;
  pollId: string;
  optionId: string;
  voterIdentifier: string;
  createdAt?: string;
}

export interface CreatePollData {
  title: string;
  description: string;
  deadline: string;
  category: string;
  allow_multiple: boolean;
  options: string[];
}