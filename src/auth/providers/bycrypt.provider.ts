import * as bcrypt from 'bcrypt';
import { Injectable } from '@nestjs/common';
import { HashingProvider } from './hashing.provider.js';

@Injectable()
export class BycryptProvider implements HashingProvider {
  async hashPassword(data: string | Buffer): Promise<string> {

    const salt = await bcrypt.genSalt(); // default salt rounds is 10 -> genSalt(10)
    return await bcrypt.hash(data, salt);
  }

  async comparePassword(data: string | Buffer, encrypted: string): Promise<boolean> {
    return await bcrypt.compare(data, encrypted);
  }
}
