import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('authInterceptor + AuthService', () => {
  let http: HttpTestingController;
  let client: HttpClient;
  let auth: AuthService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    client = TestBed.inject(HttpClient);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => http.verify());

  const logIn = () => {
    auth.login('admin@hana.test', 'hana1234').subscribe();
    http.expectOne('/api/admin/login').flush({
      accessToken: 'jwt-123',
      staff: { id: '1', email: 'admin@hana.test', name: 'แอดมิน', role: 'ADMIN' },
    });
  };

  it('stores the session after login', () => {
    logIn();
    expect(auth.isLoggedIn()).toBe(true);
    expect(auth.staff()?.name).toBe('แอดมิน');
    expect(sessionStorage.getItem('clinic-admin-session')).toContain('jwt-123');
  });

  it('adds the token to admin calls only', () => {
    logIn();
    client.get('/api/admin/stats').subscribe();
    client.get('/api/treatments').subscribe();

    expect(http.expectOne('/api/admin/stats').request.headers.get('Authorization')).toBe(
      'Bearer jwt-123',
    );
    expect(http.expectOne('/api/treatments').request.headers.has('Authorization')).toBe(false);
  });

  it('logs out and goes to the login page when the token is rejected', () => {
    logIn();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    client.get('/api/admin/stats').subscribe({ error: () => undefined });
    http
      .expectOne('/api/admin/stats')
      .flush({ message: 'expired' }, { status: 401, statusText: 'Unauthorized' });

    expect(auth.isLoggedIn()).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/admin/login'], { queryParams: { reason: 'expired' } });
  });
});
