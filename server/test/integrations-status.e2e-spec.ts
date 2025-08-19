import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, CanActivate, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { JwtAuthGuard } from './../src/auth/jwt-auth.guard';
import { ConfigModule } from '@nestjs/config';
import { AdyenModule } from './../src/adyen/adyen.module';
import { IntegrationsStatusModule } from './../src/integrations/integrations-status.module';

// Mutable role for tests; JwtAuthGuard mock will read this
let testRole: 'admin' | 'accountant' | 'customer' = 'admin';

class JwtAuthGuardMock implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = { id: 'test-user', role: testRole };
    return true;
  }
}

describe('IntegrationsStatus (e2e)', () => {
  let app: INestApplication;

  async function initApp() {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        AdyenModule,
        IntegrationsStatusModule,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(new JwtAuthGuardMock())
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  }

  afterEach(async () => {
    if (app) await app.close();
  });

  it('GET /integrations/adyen/status returns 200 with admin role (sandbox env)', async () => {
    process.env.ADYEN_ENV = 'test';
    testRole = 'admin';
    await initApp();

    const res = await request(app.getHttpServer())
      .get('/integrations/adyen/status')
      .expect(200);

    expect(res.body).toHaveProperty('environment', 'test');
    expect(res.body).toHaveProperty('baseUrl');
    expect(res.body).toHaveProperty('hasApiKey');
    expect(res.body).toHaveProperty('hasBalanceAccountId');
    expect(res.body).toHaveProperty('connectivity');
    expect(typeof res.body.connectivity.ok).toBe('boolean');
    expect(typeof res.body.connectivity.httpStatus).toBe('number');
  });

  it('GET /integrations/adyen/status returns 403 for insufficient role', async () => {
    process.env.ADYEN_ENV = 'test';
    testRole = 'customer';
    await initApp();

    await request(app.getHttpServer())
      .get('/integrations/adyen/status')
      .expect(403);
  });

  it('GET /integrations/adyen/status returns 400 for live environment', async () => {
    process.env.ADYEN_ENV = 'live';
    testRole = 'admin';
    await initApp();

    await request(app.getHttpServer())
      .get('/integrations/adyen/status')
      .expect(400);
  });
});
