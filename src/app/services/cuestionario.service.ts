import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable, catchError, throwError } from 'rxjs';
import { Cuestionario } from '../models/cuestionario';

@Injectable({
  providedIn: 'root',
})
export class CuestionarioService {
  private url: string = `${environment.URL_BACKEND}/cuestionario`;
  private httpHeaders = new HttpHeaders({ 'Content-type': 'application/json' });

  userLogeado: String = this.authservice.user.username;

  constructor(
    private http: HttpClient,
    private router: Router,
    private authservice: AuthService
  ) {}

  private aggAutorizacionHeader(): HttpHeaders {
    let token = this.authservice.Token;
    if (token != null) {
      return this.httpHeaders.append('Authorization', 'Bearer ' + token);
    }
    return this.httpHeaders;
  }

  private isNoAutorizado(e: { status: number }): boolean {
    if (e.status == 401 || e.status == 403) {
      if (this.authservice.isAuthenticated()) {
        this.authservice.logout();
      }
      this.router.navigate(['login']);
      return true;
    }
    return false;
  }

  obtenerCuestionarios(): Observable<Cuestionario[]> {
    return this.http
      .get<Cuestionario[]>(`${this.url}/obtener-cuestionarios`, {
        headers: this.aggAutorizacionHeader(),
      })
      .pipe(
        catchError((e) => {
          if (this.isNoAutorizado(e)) {
            return throwError(e);
          }
          return throwError(e);
        })
      );
  }

  obtenerCuestionario(codigo: number): Observable<Cuestionario[]> {
    return this.http
      .get<Cuestionario[]>(`${this.url}/obtener-cuestionario/${codigo}`, {
        headers: this.aggAutorizacionHeader(),
      })
      .pipe(
        catchError((e) => {
          if (this.isNoAutorizado(e)) {
            return throwError(e);
          }
          return throwError(e);
        })
      );
  }

  obtenerCuestionariosCurso(codigo: number): Observable<Cuestionario[]> {
    return this.http
      .get<Cuestionario[]>(
        `${this.url}/obtener-cuestionarios-curso/${codigo}`,
        {
          headers: this.aggAutorizacionHeader(),
        }
      )
      .pipe(
        catchError((e) => {
          if (this.isNoAutorizado(e)) {
            return throwError(e);
          }
          return throwError(e);
        })
      );
  }

  registrarCuestionario(cuestionario: Cuestionario): Observable<number> {
    return this.http.post<number>(
      `${this.url}/registrar-cuestionario`,
      cuestionario,
      {
        headers: this.aggAutorizacionHeader(),
      }
    );
  }

  actualizarCuestionario(cuestionario: Cuestionario): Observable<number> {
    return this.http.put<number>(
      `${this.url}/actualizar-cuestionario`,
      cuestionario,
      {
        headers: this.aggAutorizacionHeader(),
      }
    );
  }
}
