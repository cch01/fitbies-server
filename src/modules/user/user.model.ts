import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { IsEmail } from 'class-validator';
import { Paginated } from 'src/utils/create.paginated.schema';

export type UserDocument = User & Document;

@Schema({ collection: 'users', timestamps: true })
@ObjectType()
export class User {
  @Field((type) => ID)
  _id: string;

  @Prop({ required: true })
  @Field({ nullable: true })
  nickname?: string;

  @Prop({})
  @Field({ nullable: true })
  firstName?: string;

  @Prop({})
  @Field({ nullable: true })
  lastName?: string;

  @IsEmail()
  @Prop({ unique: true })
  @Field({ nullable: true })
  email?: string;

  @Prop({})
  password?: string;

  @Prop({ required: true })
  @Field((type) => UserType, { nullable: true })
  type?: UserType;

  @Prop({ required: false })
  @Field((type) => UserCurrentStates, { nullable: true })
  status: UserCurrentStates;

  @Prop()
  resetToken?: string;

  @Prop()
  activationToken?: string;

  @Field({ nullable: true, defaultValue: false })
  @Prop()
  isActivated?: boolean;

  @Field((type) => Date, { nullable: true })
  @Prop()
  registeredAt?: Date;

  @Field({ nullable: true })
  createdAt?: Date;

  @Field({ nullable: true })
  updatedAt?: Date;
}

export enum UserType {
  CLIENT = 'CLIENT',
  ADMIN = 'ADMIN',
}

registerEnumType(UserType, {
  name: 'UserType',
});

const UserSchema = SchemaFactory.createForClass(User);

export const UserModel = MongooseModule.forFeature([
  { name: 'user', schema: UserSchema },
]);

@ObjectType('UserConnection')
export class UserConnection extends Paginated(User) {}

export enum UserCurrentStates {
  ONLINE = 'ONLINE',
  MEETING = 'MEETING',
  OFFLINE = 'OFFLINE',
}

registerEnumType(UserCurrentStates, {
  name: 'UserCurrentStates',
});
