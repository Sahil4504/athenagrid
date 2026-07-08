import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsNumber, IsString, Min, ValidateNested } from 'class-validator';

class OrderLineDto {
  @IsString() catalogItemId!: string;
  @IsNumber() @Min(0.1) qty!: number;
}

export class CreateOrderDto {
  @IsString() industryId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderLineDto)
  items!: OrderLineDto[];
}
