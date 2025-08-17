import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepo.find({
      select: ['id', 'email', 'role', 'createdAt', 'updatedAt'],
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepo.findOne({ 
      where: { id },
      select: ['id', 'email', 'role', 'createdAt', 'updatedAt']
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(dto: CreateUserDto): Promise<User> {
    const exists = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (exists) throw new BadRequestException('Email already exists');
    
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepo.create({
      email: dto.email,
      passwordHash,
      role: dto.role,
    });
    
    const saved = await this.usersRepo.save(user);
    // Return user without password hash
    const { passwordHash: _, ...result } = saved;
    return result as User;
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    
    if (dto.email && dto.email !== user.email) {
      const exists = await this.usersRepo.findOne({ where: { email: dto.email } });
      if (exists) throw new BadRequestException('Email already exists');
      user.email = dto.email;
    }
    
    if (dto.password) {
      const passwordHash = await bcrypt.hash(dto.password, 10);
      (user as any).passwordHash = passwordHash;
    }
    
    if (dto.role) {
      user.role = dto.role;
    }
    
    const saved = await this.usersRepo.save(user);
    const { passwordHash: _, ...result } = saved;
    return result as User;
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepo.remove(user);
  }

  async getUserStats(userId: number) {
    // Get user's unpaid payment amounts
    const result = await this.usersRepo
      .createQueryBuilder('user')
      .leftJoin('user.payments', 'payment')
      .select([
        'user.id',
        'user.email',
        'user.role',
        'COALESCE(SUM(CASE WHEN payment.status = "pending" THEN payment.amount ELSE 0 END), 0) as unpaidAmount',
        'COUNT(CASE WHEN payment.status = "pending" THEN 1 END) as pendingPayments'
      ])
      .where('user.id = :userId', { userId })
      .groupBy('user.id')
      .getRawOne();
      
    return {
      userId: result.user_id,
      email: result.user_email,
      role: result.user_role,
      unpaidAmount: parseFloat(result.unpaidAmount) || 0,
      pendingPayments: parseInt(result.pendingPayments) || 0
    };
  }
}
