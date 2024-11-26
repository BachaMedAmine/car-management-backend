// src/types/express.d.ts
import { User } from 'src/users/schemas/user.schema';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
      };
    }
  }
}