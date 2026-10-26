import { BadRequestException, HttpException, HttpStatus, Injectable, RequestTimeoutException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user.entity.js';
import { In, Repository } from 'typeorm';
import { CreateUserDto } from '../dtos/create-user.dto.js';
import { ConfigService } from '@nestjs/config';
import { UsersCreateManyProvider } from './users-create-many.provider.js';
import { CreateManyUsersDto } from '../dtos/create-many-user.dto.js';


@Injectable()
export class UsersService {

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly configService: ConfigService,
        private readonly usersCreateManyProvider: UsersCreateManyProvider,
    ) { }

    public async findAll(): Promise<User[]> {
        const nodeEnv = this.configService.get<string>('NODE_ENV');
        console.log('NODE_ENV:', nodeEnv);
        return await this.userRepository.find();
    }
    public async create(createUserDto: CreateUserDto) {

        // // Check if user already exists
        // const isUserExists = await this.userRepository.findOne({ where: { email: createUserDto.email } });

        // // Handle the exception when the user already exists
        // if (isUserExists) {
        //     throw new Error('User already exists');
        // }

        // // Create a new-user instance
        // const newUser = this.userRepository.create(createUserDto);

        // // Save it to the database
        // return await this.userRepository.save(newUser);

        // With proper exception handling

        let isExistingUser: User | null;
        try {
            isExistingUser = await this.userRepository.findOne({ where: { email: createUserDto.email } });
        } catch (error) {
            throw new RequestTimeoutException('Unable to process the request at this time. Please try again later.', {
                description: 'Database connection timeout. Please check your database connection and try again.'
            });
        }

        if (isExistingUser) {
            throw new BadRequestException('User already exists with this email', {
                description: 'A user with the provided email already exists. Please use a different email or log in.',
            });
        }

        let newUser = this.userRepository.create(createUserDto);

        try {
            newUser = await this.userRepository.save(newUser);
        } catch (error) {
            throw new RequestTimeoutException('Unable to process the request at this time. Please try again later.', {
                description: 'Database connection timeout. Please check your database connection and try again.'
            });
        }
        return newUser;
    }

    public async findOneById(id: string): Promise<User | null> {
        // return await this.userRepository.findOne({ where: { id } });


        // With proper exception handling

        let user: User | null;

        try {
            user = await this.userRepository.findOne({ where: { id } });
        } catch (error) {
            throw new RequestTimeoutException('Unable to process the request at this time. Please try again later.', {
                description: 'Database connection timeout. Please check your database connection and try again.'
            });
        }

        if (!user) {
            throw new BadRequestException('User not found with this ID', {
                description: 'No user exists with the provided ID. Please check the ID and try again.',
            });
        }

        return user;
    }

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
            }
        )
    }

    public async createManyUsers(createManyUsersDto: CreateManyUsersDto) {
        return await this.usersCreateManyProvider.createManyUsers(createManyUsersDto);
    }

    public async deleteManyUsers(ids: string[]) {
        const result = await this.userRepository.delete({ id: In(ids) });

        return {
            requested: ids.length,
            deleted: result.affected ?? 0,
        };
    }

}
