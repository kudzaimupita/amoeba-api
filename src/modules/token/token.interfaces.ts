import { Document, Model } from 'mongoose';
import { JwtPayload } from 'jsonwebtoken';
import { QueryResult } from '../../utils/paginate/paginate';
// import { QueryResult } from '../../utils/paginate';
export interface IToken {
  token: string;
  user: string;
  type: string;
  expires: Date;
  blacklisted: boolean;
  pin: number;
  sessionDetails: any;
  workspace?: string;
}

export type NewToken = Omit<IToken, 'blacklisted'>;

export interface ITokenDoc extends IToken, Document {}

export interface ITokenModel extends Model<ITokenDoc> {
  paginate(filter: Record<string, any>, options: Record<string, any>): Promise<QueryResult>;
}

export interface IPayload extends JwtPayload {
  sub: string;
  iat: number;
  exp: number;
  type: string;
  wid?: string;
}

export interface TokenPayload {
  token: string;
  expires: Date;
}

export interface PinPayload {
  token: string;
}

export interface AccessAndRefreshTokens {
  access: TokenPayload;
  refresh: TokenPayload;
  pin: PinPayload;
}
