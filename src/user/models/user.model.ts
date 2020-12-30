import { Field, ID, ObjectType } from "@nestjs/graphql";
import { MongooseModule, Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from 'mongoose';


export type UserDocument = User & Document;

@Schema({ collection: 'users' })
@ObjectType()
export class User {
  @Field(type => ID)
  _id: string;

  @Prop({ required: true })
  @Field({ nullable: true })
  firstName?: string;

  @Prop({ required: true })
  @Field({ nullable: true })
  lastName?: string;

  @Prop({ required: true, unique: true })
  @Field({ nullable: true })
  email?: string;

  @Prop({ required: true })
  password?: string;

  @Prop({ required: true, default: new Date() })
  @Field({ nullable: true })
  createdAt?: Date;

  @Prop({ required: true, default: new Date() })
  @Field({ nullable: true })
  updatedAt?: Date;
}

const UserSchema = SchemaFactory.createForClass(User);
export const UserModel = MongooseModule.forFeature([{ name: 'user', schema: UserSchema }]) 