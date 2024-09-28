import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.authService.user.nombre) {
      return true;
    } else {
      this.router.navigate(['/inicio-sesion']); // Redirige a la página de inicio de sesión si el usuario no está autenticado
      return false;
    }
  }
}
