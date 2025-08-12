import { IsInt, IsOptional, IsString, Length, Min, IsISO31661Alpha2 } from 'class-validator';

export class UpsertBankAccountDto {
  @IsInt()
  @Min(1)
  user_id!: number;

  @IsISO31661Alpha2()
  country!: string;

  @IsString()
  @Length(3, 3)
  currency!: string;

  @IsString()
  account_holder_name!: string;

  // Either provide IBAN or (account_number + routing_code)
  @IsOptional()
  @IsString()
  iban?: string;

  @IsOptional()
  @IsString()
  account_number?: string;

  @IsOptional()
  @IsString()
  routing_code?: string;
}
