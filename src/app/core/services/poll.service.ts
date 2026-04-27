import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { CreatePollData, Poll } from '../models/poll.model';

@Injectable({
  providedIn: 'root'
})
export class PollService {
  private supabase = this.supabaseService.getClient();

  constructor(private supabaseService: SupabaseService) {}

  async loadPolls(): Promise<Poll[]> {
    const { data, error } = await this.supabase
      .from('polls')
      .select('*, options(*)')
      .order('created_at', { ascending: false })
      .order('id', { foreignTable: 'options', ascending: true });

    if (error) {
      throw error;
    }

    return data as Poll[];
  }

  async createPoll(pollData: CreatePollData): Promise<string> {
    const { data: poll, error: pollError } = await this.supabase
      .from('polls')
      .insert({
        title: pollData.title,
        description: pollData.description,
        deadline: pollData.deadline,
        category: pollData.category,
        allow_multiple: pollData.allow_multiple
      })
      .select()
      .single();

    if (pollError) {
      throw pollError;
    }

    const options = pollData.options.map((text) => ({
      poll_id: poll.id,
      text,
      vote_count: 0
    }));

    const { error: optionsError } = await this.supabase
      .from('options')
      .insert(options);

    if (optionsError) {
      throw optionsError;
    }

    return poll.id;
  }
  async getPollById(id: string): Promise<Poll | null> {
  const { data, error } = await this.supabase
    .from('polls')
    .select('*, options(*)')
    .eq('id', id)
    .order('id', { foreignTable: 'options', ascending: true })
    .single();

  if (error) {
    return null;
  }

  return data as Poll;
}

async vote(
  pollId: string,
  optionId: string,
  voterIdentifier: string
): Promise<void> {
  const { error: voteError } = await this.supabase
    .from('votes')
    .insert({
      poll_id: pollId,
      option_id: optionId,
      voter_identifier: voterIdentifier
    });

  if (voteError) {
    throw voteError;
  }

  const { error: incrementError } = await this.supabase
    .rpc('increment_vote_count', {
      option_id_param: optionId
    });

  if (incrementError) {
    throw incrementError;
  }
}

async getUserVotes(pollId: string, voterIdentifier: string): Promise<string[]> {
  const { data, error } = await this.supabase
    .from('votes')
    .select('option_id')
    .eq('poll_id', pollId)
    .eq('voter_identifier', voterIdentifier);

  if (error || !data) {
    return [];
  }

  return data.map((row) => row.option_id);
}
subscribeToPollUpdates(pollId: string, callback: () => void) {
  return this.supabase
    .channel(`poll-${pollId}-updates`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'options',
        filter: `poll_id=eq.${pollId}`
      },
      () => callback()
    )
    .subscribe();
} }
