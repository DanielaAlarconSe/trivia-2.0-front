import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable, catchError, throwError } from 'rxjs';
import { Entidad } from '../models/entidad';
import { AsignacionTrivia } from '../models/asignacion-trivia';
import { AsignacionDto } from '../models/dto/asignacion-dto';

@Injectable({
  providedIn: 'root',
})
export class AsginacionService {
  private url: string = `${environment.URL_BACKEND}/asignacion`;
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

  obtenerAspirantesPorEntidad(entidad: number): Observable<AsignacionDto[]> {
    return this.http
      .get<AsignacionDto[]>(
        `${this.url}/obtener-aspirantes-entidad/${entidad}`,
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

  registrarAsignacionTrivia(asignacion: AsignacionTrivia): Observable<number> {
    return this.http.post<number>(
      `${this.url}/registrar-asignacion`,
      asignacion,
      {
        headers: this.aggAutorizacionHeader(),
      }
    );
  }

  actualizarAsignacionTrivia(asignacion: AsignacionTrivia): Observable<number> {
    return this.http.put<number>(
      `${this.url}/actualizar-asignacion`,
      asignacion,
      {
        headers: this.aggAutorizacionHeader(),
      }
    );
  }

  eliminarAsignacionTrivia(asignacion: AsignacionTrivia): Observable<number> {
    return this.http.put<number>(
      `${this.url}/actualizar-asignacion`,
      asignacion,
      {
        headers: this.aggAutorizacionHeader(),
      }
    );
  }
}
