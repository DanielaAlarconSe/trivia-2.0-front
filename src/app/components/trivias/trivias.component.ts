import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Cuestionario } from 'src/app/models/cuestionario';
import { AuthService } from 'src/app/services/auth.service';
import { CuestionarioService } from 'src/app/services/cuestionario.service';

@Component({
  selector: 'app-trivias',
  templateUrl: './trivias.component.html',
  styleUrls: ['./trivias.component.css'],
})
export class TriviasComponent {
  cuestionarios!: Cuestionario[];
  precarga: boolean = false;
  encuesta: number = 0;
  cursoCodigo!: number;
  categoria1Cuestionarios: any[] = [];

  constructor(
    public cuestionarioService: CuestionarioService,
    private activatedRoute: ActivatedRoute
  ) {
    this.activatedRoute.params.subscribe((params) => {
      this.cursoCodigo = params['codigo'];
    });
  }

  ngOnInit() {
    this.listarCuestionario();
  }

  realizarEncuesta(codigo: number) {
    //this.cuestionarioService.obtenerEncuesta(codigo);
  }

  listarCuestionario() {
    this.cuestionarioService
      .obtenerCuestionariosCurso(this.cursoCodigo)
      .subscribe((data) => {
        this.precarga = true;
        this.cuestionarios = data;
        console.log(data);
        
        this.cuestionariosCategoria1();
      });
  }

  cuestionariosCategoria1(){
    this.categoria1Cuestionarios = this.cuestionarios.filter(
      cuestionario => cuestionario.categoriaCodigo === 1
    );
  }
}
