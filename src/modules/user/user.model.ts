import { Field, ID, ObjectType } from "@nestjs/graphql";
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

  @Field({ nullable: true })
  createdAt?: Date;

  @Field({ nullable: true })
  updatedAt?: Date;
}

const UserSchema = SchemaFactory.createForClass(User);
UserSchema.pre('save', async function (){
  this.set({ updatedAt: new Date() });
});

UserSchema.pre('updateOne', async function (){
  this.set({ updatedAt: new Date() });
});

export const UserModel = MongooseModule.forFeature([{ name: 'user', schema: UserSchema }]) 