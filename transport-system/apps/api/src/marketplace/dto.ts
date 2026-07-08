import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

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

  // Optional alternate delivery location (e.g. a warehouse at a different ZIP than
  // the farmer's registered address). When present, the transport job drops off here.
  @IsOptional() @IsString() deliverPostalCode?: string;
  @IsOptional() @IsString() deliverAddress?: string;
}
