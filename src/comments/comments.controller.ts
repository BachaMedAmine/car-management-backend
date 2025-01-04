import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    Patch,
    UseGuards,
    Request
  } from '@nestjs/common';
  import { CreateCommentDto } from './dto/create-comment.dto';
  import { UpdateCommentDto } from './dto/update-comment.dto';
  import { AuthGuard } from '@nestjs/passport';
  import { CommentsService } from './comments.service';
  
  export interface CommentResponse {
    id: string;
    content: string;
    postId: string | null;
    userId: string | null;
    userName: string | null;
    userEmail: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
  }
  @Controller('posts/:postId/comments')
  @UseGuards(AuthGuard('jwt'))
  export class CommentsController {
    constructor(private readonly commentsService: CommentsService) {}
  
    @Post()
    async addComment(
      @Param('postId') postId: string,
      @Body() createCommentDto: CreateCommentDto,
      @Request() req
    ) {
      // L'AuthGuard doit déjà garantir qu'il y a un req.user
      const userId = req.user.userId;
      return this.commentsService.addComment(postId, createCommentDto, userId);
    }
  
    /**
     * Récupère tous les commentaires pour un post précis
     * par ex: GET /posts/ABC123/comments
     */
    @Get()
    async findAll(@Param('postId') postId: string): Promise<CommentResponse[]> {
      return this.commentsService.findAllByPost(postId);
    }
  
    @Get(':id')
    async findOne(@Param('id') id: string) {
      return this.commentsService.findOne(id);
    }
  
    @Patch(':id')
    async update(
      @Param('id') id: string,
      @Body() updateCommentDto: UpdateCommentDto
    ) {
      return this.commentsService.update(id, updateCommentDto);
    }
  
    @Delete(':id')
    async remove(@Param('id') id: string) {
      return this.commentsService.remove(id);
    }
  }