import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable, catchError, throwError } from 'rxjs';
import { Persona } from '../models/persona';
import { PersonaDto } from '../dto/persona-dto';

@Injectable({
  providedIn: 'root'
})
export class PersonaService {
  private url: string = `${environment.URL_BACKEND}/persona`;
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

  obtenerPersonas(): Observable<Persona[]> {
    return this.http
      .get<Persona[]>(`${this.url}/obtener-personas`, {
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
  
  registrarPersona(persona: Persona): Observable<number> {
    return this.http.post<number>(`${this.url}/registrar-persona`, persona, {
      headers: this.aggAutorizacionHeader(),
    });
  }

  actualizarPersona(persona: Persona): Observable<number> {
    return this.http.put<number>(`${this.url}/actualizar-persona`, persona, {
      headers: this.aggAutorizacionHeader(),
    });
  }

  obtenerPersonasUsuario(): Observable<PersonaDto[]> {
    return this.http
      .get<PersonaDto[]>(`${this.url}/obtener-personas-usuario`, {
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

  obtenerInstructores(): Observable<Persona[]> {
    return this.http
      .get<Persona[]>(`${this.url}/obtener-instructores`, {
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
}
