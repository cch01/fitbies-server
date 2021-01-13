import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Document, SchemaTypes } from 'mongoose';
import { IsDate } from 'class-validator';

export type SessionDocument = Session & Document;

@Schema({ collection: 'sessions', timestamps: true })
export class Session {
  @Prop({ default: () => uuidv4() })
  sid: string;

  @IsDate()
  @Prop({ default: () => new Date() })
  lastAccess: Date;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'user' })
  user: string;

  @Prop()
  logoutAt: Date;
}

const SessionSchema = SchemaFactory.createForClass(Session);

export const SessionModel = MongooseModule.forFeature([
  { name: 'session', schema: SessionSchema },
]);
