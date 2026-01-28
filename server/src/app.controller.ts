import { Controller, Get } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';

@ApiExcludeController()
@Controller()
export class AppController {
    @Get()
    @Public()
    root(): string {
        return 'hello world';
    }
}
