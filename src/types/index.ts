import { Request } from "express";
import { IUser } from "../models/user";

export interface CustomRequest extends Request {
  userId?: string;
  user: IUser;
}

export interface PaginatedResponse<T> {
  meta: {
    totalRecords: number;
    totalPages: number;
    currentPage: number;
  };
  data: T[];
}
