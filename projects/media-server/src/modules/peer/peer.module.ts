import { Module } from '@nestjs/common';
import { PeerService } from '@/services/peer/peer.service';

@Module({
  providers: [PeerService],
})
export class PeerModule {}
