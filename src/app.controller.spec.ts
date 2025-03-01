import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfig } from './config/app.config';
import { MultiversXConfig } from './config/multiversx.config';
import { Environment } from './utils/constants';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;
  let appConfig: AppConfig & { environment: Environment };
  let multiversXConfig: MultiversXConfig;

  beforeEach(async () => {
    appService = { getInfo: jest.fn(), checkHealth: jest.fn() } as any;
    appConfig = { environment: 'test' as Environment, aiAnalysisEnabled: true } as any;
    multiversXConfig = { network: 'testnet', apiUrl: 'http://api.test', explorerUrl: 'http://explorer.test' } as any;

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        { provide: AppService, useValue: appService },
        { provide: AppConfig, useValue: appConfig },
        { provide: MultiversXConfig, useValue: multiversXConfig },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('getInfo', () => {
    it('should return application information', () => {
      const result = {
        name: 'App Name',
        description: 'App Description',
        version: '1.0.0',
        environment: 'test' as Environment,
        network: 'testnet',
        features: {
          aiAnalysis: true,
          patternDetection: true,
          anomalyDetection: true,
          realTimeMonitoring: true,
        },
      };
      jest.spyOn(appService, 'getInfo').mockImplementation(() => result);

      expect(appController.getInfo()).toBe(result);
    });
  });

  describe('getHealth', () => {
    it('should return health status as ok', async () => {
      jest.spyOn(appService, 'checkHealth').mockResolvedValue(true);

      expect(await appController.getHealth()).toEqual({
        status: 'ok',
        version: '1.0.0',
        timestamp: expect.any(String),
        environment: 'test',
        network: 'testnet',
        aiAnalysisEnabled: true,
      });
    });

    it('should return health status as error', async () => {
      jest.spyOn(appService, 'checkHealth').mockResolvedValue(false);

      expect(await appController.getHealth()).toEqual({
        status: 'error',
        message: 'One or more services are not healthy',
      });
    });
  });

  describe('getConfig', () => {
    it('should return public configuration', () => {
      expect(appController.getConfig()).toEqual({
        appName: undefined,
        environment: 'test',
        network: 'testnet',
        apiUrl: 'http://api.test',
        explorerUrl: 'http://explorer.test',
        aiAnalysisEnabled: true,
      });
    });
  });
});
