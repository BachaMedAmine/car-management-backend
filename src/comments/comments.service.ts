import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Comment } from './schemas/comment.schema';
import { Post } from '../posts/schemas/post.schema';
import { User } from 'src/users/schemas/user.schema';
import { UpdateCommentDto } from './dto/update-comment.dto';


interface CommentResponse {
  id: string;
  content: string;
  postId: string | null;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}


@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private readonly commentModel: Model<Comment>,
    @InjectModel(Post.name) private readonly postModel: Model<Post>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async addComment(
    postId: string,
    createCommentDto: CreateCommentDto,
    userId: string,
  ): Promise<Comment> {
    const postObjectId = new Types.ObjectId(postId);
    const userObjectId = new Types.ObjectId(userId);

    const postExists = await this.postModel.findById(postObjectId).exec();
    if (!postExists) {
      throw new NotFoundException('Post not found');
    }

    const comment = new this.commentModel({
      post: postObjectId,
      user: userObjectId,
      content: createCommentDto.content,
    });

    const savedComment = await comment.save();

    await this.postModel.findByIdAndUpdate(
      postId,
      { $push: { comments: savedComment._id } },
      { new: true },
    );

    return this.commentModel
      .findById(savedComment._id)
      .populate('user', '_id name email')
      .populate('post', '_id title')
      .exec();
  }

  /**
   * Get all comments for a specific post
   */
  async findAllByPost(postId: string): Promise<CommentResponse[]> {
    const postObjectId = new Types.ObjectId(postId);
    const comments = await this.commentModel
      .find({ post: postObjectId })
      .populate('user', '_id name email') // Populate user details
      .exec();

    // Map the comments to the expected response format
    return comments.map((comment) => ({
      id: comment._id.toString(),
      content: comment.content,
      postId: comment.post?.toString() || null,
      userId: comment.user?._id?.toString() || null,
      userName: comment.user?.name || null,
      userEmail: comment.user?.email || null,
      createdAt: comment.createdAt || null,
      updatedAt: comment.updatedAt || null,
    }));
  }

  async findOne(id: string): Promise<any> {
    const comment = await this.commentModel
      .findById(id)
      .populate('post', '_id title')
      .populate('user', '_id name email')
      .exec();

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    return {
      id: comment._id.toString(),
      content: comment.content,
      postId: comment.post?._id?.toString() || null,
      userId: comment.user?._id?.toString() || null,
      userName: comment.user?.name || null,
      userEmail: comment.user?.email || null,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }

  async update(id: string, updateCommentDto: UpdateCommentDto): Promise<Comment> {
    const updatedComment = await this.commentModel
      .findByIdAndUpdate(id, updateCommentDto, { new: true })
      .exec();
    if (!updatedComment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }
    return updatedComment;
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.commentModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }
    return { message: `Comment with ID ${id} successfully deleted` };
  }
}