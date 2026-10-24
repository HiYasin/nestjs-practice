import { Module } from '@nestjs/common';
import { MetaOptionsService } from './meta-options.service.js';
import { MetaOptionsController } from './meta-options.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetaOption } from './entities/meta-option.entity.js';

@Module({
  controllers: [MetaOptionsController],
  providers: [MetaOptionsService],
  imports: [TypeOrmModule.forFeature([MetaOption])]
})
export class MetaOptionsModule {}
