import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Document, SchemaTypes } from 'mongoose';

export type SessionDocument = Session & Document;

@Schema({ collection: 'sessions', timestamps: true })
export class Session {
  @Prop({ default: () => uuidv4() })
  sid: string;

  @Prop({ default: () => new Date() })
  lastLogin: Date;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'user' })
  user: string;
}

const SessionSchema = SchemaFactory.createForClass(Session);

export const SessionModel = MongooseModule.forFeature([
  { name: 'session', schema: SessionSchema },
]);
