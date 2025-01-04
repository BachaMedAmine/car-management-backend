import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';
import { Post } from 'src/posts/schemas/post.schema';
import { User } from 'src/users/schemas/user.schema';

@Schema({ timestamps: true })
export class Comment extends Document {
  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'Post' })
  post: Post;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'User' })
  user: User;

  @Prop({ required: true, type: String })
  content: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);