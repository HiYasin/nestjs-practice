# Exception Handling in NestJS

NestJS turns thrown exceptions into HTTP error responses. The users module shows
two useful approaches:

- **Built-in exceptions** for common HTTP errors.
- **Custom `HttpException` responses** when the API needs its own response body.

The examples below follow `src/users/providers/users.service.ts`.

## 1. Built-in HTTP exceptions

Import the exception class from `@nestjs/common` and throw it when an expected
error occurs:

```ts
import {
  BadRequestException,
  RequestTimeoutException,
} from '@nestjs/common';
```

### Duplicate user

`BadRequestException` returns HTTP `400 Bad Request` when the email is already
registered:

```ts
if (isExistingUser) {
  throw new BadRequestException('User already exists with this email', {
    description:
      'A user with the provided email already exists. Please use a different email or log in.',
  });
}
```

The response is similar to:

```json
{
  "message": "User already exists with this email",
  "error": "Bad Request",
  "statusCode": 400
}
```

### Database failure

When a database operation fails, the service translates the failure into a
`RequestTimeoutException` instead of exposing the database error to the client:

```ts
try {
  user = await this.userRepository.findOne({ where: { id } });
} catch (error) {
  throw new RequestTimeoutException(
    'Unable to process the request at this time. Please try again later.',
    {
      description:
        'Database connection timeout. Please check your database connection and try again.',
    },
  );
}
```

This produces HTTP `408 Request Timeout`. The original database error should be
logged internally, but should not normally be returned to the client.

### Missing user

After a successful query, an empty result is handled explicitly:

```ts
if (!user) {
  throw new BadRequestException('User not found with this ID', {
    description:
      'No user exists with the provided ID. Please check the ID and try again.',
  });
}
```

For a production API, `NotFoundException` (HTTP `404`) would usually be a more
precise choice for a missing user:

```ts
import { NotFoundException } from '@nestjs/common';

throw new NotFoundException('User not found with this ID');
```

## 2. Custom `HttpException` responses

Use `HttpException` when the response body needs custom fields. The users
service exposes this example through `GET /users/custom-exception`:

```ts
public async customException() {
  throw new HttpException(
    {
      status: HttpStatus.BAD_REQUEST,
      error: 'This is a custom exception message',
      fileName: 'app.service.ts',
      lineNumber: 10,
    },
    HttpStatus.BAD_REQUEST,
    {
      cause: new Error('This is the cause of the exception'),
      description: 'This is a custom description for the exception',
    },
  );
}
```

The first argument is the response body, the second is the HTTP status, and the
third contains exception options. The result is a `400` response containing the
custom fields such as `status`, `error`, `fileName`, and `lineNumber`.

The controller only delegates to the service:

```ts
@Get('custom-exception')
public async getCustomException() {
  return this.usersService.customException();
}
```

Test it while the app is running:

```sh
curl http://localhost:3000/users/custom-exception
```

## 3. Validation errors

`src/main.ts` registers a global `ValidationPipe`:

```ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```

Invalid request data is rejected before the controller method runs. For
example, a request that fails the `CreateUserDto` validators receives a `400`
response. `forbidNonWhitelisted: true` also rejects properties that are not in
the DTO instead of silently accepting them.

## 4. `Error` versus NestJS exceptions

Avoid throwing a plain `Error` for an HTTP request:

```ts
throw new Error('User already exists');
```

NestJS treats an unrecognized error as an internal server error, usually
returning HTTP `500`, and the client does not receive a meaningful HTTP error
type. Prefer a NestJS exception whose status matches the problem:

| Situation | Recommended exception | Status |
| --------- | --------------------- | ------: |
| Invalid request | `BadRequestException` | 400 |
| Unauthenticated request | `UnauthorizedException` | 401 |
| Authenticated but forbidden | `ForbiddenException` | 403 |
| Resource does not exist | `NotFoundException` | 404 |
| Database or upstream timeout | `RequestTimeoutException` | 408 |
| Unexpected failure | `InternalServerErrorException` | 500 |

## 5. Recommended flow

1. Validate input with DTOs and the global `ValidationPipe`.
2. Catch low-level database or external-service failures.
3. Translate known failures into a suitable built-in NestJS exception.
4. Use `HttpException` when a custom response shape is required.
5. Do not return database details, stack traces, or internal implementation
   details to API clients.
6. Test both the HTTP status and the response body for each failure case.

NestJS's built-in exception layer handles the thrown exception automatically, so
controllers usually do not need `try/catch` blocks for these expected errors.
