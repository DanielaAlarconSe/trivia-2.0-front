import { RespuestaTipo } from './../models/respuesta-tipo';
import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable, catchError, throwError } from 'rxjs';
import { Pregunta } from '../models/pregunta';

@Injectable({
  providedIn: 'root',
})
export class PreguntaService {
  private url: string = `${environment.URL_BACKEND}/pregunta`;
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

  obtenerPreguntasCuestionario(codigo: number): Observable<Pregunta[]> {
    return this.http
      .get<Pregunta[]>(`${this.url}/obtener-preguntas-cuestionario/${codigo}`, {
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

  obtenerRespuestaTipo(): Observable<RespuestaTipo[]> {
    return this.http
      .get<RespuestaTipo[]>(`${this.url}/obtener-respuesta-tipo`, {
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

  registrarPregunta(pregunta: Pregunta): Observable<number> {
    return this.http.post<number>(`${this.url}/registrar-pregunta`, pregunta, {
      headers: this.aggAutorizacionHeader(),
    });
  }

  actualizarPregunta(pregunta: Pregunta): Observable<number> {
    return this.http.put<number>(`${this.url}/actualizar-pregunta`, pregunta, {
      headers: this.aggAutorizacionHeader(),
    });
  }
}
