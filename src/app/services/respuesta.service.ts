import { RespuestaTipo } from './../models/respuesta-tipo';
import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable, catchError, throwError } from 'rxjs';
import { RespuestaOpcion } from '../models/respuesta-opcion';
import { RespuestaCuestionario } from '../models/respuesta-cuestionario';
import { Respuesta } from '../models/respuesta';
import { Bandera } from '../models/bandera';

@Injectable({
  providedIn: 'root',
})
export class RespuestaService {
  private url: string = `${environment.URL_BACKEND}/respuesta`;
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

  obtenerRespuestasCuestionario(codigo: number): Observable<RespuestaOpcion[]> {
    return this.http
      .get<RespuestaOpcion[]>(
        `${this.url}/obtener-respuestas-cuestionario/${codigo}`,
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

  obtenerUltimoRegistro(): Observable<number> {
    return this.http.get<number>(`${this.url}/obtener-ultimo-registro`, {
      headers: this.aggAutorizacionHeader(),
    });
  }

  registrarRespuesta(respuesta: RespuestaOpcion): Observable<number> {
    return this.http.post<number>(
      `${this.url}/registrar-respuesta`,
      respuesta,
      {
        headers: this.aggAutorizacionHeader(),
      }
    );
  }

  actualizarRespuesta(respuesta: RespuestaOpcion): Observable<number> {
    return this.http.put<number>(
      `${this.url}/actualizar-respuesta`,
      respuesta,
      {
        headers: this.aggAutorizacionHeader(),
      }
    );
  }

  registrarRespuestaCuestionario(
    respuestaCuestionario: RespuestaCuestionario
  ): Observable<number> {
    return this.http.post<number>(
      `${this.url}/registrar-respuesta-cuestionario`,
      respuestaCuestionario,
      {
        headers: this.aggAutorizacionHeader(),
      }
    );
  }

  registrarRespuestaTrivia(respuesta: Respuesta): Observable<number> {
    return this.http.post<number>(
      `${this.url}/registrar-respuesta-trivia`,
      respuesta,
      {
        headers: this.aggAutorizacionHeader(),
      }
    );
  }

  actualizarCalificacion(
    respuestaCuestionario: RespuestaCuestionario
  ): Observable<number> {
    return this.http.post<number>(
      `${this.url}/actualizar-calificacion`,
      respuestaCuestionario,
      {
        headers: this.aggAutorizacionHeader(),
      }
    );
  }
}
