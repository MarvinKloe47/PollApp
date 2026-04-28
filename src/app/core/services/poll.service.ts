import { Injectable } from '@angular/core';
import { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { CreatePollData, Poll } from '../models/poll.model';

/**
 * Encapsulates all poll-related database operations.
 */
@Injectable({
  providedIn: 'root'
})
export class PollService {
  private readonly supabase: SupabaseClient = this.supabaseService.getClient();

  /**
   * Creates the service with access to the shared Supabase client factory.
   *
   * @param supabaseService Service that exposes the configured Supabase client.
   */
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Loads all polls together with their options ordered by creation date.
   *
   * @returns A list of polls including their nested options.
   */
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

  /**
   * Persists a new poll and inserts its answer options.
   *
   * @param pollData User-provided values used to create the poll.
   * @returns The identifier of the newly created poll.
   */
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

  /**
   * Loads a single poll by its identifier.
   *
   * @param id Identifier of the poll to retrieve.
   * @returns The matching poll or `null` when it cannot be loaded.
   */
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

  /**
   * Stores a vote and increments the corresponding option counter.
   *
   * @param pollId Identifier of the poll receiving the vote.
   * @param optionId Identifier of the selected option.
   * @param voterIdentifier Stable client-side identifier for the voter.
   */
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

  /**
   * Resolves the option previously selected by a voter for a poll.
   *
   * @param pollId Identifier of the poll to inspect.
   * @param voterIdentifier Stable client-side identifier for the voter.
   * @returns The chosen option identifier or `null` if no vote exists.
   */
  async getUserVote(
    pollId: string,
    voterIdentifier: string
  ): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('votes')
      .select('option_id')
      .eq('poll_id', pollId)
      .eq('voter_identifier', voterIdentifier)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data.option_id;
  }

  /**
   * Resolves all options previously selected by a voter for a poll.
   *
   * @param pollId Identifier of the poll to inspect.
   * @param voterIdentifier Stable client-side identifier for the voter.
   * @returns A list of chosen option identifiers.
   */
  async getUserVotes(
    pollId: string,
    voterIdentifier: string
  ): Promise<string[]> {
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

  /**
   * Subscribes to live option updates for a poll.
   *
   * @param pollId Identifier of the poll whose options should be observed.
   * @param callback Function invoked whenever a relevant update is received.
   * @returns The Supabase channel subscription.
   */
  subscribeToPollUpdates(pollId: string, callback: () => void): RealtimeChannel {
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
  }
}
