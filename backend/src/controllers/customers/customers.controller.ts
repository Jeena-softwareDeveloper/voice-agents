import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { CustomersService } from '../../services/customers/customers.service';
import { ConvertCustomerDto } from '../../dto/customer.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { TenantGuard } from '../../guards/tenant.guard';
import { CurrentTenant } from '../../decorators/current-tenant.decorator';

@Controller('customers')
@UseGuards(JwtAuthGuard, TenantGuard)
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Post('convert')
  async convertCustomer(@CurrentTenant() tenantId: string, @Body() dto: ConvertCustomerDto) {
    return this.customersService.convertLeadToCustomer(tenantId, dto);
  }

  @Get()
  async getTenantCustomers(@CurrentTenant() tenantId: string) {
    return this.customersService.getTenantCustomers(tenantId);
  }

  @Get(':id')
  async getCustomerById(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.customersService.getCustomerById(tenantId, id);
  }
}
