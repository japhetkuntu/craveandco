import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CustomerAuthService } from './customer-auth.service';
import { CustomerRegisterDto, CustomerLoginDto, RefreshDto } from './dto/auth.dto';

@Controller('api/v1/public/customer')
export class CustomerAuthController {
  constructor(private customerAuth: CustomerAuthService) {}

  @Post('register')
  register(@Body() dto: CustomerRegisterDto) {
    return this.customerAuth.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: CustomerLoginDto) {
    return this.customerAuth.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto) {
    return this.customerAuth.refresh(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Body() dto: RefreshDto) {
    return this.customerAuth.logout(dto.refreshToken);
  }
}
