import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { UsuarioDto } from '../dto/usuario-dto';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private url: string = `${environment.URL_BACKEND}/usuario`;
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

  registrarUsuario(usuario: UsuarioDto): Observable<number> {
    return this.http.post<number>(`${this.url}/registrar-usuario`, usuario, {
      headers: this.aggAutorizacionHeader(),
    });
  }


  actualizarUsuario(usuario: UsuarioDto): Observable<number> {
    return this.http.put<number>(`${this.url}/actualizar-usuario`, usuario, {
      headers: this.aggAutorizacionHeader(),
    });
  }

  eliminarUsuario(usuario: UsuarioDto): Observable<number> {
    return this.http.put<number>(`${this.url}/eliminar-usuario`, usuario, {
      headers: this.aggAutorizacionHeader(),
    });
  }
}
