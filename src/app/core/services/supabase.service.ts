import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

/**
 * Creates and exposes the shared Supabase client used by the application.
 */
@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  /** Lazily reused Supabase client instance for API access. */
  private client: SupabaseClient;

  /**
   * Initializes the Supabase client with the project's public configuration.
   */
  constructor() {
    this.client = createClient(
      environment.supabaseUrl,
      environment.supabaseKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      }
    );
  }

  /**
   * Returns the configured Supabase client instance.
   *
   * @returns Shared client used for all database interactions.
   */
  getClient(): SupabaseClient {
    return this.client;
  }
}
