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
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import { Entidad } from 'src/app/models/entidad';
import { EntidadService } from 'src/app/services/entidad.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-entidad',
  templateUrl: './entidad.component.html',
  styleUrls: ['./entidad.component.css'],
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { subscriptSizing: 'dynamic' },
    },
  ],
})
export class EntidadComponent {
  listadoEntidad: Entidad[] = [];

  dataSource = new MatTableDataSource<Entidad>([]);
  displayedColumns: string[] = [
    'index',
    'nombre',
    'direccion',
    'telefono',
    'email',
    'fechaRegistro',
    'opciones',
  ];
  @ViewChild(MatPaginator, { static: false }) paginator!: MatPaginator;

  dialogRef!: MatDialogRef<any>;
  palabrasClaves!: string;

  constructor(
    public entidadService: EntidadService,
    public dialog: MatDialog,
    private authService: AuthService,
    private router: Router
  ) {
    if (this.authService.validacionToken()) {
      this.obtenerEntidades();
    }
  }

  obtenerEntidades() {
    this.entidadService.obtenerEntidades().subscribe((data: any) => {
      this.listadoEntidad = data;
      this.dataSource = new MatTableDataSource<Entidad>(data);
      this.paginator.firstPage();
      this.dataSource.paginator = this.paginator;
    });
  }

  registrarFormulario(): void {
    this.dialogRef = this.dialog.open(ModalFormularioEntidad, {
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
    this.obtenerEntidades();
    this.palabrasClaves = '';
  }

  editarFormulario(element: any): void {
    this.dialogRef = this.dialog.open(ModalFormularioEntidad, {
      width: '50%',
      disableClose: true,
      data: { entidad: element },
    });
    this.dialogRef.afterClosed().subscribe(() => {
      this.onModalClosed();
    });
  }

  onModalClosed() {
    this.obtenerEntidades();
  }

  eliminar(entidad: Entidad) {
    this.entidadService.eliminarEntidad(entidad).subscribe(
      (data: any) => {
        if (data > 0) {
          this.obtenerEntidades();
        } else {
          this.mensajeError();
        }
      },
      (err: any) => this.fError(err)
    );
  }

  editarEntidad(element: Entidad) {
    this.editarFormulario(element);
  }

  eliminarEntidad(element: Entidad) {
    Swal.fire({
      title: 'Está a punto de eliminar la entidad',
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
  selector: 'modal-formulario-entidad',
  templateUrl: './modal-formulario-entidad.html',
  styleUrls: ['./entidad.component.css'],
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { subscriptSizing: 'dynamic' },
    },
  ],
})
export class ModalFormularioEntidad {
  editar: boolean = false;
  formulario!: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<ModalFormularioEntidad>,
    private formBuilder: FormBuilder,
    public dialog: MatDialog,
    private authService: AuthService,
    private router: Router,
    private entidadService: EntidadService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.authService.validacionToken()) {
      this.crearFormulario();
      if (JSON.stringify(data) !== 'null') {
        this.editarEntidad(data.entidad);
      }
    }
  }

  ngOnInit() {}

  private crearFormulario(): void {
    this.formulario = this.formBuilder.group({
      codigo: new FormControl(''),
      nombre: new FormControl('', Validators.required),
      direccion: new FormControl('', Validators.required),
      telefono: new FormControl('', Validators.required),
      email: new FormControl('', [Validators.required, Validators.email]),
      fechaRegistro: new FormControl(''),
      estado: new FormControl(''),
    });
  }

  generarEntidad(): void {
    let entidad: Entidad = new Entidad();
    entidad.codigo = this.formulario.get('codigo')!.value;
    entidad.nombre = this.formulario.get('nombre')!.value;
    entidad.direccion = this.formulario.get('direccion')!.value;
    entidad.telefono = this.formulario.get('telefono')!.value;
    entidad.email = this.formulario.get('email')!.value;
    entidad.fechaRegistro = this.formulario.get('fechaRegistro')!.value;
    entidad.estado = this.formulario.get('estado')!.value;

    if (this.editar) {
      this.actualizarEntidad(entidad);
    } else {
      this.registrarEntidad(entidad);
    }
  }

  registrarEntidad(entidad: Entidad) {
    this.entidadService.registrarEntidad(entidad).subscribe(
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

  actualizarEntidad(entidad: Entidad) {
    this.entidadService.actualizarEntidad(entidad).subscribe(
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

  editarEntidad(element: Entidad) {
    this.editar = true;
    this.formulario.get('codigo')!.setValue(element.codigo);
    this.formulario.get('nombre')!.setValue(element.nombre);
    this.formulario.get('direccion')!.setValue(element.direccion);
    this.formulario.get('telefono')!.setValue(element.telefono);
    this.formulario.get('email')!.setValue(element.email);
    this.formulario.get('fechaRegistro')!.setValue(element.fechaRegistro);
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

  transformToUppercase(event: Event, controlName: string): void {
    const inputElement = event.target as HTMLInputElement;
    const uppercaseValue = inputElement.value.toUpperCase();
    inputElement.value = uppercaseValue;
    this.formulario.get(controlName)?.setValue(uppercaseValue);
  }
}
