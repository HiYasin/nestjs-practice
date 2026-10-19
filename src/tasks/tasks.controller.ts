import { Body, Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Patch, Post, Query, ValidationPipe } from '@nestjs/common';
import { CreateTaskDto } from './ dtos/create-task.dto.js';
import { GetTaskParamDto } from './ dtos/get-task-param.dto.js';
import { PatchTaskDto } from './ dtos/patch-task.dto.js';

@Controller('tasks')
export class TasksController {

  // ===Validating param and query with built-in pipe===
  @Get('{/:id}')
  public getTasks(
    // ===Step 01: Basic===
    // @Param('id', ParseIntPipe) id: number | undefined,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,

    // ===Step 02: Using DTOs===
    @Param() getTaskParam: GetTaskParamDto
  ) {
    console.log(getTaskParam)
    return {
      // id: getTaskParam.id,
      // typeOfId: typeof getTaskParam.id,
      limit,
      typeOfLimit: typeof limit,
      page,
      typeOfPage: typeof page
    }
  }


  // ===Validation body with custom pipe===
  // ===Step 01: Basic===
  // @Post()
  // public createTasks(
  //   @Body(new ValidationPipe()) createTaskDto: CreateTaskDto,
  // ) {
  //   return createTaskDto;
  // }

  // We can use filter additional property (not part of the DTO) for security
  // new ValidationPipe({
  //   whitelist: true, // Trim the additional property
  //   forbidNonWhitelisted: true // Forbid the request directly
  // }

  // ===Step 02: Best Practice===
  // We can also config global validation pipe to avoid redundent code
  // main.ts
  // app.useGlobalPipes(
  //   new ValidationPipe({
  //     whitelist: true,
  //     forbidNonWhitelisted: true
  //   })
  // )
  // Now we don't need to define validation pipe explicitly in each method
  @Post()
  public createTasks(
    @Body() createTaskDto: CreateTaskDto,
  ) {
    console.log(typeof createTaskDto)
    console.log(createTaskDto instanceof CreateTaskDto)
    return createTaskDto;
  }


  // ===Validation body with mapped types/Dtos
  @Patch()
  public updateTasks(
    @Body() patchTaskDto: PatchTaskDto
  ) {
    console.log(patchTaskDto);
    return patchTaskDto;
  }
}
