import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable, catchError, throwError } from 'rxjs';
import { Entidad } from '../models/entidad';

@Injectable({
  providedIn: 'root',
})
export class EntidadService {
  private url: string = `${environment.URL_BACKEND}/entidad`;
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

  obtenerEntidades(): Observable<Entidad[]> {
    return this.http
      .get<Entidad[]>(`${this.url}/obtener-entidad`, {
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

  obtenerEntidad(codigo: number): Observable<Entidad[]> {
    return this.http
      .get<Entidad[]>(`${this.url}/obtener-entidad/${codigo}`, {
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

  registrarEntidad(entidad: Entidad): Observable<number> {
    return this.http.post<number>(`${this.url}/registrar-entidad`, entidad, {
      headers: this.aggAutorizacionHeader(),
    });
  }

  actualizarEntidad(entidad: Entidad): Observable<number> {
    return this.http.put<number>(`${this.url}/actualizar-entidad`, entidad, {
      headers: this.aggAutorizacionHeader(),
    });
  }

  eliminarEntidad(entidad: Entidad): Observable<number> {
    return this.http.put<number>(`${this.url}/eliminar-entidad`, entidad, {
      headers: this.aggAutorizacionHeader(),
    });
  }
}
