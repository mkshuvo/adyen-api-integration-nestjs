import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';

@Injectable()
export class SeederService implements OnModuleInit {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.seedUsers();
  }

  private async seedUsers() {
    const existingUsers = await this.usersRepo.count();
    if (existingUsers > 0) {
      console.log('Users already seeded, skipping...');
      return;
    }

    console.log('Seeding initial users...');
    
    const users = [
      {
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin' as const,
      },
      {
        email: 'accountant@example.com',
        password: 'password123',
        role: 'accountant' as const,
      },
      {
        email: 'user@example.com',
        password: 'password123',
        role: 'customer' as const,
      },
    ];

    for (const userData of users) {
      const passwordHash = await bcrypt.hash(userData.password, 10);
      const user = this.usersRepo.create({
        email: userData.email,
        passwordHash,
        role: userData.role,
      });
      await this.usersRepo.save(user);
      console.log(`Created user: ${userData.email} (${userData.role})`);
    }

    console.log('User seeding completed!');
  }
}
