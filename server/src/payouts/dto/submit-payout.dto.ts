import { IsString, Length } from 'class-validator';

export class SubmitPayoutDto {
  // Use string to preserve BIGINT values
  @IsString()
  @Length(1, 20)
  payment_id!: string;
}
