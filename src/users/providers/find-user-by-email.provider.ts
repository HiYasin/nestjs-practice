import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../user.entity.js";
import { RequestTimeoutException, UnauthorizedException } from "@nestjs/common";


export class FindUserByEmailProvider {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>
    ) { }

    public async findUserByEmail(email: string) {
        let user: User | null = null;

        try {
            user = await this.userRepository.findOne({
                where: {
                    email: email
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

        if (!user) {
            throw new UnauthorizedException(
                'User not found.',
                {
                    description: 'No user found with the provided email address.',
                }
            );
        }

        return user;
    }
}