import { Component, Inject, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import Swal from 'sweetalert2';
import { Cuestionario } from 'src/app/models/cuestionario';
import { CuestionarioService } from 'src/app/services/cuestionario.service';
import { Curso } from 'src/app/models/curso';
import { CuestionarioCategoriaService } from 'src/app/services/cuestionario-categoria.service';
import { CuestionarioCategoria } from 'src/app/models/cuestionario-categoria';
import { CursoService } from 'src/app/services/curso.service';

@Component({
  selector: 'app-cuestionario',
  templateUrl: './cuestionario.component.html',
  styleUrls: ['./cuestionario.component.css'],
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { subscriptSizing: 'dynamic' },
    },
  ],
})
export class CuestionarioComponent {
  rutaServidor = 'http://localhost:4200/#/trivia-competitiva/';
  listadoCuestionario: Cuestionario[] = [];

  dataSource = new MatTableDataSource<Cuestionario>([]);
  displayedColumns: string[] = [
    'index',
    'nombre',
    'instrucciones',
    'categoria',
    'curso',
    'fechaInicio',
    'fechaFin',
    'estado',
    'opciones',
  ];
  @ViewChild(MatPaginator, { static: false }) paginator!: MatPaginator;

  dialogRef!: MatDialogRef<any>;
  palabrasClaves!: string;

  constructor(
    public cuestionarioService: CuestionarioService,
    public dialog: MatDialog,
    private authService: AuthService,
    private router: Router
  ) {
    if (this.authService.validacionToken()) {
      this.obtenerCuestionarios();
    }
  }

