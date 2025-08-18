import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Controller('health')
export class HealthController {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  @Get()
  async getHealth() {
    try {
      // Test database connection
      await this.userRepo.count();
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        database: 'connected',
        adyen: {
          environment: process.env.ADYEN_ENV || 'test',
          configured: !!(process.env.ADYEN_API_KEY && process.env.ADYEN_MERCHANT_ACCOUNT)
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        database: 'disconnected'
      };
    }
  }

  @Get('ready')
  async getReadiness() {
    try {
      // More thorough readiness check
      const userCount = await this.userRepo.count();
      
      const checks = {
        database: userCount >= 0,
        adyen_config: !!(process.env.ADYEN_API_KEY && process.env.ADYEN_MERCHANT_ACCOUNT),
        jwt_secret: !!process.env.JWT_SECRET
      };

      const allReady = Object.values(checks).every(check => check === true);

      return {
        status: allReady ? 'ready' : 'not_ready',
        timestamp: new Date().toISOString(),
        checks
      };
    } catch (error) {
      return {
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }
}
