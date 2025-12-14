export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          email: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          email?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          username?: string;
          email?: string | null;
          avatar_url?: string | null;
        };
      };
      contacts: {
        Row: {
          id: string;
          user_id: string;
          contact_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          contact_id: string;
        };
        Update: {
          user_id?: string;
          contact_id?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          text: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          sender_id: string;
          receiver_id: string;
          text: string;
          read?: boolean;
        };
        Update: {
          text?: string;
          read?: boolean;
        };
      };
      channels: {
        Row: {
          id: string;
          name: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          name: string;
          created_by: string;
        };
        Update: {
          name?: string;
        };
      };
      channel_members: {
        Row: {
          id: string;
          channel_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          channel_id: string;
          user_id: string;
        };
        Update: {};
      };
    };
  };
}