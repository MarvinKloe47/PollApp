import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Poll } from '../models/poll.model';

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
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data as Poll[];
  }
}