import {
  Controller,
  Post,
  Delete,
  Query,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  ParseFilePipe,
  MaxFileSizeValidator,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { tmpdir } from 'os';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { FilesService } from './files.service';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

@Controller('api/v1/files')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'OPERATIONS_MANAGER')
export class FilesController {
  constructor(private files: FilesService) {}

  @Post('menu-images')
  @UseInterceptors(FileInterceptor('file', { storage: diskStorage({ destination: tmpdir() }) }))
  async uploadMenuImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 })],
      }),
    )
    file: Express.Multer.File,
  ) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type "${file.mimetype}" is not allowed. Use JPEG, PNG or WebP.`,
      );
    }
    const key = await this.files.uploadMenuImage(file);
    return { key };
  }

  @Delete('menu-images')
  async deleteMenuImage(@Query('key') key: string) {
    if (!key || !key.startsWith('menu/') || key.includes('..')) {
      throw new BadRequestException('Invalid image key');
    }
    await this.files.deleteImage(key);
    return { success: true };
  }
}

