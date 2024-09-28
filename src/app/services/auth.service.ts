import { Injectable } from '@angular/core';
import { Usuario } from '../models/usuario';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../environments/environment';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private usuario: Usuario | undefined;
  private url: string = environment.URL_BACKEND;
  private httpHeaders = new HttpHeaders({ 'Content-type': 'application/json' });
  private token: any;
  public codigoverificacion: any;

  constructor(private http: HttpClient, private router: Router) {}

  public get user(): Usuario {
    if (this.usuario != null) {
      return this.usuario;
    } else if (
      this.usuario == null &&
      localStorage.getItem('usuario') != null
    ) {
      this.usuario = JSON.parse(
        sessionStorage.getItem('usuario') || '{}'
      ) as Usuario;
      return this.usuario;
    }
    return new Usuario();
  }

  public get Token(): any {
    if (this.token != null) {
      return this.token;
    } else if (this.token == null && sessionStorage.getItem('token') != null) {
      this.token = sessionStorage.getItem('token');
      return this.token;
    }
    return null;
  }

  public get Codigoverificacion(): any {
    if (this.codigoverificacion != null) {
      return this.codigoverificacion;
    } else if (
      this.codigoverificacion == null &&
      sessionStorage.getItem('codigo') != null
    ) {
      this.codigoverificacion = sessionStorage.getItem('codigo');
      return this.codigoverificacion;
    }
    return null;
  }

  login(usuario: Usuario): Observable<any> {
    const url = this.url + '/oauth/token';
    const credenciales = btoa('angularapp' + ':' + '12345');
    const httpHeaders = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + credenciales,
    });
    let params = new URLSearchParams();

    params.set('grant_type', 'password');
    params.set('username', usuario.username);
    params.set('password', usuario.password);

    return this.http
      .post<any>(url, params.toString(), { headers: httpHeaders })
      .pipe(
        catchError((e) => {
          if (e) {
            if (e.error.error_description == 'Bad credentials') {
              const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                didOpen: (toast) => {
                  toast.addEventListener('mouseenter', Swal.stopTimer);
                  toast.addEventListener('mouseleave', Swal.resumeTimer);
                },
              });

              Toast.fire({
                icon: 'error',
                title: 'Contraseña incorrecta',
              });
              return [throwError(e), false];
            }
            const Toast = Swal.mixin({
              toast: true,
              position: 'top-end',
              showConfirmButton: false,
              timer: 3000,
              timerProgressBar: true,
              didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
              },
            });

            Toast.fire({
              icon: 'error',
              title: 'Usuario no encontrado en el sistema.',
            });
            return throwError(e);
          }
          return throwError(e);
        })
      );
  }

  guardarUsuario(accessToken: string): void {
    let datos = this.obtenerdatosToken(accessToken);
    //  let helper = new JwtHelperService();
    // let datos = helper.decodeToken(accessToken);
    this.usuario = new Usuario();
    this.usuario.username = datos.username;
    this.usuario.nombre = datos.nombre;
    this.usuario.apellido = datos.apellido;
    this.usuario.rol = datos.role;

    sessionStorage.setItem('usuario', JSON.stringify(this.usuario));
    localStorage.setItem('usuario', JSON.stringify(this.usuario));
  }

  guardarToken(accessToken: string): void {
    this.token = accessToken;
    localStorage.setItem('token', accessToken);
    sessionStorage.setItem('token', accessToken);
  }

  guardarCodigoverificacion(codigo: string): void {
    this.codigoverificacion = codigo;
    sessionStorage.setItem('codigo', codigo);
    localStorage.setItem('codigo', codigo);
  }

  obtenerdatosToken(accessToken: string): any {
    if (accessToken != null) {
      return JSON.parse(atob(accessToken.split('.')[1]));
    }
    return null;
  }

  isAuthenticated(): boolean {
    let payload = this.obtenerdatosToken(this.Token);
    if (payload != null && payload.user_name && payload.user_name.length > 0) {
      return true;
    }
    return false;
  }

  logout(): void {
    this.token = null;
    this.usuario = undefined;
    sessionStorage.clear();
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('usuario');
    sessionStorage.removeItem('codigo');

    localStorage.clear();
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('codigo');
  }

  private aggAutorizacionHeader(): HttpHeaders {
    let token = this.token;
    if (token != null) {
      return this.httpHeaders.append('Authorization', 'Bearer ' + token);
    }
    return this.httpHeaders;
  }

  validacionToken() {
    if (!this.isAuthenticated()) {
      this.router.navigate(['login']);
      return false;
    }
    return true;
  }
}
