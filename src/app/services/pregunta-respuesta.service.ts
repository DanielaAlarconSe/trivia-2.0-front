import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable, catchError, throwError } from 'rxjs';
import { PreguntaRespuesta } from '../models/pregunta-respuesta';

@Injectable({
  providedIn: 'root',
})
export class PreguntaRespuestaService {
  private url: string = `${environment.URL_BACKEND}/pregunta-respuesta`;
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

  obtenerPreguntaRespuestas(
    codigo: number
  ): Observable<PreguntaRespuesta[]> {
    return this.http
      .get<PreguntaRespuesta[]>(
        `${this.url}/obtener-pregunta-respuestas/${codigo}`,
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

  registrarPreguntaRespuesta(preguntaRespuesta: PreguntaRespuesta): Observable<number> {
    return this.http.post<number>(
      `${this.url}/registrar-pregunta-respuesta`,
      preguntaRespuesta,
      {
        headers: this.aggAutorizacionHeader(),
      }
    );
  }

  actualizarPreguntaRespuesta(preguntaRespuesta: PreguntaRespuesta): Observable<number> {
    return this.http.put<number>(
      `${this.url}/actualizar-pregunta-respuesta`,
      preguntaRespuesta,
      {
        headers: this.aggAutorizacionHeader(),
      }
    );
  }
}
