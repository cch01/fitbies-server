import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Schema, Prop, SchemaFactory, MongooseModule } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { IsDate } from 'class-validator';

export type MeetingDocument = Meeting & mongoose.Document;

@ObjectType()
@Schema()
export class Participant {
  @Field((type) => ID)
  @Prop({ type: mongoose.SchemaTypes.ObjectId, ref: 'users' })
  _id!: string;

  @Field({ nullable: true })
  @Prop()
  approvedAt?: Date;
}
export const ParticipantSchema = SchemaFactory.createForClass(Participant);

@ObjectType()
@Schema({ collection: 'meetings', timestamps: true })
export class Meeting {
  @Field((type) => ID)
  _id: string;

  @Field((type) => ID, { nullable: true })
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true })
  initiator: string;

  @Field((type) => [Participant], { nullable: true })
  @Prop({
    type: ParticipantSchema,
  })
  participants?: Participant[];

  @Field((type) => String, { nullable: true })
  @Prop()
  passCode?: string;

  @Field({ nullable: true })
  @Prop()
  invitationToken?: string;

  @IsDate()
  @Field((type) => Date, { nullable: true })
  @Prop({ type: Date, default: null })
  endedAt?: Date;

  @Field({ nullable: true })
  @Prop({ default: false })
  needApproval?: boolean;
}

const MeetingSchema = SchemaFactory.createForClass(Meeting);

export const MeetingModel = MongooseModule.forFeature([
  { name: 'meeting', schema: MeetingSchema },
]);
