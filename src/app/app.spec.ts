import { TestBed } from '@angular/core/testing';
import { App } from './app.component';
import { environment } from '../environments/environment';
import { ENVIRONMENT_TOKEN } from './core/services/auth.service';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [{ provide: ENVIRONMENT_TOKEN, useValue: environment }],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('environment production flag', () => {
    expect(environment.production).toBeFalsy();
  });

  it('environment has apiUrl', () => {
    expect(environment.apiUrl).toContain('localhost');
  });

  it('environment has wsUrl', () => {
    expect(environment.wsUrl).toContain('localhost');
  });
});
