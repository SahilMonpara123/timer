export type Database = {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          manager_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          manager_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          manager_id?: string;
        };
      };
      time_logs: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          hours: number;
          notes: string;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          hours: number;
          notes?: string;
          date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          hours?: number;
          notes?: string;
          date?: string;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          role: 'manager' | 'employee';
          full_name: string;
        };
        Insert: {
          id: string;
          email: string;
          role: 'manager' | 'employee';
          full_name: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: 'manager' | 'employee';
          full_name?: string;
        };
      };
      project_employees: {
        Row: {
          project_id: string;
          user_id: string;
          invite_email: string;
          invite_token: string;
          status: 'invited' | 'accepted' | 'declined';
        };
        Insert: {
          project_id: string;
          user_id?: string;
          invite_email: string;
          invite_token: string;
          status: 'invited' | 'accepted' | 'declined';
        };
        Update: {
          project_id?: string;
          user_id?: string;
          invite_email?: string;
          invite_token?: string;
          status?: 'invited' | 'accepted' | 'declined';
        };
      };
    };
  };
};
