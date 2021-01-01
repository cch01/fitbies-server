import { Field, ID, ObjectType, registerEnumType } from "@nestjs/graphql";
import { MongooseModule, Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from 'mongoose';


export type UserDocument = User & Document;

@Schema({ collection: 'users', timestamps: true })
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

  @Prop({ required: true })
  @Field(type => UserType, { nullable: true })
  type?: UserType;
   
  @Field({ nullable: true })
  createdAt?: Date;

  @Field({ nullable: true })
  updatedAt?: Date;
}

export enum UserType {
  CLIENT="CLIENT",
  ADMIN="ADMIN"
}

registerEnumType(UserType, {
  name: 'UserType',
});


const UserSchema = SchemaFactory.createForClass(User);

export const UserModel = MongooseModule.forFeature([{ name: 'user', schema: UserSchema }]) 