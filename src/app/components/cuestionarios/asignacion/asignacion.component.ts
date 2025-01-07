import { Component, Inject, ViewChild } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
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
import { AsginacionService } from 'src/app/services/asginacion.service';
import Swal from 'sweetalert2';
import { AsignacionDto } from 'src/app/models/dto/asignacion-dto';
import { PersonaService } from 'src/app/services/persona.service';
import { PersonaDto } from 'src/app/models/dto/persona-dto';
import { AsignacionTrivia } from '../../../models/asignacion-trivia';
import { CuestionarioService } from '../../../services/cuestionario.service';
import { Cuestionario } from 'src/app/models/cuestionario';
import { SeguimientoService } from '../../../services/seguimiento.service';
import { EmailNotificacionDto } from 'src/app/models/dto/email-notificacion-dto';

@Component({
  selector: 'app-asignacion',
  templateUrl: './asignacion.component.html',
  styleUrls: ['./asignacion.component.css'],
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { subscriptSizing: 'dynamic' },
    },
  ],
})
export class AsignacionComponent {
  listadoEntidad: Entidad[] = [];
  codigoEntidad!: number;
  asignacion!: AsignacionDto;

  dataSource = new MatTableDataSource<AsignacionDto>([]);
  displayedColumns: string[] = [
    'index',
    'entidad',
    'persona',
    'trivia',
    'seguimiento',
    'fechaInicio',
    'fechaFin',
    'opciones',
  ];
  @ViewChild(MatPaginator, { static: false }) paginator!: MatPaginator;

  dialogRef!: MatDialogRef<any>;
  palabrasClaves!: string;

  constructor(
    public entidadService: EntidadService,
    public dialog: MatDialog,
    private authService: AuthService,
    private router: Router,
    private asginacionService: AsginacionService,
    private seguimientoService: SeguimientoService
  ) {
    if (this.authService.validacionToken()) {
      this.obtenerEntidades();
    }
  }

  obtenerEntidades() {
    this.entidadService.obtenerEntidades().subscribe((data) => {
      this.listadoEntidad = data;
    });
  }

  enviarEmail(element: AsignacionDto) {
    let email: EmailNotificacionDto = new EmailNotificacionDto();
    email.destinatarioAspirante = element.personaEmail;
    email.aspiranteNombre =
      element.personaNombre + ' ' + element.personaApellido;
    email.usuario = element.personaEmail;
    email.clave = element.personaToken;
    email.entidadNombre = element.entidadNombre;
    const formatFecha = (fecha: string | Date): string => {
      // Asegurar que sea una instancia de Date
      const fechaObj = fecha instanceof Date ? fecha : new Date(fecha);

      const opcionesFecha: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      };
      const opcionesHora: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      };

      const fechaFormateada: string = fechaObj.toLocaleDateString(
        'es-ES',
        opcionesFecha
      );
      const horaFormateada: string = fechaObj.toLocaleTimeString(
        'es-ES',
        opcionesHora
      );

      return `${fechaFormateada} ${horaFormateada}`;
    };

    // Uso en tu método
    email.fechaFinalizacion = formatFecha(element.fechaFinalizacion);

    console.log(email);

    this.seguimientoService
      .emailNotificacionAspirante(email)
      .subscribe((data) => {
        console.log(data);
        let seguimiento: AsignacionTrivia = new AsignacionTrivia();
        seguimiento.codigo = element.asignacionCodigo;
        seguimiento.seguimiento = 2;
        this.seguimientoService
          .actualizarSeguimiento(seguimiento)
          .subscribe((data) => {
            this.actualizarAsignacion(element);
          });
      });
  }

  obtenerAsignacion(event: any) {
    let asignacion: AsignacionDto = new AsignacionDto();
    this.codigoEntidad = event.value.codigo;
    asignacion.entidadCodigo = event.value.codigo;
    asignacion.entidadNombre = event.value.nombre;
    this.asignacion = asignacion;
    this.asginacionService
      .obtenerAspirantesPorEntidad(event.value.codigo)
      .subscribe((data) => {
        this.dataSource = new MatTableDataSource<AsignacionDto>(data);
        this.paginator.firstPage();
        this.dataSource.paginator = this.paginator;
      });
  }

  actualizarAsignacion(element: AsignacionDto) {
    console.log(element);

    this.asginacionService
      .obtenerAspirantesPorEntidad(element.entidadCodigo)
      .subscribe((data) => {
        this.dataSource = new MatTableDataSource<AsignacionDto>(data);
        this.paginator.firstPage();
        this.dataSource.paginator = this.paginator;
      });
  }

  obtenerAspirantes(event: any) {
    this.codigoEntidad = event.value.codigo;
    this.asginacionService
      .obtenerAspirantesPorEntidad(event.value.codigo)
      .subscribe((data) => {
        console.log(data);
        this.dataSource = new MatTableDataSource<AsignacionDto>(data);
        this.paginator.firstPage();
        this.dataSource.paginator = this.paginator;
      });
  }

  registrarFormulario(): void {
    this.dialogRef = this.dialog.open(ModalFormularioAsignacion, {
      width: '50%',
      disableClose: true,
      data: { asignacion: this.asignacion },
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

  editarFormulario(element: AsignacionDto): void {
    this.dialogRef = this.dialog.open(ModalFormularioAsignacion, {
      width: '50%',
      disableClose: true,
      data: { asignacion: element },
    });
    this.dialogRef.afterClosed().subscribe(() => {
      this.onModalClosed();
    });
  }

  onModalClosed() {
    this.actualizarAsignacion(this.asignacion);
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
  templateUrl: './modal-formulario-asignacion.html',
  styleUrls: ['./asignacion.component.css'],
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { subscriptSizing: 'dynamic' },
    },
  ],
})
export class ModalFormularioAsignacion {
  editar: boolean = false;
  formulario!: FormGroup;
  listadoPersonas: PersonaDto[] = [];
  listadoCuestionarios: Cuestionario[] = [];

