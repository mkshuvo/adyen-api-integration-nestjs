import { IsEmail, IsEnum, IsOptional, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsEnum(['admin', 'accountant', 'customer'])
  role?: 'admin' | 'accountant' | 'customer';
}
