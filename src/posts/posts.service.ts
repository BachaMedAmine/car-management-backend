import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post } from './schemas/post.schema';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostsService {
  constructor(@InjectModel(Post.name) private readonly postModel: Model<Post>) {}

  async createPost(createPostDto: CreatePostDto, userId: string): Promise<Post> {
    const post = new this.postModel({
      ...createPostDto,
      user: userId,
    });
    await post.save();
    return this.postModel.findById(post._id)
      .populate('user', 'name email') // Populate the user details for the post
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'name email', // Populate the user details for each comment
        },
      })
      .exec();
  }

  async getPosts(page: number, limit: number): Promise<any[]> {
    const skip = (page - 1) * limit;
    return this.postModel
      .find()
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email') // Populate user details for the post
      .populate({
        path: 'comments',
        model: 'Comment', // Explicitly populate the comments with the Comment model
        populate: {
          path: 'user',
          select: 'name email', // Populate user details for each comment
        },
      })
      .exec();
  }

  async getPostDetails(id: string): Promise<Post> {
    return this.postModel
      .findById(id)
      .populate('user', 'name email') // Populate user details for the post
      .populate({
        path: 'comments',
        populate: {
          path: 'user', // Populate user details inside each comment
          select: 'name email',
        },
      })
      .populate({
        path: 'comments',
        populate: {
          path: 'post', // Populate the post inside each comment (optional)
          select: 'title content _id',
        },
      })
      .exec();
  }
}