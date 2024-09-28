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
import { Cuestionario } from 'src/app/models/cuestionario';
import { CuestionarioService } from 'src/app/services/cuestionario.service';
import Swal from 'sweetalert2';
import { RespuestaOpcion } from 'src/app/models/respuesta-opcion';
import { RespuestaService } from '../../../services/respuesta.service';
import { Pregunta } from 'src/app/models/pregunta';
import { PreguntaService } from 'src/app/services/pregunta.service';
import { PreguntaRespuesta } from 'src/app/models/pregunta-respuesta';
import { PreguntaRespuestaService } from '../../../services/pregunta-respuesta.service';

@Component({
  selector: 'app-pregunta-respuesta',
  templateUrl: './pregunta-respuesta.component.html',
  styleUrls: ['./pregunta-respuesta.component.css'],
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { subscriptSizing: 'dynamic' },
    },
  ],
})
export class PreguntaRespuestaComponent {
  listadoCuestionarios: Cuestionario[] = [];
  listadoPreguntas: Pregunta[] = [];
  listadoRespuestasCuestionario: RespuestaOpcion[] = [];
  codigoPregunta!: number;
  preguntaRespuesta!: PreguntaRespuesta;

  dataSource = new MatTableDataSource<PreguntaRespuesta>([]);
  displayedColumns: string[] = [
    'index',
    'cuestionario',
    'pregunta',
    'respuesta',
    'puntuacion',
    'opciones',
  ];
  @ViewChild(MatPaginator, { static: false }) paginator!: MatPaginator;

  dialogRef!: MatDialogRef<any>;
  palabrasClaves!: string;

  constructor(
    public cuestionarioService: CuestionarioService,
    public respuestaService: RespuestaService,
    public preguntaRespuestaService: PreguntaRespuestaService,
    public preguntaService: PreguntaService,
    public dialog: MatDialog,
    private authService: AuthService,
    private router: Router
  ) {
    if (this.authService.validacionToken()) {
      this.obtenerCuestionarios();
    }
  }

  obtenerPreguntas(event: any) {
    this.preguntaService
      .obtenerPreguntasCuestionario(event.value.codigo)
      .subscribe((data) => {
        this.listadoPreguntas = data;
      });
  }

  obtenerRespuestas(event: any) {
    let preguntaRespuesta: PreguntaRespuesta = new PreguntaRespuesta();
    this.codigoPregunta = event.value.codigo;
    preguntaRespuesta.cuestionarioCodigo = event.value.cuestionarioCodigo;
    preguntaRespuesta.cuestionarioNombre = event.value.cuestionarioNombre;
    preguntaRespuesta.preguntaCodigo = event.value.codigo;
    preguntaRespuesta.preguntaNombre = event.value.nombre;
    this.preguntaRespuesta = preguntaRespuesta;
    this.preguntaRespuestaService
      .obtenerPreguntaRespuestas(event.value.codigo)
      .subscribe((data) => {
        this.dataSource = new MatTableDataSource<PreguntaRespuesta>(data);
        this.paginator.firstPage();
        this.dataSource.paginator = this.paginator;
      });
  }

  actualizarPreguntaRespuesta(element: PreguntaRespuesta) {
    this.preguntaRespuestaService
      .obtenerPreguntaRespuestas(element.preguntaCodigo)
      .subscribe((data) => {
        this.dataSource = new MatTableDataSource<PreguntaRespuesta>(data);
        this.paginator.firstPage();
        this.dataSource.paginator = this.paginator;
      });
  }

  obtenerCuestionarios() {
    this.cuestionarioService.obtenerCuestionarios().subscribe((data: any) => {
      this.listadoCuestionarios = data;
    });
  }

