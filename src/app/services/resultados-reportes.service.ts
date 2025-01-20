import { RespuestaTipo } from './../models/respuesta-tipo';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable, catchError, throwError } from 'rxjs';
import { RespuestaCuestionario } from '../models/respuesta-cuestionario';
import { Calificacion } from '../models/calificacion';
import { ReporteAgrupadoDto } from '../models/dto/reporte-agrupado-dto';
import { EmailNotificacionDto } from '../models/dto/email-notificacion-dto';

@Injectable({
  providedIn: 'root',
})
export class ResultadosReportesService {
  private url: string = `${environment.URL_BACKEND}/resultados-reportes`;
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

  obtenerResultadoTrivia(codigo: number): Observable<number> {
    return this.http.get<number>(
      `${this.url}/obtener-resultado-trivia/${codigo}`,
      {
        headers: this.aggAutorizacionHeader(),
      }
    );
  }

  obtenerCalificaciones(): Observable<Calificacion[]> {
    return this.http.get<Calificacion[]>(`${this.url}/obtener-calificaciones`, {
      headers: this.aggAutorizacionHeader(),
    });
  }

  obtenerCalificacionesTrivia(codigo: number): Observable<Calificacion[]> {
    return this.http.get<Calificacion[]>(
      `${this.url}/obtener-calificaciones-trivia/${codigo}`,
      {
        headers: this.aggAutorizacionHeader(),
      }
    );
  }

  obtenerCalificacionesToken(token: string): Observable<Calificacion[]> {
    return this.http.get<Calificacion[]>(
      `${this.url}/obtener-calificaciones-token/${token}`,
      {
        headers: this.aggAutorizacionHeader(),
      }
    );
  }

  generarDatosReporteAgrupado(
    cuestionario: number,
    preguntas: number[]
  ): Observable<ReporteAgrupadoDto[]> {
    return this.http
      .get<ReporteAgrupadoDto[]>(
        `${this.url}/generar-datos-reporte-agrupado/${cuestionario}/${preguntas}`,
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

  public emailNotificacionEntidad(email: EmailNotificacionDto): Observable<EmailNotificacionDto> {
    return this.http.put<EmailNotificacionDto>(`${this.url}/email/entidad`, email);
  }
}