  constructor(
    public dialogRef: MatDialogRef<ModalFormularioAsignacion>,
    private formBuilder: FormBuilder,
    public dialog: MatDialog,
    private authService: AuthService,
    private router: Router,
    private personaService: PersonaService,
    private cuestionarioService: CuestionarioService,
    private asginacionService: AsginacionService,

    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.authService.validacionToken()) {
      this.crearFormulario();
      console.log(data.asignacion);

      if (data.asignacion.asignacionCodigo !== undefined) {
        console.log('entra');

        this.editarAsignacionTrivia(data.asignacion);
      }
    }
  }

  ngOnInit() {
    this.obtenerAspirantes();
    this.obtenerCuestonarios();
  }

  obtenerAspirantes() {
    this.personaService
      .obtenerAspirantesEntidad(this.data.asignacion.entidadCodigo)
      .subscribe((data) => {
        this.listadoPersonas = data;
      });
  }

  obtenerCuestonarios() {
    this.cuestionarioService
      .obtenerCuestionariosAspirantes()
      .subscribe((data) => {
        this.listadoCuestionarios = data;
      });
  }

  private crearFormulario(): void {
    this.formulario = this.formBuilder.group({
      codigo: new FormControl(''),
      usuario: new FormControl('', Validators.required),
      cuestionario: new FormControl('', Validators.required),
      fechaInicio: new FormControl('', Validators.required),
      fechaFin: new FormControl('', Validators.required),
      estado: new FormControl(''),
    });

    // Escuchar cambios en el campo 'cuestionario' para aplicar validación personalizada
    this.formulario
      .get('cuestionario')
      ?.valueChanges.subscribe((cuestionarioCodigo: number) => {
        const cuestionario = this.listadoCuestionarios.find(
          (c) => c.codigo === cuestionarioCodigo
        );
        if (cuestionario) {
          this.formulario.setValidators(this.validarRangoFechas(cuestionario));
          this.formulario.updateValueAndValidity();
        }
      });
  }

  validarRangoFechas(cuestionario: Cuestionario): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const fechaInicioControl = formGroup.get('fechaInicio');
      const fechaFinControl = formGroup.get('fechaFin');
      if (!fechaInicioControl || !fechaFinControl || !cuestionario) {
        return null;
      }

      const fechaInicio = new Date(fechaInicioControl.value);
      const fechaFin = new Date(fechaFinControl.value);
      const cuestionarioInicio = new Date(cuestionario.fechaInicio);
      const cuestionarioFin = new Date(cuestionario.fechaFin);

      // Validar que las fechas estén dentro del rango del cuestionario
      if (fechaInicio < cuestionarioInicio || fechaFin > cuestionarioFin) {
        return { rangoFechasInvalido: true };
      }

      // Validar que la fecha de inicio no sea mayor que la fecha de fin
      if (fechaInicio > fechaFin) {
        return { fechasDesordenadas: true };
      }

      return null;
    };
  }

  generarEntidad(): void {
    let asignacion: AsignacionTrivia = new AsignacionTrivia();
    asignacion.codigo = this.formulario.get('codigo')!.value;
    asignacion.usuario = this.formulario.get('usuario')!.value;
    asignacion.cuestionario = this.formulario.get('cuestionario')!.value;
    asignacion.fechaAsignacion = this.formulario.get('fechaInicio')!.value;
    asignacion.fechaFinalizacion = this.formulario.get('fechaFin')!.value;
    asignacion.estado = this.formulario.get('estado')!.value;

    if (this.editar) {
      this.actualizarAsignacionTrivia(asignacion);
    } else {
      this.registrarAsignacionTrivia(asignacion);
    }
  }

  registrarAsignacionTrivia(asignacion: AsignacionTrivia) {
    this.asginacionService.registrarAsignacionTrivia(asignacion).subscribe(
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

  actualizarAsignacionTrivia(asignacion: AsignacionTrivia) {
    this.asginacionService.actualizarAsignacionTrivia(asignacion).subscribe(
      (data) => {
        if (data > 0) {
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
            title: 'Proceso realizado',
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

  editarAsignacionTrivia(element: AsignacionDto) {
    this.editar = true;
    this.formulario.get('codigo')!.setValue(element.asignacionCodigo);
    this.formulario.get('usuario')!.setValue(element.usuarioCodigo);
    this.formulario.get('cuestionario')!.setValue(element.cuestionarioCodigo);
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
    const fechaInicioFormatted = formatDate(new Date(element.fechaAsignacion));
    const fechaFinFormatted = formatDate(new Date(element.fechaFinalizacion));
    this.formulario.get('fechaInicio')!.setValue(fechaInicioFormatted);
    this.formulario.get('fechaFin')!.setValue(fechaFinFormatted);
    this.formulario.get('estado')!.setValue(element.estado);
  }

  cancelar() {
    this.formulario.reset();
    this.crearFormulario();
    this.editar = false;
    this.dialogRef.close();
  }

  mensajeSuccses() {
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
      title: 'Proceso realizado',
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
