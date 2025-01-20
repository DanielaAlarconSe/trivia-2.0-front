import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Cuestionario } from 'src/app/models/cuestionario';
import { Pregunta } from 'src/app/models/pregunta';
import { RespuestaOpcion } from 'src/app/models/respuesta-opcion';
import { PreguntaRespuesta } from 'src/app/models/pregunta-respuesta';
import { RespuestaService } from 'src/app/services/respuesta.service';
import { PreguntaService } from 'src/app/services/pregunta.service';
import { CuestionarioService } from 'src/app/services/cuestionario.service';
import { PreguntaRespuestaService } from 'src/app/services/pregunta-respuesta.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-vista-previa',
  templateUrl: './vista-previa.component.html',
  styleUrls: ['./vista-previa.component.css'],
})
export class VistaPreviaComponent implements OnInit {
  formulario!: FormGroup;
  listadoCuestionarios: Cuestionario[] = [];
  listadoPreguntas: Pregunta[] = [];
  listadoOpciones: RespuestaOpcion[] = [];
  listadoPreguntaRespuestas: Array<PreguntaRespuesta[]> = new Array();
  listadoRespuestas: Array<PreguntaRespuesta[]> = new Array();
  cuestionario!: any;
  flag: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    public cuestionarioService: CuestionarioService,
    public preguntaService: PreguntaService,
    public respuestaService: RespuestaService,
    public preguntaRespuestaService: PreguntaRespuestaService,
    private authService:AuthService,
  ) {
    this.crearFormulario();
    this.obtenerCuestionarios();
  }

  ngOnInit() {}

  private crearFormulario(): void {
    this.formulario = this.formBuilder.group({
      codigo: new FormControl('', Validators.required),
    });
  }

  obtenerCuestionarios(): void {
    this.cuestionarioService.obtenerCuestionarios( this.authService.user.tipoUsuarioCodigo,
      this.authService.user.personaCodigo).subscribe((data) => {
      this.listadoCuestionarios = data;
    });
  }

  visualizar() {
    this.flag = true;
    this.cuestionario = this.listadoCuestionarios.find(
      (objeto) => objeto.codigo === this.formulario.get('codigo')!.value
    );
    this.listarPreguntasCuestionario();
  }

  listarPreguntasCuestionario() {
    this.preguntaService
      .obtenerPreguntasCuestionario(this.formulario.get('codigo')!.value)
      .subscribe((data) => {
        this.listadoPreguntas = data;
        for (const pregunta of data) {
          this.preguntaRespuestaService
            .obtenerPreguntaRespuestas(pregunta.codigo)
            .subscribe((data) => {
              this.listadoPreguntaRespuestas.push(data);
              this.listadoPreguntaRespuestas[pregunta.codigo] = data;
            });
        }
        this.funcion();
      });
  }

  funcion() {
    for (let index = 0; index < this.listadoPreguntas.length; index++) {
      this.preguntaRespuestaService
        .obtenerPreguntaRespuestas(this.listadoPreguntas[index].codigo)
        .subscribe((data) => {
          this.listadoRespuestas.push(data);

          this.listadoRespuestas[index] = data;
        });
    }
  }
}