  registrarFormulario(): void {
    this.dialogRef = this.dialog.open(ModalFormularioPreguntaRespuesta, {
      width: '50%',
      disableClose: true,
      data: { preguntaRespuesta: this.preguntaRespuesta },
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

  editarFormulario(element: PreguntaRespuesta): void {
    this.dialogRef = this.dialog.open(ModalFormularioPreguntaRespuesta, {
      width: '50%',
      disableClose: true,
      data: { preguntaRespuesta: element },
    });
    this.dialogRef.afterClosed().subscribe(() => {
      this.onModalClosed();
    });
  }

  onModalClosed() {
    this.actualizarPreguntaRespuesta(this.preguntaRespuesta);
  }

  eliminar(preguntaRespuesta: PreguntaRespuesta) {
    this.preguntaRespuestaService
      .actualizarPreguntaRespuesta(preguntaRespuesta)
      .subscribe(
        (data: any) => {
          if (data > 0) {
            this.actualizarPreguntaRespuesta(preguntaRespuesta);
          } else {
            this.mensajeError();
          }
        },
        (err: any) => this.fError(err)
      );
  }

  eliminarRespuesta(element: PreguntaRespuesta) {
    Swal.fire({
      title: 'Está a punto de eliminar la respuesta',
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
  selector: 'modal-formulario-pregunta-respuesta',
  templateUrl: './modal-formulario-pregunta-respuesta.html',
  styleUrls: ['./pregunta-respuesta.component.css'],
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { subscriptSizing: 'dynamic' },
    },
  ],
})
export class ModalFormularioPreguntaRespuesta {
  editar: boolean = false;
  formulario!: FormGroup;
  listadoRespuestas: RespuestaOpcion[] = [];

  constructor(
    public dialogRef: MatDialogRef<ModalFormularioPreguntaRespuesta>,
    private formBuilder: FormBuilder,
    public dialog: MatDialog,
    private authService: AuthService,
    private router: Router,
    public respuestaService: RespuestaService,
    public preguntaRespuestaService: PreguntaRespuestaService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.authService.validacionToken()) {
      this.crearFormulario();

      if (data.preguntaRespuesta.codigo !== undefined) {
        this.editarPreguntaRespuesta(data.preguntaRespuesta);
      }
    }
  }

  ngOnInit() {
    this.obtenerRespuestas();
  }

  obtenerRespuestas() {
    this.respuestaService
      .obtenerRespuestasCuestionario(
        this.data.preguntaRespuesta.cuestionarioCodigo
      )
      .subscribe((data) => {
        this.listadoRespuestas = data;
      });
  }

  private crearFormulario(): void {
    this.formulario = this.formBuilder.group({
      codigo: new FormControl(''),
      preguntaCodigo: new FormControl(''),
      respuestaCodigo: new FormControl('', Validators.required),
      estado: new FormControl(''),
    });
  }

  generarPreguntaRespuesta(): void {
    let preguntaRespuesta: PreguntaRespuesta = new PreguntaRespuesta();
    preguntaRespuesta.codigo = this.formulario.get('codigo')!.value;
    preguntaRespuesta.preguntaCodigo =
      this.data.preguntaRespuesta.preguntaCodigo;
    preguntaRespuesta.respuestaOpcionCodigo =
      this.formulario.get('respuestaCodigo')!.value;
    preguntaRespuesta.estado = this.formulario.get('estado')!.value;

    if (this.editar) {
      this.actualizarPreguntaRespuesta(preguntaRespuesta);
    } else {
      this.registrarPreguntaRespuesta(preguntaRespuesta);
    }
  }

  registrarPreguntaRespuesta(preguntaRespuesta: PreguntaRespuesta) {
    this.preguntaRespuestaService
      .registrarPreguntaRespuesta(preguntaRespuesta)
      .subscribe(
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

  actualizarPreguntaRespuesta(preguntaRespuesta: PreguntaRespuesta) {
    this.preguntaRespuestaService
      .actualizarPreguntaRespuesta(preguntaRespuesta)
      .subscribe(
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

  editarPreguntaRespuesta(element: PreguntaRespuesta) {
    this.editar = true;
    this.formulario.get('codigo')!.setValue(element.codigo);
    this.formulario.get('preguntaCodigo')!.setValue(element.preguntaCodigo);
    this.formulario
      .get('respuestaCodigo')!
      .setValue(element.respuestaOpcionCodigo);
    this.formulario.get('estado')!.setValue(element.estado);
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
}
