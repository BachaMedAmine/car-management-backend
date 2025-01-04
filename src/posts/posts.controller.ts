import {
  Controller,
  Get,
  Post as PostMethod,
  Param,
  Body,
  Request,
  Query,
  UseGuards
} from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { PostsService } from './posts.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('posts')
@UseGuards(AuthGuard('jwt'))
export class PostsController {
  constructor(private readonly postService: PostsService) {}

  @PostMethod()
  async createPost(@Request() req, @Body() createPostDto: CreatePostDto) {
    const userId = req.user?.userId;
    return this.postService.createPost(createPostDto, userId);
  }

  @Get()
  getPosts(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.postService.getPosts(Number(page), Number(limit));
  }

  @Get(':id')
  getPostDetails(@Param('id') id: string) {
    return this.postService.getPostDetails(id);
  }
}