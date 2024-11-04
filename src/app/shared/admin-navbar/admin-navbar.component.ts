import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, shareReplay } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/services/auth.service';
import { NavbarHiddenService } from 'src/app/services/navbar-hidden.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-navbar',
  templateUrl: './admin-navbar.component.html',
  styleUrls: ['./admin-navbar.component.css']
})
export class AdminNavbarComponent {
  public nombre: string = this.auth.user.nombre;
  public apellido: string = this.auth.user.apellido;
  public roles: number = this.auth.user.rol;
  public rol: number = this.roles;
  url: string = environment.URL_BACKEND;
  panelOpenState = false;
  panelAbierto: string | null = null;
  anio = new Date();

  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(
      map((result) => result.matches),
      shareReplay()
    );

  constructor(
    private breakpointObserver: BreakpointObserver,
    public auth: AuthService,
    private router: Router,
    public navbarHiddenService: NavbarHiddenService
  ) {}

  togglePanel(panelId: string): void {
    if (this.panelAbierto === panelId) {
      this.panelAbierto = null;
    } else {
      this.panelAbierto = panelId;
    }
  }

  receiveMessage($event: any) {
    this.rol = $event;
  }

  scroll(page: HTMLElement) {
    page.scrollIntoView();
  }

  logout(): void {
    this.auth.logout();
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
      icon: 'success',
      title: 'Sesión cerrada correctamente',
    });
    this.router.navigate(['/inicio']);
  }

  ngOnInit() {}

  toggle() {
    this.navbarHiddenService.toggleSideBar();
  }
}
