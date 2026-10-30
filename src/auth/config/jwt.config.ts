// import {registerAs} from '@nestjs/config';

// export default registerAs('jwt', () => ({
//   secret: process.env.JWT_SECRET,
//   audience: process.env.JWT_TOKEN_AUDIENCE,
//   issuer: process.env.JWT_TOKEN_ISSUER,
//   accessTokenTtl: parseInt(process.env.JWT_ACCESS_TOKEN_TTL || '3600', 10), // default to 1 hour
// }));

// In the above senerio we have to put the zod validation in the global env validation file.

import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const jwtEnvSchema = z.object({
  JWT_SECRET: z.string().min(32),
  JWT_TOKEN_AUDIENCE: z.string().min(1),
  JWT_TOKEN_ISSUER: z.string().min(1),
  JWT_ACCESS_TOKEN_TTL: z.coerce.number().int().positive().default(3600),
});

export default registerAs('jwt', () => {
  const env = jwtEnvSchema.parse(process.env);

  return {
    secret: env.JWT_SECRET,
    audience: env.JWT_TOKEN_AUDIENCE,
    issuer: env.JWT_TOKEN_ISSUER,
    accessTokenTtl: env.JWT_ACCESS_TOKEN_TTL,
  };
});