import { BadRequestException, forwardRef, Inject, Injectable, RequestTimeoutException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user.entity.js';
import { HashingProvider } from '../../auth/providers/hashing.provider.js';
import { CreateUserDto } from '../dtos/create-user.dto.js';

@Injectable()
export class CreateUserProvider {
    constructor(

        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        @Inject(forwardRef(() => HashingProvider))
        private readonly hashingProvider: HashingProvider

    ) { }

    public async createUser(createUserDto: CreateUserDto) {

        let isExistingUser = undefined;

        try {
            isExistingUser = await this.userRepository.findOne({
                where: {
                    email: createUserDto.email
                }
            });
        } catch (error) {
            throw new RequestTimeoutException(
                'Unable to process request at this time. Please try again later.',
                {
                    description: 'Database connection error',
                }
            );
        }

        if (isExistingUser) {
            throw new BadRequestException(
                'User already exists.',
                {
                    description: 'User already exists with the provided email address.',
                }
            );
        }

        let newUser = await this.userRepository.create({
            ...createUserDto,
            password: await this.hashingProvider.hashPassword(createUserDto.password),
        });

        try {
            newUser = await this.userRepository.save(newUser);
        } catch (error) {
            throw new RequestTimeoutException(
                'Unable to process request at this time. Please try again later.',
                {
                    description: 'Database connection error',
                }
            );
        }

        return newUser;
    }
}
