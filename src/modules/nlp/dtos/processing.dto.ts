import { ApiProperty } from '@nestjs/swagger';

export class ProcessingDto {
  @ApiProperty()
  text: string;

  @ApiProperty({ required: false, description: 'Tenant owner identifier' })
  owner?: string;
}
export class TrainingSamplesDto {
  @ApiProperty({ type: () => TrainingSampleDto, isArray: true })
  samples: TrainingSampleDto[];
}
export class TrainingSampleDto {
  @ApiProperty({ type: 'string' })
  text: string;
  @ApiProperty({ type: 'string' })
  label: string;
}
