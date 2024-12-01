import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ReporteCalificacionesExcelService } from './../../../services/reporte-calificaciones-excel.service';
import { ResultadosReportesService } from 'src/app/services/resultados-reportes.service';
import { CursoService } from './../../../services/curso.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { Cuestionario } from 'src/app/models/cuestionario';
import { CuestionarioService } from 'src/app/services/cuestionario.service';
import { Curso } from 'src/app/models/curso';
import { Calificacion } from 'src/app/models/calificacion';
import { EscalafonPdfService } from 'src/app/services/escalafon-pdf.service';
import { DatePipe } from '@angular/common';
import Swal from 'sweetalert2';
import html2canvas from 'html2canvas';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-escalafon',
  templateUrl: './escalafon.component.html',
  styleUrls: ['./escalafon.component.css'],
})
export class EscalafonComponent {
  listadoCalificaciones: Calificacion[] = [];
  listadoCursos: Curso[] = [];
  listadoCuestionarios: Cuestionario[] = [];

  dataForExcel: any[] = [];
  dataCalificacion: any[] = [];

  //Filtros
  cursoNombre!: string;
  cuestionarioNombre!: string;

  dataSource = new MatTableDataSource<Calificacion>([]);
  displayedColumns: string[] = [
    'index',
    'nombre',
    'curso',
    'cuestionario',
    'fecha',
    'calificacion',
  ];
  @ViewChild(MatPaginator, { static: false }) paginator!: MatPaginator;

  dialogRef!: MatDialogRef<any>;
  palabrasClaves!: string;
  cursoCodigo!: number;
  cuestionarioCodigo!: number;
  rutaServidor = 'http://localhost:4200/#/escalafon/';
  url: boolean = false;
  cuestionarioToken!: string;

  cloudinaryUploadUrl =
    'https://api.cloudinary.com/v1_1/df4xfvk4i/image/upload'; // Cambia YOUR_CLOUD_NAME
  uploadPreset = 'ml_default'; // Cambia esto por el upload preset que configures en Cloudinary

  @ViewChild('captureElement') captureElement!: ElementRef;

  constructor(
    public cuestionarioService: CuestionarioService,
    public resultadosReportesService: ResultadosReportesService,
    public cursoService: CursoService,
    public dialog: MatDialog,
    public datePipe: DatePipe,
    private authService: AuthService,
    public reporteCalificacionesExcelService: ReporteCalificacionesExcelService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private escalafonPdfService: EscalafonPdfService,
    private http: HttpClient
  ) {
    this.activatedRoute.params.subscribe((params) => {
      this.cuestionarioToken = params['token'];
      this.obtenerCalificacion();
    });
  }

  obtenerCalificacion(): void {
    this.resultadosReportesService
      .obtenerCalificacionesToken(this.cuestionarioToken)
      .subscribe(
        (data) => {
          this.listadoCalificaciones = data;
          this.dataSource = new MatTableDataSource<Calificacion>(data);
          this.paginator.firstPage();
          this.dataSource.paginator = this.paginator;
          this.crearDatasource();
        },
        (error) => {
          // Maneja el error aquí y muestra una alerta con SweetAlert
          Swal.fire({
            icon: 'warning',
            title: 'Advertencia',
            timer: 8000, // Tiempo en milisegundos (5 segundos)
            timerProgressBar: true,
            showConfirmButton: false,
            text: 'No se puede obtener los resultados de la trivia. Por favor, revise el token suministrado o si la trivia sigue vigente.',
          }).then(() => {
            // Redirigir a la URL cuando el temporizador termina
            this.router.navigate(['/inicio']);
          });
        }
      );
  }

  generarPdf() {
    this.escalafonPdfService.export(this.listadoCalificaciones);
  }

