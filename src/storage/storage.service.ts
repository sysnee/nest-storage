import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as mime from 'mime-types';

export interface FileMetadata {
  id: string;
  originalName: string;
  filename: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
  path: string;
}

@Injectable()
export class StorageService {
  private readonly uploadDir: string;
  private readonly maxFileSize: number;
  private readonly allowedMimeTypes: string[];

  constructor(private configService: ConfigService) {
    this.uploadDir = join(process.cwd(), this.configService.get('app.uploadDir'));
    this.maxFileSize = this.configService.get('app.maxFileSize');
    this.allowedMimeTypes = this.configService.get('app.allowedMimeTypes');
    this.ensureUploadDir();
  }

  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<FileMetadata> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException('File size exceeds limit');
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('File type not allowed');
    }

    const fileId = uuidv4();
    const fileExtension = this.getFileExtension(file.originalname);
    const filename = `${fileId}${fileExtension}`;
    const filePath = join(this.uploadDir, filename);

    await fs.writeFile(filePath, file.buffer);

    const metadata: FileMetadata = {
      id: fileId,
      originalName: file.originalname,
      filename,
      mimeType: file.mimetype,
      size: file.size,
      uploadedAt: new Date(),
      path: filePath,
    };

    await this.saveMetadata(metadata);
    return metadata;
  }

  async getFile(fileId: string): Promise<{ buffer: Buffer; metadata: FileMetadata }> {
    const metadata = await this.getMetadata(fileId);
    const filePath = join(this.uploadDir, metadata.filename);

    try {
      const buffer = await fs.readFile(filePath);
      return { buffer, metadata };
    } catch {
      throw new NotFoundException('File not found');
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    const metadata = await this.getMetadata(fileId);
    const filePath = join(this.uploadDir, metadata.filename);

    try {
      await fs.unlink(filePath);
      await this.deleteMetadata(fileId);
    } catch {
      throw new NotFoundException('File not found');
    }
  }

  async listFiles(limit = 100, offset = 0): Promise<FileMetadata[]> {
    const metadataPath = join(this.uploadDir, 'metadata.json');
    
    try {
      const data = await fs.readFile(metadataPath, 'utf-8');
      const files: FileMetadata[] = JSON.parse(data);
      return files.slice(offset, offset + limit);
    } catch {
      return [];
    }
  }

  private async saveMetadata(metadata: FileMetadata): Promise<void> {
    const metadataPath = join(this.uploadDir, 'metadata.json');
    
    try {
      const data = await fs.readFile(metadataPath, 'utf-8');
      const files: FileMetadata[] = JSON.parse(data);
      files.push(metadata);
      await fs.writeFile(metadataPath, JSON.stringify(files, null, 2));
    } catch {
      await fs.writeFile(metadataPath, JSON.stringify([metadata], null, 2));
    }
  }

  private async getMetadata(fileId: string): Promise<FileMetadata> {
    const metadataPath = join(this.uploadDir, 'metadata.json');
    
    try {
      const data = await fs.readFile(metadataPath, 'utf-8');
      const files: FileMetadata[] = JSON.parse(data);
      const file = files.find(f => f.id === fileId);
      
      if (!file) {
        throw new NotFoundException('File not found');
      }
      
      return file;
    } catch {
      throw new NotFoundException('File not found');
    }
  }

  private async deleteMetadata(fileId: string): Promise<void> {
    const metadataPath = join(this.uploadDir, 'metadata.json');
    
    try {
      const data = await fs.readFile(metadataPath, 'utf-8');
      const files: FileMetadata[] = JSON.parse(data);
      const filteredFiles = files.filter(f => f.id !== fileId);
      await fs.writeFile(metadataPath, JSON.stringify(filteredFiles, null, 2));
    } catch {
      // Metadata file doesn't exist, nothing to delete
    }
  }

  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot !== -1 ? filename.substring(lastDot) : '';
  }
}
