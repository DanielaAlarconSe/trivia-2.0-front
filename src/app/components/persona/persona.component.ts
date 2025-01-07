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
import { Persona } from 'src/app/models/persona';
import { AuthService } from 'src/app/services/auth.service';
import { PersonaService } from 'src/app/services/persona.service';
import Swal from 'sweetalert2';
import { UbicacionService } from 'src/app/services/ubicacion.service';
import { Observable, map, of, startWith } from 'rxjs';

@Component({
  selector: 'app-persona',
  templateUrl: './persona.component.html',
  styleUrls: ['./persona.component.css'],
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { subscriptSizing: 'dynamic' },
    },
  ],
})
export class PersonaComponent {
  listadoPersona: Persona[] = [];

  dataSource = new MatTableDataSource<Persona>([]);
  displayedColumns: string[] = [
    'index',
    'nombres',
    'email',
    'pais',
    'fechaRegistro',
    'opciones',
  ];
  @ViewChild(MatPaginator, { static: false }) paginator!: MatPaginator;

  dialogRef!: MatDialogRef<any>;
  palabrasClaves!: string;

  form!: FormGroup;

  constructor(
    public personaService: PersonaService,
    public dialog: MatDialog,
    private authService: AuthService,
    private router: Router
  ) {
    if (this.authService.validacionToken()) {
      this.obtenerPersonas();
    }
  }

  obtenerPersonas() {
    this.personaService.obtenerPersonas().subscribe((data: any) => {
      this.listadoPersona = data;
      this.dataSource = new MatTableDataSource<Persona>(data);
      this.paginator.firstPage();
      this.dataSource.paginator = this.paginator;
    });
  }

  registrarFormulario(): void {
    this.dialogRef = this.dialog.open(ModalFormularioPersona, {
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
    this.obtenerPersonas();
    this.palabrasClaves = '';
  }

  editarFormulario(element: any): void {
    this.dialogRef = this.dialog.open(ModalFormularioPersona, {
      width: '50%',
      disableClose: true,
      data: { sede: element },
    });
    this.dialogRef.afterClosed().subscribe(() => {
      this.onModalClosed();
    });
  }

  onModalClosed() {
    this.obtenerPersonas();
  }

  eliminar(persona: Persona) {
    this.personaService.actualizarPersona(persona).subscribe(
      (data: any) => {
        if (data > 0) {
          this.obtenerPersonas();
        } else {
          this.mensajeError();
        }
      },
      (err: any) => this.fError(err)
    );
  }

  editarPersona(element: Persona) {
    this.editarFormulario(element);
  }

  eliminarPersona(element: Persona) {
    Swal.fire({
      title:
        '¿Se encuentra seguro de eliminar a ' +
        element.nombre +
        ' ' +
        element.apellido +
        ' ?',
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
  selector: 'modal-formulario-persona',
  templateUrl: './modal-formulario-persona.html',
  styleUrls: ['./persona.component.css'],
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { subscriptSizing: 'dynamic' },
    },
  ],
})
export class ModalFormularioPersona {
  editar: boolean = false;
  nameFile: string = 'Archivo: pdf';
  listadoPersona: Persona[] = [];
  form!: FormGroup;
  paises!: Observable<any[]>; // Ajusta el tipo según tus datos
  pais: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<ModalFormularioPersona>,
    private formBuilder: FormBuilder,
    public personaService: PersonaService,
    public dialog: MatDialog,
    private authService: AuthService,
    private router: Router,
    private ubicacionService: UbicacionService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.authService.validacionToken()) {
      this.crearFormPersona();
      this.obtenerPersonas();
      this.obtenerPaises();
      if (JSON.stringify(data) !== 'null') {
        this.editarPersona(data.sede);
      }
    }
  }

  ngOnInit() {
    this.form
      .get('pais')
      ?.valueChanges.pipe(
        startWith(''),
        map((value) => (typeof value === 'string' ? value : value?.nombre)),
        map((name) => (name ? this.filterPais(name) : this.pais.slice()))
      )
      .subscribe((filteredPaises) => {
        this.paises = of(filteredPaises);
      });
  }

  private crearFormPersona(): void {
    this.form = this.formBuilder.group({
      codigo: new FormControl(''),
      // DATOS PERSONALES
      nombre: new FormControl('', Validators.required),
      apellido: new FormControl('', Validators.required),
      // DATOS DE CONTACTO
      pais: new FormControl('', Validators.required),
      correoPersonal: new FormControl('', [
        Validators.required,
        Validators.email,
      ]),
      estado: new FormControl(''),
    });
  }

  obtenerPaises(): void {
    this.ubicacionService.obtenerPaises().subscribe((data) => {
      this.pais = data;
    });
  }

  filterPais(name: string): any[] {
    const filterValue = name.toLowerCase();
    return this.pais.filter((option) =>
      option.nombre.toLowerCase().includes(filterValue)
    );
  }

  displayFn(pais: any): string {
    return pais && pais.nombre ? pais.nombre : '';
  }

  generarPersona(): void {
    let persona: Persona = new Persona();
    persona.codigo = this.form.get('codigo')!.value;
    persona.nombre = this.form.get('nombre')!.value;
    persona.apellido = this.form.get('apellido')!.value;

    //DATOS DE CONTACTO
    persona.paisResidencia = this.form.get('pais')!.value;
    persona.correo = this.form.get('correoPersonal')!.value;

    persona.estado = this.form.get('estado')!.value;

    if (this.editar) {
      this.actualizarPersona(persona);
    } else {
      this.registrarPersona(persona);
    }
  }

  registrarPersona(persona: Persona) {
    const paisSeleccionado = this.form.get('pais')?.value;
    const codigoPais = paisSeleccionado.codigo;

    let d = new Persona();
    d.codigo = persona.codigo;
    d.nombre = persona.nombre;
    d.apellido = persona.apellido;
    d.correo = persona.correo;
    d.paisResidencia = codigoPais;

    this.personaService.registrarPersona(d).subscribe(
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
          this.crearFormPersona();
        } else {
          this.mensajeError();
        }
      },
      (err) => this.fError(err)
    );
  }

  actualizarPersona(persona: Persona) {
    this.personaService.actualizarPersona(persona).subscribe(
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

  editarPersona(element: Persona) {
    this.editar = true;
    this.form.get('nombre')!.setValue(element.nombre);
    this.form.get('apellido')!.setValue(element.apellido);
    this.form.get('pais')!.setValue(element.paisResidencia);
    this.form.get('correoPersonal')!.setValue(element.correo);
    this.form.get('codigo')!.setValue(element.codigo);
  }

  eliminarPersona() {
    let persona: Persona = new Persona();
    persona.codigo = this.form.get('codigo')!.value;
    persona.nombre = this.form.get('nombre')!.value;
    persona.apellido = this.form.get('apellido')!.value;
    //DATOS DE CONTACTO
    persona.paisResidencia = this.form.get('pais')!.value;
    persona.correo = this.form.get('correoPersonal')!.value;
    this.actualizarPersona(persona);
  }

  cancelar() {
    this.form.reset();
    this.crearFormPersona();
    this.editar = false;
    this.dialogRef.close();
  }

  obtenerPersonas() {
    this.personaService.obtenerPersonas().subscribe((data) => {
      this.listadoPersona = data;
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

  transformToUppercase(event: Event, controlName: string): void {
    const inputElement = event.target as HTMLInputElement;
    const uppercaseValue = inputElement.value.toUpperCase();
    inputElement.value = uppercaseValue;
    this.form.get(controlName)?.setValue(uppercaseValue);
  }
}