  copyUrl(url: string) {
    navigator.clipboard
      .writeText(this.rutaServidor + url)
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

  botonActivo(element: Cuestionario): boolean {
    const fechaJson = new Date(element.fechaFin);
    return fechaJson <= new Date();
  }

  obtenerCuestionarios() {
    this.cuestionarioService
      .obtenerCuestionarios(
        this.authService.user.tipoUsuarioCodigo,
        this.authService.user.personaCodigo
      )
      .subscribe((data: any) => {
        this.listadoCuestionario = data;
        this.dataSource = new MatTableDataSource<Cuestionario>(data);
        this.paginator.firstPage();
        this.dataSource.paginator = this.paginator;
      });
  }

  registrarFormulario(): void {
    this.dialogRef = this.dialog.open(ModalFormularioCuestionario, {
      width: '50%',
      disableClose: true,
    });
    this.dialogRef.afterClosed().subscribe(() => {
      this.onModalClosed();
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
    this.obtenerCuestionarios();
    this.palabrasClaves = '';
  }

  editarFormulario(element: any): void {
    this.dialogRef = this.dialog.open(ModalFormularioCuestionario, {
      width: '50%',
      disableClose: true,
      data: { cuestionario: element },
    });
    this.dialogRef.afterClosed().subscribe(() => {
      this.onModalClosed();
    });
  }

  onModalClosed() {
    this.obtenerCuestionarios();
  }

  eliminar(cuestionario: Cuestionario) {
    this.cuestionarioService.actualizarCuestionario(cuestionario).subscribe(
      (data: any) => {
        if (data > 0) {
          this.obtenerCuestionarios();
        } else {
          this.mensajeError();
        }
      },
      (err: any) => this.fError(err)
    );
  }

  editarCuestionario(element: Cuestionario) {
    this.editarFormulario(element);
  }

  eliminarCuestionario(element: Cuestionario) {
    Swal.fire({
      title: 'Está a punto de eliminar el cuestionario',
      text: 'La siguiente acción no podrá deshacerse.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#00c053',
      cancelButtonColor: '#DC1919',
      confirmButtonText: 'Aceptar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        element.estado = 0;
        this.eliminar(element);
        Swal.fire({
          icon: 'success',
          title: '¡Transacción realizada con éxito!',
          confirmButtonColor: '#00c053',
          confirmButtonText: 'Ok',
        });
      }
    });
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

//// MODAL FORMULARIO

@Component({
  selector: 'modal-formulario-cuestionario',
  templateUrl: './modal-formulario-cuestionario.html',
  styleUrls: ['./cuestionario.component.css'],
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { subscriptSizing: 'dynamic' },
    },
  ],
})
export class ModalFormularioCuestionario {
  editar: boolean = false;
  formulario!: FormGroup;
  cursos: Curso[] = [];
  categorias: CuestionarioCategoria[] = [];
  fechaLimiteMinima!: any;
  fechaLimiteMinimaVigencia!: any;

  constructor(
    public dialogRef: MatDialogRef<ModalFormularioCuestionario>,
    private formBuilder: FormBuilder,
    private cursoService: CursoService,
    public dialog: MatDialog,
    private authService: AuthService,
    private router: Router,
    private cuestionarioService: CuestionarioService,
    private cuestionarioCategoriaService: CuestionarioCategoriaService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.fechaLimiteMinima = new Date();
    if (this.authService.validacionToken()) {
      this.crearFormulario();
      this.obtenerCursos();
      this.obtenerCategorias();
      if (JSON.stringify(data) !== 'null') {
        this.editarCuestionario(data.cuestionario);
      }
    }
  }

  ngOnInit() {}

  limiteVigencia() {
    this.fechaLimiteMinimaVigencia = new Date(
      this.formulario.get('fechaInicio')!.value
    );
  }

  private crearFormulario(): void {
    this.formulario = this.formBuilder.group({
      codigo: new FormControl(''),
      nombre: new FormControl('', Validators.required),
      instrucciones: new FormControl('', Validators.required),
      curso: new FormControl(''),
      fechaInicio: new FormControl(''),
      fechaFin: new FormControl(''),
      tiempo: new FormControl('', [Validators.min(1), Validators.max(1440)]),
      categoria: new FormControl('', Validators.required),
      estado: new FormControl(''),
    });
  }

  obtenerCursos(): void {
    this.cursoService
      .obtenerCursos(
        this.authService.user.tipoUsuarioCodigo,
        this.authService.user.personaCodigo
      )
      .subscribe((data) => {
        this.cursos = data;
      });
  }

  obtenerCategorias(): void {
    this.cuestionarioCategoriaService
      .obtenerCategorias(this.authService.user.tipoUsuarioCodigo)
      .subscribe((data) => {
        this.categorias = data;
      });
  }

  generarCuestionario(): void {
    let cuestionario: Cuestionario = new Cuestionario();
    cuestionario.codigo = this.formulario.get('codigo')!.value;
    cuestionario.nombre = this.formulario.get('nombre')!.value;
    cuestionario.instrucciones = this.formulario.get('instrucciones')!.value;
    cuestionario.cursoCodigo = this.formulario.get('curso')!.value;
    if (this.formulario.get('categoria')!.value == 2) {
      const tiempo = this.formulario.get('tiempo')!.value; // Duración en minutos
      const fechaInicio = this.formulario.get('fechaInicio')!.value; // Hora de inicio seleccionada

      // Convertir fechaInicio a un objeto Date
      const fechaInicioDate = new Date(fechaInicio);

      // Calcular la fecha de finalización sumando los minutos
      const fechaFinDate = new Date(fechaInicioDate.getTime() + tiempo * 60000); // 60000 ms = 1 minuto

      // Actualizar las propiedades del cuestionario
      cuestionario.fechaInicio = fechaInicioDate;
      cuestionario.fechaFin = fechaFinDate;

      console.log('Fecha de inicio:', cuestionario.fechaInicio);
      console.log('Fecha de finalización:', cuestionario.fechaFin);
    } else {
      cuestionario.fechaInicio = this.formulario.get('fechaInicio')!.value;
      cuestionario.fechaFin = this.formulario.get('fechaFin')!.value;
    }
    cuestionario.categoriaCodigo = this.formulario.get('categoria')!.value;
    cuestionario.estado = this.formulario.get('estado')!.value;

    if (this.editar) {
      this.actualizarCuestionario(cuestionario);
    } else {
      this.registrarCuestionario(cuestionario);
    }
  }

  registrarCuestionario(cuestionario: Cuestionario) {
    this.cuestionarioService.registrarCuestionario(cuestionario).subscribe(
      (data) => {
        if (data > 0) {
          Swal.fire({
            icon: 'success',
            title: 'Registrado',
            text: '¡Operación exitosa!',
            showConfirmButton: false,
            timer: 2500,
          });
          this.dialogRef.close();
          this.cancelar();
          this.crearFormulario();
        } else {
          this.mensajeError();
        }
      },
      (err) => this.fError(err)
    );
  }

  actualizarCuestionario(cuestionario: Cuestionario) {
    this.cuestionarioService.actualizarCuestionario(cuestionario).subscribe(
      (data) => {
        if (data > 0) {
          Swal.fire({
            icon: 'success',
            title: 'Actualizado',
            text: '¡Operación exitosa!',
            showConfirmButton: false,
          });
          this.cancelar();
          this.dialogRef.close();
        } else {
          this.mensajeError();
        }
      },
      (err) => this.fError(err)
    );
  }

  editarCuestionario(element: Cuestionario) {
    console.log(element);

    this.editar = true;
    this.formulario.get('codigo')!.setValue(element.codigo);
    this.formulario.get('nombre')!.setValue(element.nombre);
    this.formulario.get('instrucciones')!.setValue(element.instrucciones);
    this.formulario.get('curso')!.setValue(element.cursoCodigo);
    if (element.categoriaCodigo == 2) {
      const fechaInicio = new Date(element.fechaInicio); // Convertir a Date
      const fechaFin = new Date(element.fechaFin); // Convertir a Date

      // Calcular la diferencia en milisegundos
      const diferenciaMs = fechaFin.getTime() - fechaInicio.getTime();

      // Convertir a minutos
      const diferenciaMinutos = Math.floor(diferenciaMs / 60000);

      // Asignar el valor de tiempo
      this.formulario.get('tiempo')!.setValue(diferenciaMinutos);
    }
    // Formatear las fechas para que sean compatibles con el input datetime-local
    const formatDate = (date: Date) => {
      const pad = (num: number) => (num < 10 ? '0' : '') + num;
      const year = date.getFullYear();
      const month = pad(date.getMonth() + 1); // Meses van de 0 a 11
      const day = pad(date.getDate());
      const hours = pad(date.getHours());
      const minutes = pad(date.getMinutes());
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const fechaInicioFormatted = formatDate(new Date(element.fechaInicio));
    const fechaFinFormatted = formatDate(new Date(element.fechaFin));

    this.formulario.get('fechaInicio')!.setValue(fechaInicioFormatted);
    this.formulario.get('fechaFin')!.setValue(fechaFinFormatted);
    this.formulario.get('categoria')!.setValue(element.categoriaCodigo);
    this.formulario.get('estado')!.setValue(element.estado);
  }

  eliminarCuestionario() {
    let cuestionario: Cuestionario = new Cuestionario();
    cuestionario.codigo = this.formulario.get('codigo')!.value;
    cuestionario.nombre = this.formulario.get('nombre')!.value;
    cuestionario.instrucciones = this.formulario.get('instrucciones')!.value;
    cuestionario.cursoCodigo = this.formulario.get('curso')!.value;
    cuestionario.fechaInicio = this.formulario.get('fechaInicio')!.value;
    cuestionario.fechaFin = this.formulario.get('fechaFin')!.value;
    cuestionario.categoriaCodigo = this.formulario.get('categoria')!.value;
    cuestionario.estado = this.formulario.get('estado')!.value;
    this.actualizarCuestionario(cuestionario);
  }

  cancelar() {
    this.formulario.reset();
    this.crearFormulario();
    this.editar = false;
    this.dialogRef.close();
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

  transformToUppercase(event: Event, controlName: string): void {
    const inputElement = event.target as HTMLInputElement;
    const uppercaseValue = inputElement.value.toUpperCase();
    inputElement.value = uppercaseValue;
    this.formulario.get(controlName)?.setValue(uppercaseValue);
  }
}
