import { Global, Module } from '@nestjs/common';
import { GeoService } from './geo.service';
import { GeocodeService } from './geocode.service';

@Global()
@Module({
  providers: [GeoService, GeocodeService],
  exports: [GeoService, GeocodeService],
})
export class GeoModule {}
