import { Component } from '@angular/core';
import { Curso } from 'src/app/models/curso';
import { CursoService } from 'src/app/services/curso.service';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.css'],
})
export class InicioComponent {
  listadoCursos: Curso[] = [];
  constructor(private cursoService: CursoService) {
    this.obtenerCursos();
  }

  obtenerCursos() {
    this.cursoService.obtenerCursos(0,0).subscribe((data) => {
      this.listadoCursos = data;
    });
  }
}
