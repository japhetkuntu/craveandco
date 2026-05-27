import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { PublicRaffleService } from './public-raffle.service';
import { RaffleRequestOtpDto, RaffleVerifyDto, RaffleSpinDto } from './dto/raffle.dto';

@Controller('api/v1/public/raffle')
@UseGuards(ThrottlerGuard)
export class PublicRaffleController {
  constructor(private raffle: PublicRaffleService) {}

  /** Request an access code via SMS. Max 5 requests per IP per minute. */
  @Post('request-otp')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  requestOtp(@Body() dto: RaffleRequestOtpDto) {
    return this.raffle.requestOtp(dto);
  }

  /** Verify the SMS access code and start the raffle session. Max 10 per IP per minute. */
  @Post('verify')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  verifyOtp(@Body() dto: RaffleVerifyDto) {
    return this.raffle.verifyOtp(dto);
  }

  /** Spin the wheel. Max 20 per IP per minute. */
  @Post('spin')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  spin(@Body() dto: RaffleSpinDto) {
    return this.raffle.spin(dto);
  }
}
