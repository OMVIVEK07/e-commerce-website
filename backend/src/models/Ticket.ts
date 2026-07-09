import { Schema, model, Document, Types } from 'mongoose';

export interface IReply {
  sender: Types.ObjectId; // User ID of sender (customer, seller or admin helper)
  message: string;
  timestamp: Date;
}

export interface ITicket extends Document {
  user: Types.ObjectId;
  subject: string;
  message: string;
  status: 'open' | 'in-progress' | 'resolved';
  replies: IReply[];
  createdAt: Date;
  updatedAt: Date;
}

const ReplySchema = new Schema<IReply>({
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const TicketSchema = new Schema<ITicket>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'resolved'],
      default: 'open',
      index: true,
    },
    replies: [ReplySchema],
  },
  { timestamps: true }
);

export const Ticket = model<ITicket>('Ticket', TicketSchema);
