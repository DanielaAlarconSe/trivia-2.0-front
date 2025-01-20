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
import { PreguntaService } from 'src/app/services/pregunta.service';
import { Pregunta } from 'src/app/models/pregunta';
import { RespuestaTipo } from 'src/app/models/respuesta-tipo';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-pregunta',
  templateUrl: './pregunta.component.html',
  styleUrls: ['./pregunta.component.css'],
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { subscriptSizing: 'dynamic' },
    },
  ],
})
export class PreguntaComponent {
  listadoCuestionarios: Cuestionario[] = [];
  listadoPreguntasCuestionario: Pregunta[] = [];
  codigoCuestionario!: number;
  pregunta!: Pregunta;

  dataSource = new MatTableDataSource<Pregunta>([]);
  displayedColumns: string[] = [
    'index',
    'nombre',
    'cuestionario',
    'tipo',
    'texto',
    'opciones',
  ];
  @ViewChild(MatPaginator, { static: false }) paginator!: MatPaginator;

  dialogRef!: MatDialogRef<any>;
  palabrasClaves!: string;

  constructor(
    public cuestionarioService: CuestionarioService,
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
    let pregunta: Pregunta = new Pregunta();
    this.codigoCuestionario = event.value.codigo;
    pregunta.cuestionarioCodigo = event.value.codigo;
    pregunta.cuestionarioNombre = event.value.nombre;
    this.pregunta = pregunta;
    this.preguntaService
      .obtenerPreguntasCuestionario(event.value.codigo)
      .subscribe((data) => {
        this.listadoPreguntasCuestionario = data;
        this.dataSource = new MatTableDataSource<Pregunta>(data);
        this.paginator.firstPage();
        this.dataSource.paginator = this.paginator;
      });
  }

  actualizarPreguntas(element: Pregunta) {
    this.preguntaService
      .obtenerPreguntasCuestionario(element.cuestionarioCodigo)
      .subscribe((data) => {
        this.listadoPreguntasCuestionario = data;
        this.dataSource = new MatTableDataSource<Pregunta>(data);
        this.paginator.firstPage();
        this.dataSource.paginator = this.paginator;
      });
  }

  obtenerCuestionarios() {
    this.cuestionarioService
      .obtenerCuestionarios(
        this.authService.user.tipoUsuarioCodigo,
        this.authService.user.personaCodigo
      )
      .subscribe((data: any) => {
        this.listadoCuestionarios = data;
      });
  }

  registrarFormulario(): void {
    this.dialogRef = this.dialog.open(ModalFormularioPregunta, {
      width: '50%',
      disableClose: true,
      data: { pregunta: this.pregunta },
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

  editarFormulario(element: Pregunta): void {
    this.dialogRef = this.dialog.open(ModalFormularioPregunta, {
      width: '50%',
      disableClose: true,
      data: { pregunta: element },
    });
    this.dialogRef.afterClosed().subscribe(() => {
      this.onModalClosed();
    });
  }

  onModalClosed() {
    this.actualizarPreguntas(this.pregunta);
  }

  eliminar(pregunta: Pregunta) {
    this.preguntaService.actualizarPregunta(pregunta).subscribe(
      (data: any) => {
        if (data > 0) {
          this.actualizarPreguntas(pregunta);
        } else {
          this.mensajeError();
        }
      },
      (err: any) => this.fError(err)
    );
  }

  eliminarCuestionario(element: Pregunta) {
    Swal.fire({
      title: 'Está a punto de eliminar la pregunta',
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
  templateUrl: './modal-formulario-pregunta.html',
  styleUrls: ['./pregunta.component.css'],
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { subscriptSizing: 'dynamic' },
    },
  ],
})
export class ModalFormularioPregunta {
  editar: boolean = false;
  formulario!: FormGroup;
  pregunta: Pregunta[] = [];
  listadoRespuestaTipo: RespuestaTipo[] = [];

  constructor(
    public dialogRef: MatDialogRef<ModalFormularioPregunta>,
    private formBuilder: FormBuilder,
    public dialog: MatDialog,
    private authService: AuthService,
    private router: Router,
    public preguntaService: PreguntaService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.authService.validacionToken()) {
      this.crearFormulario();

      if (data.pregunta.codigo !== undefined) {
        this.editarPregunta(data.pregunta);
      }
    }
  }

  ngOnInit() {
    this.obtenerRespuestaTipo();
  }

  obtenerRespuestaTipo() {
    this.preguntaService.obtenerRespuestaTipo().subscribe((data) => {
      this.listadoRespuestaTipo = data;
    });
  }

  private crearFormulario(): void {
    this.formulario = this.formBuilder.group({
      codigo: new FormControl(''),
      nombre: new FormControl('', Validators.required),
      cuestionarioCodigo: new FormControl(''),
      tipoRespuestaCodigo: new FormControl('', Validators.required),
      textoAdicional: new FormControl(''),
      estado: new FormControl(''),
    });
  }

  generarCuestionario(): void {
    let pregunta: Pregunta = new Pregunta();
    pregunta.codigo = this.formulario.get('codigo')!.value;
    pregunta.nombre = this.formulario.get('nombre')!.value;
    pregunta.cuestionarioCodigo = this.data.pregunta.cuestionarioCodigo;
    pregunta.tipoRespuestaCodigo = this.formulario.get(
      'tipoRespuestaCodigo'
    )!.value;
    pregunta.textoAdicional = this.formulario.get('textoAdicional')!.value;
    pregunta.estado = this.formulario.get('estado')!.value;

    if (this.editar) {
      this.actualizarPregunta(pregunta);
    } else {
      this.registrarPregunta(pregunta);
    }
  }

  registrarPregunta(pregunta: Pregunta) {
    this.preguntaService.registrarPregunta(pregunta).subscribe(
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

  actualizarPregunta(pregunta: Pregunta) {
    this.preguntaService.actualizarPregunta(pregunta).subscribe(
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

  editarPregunta(element: Pregunta) {
    this.editar = true;
    this.formulario.get('codigo')!.setValue(element.codigo);
    this.formulario.get('nombre')!.setValue(element.nombre);
    this.formulario
      .get('cuestionarioCodigo')!
      .setValue(element.cuestionarioCodigo);
    this.formulario
      .get('tipoRespuestaCodigo')!
      .setValue(element.tipoRespuestaCodigo);
    this.formulario.get('textoAdicional')!.setValue(element.textoAdicional);
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
