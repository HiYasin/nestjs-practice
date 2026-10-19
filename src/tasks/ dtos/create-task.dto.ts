import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

export enum TaskStatus {
  TODO = 'todo',
  RUNNING = 'running',
  COMPLETED = 'completed'
}

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  title: string;

  @IsString()
  @IsNotEmpty({message: "Task body can't by empty"})
  @MinLength(5)
  @MaxLength(200)
  body: string;

  @IsString()
  @IsOptional()
  importancy: string;


  @IsString()
  @IsEnum(TaskStatus, {
    message: 'Task status must be  (todo, running, completed)'
  })
  status: TaskStatus

  @IsEmail()
  @Matches(/^[a-zA-Z0-9._%+-]+@gmail\.com$/, {
    message: 'Only gmail is acceptable.'
  })
  email: string
}
