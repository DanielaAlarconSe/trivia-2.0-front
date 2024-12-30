import { PreguntaService } from './../../../services/pregunta.service';
import { ResultadosReportesService } from 'src/app/services/resultados-reportes.service';
import { CursoService } from './../../../services/curso.service';
import { Component, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { AuthService } from 'src/app/services/auth.service';
import { Cuestionario } from 'src/app/models/cuestionario';
import { CuestionarioService } from 'src/app/services/cuestionario.service';
import { Curso } from 'src/app/models/curso';
import { Calificacion } from 'src/app/models/calificacion';
import { Pregunta } from 'src/app/models/pregunta';
import { ReporteAgrupadoDto } from 'src/app/models/dto/reporte-agrupado-dto';

@Component({
  selector: 'app-respuestas',
  templateUrl: './respuestas.component.html',
  styleUrls: ['./respuestas.component.css'],
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { subscriptSizing: 'dynamic' },
    },
  ],
})
export class RespuestasComponent {
  listadoCalificaciones: Calificacion[] = [];
  listadoCursos: Curso[] = [];
  listadoCuestionarios: Cuestionario[] = [];
  listadoPreguntas: Pregunta[] = [];
  listadoReporteAgrupado: ReporteAgrupadoDto[] = [];
  codigosPreguntas: number[] = [];

  dataSource = new MatTableDataSource<Calificacion>([]);
  displayedColumns: string[] = [
    'index',
    'nombre',
    'curso',
    'cuestionario',
    'calificacion',
    'fecha',
  ];
  @ViewChild(MatPaginator, { static: false }) paginator!: MatPaginator;

  dialogRef!: MatDialogRef<any>;
  palabrasClaves!: string;
  cursoCodigo!: number;
  cuestionarioCodigo!: number;

  constructor(
    public cuestionarioService: CuestionarioService,
    public resultadosReportesService: ResultadosReportesService,
    public cursoService: CursoService,
    public preguntaService: PreguntaService,
    public dialog: MatDialog,
    private authService: AuthService
  ) {
    if (this.authService.validacionToken()) {
      this.obtenerCursos();
    }
  }

  obtenerCalificaciones() {
    this.resultadosReportesService
      .obtenerCalificaciones()
      .subscribe((data: any) => {
        console.log(data);
        this.listadoCalificaciones = data;
        this.dataSource = new MatTableDataSource<Calificacion>(data);
        this.paginator.firstPage();
        this.dataSource.paginator = this.paginator;
      });
  }

  obtenerCursos() {
    this.cursoService.obtenerCursos().subscribe((data) => {
      this.listadoCursos = data;
    });
  }

  obtenerCuestionarios(codigo: number) {
    this.cuestionarioService
      .obtenerCuestionariosCursoGeneral(codigo)
      .subscribe((data) => {
        this.listadoCuestionarios = data;
      });
  }

  obtenerPreguntas(cuestionarioCodigo: number) {
    console.log('|||', cuestionarioCodigo);

    this.cuestionarioCodigo = cuestionarioCodigo;
    this.preguntaService
      .obtenerPreguntasCuestionario(cuestionarioCodigo)
      .subscribe((data) => {
        this.listadoPreguntas = data;
        this.codigosPreguntas = this.listadoPreguntas.map(
          (pregunta) => pregunta.codigo
        );
        this.generarReporteAgrupadoOpciones();
      });
  }

  generarReporteAgrupadoOpciones() {
    console.log('****', this.cuestionarioCodigo, '????', this.codigosPreguntas);
    this.resultadosReportesService
      .generarDatosReporteAgrupado(
        this.cuestionarioCodigo,
        this.codigosPreguntas
      )
      .subscribe((data) => {
        console.log('/////', data);

        this.listadoReporteAgrupado = data;
      });
  }

  getColumnas(): string[] {
    const allColumns: string[] = [];
    this.listadoReporteAgrupado.forEach((data) => {
      const columns = Object.keys(data.columnas);
      columns.forEach((column) => {
        if (!allColumns.includes(column)) {
          allColumns.push(column);
        }
      });
    });
    allColumns.sort();
    return allColumns;
  }
}
