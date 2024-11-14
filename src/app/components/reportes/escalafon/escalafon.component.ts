import { Component, ViewChild } from '@angular/core';
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
    private escalafonPdfService: EscalafonPdfService
  ) {
    this.activatedRoute.params.subscribe((params) => {
      this.cuestionarioToken = params['token'];
      this.obtenerCalificacion();
    });
  }

  obtenerCalificacion(): void {
    console.log('ENTRA');

    this.resultadosReportesService
      .obtenerCalificacionesToken(this.cuestionarioToken)
      .subscribe(
        (data) => {
          console.log(data);

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
}
