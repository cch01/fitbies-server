import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Schema, Prop, SchemaFactory, MongooseModule } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { IsDate } from 'class-validator';
import { User } from '../user/user.model';
import { Paginated } from 'src/utils/create.paginated.schema';
import { v4 as uuidv4 } from 'uuid';

export type MeetingDocument = Meeting & mongoose.Document;

@ObjectType()
@Schema()
export class Participant {
  @Field((type) => ID)
  @Prop({ type: mongoose.SchemaTypes.ObjectId, ref: 'users' })
  _id!: string;

  @Field({ nullable: true })
  @Prop({ default: () => new Date() })
  joinedAt?: Date;

  @Field({ nullable: true })
  @Prop()
  leftAt?: Date;

  @Field({ nullable: true })
  @Prop({ default: false })
  isLeft?: boolean;
}
export const ParticipantSchema = SchemaFactory.createForClass(Participant);

@ObjectType()
@Schema({ collection: 'meetings', timestamps: true })
export class Meeting {
  @Field((type) => ID)
  _id: string;

  @Field({ nullable: true })
  @Prop({ default: () => uuidv4() })
  roomId?: string;

  @Field((type) => User, { nullable: true })
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true })
  initiator: string;

  @Field((type) => [Participant], { nullable: true })
  @Prop({
    type: [ParticipantSchema],
    default: [],
  })
  participants?: Participant[];

  @Field((type) => [ID], { nullable: true })
  @Prop({
    type: [mongoose.SchemaTypes.ObjectId],
    ref: 'users',
    default: [],
  })
  blockList?: string[];

  @Field((type) => String, { nullable: true })
  @Prop()
  passCode?: string;

  @IsDate()
  @Field((type) => Date, { nullable: true })
  @Prop({ type: Date, default: null })
  endedAt?: Date;
}

const MeetingSchema = SchemaFactory.createForClass(Meeting);

export const MeetingModel = MongooseModule.forFeature([
  { name: 'meeting', schema: MeetingSchema },
]);

@ObjectType('MeetingConnection')
export class MeetingConnection extends Paginated(Meeting) {}
