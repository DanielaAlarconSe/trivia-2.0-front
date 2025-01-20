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

@Component({
  selector: 'app-respuesta',
  templateUrl: './respuesta.component.html',
  styleUrls: ['./respuesta.component.css'],
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { subscriptSizing: 'dynamic' },
    },
  ],
})
export class RespuestaComponent {
  listadoCuestionarios: Cuestionario[] = [];
  listadoRespuestasCuestionario: RespuestaOpcion[] = [];
  codigoCuestionario!: number;
  respuesta!: RespuestaOpcion;

  dataSource = new MatTableDataSource<RespuestaOpcion>([]);
  displayedColumns: string[] = [
    'index',
    'nombre',
    'cuestionario',
    'puntuacion',
    'opciones',
  ];
  @ViewChild(MatPaginator, { static: false }) paginator!: MatPaginator;

  dialogRef!: MatDialogRef<any>;
  palabrasClaves!: string;

  constructor(
    public cuestionarioService: CuestionarioService,
    public respuestaService: RespuestaService,
    public dialog: MatDialog,
    private authService: AuthService,
    private router: Router
  ) {
    if (this.authService.validacionToken()) {
      this.obtenerCuestionarios();
    }
  }

  obtenerRespuestas(event: any) {
    let respuesta: RespuestaOpcion = new RespuestaOpcion();
    this.codigoCuestionario = event.value.codigo;
    respuesta.cuestionarioCodigo = event.value.codigo;
    respuesta.cuestionarioNombre = event.value.nombre;
    this.respuesta = respuesta;
    this.respuestaService
      .obtenerRespuestasCuestionario(event.value.codigo)
      .subscribe((data) => {
        this.listadoRespuestasCuestionario = data;
        this.dataSource = new MatTableDataSource<RespuestaOpcion>(data);
        this.paginator.firstPage();
        this.dataSource.paginator = this.paginator;
      });
  }

  actualizarRespuestas(element: RespuestaOpcion) {
    this.respuestaService
      .obtenerRespuestasCuestionario(element.cuestionarioCodigo)
      .subscribe((data) => {
        this.listadoRespuestasCuestionario = data;
        this.dataSource = new MatTableDataSource<RespuestaOpcion>(data);
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
    this.dialogRef = this.dialog.open(ModalFormularioRespuesta, {
      width: '50%',
      disableClose: true,
      data: { respuesta: this.respuesta },
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

  editarFormulario(element: RespuestaOpcion): void {
    this.dialogRef = this.dialog.open(ModalFormularioRespuesta, {
      width: '50%',
      disableClose: true,
      data: { respuesta: element },
    });
    this.dialogRef.afterClosed().subscribe(() => {
      this.onModalClosed();
    });
  }

  onModalClosed() {
    this.actualizarRespuestas(this.respuesta);
  }

  eliminar(respuesta: RespuestaOpcion) {
    this.respuestaService.actualizarRespuesta(respuesta).subscribe(
      (data: any) => {
        if (data > 0) {
          this.actualizarRespuestas(respuesta);
        } else {
          this.mensajeError();
        }
      },
      (err: any) => this.fError(err)
    );
  }

  eliminarRespuesta(element: RespuestaOpcion) {
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
  selector: 'modal-formulario-respuesta',
  templateUrl: './modal-formulario-respuesta.html',
  styleUrls: ['./respuesta.component.css'],
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { subscriptSizing: 'dynamic' },
    },
  ],
})
export class ModalFormularioRespuesta {
  editar: boolean = false;
  formulario!: FormGroup;
  respuesta: RespuestaOpcion[] = [];

  constructor(
    public dialogRef: MatDialogRef<ModalFormularioRespuesta>,
    private formBuilder: FormBuilder,
    public dialog: MatDialog,
    private authService: AuthService,
    private router: Router,
    public respuestaService: RespuestaService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.authService.validacionToken()) {
      this.crearFormulario();

      if (data.respuesta.codigo !== undefined) {
        this.editarRespuesta(data.respuesta);
      }
    }
  }

  ngOnInit() {}

  private crearFormulario(): void {
    this.formulario = this.formBuilder.group({
      codigo: new FormControl(''),
      nombre: new FormControl('', Validators.required),
      cuestionarioCodigo: new FormControl(''),
      puntuacion: new FormControl(''),
      estado: new FormControl(''),
    });
  }

  generarRespuesta(): void {
    let respuesta: RespuestaOpcion = new RespuestaOpcion();
    respuesta.codigo = this.formulario.get('codigo')!.value;
    respuesta.nombre = this.formulario.get('nombre')!.value;
    respuesta.cuestionarioCodigo = this.data.respuesta.cuestionarioCodigo;
    respuesta.puntuacion = this.formulario.get('puntuacion')!.value;
    respuesta.estado = this.formulario.get('estado')!.value;

    if (this.editar) {
      this.actualizarRespuesta(respuesta);
    } else {
      this.registrarRespuesta(respuesta);
    }
  }

  registrarRespuesta(respuesta: RespuestaOpcion) {
    this.respuestaService.registrarRespuesta(respuesta).subscribe(
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

  actualizarRespuesta(respuesta: RespuestaOpcion) {
    this.respuestaService.actualizarRespuesta(respuesta).subscribe(
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

  editarRespuesta(element: RespuestaOpcion) {
    this.editar = true;
    this.formulario.get('codigo')!.setValue(element.codigo);
    this.formulario.get('nombre')!.setValue(element.nombre);
    this.formulario
      .get('cuestionarioCodigo')!
      .setValue(element.cuestionarioCodigo);
    this.formulario.get('puntuacion')!.setValue(element.puntuacion);
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
