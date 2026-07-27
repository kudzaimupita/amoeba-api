/* eslint-disable import/no-extraneous-dependencies */
import { Document, Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { IOptions, QueryResult } from '../../utils/paginate/paginate';

export interface IActivityLog extends Document {
  userId: ObjectId; // Reference to the User
  actionType:
    | 'LOGIN'
    | 'LOGOUT'
    | 'CREATE'
    | 'UPDATE'
    | 'DELETE'
    | 'RESTORE'
    | 'ERROR'
    | 'READ'
    | 'SECURITY_BREACH'
    | 'DATA_CHANGE'
    | 'NETWORK_EVENT'
    | 'SYSTEM_EVENT'
    | 'SECURITY_WARNING'
    | 'SOFT_DELETE'
    | 'IN_PROGRESS'
    | 'PARTIAL_SUCCESS'
    | 'FAILED';
  resourceType: 'USER' | 'APPLICATION' | 'DATA' | 'NETWORK' | 'SYSTEM' | 'TOKEN' | 'COMPANY';
  resourceId?: ObjectId;
  company?: ObjectId;
  description: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  version: number;
  sessionId?: string;
  status?: 'SUCCESS' | 'FAILURE' | 'FAILED' | 'IN_PROGRESS' | 'PARTIAL_SUCCESS';
  errorCode?: string;
  additionalInfo?: Record<string, any>;
}

export interface IActivityLogModel extends Model<IActivityLogDoc> {
  paginate(filter: Record<string, any>, options: IOptions): unknown;
}
export interface IActivityLogDoc extends IActivityLog, Document {
  paginate(filter: Record<string, any>, options: Record<string, any>): Promise<QueryResult>;
}
