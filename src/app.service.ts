import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): any {
    return {
      productName: 'Autoverse AI Admin Panel Backend',
      version: '1.0.0',
      description: 'This backend service provides APIs for managing licenses, users, brands, cars, and other related entities for the Autoverse AI Admin Panel.',
      author: 'Autoverse AI Team',
      contact: 'support@autoverseai.com',
      homepage: 'https://autoverseai.com',
    };
  }
}
