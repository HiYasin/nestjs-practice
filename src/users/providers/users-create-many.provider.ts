import { Injectable, Logger, RequestTimeoutException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '../user.entity.js';
import { CreateManyUsersDto } from '../dtos/create-many-user.dto.js';

@Injectable()
export class UsersCreateManyProvider {

    constructor(
        private readonly dataSource: DataSource, // Inject the DataSource for transaction management
    ) { }

    public async createManyUsers(createManyUsersDto: CreateManyUsersDto) {
        let newUsers: User[] = [];

        // In typeORM queryRunner is used to manage transactions. It allows you to start a transaction, execute multiple queries, and then either commit or rollback the transaction based on the success or failure of the operations.

        // Create a query runner instance
        const queryRunner = this.dataSource.createQueryRunner();

        // Establish real database connection using our new query runner
        try {
            await queryRunner.connect();

            // Start a new transaction
            await queryRunner.startTransaction();
        } catch (error) {
            throw new RequestTimeoutException('Unable to process the request at this time.', {
                description: 'Database connection timeout. Please check your database connection and try again.'
            });
        }

        // Iterate over the users and create them one by one within the transaction
        try {
            for (const user of createManyUsersDto.users) {
                let newUser = queryRunner.manager.create(User, user); // (EntityClass, entityLikeObject)
                newUser = await queryRunner.manager.save(newUser);
                newUsers.push(newUser);
            }

            // Commit the transaction if all operations were successful
            await queryRunner.commitTransaction();

        } catch (error) {
            // If unsuccessful, rollback the transaction
            await queryRunner.rollbackTransaction();
            throw new RequestTimeoutException('Unable to complete the transaction at this time.', {
                description: 'Database connection timeout. Please check your database connection and try again.'
            });

        } finally {
            // Release the query runner which is manually created:
            try {
                await queryRunner.release();
            } catch (error) {
                throw new RequestTimeoutException('Unable to release the database connection.', {
                    description: 'Database connection timeout. Please check your database connection and try again.'
                });
            }
        }
        return newUsers;
    }
}
