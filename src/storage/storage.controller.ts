import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  Res,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { StorageService, FileMetadata } from './storage.service';

@ApiTags('storage')
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a file' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async uploadFile(@UploadedFile() file: Express.Multer.File): Promise<FileMetadata> {
    return this.storageService.uploadFile(file);
  }

  @Get('files/:id')
  @ApiOperation({ summary: 'Download a file' })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiResponse({ status: 200, description: 'File downloaded successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async getFile(@Param('id') id: string, @Res() res: Response): Promise<void> {
    console.log('getFile | Param id: ', id);
    const { buffer, metadata } = await this.storageService.getFile(id);
    
    res.set({
      'Content-Type': metadata?.mimeType || 'unknown',
      'Content-Length': metadata?.size.toString() || '0',
      'Content-Disposition': `inline; filename="${metadata?.originalName || 'Unknown File'}"`,
    });
    
    res.send(buffer);
  }

  @Get('files/:id/info')
  @ApiOperation({ summary: 'Get file metadata' })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiResponse({ status: 200, description: 'File metadata retrieved successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async getFileInfo(@Param('id') id: string): Promise<FileMetadata> {
    const { metadata } = await this.storageService.getFile(id);
    return metadata;
  }

  @Delete('files/:id')
  @ApiOperation({ summary: 'Delete a file' })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async deleteFile(@Param('id') id: string): Promise<{ message: string }> {
    await this.storageService.deleteFile(id);
    return { message: 'File deleted successfully' };
  }

  @Get('files')
  @ApiOperation({ summary: 'List files' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of files to return' })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of files to skip' })
  @ApiResponse({ status: 200, description: 'Files listed successfully' })
  async listFiles(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
  ): Promise<FileMetadata[]> {
    return this.storageService.listFiles(limit, offset);
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }
}
