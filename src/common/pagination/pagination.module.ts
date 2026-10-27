import { Module } from '@nestjs/common';
import { PaginationProvider } from './provider/pagination.provider.js';

@Module({
  providers: [PaginationProvider],
  exports: [PaginationProvider]
})
export class PaginationModule {}
