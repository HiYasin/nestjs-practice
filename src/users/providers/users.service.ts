import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user.entity.js';
import { Repository } from 'typeorm';
import { CreateUserDto } from '../dtos/create-user.dto.js';
import { ConfigService } from '@nestjs/config';


@Injectable()
export class UsersService {

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly configService: ConfigService,
    ) { }

    public async findAll(): Promise<User[]> {
        const nodeEnv = this.configService.get<string>('NODE_ENV');
        console.log('NODE_ENV:', nodeEnv);
        return await this.userRepository.find();
    }
    public async create(createUserDto: CreateUserDto){

        // Check if user already exists
        const isUserExists = await this.userRepository.findOne({ where: { email: createUserDto.email } });
        
        // Handle the exception when the user already exists
        if (isUserExists) {
            throw new Error('User already exists');
        }

        // Create a new-user instance
        const newUser = this.userRepository.create(createUserDto);

        // Save it to the database
        return await this.userRepository.save(newUser);
    }
}