  copyUrl() {
    navigator.clipboard
      .writeText(this.rutaServidor + this.listadoCuestionarios[0].token)
      .then(() => {
        // Mostrar mensaje de éxito y redirigir
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
          icon: 'info',
          title: 'URL copiado al portapapeles.',
        });
      })
      .catch((err) => {
        console.error('Error al copiar la URL: ', err);
      });
  }

  obtenerCuestionario(codigo: number) {
    this.cuestionarioService
      .obtenerCuestionariosCurso(codigo)
      .subscribe((data) => {
        this.listadoCuestionarios = data;
        console.log(JSON.stringify(this.listadoCuestionarios[0].token));

        if (this.listadoCuestionarios[0].token != null) {
          this.url = true;
        }
      });
  }

  obtenerCalificaciones(codigo: number) {
    this.resultadosReportesService
      .obtenerCalificacionesTrivia(codigo)
      .subscribe((data: any) => {
        this.listadoCalificaciones = data;
        this.dataSource = new MatTableDataSource<Calificacion>(data);
        this.paginator.firstPage();
        this.dataSource.paginator = this.paginator;
        this.crearDatasource();
      });
  }

  crearDatasource() {
    for (let index = 0; index < this.listadoCalificaciones.length; index++) {
      let fecha = this.datePipe.transform(
        this.listadoCalificaciones[index].fechaRegistro,
        'dd-MM-yyyy h:mm a'
      );
      this.dataCalificacion.push({
        N: index + 1,
        ESTUDIANTE: this.listadoCalificaciones[index].estudianteNombre,
        CURSO: this.listadoCalificaciones[index].cursoNombre,
        TRIVIA: this.listadoCalificaciones[index].cuestionarioNombre,
        CALIFICACIÓN: this.listadoCalificaciones[index].calificacion,
        FECHA: fecha,
      });
    }
  }

  datosCalificacionExcel() {
    this.dataCalificacion.forEach((row: any) => {
      this.dataForExcel.push(Object.values(row));
    });
    let reportData = {
      title: 'Reporte Calificaciones ',
      data: this.dataForExcel,
      headers: Object.keys(this.dataCalificacion[0]),
    };

    this.reporteCalificacionesExcelService.exportExcel(reportData);
  }

  obtenerCursos() {
    this.cursoService.obtenerCursos().subscribe((data) => {
      this.listadoCursos = data;
    });
  }

  obtenerCuestionarios() {
    this.cuestionarioService.obtenerCuestionarios().subscribe((data) => {
      this.listadoCuestionarios = data;
    });
  }

  filtrar(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  restaurar() {
    this.palabrasClaves = '';
  }

  mensajeSuccses() {
    Swal.fire({
      icon: 'success',
      title: 'Proceso realizado',
      text: '¡Operación exitosa!',
      showConfirmButton: false,
      timer: 2500,
    });
  }

  mensajeError() {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo completar el proceso.',
      showConfirmButton: true,
      confirmButtonText: 'Listo',
      confirmButtonColor: '#8f141b',
    });
  }

  fError(er: any): void {
    let err = er.error.error_description;
    let arr: string[] = err.split(':');
    if (arr[0] == 'Access token expired') {
      this.authService.logout();
      this.router.navigate(['login']);
    } else {
      this.mensajeError();
    }
  }

  compartir() {
    Swal.fire({
      width: 600,
      padding: '3em',
      color: '#ffffff',
      background: '#282828',
      html: `
        <button id="close-alert-btn" style="position: absolute; top: 10px; right: 10px; background: none; border: none; font-size: 20px; color: #ffffff; cursor: pointer;">
            &times;
          </button>
        <div style="border: 3px solid #00C853; border-radius: 15px; padding: 20px; text-align: center; position: relative;">
          <h2 style="color: #00C853; margin-bottom: 15px;">Redes Sociales</h2>
          <div style="display: flex; gap: 15px; justify-content: center; margin-top: 25px;">
            <button id="facebook-share-btn" style="background: none; border: none; cursor: pointer;">
              <i class="fab fa-facebook-f" style="color: #1877f2; font-size: 28px;"></i>
            </button>
            <button id="twitter-share-btn" style="background: none; border: none; cursor: pointer;">
              <i class="fab fa-twitter" style="color: #1DA1F2; font-size: 28px;"></i>
            </button>
            <button id="linkedin-share-btn" style="background: none; border: none; cursor: pointer;">
              <i class="fab fa-linkedin-in" style="color: #0077b5; font-size: 28px;"></i>
            </button>
            <button id="whatsapp-share-btn" style="background: none; border: none; cursor: pointer;">
              <i class="fab fa-whatsapp" style="color: #25D366; font-size: 28px;"></i>
            </button>
          </div>
          <img src="assets/images/login.png" alt="Logo" style="width: 250px; margin: 15px auto; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);" />
        </div>
      `,
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
      didOpen: () => {
        const closeButton = document.getElementById('close-alert-btn');
        if (closeButton) {
          closeButton.addEventListener('click', () => {
            Swal.close();
            // Realizar cualquier acción adicional después de cerrar
            this.router.navigate(['/inicio']);
          });
        }
      },
    });
    

    setTimeout(() => {
      document
        .getElementById('facebook-share-btn')
        ?.addEventListener('click', () => this.takeScreenshotAndUpload());
      document
        .getElementById('twitter-share-btn')
        ?.addEventListener('click', () =>
          this.takeScreenshotAndUpload('twitter')
        );
      document
        .getElementById('linkedin-share-btn')
        ?.addEventListener('click', () =>
          this.takeScreenshotAndUpload('linkedin')
        );
      document
        .getElementById('whatsapp-share-btn')
        ?.addEventListener('click', () =>
          this.takeScreenshotAndUpload('whatsapp')
        );
    }, 0);
  }

  takeScreenshotAndUpload(platform?: string) {
    setTimeout(() => {
      if (this.captureElement) {
        html2canvas(this.captureElement.nativeElement).then((canvas) => {
          canvas.toBlob((blob) => {
            if (blob) {
              const formData = new FormData();
              formData.append('file', blob);
              formData.append('upload_preset', this.uploadPreset);
              this.http.post(this.cloudinaryUploadUrl, formData).subscribe(
                (response: any) => {
                  const imageUrl = response.secure_url;
                  switch (platform) {
                    case 'twitter': this.shareOnTwitter(imageUrl); break;
                    case 'linkedin': this.shareOnLinkedIn(imageUrl); break;
                    case 'whatsapp': this.shareOnWhatsApp(imageUrl); break;
                    default: this.shareOnFacebook(imageUrl);
                  }
                },
                (error) => {
                  console.error('Error al subir la imagen a Cloudinary:', error);
                }
              );
            }
          });
        });
      } else {
        console.error('Elemento para captura no encontrado.');
      }
    }, 500); // Ajusta el tiempo si es necesario.
  }
  

  shareOnFacebook(imageUrl: string) {
    const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      imageUrl
    )}`;
    window.open(facebookShareUrl, '_blank');
  }

  shareOnTwitter(imageUrl: string) {
    const text = encodeURIComponent(
      '¡He completado la trivia ' +
      ' de Ciberseguridad en línea con éxito! 🔒🌐 Descubre mi resultado:'
    );
    const twitterShareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
      imageUrl
    )}&text=${text}`;
    window.open(twitterShareUrl, '_blank');
  }

  shareOnLinkedIn(imageUrl: string) {
    const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      imageUrl
    )}`;
    window.open(linkedInShareUrl, '_blank');
  }

  shareOnWhatsApp(imageUrl: string) {
    const message = encodeURIComponent(
      '¡He completado la trivia ' +
      ' de Ciberseguridad en línea con éxito! Descubre mi resultado:'
    );
    const whatsappShareUrl = `https://wa.me/?text=${message}%20${encodeURIComponent(
      imageUrl
    )}`;
    window.open(whatsappShareUrl, '_blank');
  }

}
