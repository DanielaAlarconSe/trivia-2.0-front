import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { PanelComponent } from './components/panel/panel.component';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { FooterComponent } from './shared/footer/footer.component';
import { LoginComponent } from './components/login/login.component';
import { HttpClientModule } from '@angular/common/http';
import { AdminNavbarComponent } from './shared/admin-navbar/admin-navbar.component';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import {
  PersonaComponent,
  ModalFormularioPersona,
} from './components/persona/persona.component';
import { MaterialModules } from './material.modules';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import {
  CursoComponent,
  ModalFormularioCurso,
} from './components/curso/curso.component';
import {
  ModalFormularioUsuario,
  UsuarioComponent,
} from './components/usuario/usuario.component';
import {
  ModalFormularioCuestionario,
  CuestionarioComponent,
} from './components/cuestionarios/cuestionario/cuestionario.component';
import { VistaPreviaComponent } from './components/cuestionarios/vista-previa/vista-previa.component';
import {
  PreguntaComponent,
  ModalFormularioPregunta,
} from './components/cuestionarios/pregunta/pregunta.component';
import {
  RespuestaComponent,
  ModalFormularioRespuesta,
} from './components/cuestionarios/respuesta/respuesta.component';
import {
  PreguntaRespuestaComponent,
  ModalFormularioPreguntaRespuesta,
} from './components/cuestionarios/pregunta-respuesta/pregunta-respuesta.component';
import { InicioComponent } from './components/inicio/inicio.component';
import { TriviasComponent } from './components/trivias/trivias.component';
import { TriviaComponent } from './components/trivia/trivia.component';
import { CalificacionComponent } from './components/reportes/calificacion/calificacion.component';
import { RespuestasComponent } from './components/reportes/respuestas/respuestas.component';
import { FiltroCursoPipe } from './pipes/filtro-curso.pipe';
import { FiltroCuestionarioPipe } from './pipes/filtro-cuestionario.pipe';
import { TriviaPublicaComponent } from './components/trivia-publica/trivia-publica.component';
import { TriviaCompetitivaComponent } from './components/trivia-competitiva/trivia-competitiva.component';
import { EscalafonComponent } from './components/reportes/escalafon/escalafon.component';
import { EntidadComponent, ModalFormularioEntidad } from './components/entidad/entidad.component';
import { AsignacionComponent, ModalFormularioAsignacion } from './components/cuestionarios/asignacion/asignacion.component';
import { TriviaDiagnosticaComponent } from './components/trivia-diagnostica/trivia-diagnostica.component';
import { LoginDiagnosticoComponent } from './components/login-diagnostico/login-diagnostico.component';

@NgModule({
  declarations: [
    AppComponent,
    PanelComponent,
    PersonaComponent,
    LoginComponent,
    NavbarComponent,
    AdminNavbarComponent,
    FooterComponent,
    PageNotFoundComponent,
    ModalFormularioPersona,
    ModalFormularioUsuario,
    ModalFormularioCuestionario,
    ModalFormularioPregunta,
    ModalFormularioRespuesta,
    ModalFormularioPreguntaRespuesta,
    ModalFormularioEntidad,
    ModalFormularioAsignacion,
    CursoComponent,
    UsuarioComponent,
    CuestionarioComponent,
    ModalFormularioCurso,
    VistaPreviaComponent,
    PreguntaComponent,
    RespuestaComponent,
    PreguntaRespuestaComponent,
    InicioComponent,
    TriviasComponent,
    TriviaComponent,
    CalificacionComponent,
    RespuestasComponent,
    FiltroCursoPipe,
    FiltroCuestionarioPipe,
    TriviaPublicaComponent,
    TriviaCompetitivaComponent,
    EscalafonComponent,
    EntidadComponent,
    AsignacionComponent,
    TriviaDiagnosticaComponent,
    LoginDiagnosticoComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MaterialModules,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
    MatInputModule,
    MatAutocompleteModule,
  ],
  entryComponents: [
    ModalFormularioPersona,
    ModalFormularioUsuario,
    ModalFormularioCurso,
    ModalFormularioCuestionario,
    ModalFormularioPregunta,
    ModalFormularioRespuesta,
    ModalFormularioPreguntaRespuesta,
    ModalFormularioEntidad,
    ModalFormularioAsignacion
  ],
  providers: [DatePipe, { provide: MAT_DATE_LOCALE, useValue: 'es-ES' }],
  bootstrap: [AppComponent],
})
export class AppModule {}
