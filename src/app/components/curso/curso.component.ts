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
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Curso } from 'src/app/models/curso';
import { AuthService } from 'src/app/services/auth.service';
import { CursoService } from 'src/app/services/curso.service';
import { PersonaService } from 'src/app/services/persona.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-curso',
  templateUrl: './curso.component.html',
  styleUrls: ['./curso.component.css'],
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { subscriptSizing: 'dynamic' },
    },
  ],
})
export class CursoComponent {
  listadoCurso: Curso[] = [];

  dataSource = new MatTableDataSource<Curso>([]);
  displayedColumns: string[] = [
    'codigo',
    'curso',
    'descripcion',
    'instructor',
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
    private cursoService: CursoService
  ) {
    if (this.authService.validacionToken()) {
      this.obtenerCursos();
    }
  }

  obtenerCursos() {
    this.cursoService.obtenerCursos().subscribe((data) => {
      this.listadoCurso = data;
      this.dataSource = new MatTableDataSource<Curso>(this.listadoCurso);
      this.paginator.firstPage();
      this.dataSource.paginator = this.paginator;
    });
  }

  registrarFormulario(): void {
    this.dialogRef = this.dialog.open(ModalFormularioCurso, {
      width: '50%',
      disableClose: true,
    });
    this.dialogRef.afterClosed().subscribe(() => {
      this.onModalClosed();
    });
  }

  onModalClosed() {
    this.obtenerCursos();
  }

  filtrar(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  eliminarCurso(element: any) {
    Swal.fire({
      title:
        '¿Se encuentra seguro de eliminar el curso ' + element.nombre + ' ?',
      text: 'La siguiente acción no podrá deshacerse.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#00c053',
      cancelButtonColor: '#DC1919',
      confirmButtonText: 'Aceptar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.cursoService.eliminarCurso(element).subscribe((data) => {
          Swal.fire({
            icon: 'success',
            title: '¡Transacción realizada con éxito!',
            confirmButtonColor: '#00c053',
            confirmButtonText: 'Ok',
          });
          this.obtenerCursos();
        });
      }
    });
  }

  editarCurso(curso: Curso) {
    this.dialogRef = this.dialog.open(ModalFormularioCurso, {
      width: '50%',
      disableClose: true,
      data: { curso },
    });
    this.dialogRef.afterClosed().subscribe(() => {
      this.onModalClosed();
    });
  }
}
//// MODAL FORMULARIO

@Component({
  selector: 'modal-formulario-curso',
  templateUrl: './modal-formulario-curso.html',
  styleUrls: ['./curso.component.css'],
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { subscriptSizing: 'dynamic' },
    },
  ],
})
export class ModalFormularioCurso {
  listadoInstructores: any[] = [];
  editar: boolean = false;
  nameFile: string = 'Archivo: pdf';
  form!: FormGroup;
  paises!: Observable<any[]>; // Ajusta el tipo según tus datos
  pais: any[] = [];
  charCount: number = 0;

  constructor(
    public dialogRef: MatDialogRef<ModalFormularioCurso>,
    private formBuilder: FormBuilder,
    public personaService: PersonaService,
    public dialog: MatDialog,
    private authService: AuthService,
    private router: Router,
    private cursoService: CursoService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.authService.validacionToken()) {
      this.crearFormCurso();
      this.obtenerinstructores();
      if (JSON.stringify(data) !== 'null') {
        this.editarCurso(data.curso);
      }
    }
  }

  private crearFormCurso(): void {
    this.form = this.formBuilder.group({
      codigo: new FormControl(''),
      nombre: new FormControl('', Validators.required),
      descripcion: ['', [Validators.required, this.charLimitValidator(500)]],
      instructor: new FormControl('', Validators.required),
    });
  }

  countCharacters(event: Event): void {
    const input = event.target as HTMLTextAreaElement;
    this.charCount = input.value.length;
  }

  charLimitValidator(maxChars: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const charCount = control.value ? control.value.length : 0;
      return charCount > maxChars ? { charLimitExceeded: true } : null;
    };
  }

  get descripcion() {
    return this.form.get('descripcion');
  }

  transformToUppercase(event: Event, controlName: string): void {
    const inputElement = event.target as HTMLInputElement;
    const uppercaseValue = inputElement.value.toUpperCase();
    inputElement.value = uppercaseValue;
    this.form.get(controlName)?.setValue(uppercaseValue);
  }

  obtenerinstructores() {
    this.personaService.obtenerInstructores().subscribe((data) => {
      this.listadoInstructores = data;
    });
  }

  generarCurso(): void {
    let curso: Curso = new Curso();
    curso.codigo = this.form.get('codigo')!.value;
    curso.nombre = this.form.get('nombre')!.value;
    curso.descripcion = this.form.get('descripcion')!.value;
    curso.instructor = this.form.get('instructor')!.value;

    if (this.editar) {
      this.actualizarCurso(curso);
    } else {
      this.registrarCurso(curso);
    }
  }

  editarCurso(curso: Curso) {
    this.editar = true;
    this.form.get('codigo')!.setValue(curso.codigo);
    this.form.get('nombre')!.setValue(curso.nombre);
    this.form.get('descripcion')!.setValue(curso.descripcion);
    this.form.get('instructor')!.setValue(curso.instructor);
  }

  actualizarCurso(curso: any) {
    this.cursoService.actualizarCurso(curso).subscribe(
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

  registrarCurso(curso: any) {
    this.cursoService.registrarCurso(curso).subscribe(
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
          this.crearFormCurso();
        } else {
          this.mensajeError();
        }
      },
      (err) => this.fError(err)
    );
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

  cancelar() {}
}
