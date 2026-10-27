import { Global, Module } from '@nestjs/common';
import { PaginationProvider } from './provider/pagination.provider.js';

@Global()
@Module({
  providers: [PaginationProvider],
  exports: [PaginationProvider]
})
export class PaginationModule {}
