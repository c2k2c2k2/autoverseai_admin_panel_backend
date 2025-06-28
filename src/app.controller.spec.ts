import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return product information object', () => {
      expect(appController.getHello()).toEqual({
        productName: 'Autoverse AI Admin Panel Backend',
        version: '1.0.0',
        description: 'This backend service provides APIs for managing licenses, users, brands, cars, and other related entities for the Autoverse AI Admin Panel.',
        author: 'Autoverse AI Team',
        contact: 'support@autoverseai.com',
        homepage: 'https://autoverseai.com',
      });
    });
  });
});
