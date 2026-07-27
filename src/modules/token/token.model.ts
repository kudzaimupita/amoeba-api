import mongoose from 'mongoose';
import tokenTypes from './token.types';
import toJSON from '../../utils/toJSON/toJSON';
import { ITokenDoc, ITokenModel } from './token.interfaces';
import { paginate } from '../../utils/paginate';

const tokenSchema = new mongoose.Schema<ITokenDoc, ITokenModel>(
  {
    token: {
      type: String,
      required: true,
      index: true,
    },
    user: {
      type: String,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [tokenTypes.REFRESH, tokenTypes.RESET_PASSWORD, tokenTypes.VERIFY_EMAIL, tokenTypes.PIN],
      required: true,
    },
    pin: {
      type: Number,
    },
    sessionDetails: {
      type: mongoose.Schema.Types.Mixed,
    },
    expires: {
      type: Date,
      required: true,
    },
    blacklisted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

tokenSchema.plugin(toJSON);
tokenSchema.plugin(paginate);

tokenSchema.index({ user: 1 });
tokenSchema.index({ type: 1 });
tokenSchema.index({ expires: -1 });

const Token = mongoose.model<ITokenDoc, ITokenModel>('Token', tokenSchema);

export default Token;
