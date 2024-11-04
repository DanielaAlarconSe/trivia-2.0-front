import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable, catchError, throwError } from 'rxjs';
import { Curso } from '../models/curso';

@Injectable({
  providedIn: 'root'
})
export class CursoService {
  private url: string = `${environment.URL_BACKEND}/curso`;
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

  obtenerCursos(): Observable<Curso[]> {
    return this.http
      .get<Curso[]>(`${this.url}/obtener-cursos`, {
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

  registrarCurso(curso: Curso): Observable<number> {
    return this.http.post<number>(`${this.url}/registrar-curso`, curso, {
      headers: this.aggAutorizacionHeader(),
    });
  }

  actualizarCurso(curso: Curso): Observable<number> {
    return this.http.put<number>(`${this.url}/actualizar-curso`, curso, {
      headers: this.aggAutorizacionHeader(),
    });
  }

  eliminarCurso(curso: Curso): Observable<number> {
    return this.http.put<number>(`${this.url}/eliminar-curso`, curso, {
      headers: this.aggAutorizacionHeader(),
    });
  }
}
