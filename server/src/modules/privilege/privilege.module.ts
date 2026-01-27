import { Module } from '@nestjs/common';
import { PrivilegeController } from './privilege.controller';
import { PrivilegeService } from './privilege.service';

@Module({
    controllers: [PrivilegeController],
    providers: [PrivilegeService],
    exports: [PrivilegeService]
})
export class PrivilegeModule {}
