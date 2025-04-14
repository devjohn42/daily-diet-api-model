import { Knex } from "knex";

declare module 'knex/types/tables' {
  export interface Tables {
    users: {
      id: string;
      name: string;
      email: string;
      session_id: string;
    }
    meals: {
      id: string
      name: string
      description: string
      in_diet: boolean
      created_at: string // Date
      session_id?: string
    }
  }
}