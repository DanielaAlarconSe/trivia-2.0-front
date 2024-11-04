import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import html2canvas from 'html2canvas';
import { Cuestionario } from 'src/app/models/cuestionario';
import { Pregunta } from 'src/app/models/pregunta';
import { RespuestaOpcion } from 'src/app/models/respuesta-opcion';
import { PreguntaRespuesta } from 'src/app/models/pregunta-respuesta';
import { CuestionarioService } from 'src/app/services/cuestionario.service';
import { PreguntaService } from 'src/app/services/pregunta.service';
import { RespuestaService } from 'src/app/services/respuesta.service';
import { PreguntaRespuestaService } from 'src/app/services/pregunta-respuesta.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Respuesta } from 'src/app/models/respuesta';
import { RespuestaCuestionario } from 'src/app/models/respuesta-cuestionario';
import { ResultadosReportesService } from 'src/app/services/resultados-reportes.service';
import Swal from 'sweetalert2';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-trivia-publica',
  templateUrl: './trivia-publica.component.html',
  styleUrls: ['./trivia-publica.component.css'],
})
export class TriviaPublicaComponent implements OnInit {
  formularioEstudiante!: FormGroup;
  formulario!: FormGroup;
  cuestionario!: Cuestionario;
  listadoPreguntas: Pregunta[] = [];
  listadoOpciones: RespuestaOpcion[] = [];
  listadoPreguntaRespuestas: Array<PreguntaRespuesta[]> = new Array();
  listadoRespuestas: Array<PreguntaRespuesta[]> = new Array();
  flag: boolean = false;
  cuestionarioCodigo!: number;
  estudianteCodigo!: number;
  calificacion!: number;

  cloudinaryUploadUrl =
    'https://api.cloudinary.com/v1_1/df4xfvk4i/image/upload'; // Cambia YOUR_CLOUD_NAME
  uploadPreset = 'ml_default'; // Cambia esto por el upload preset que configures en Cloudinary

  @ViewChild('captureElement') captureElement!: ElementRef;

  constructor(
    private formBuilder: FormBuilder,
    public cuestionarioService: CuestionarioService,
    public preguntaService: PreguntaService,
    public respuestaService: RespuestaService,
    public preguntaRespuestaService: PreguntaRespuestaService,
    public resultadosReportesService: ResultadosReportesService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private http: HttpClient
  ) {
    this.activatedRoute.params.subscribe((params) => {
      this.cuestionarioCodigo = params['codigo'];
    });
    this.crearFormularioEstudiante();
    this.obtenerCuestionario();
  }

  ngOnInit() {
    this.setupNombreChange();
  }

  takeScreenshotAndUpload() {
    const element = this.captureElement.nativeElement;

    html2canvas(element).then((canvas) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const formData = new FormData();
          formData.append('file', blob);
          formData.append('upload_preset', this.uploadPreset); // Tu preset en Cloudinary

          this.http.post(this.cloudinaryUploadUrl, formData).subscribe(
            (response: any) => {
              const imageUrl = response.secure_url;
              this.shareOnFacebook(imageUrl);
            },
            (error) => {
              console.error('Error al subir la imagen a Cloudinary:', error);
            }
          );
        }
      });
    });
  }

  shareOnFacebook(imageUrl: string) {
    const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      imageUrl
    )}`;
    window.open(facebookShareUrl, '_blank');
  }

  private crearFormularioEstudiante(): void {
    this.formularioEstudiante = this.formBuilder.group({
      nombre: new FormControl('', Validators.required),
    });
  }

  private setupNombreChange(): void {
    this.formularioEstudiante.get('nombre')?.valueChanges.subscribe((value) => {
      const uppercaseValue = value.toUpperCase();
      if (value !== uppercaseValue) {
        this.formularioEstudiante
          .get('nombre')
          ?.setValue(uppercaseValue, { emitEvent: false });
      }
    });
  }

  generarEstudiante(): void {
    let respuestaCuestionario: RespuestaCuestionario =
      new RespuestaCuestionario();
    respuestaCuestionario.estudianteNombre =
      this.formularioEstudiante.get('nombre')!.value;
    respuestaCuestionario.cuestionarioCodigo = this.cuestionarioCodigo;
    this.cargarRespuestas();
  }

  registrarEstudiante(respuestaCuestionario: RespuestaCuestionario) {
    this.respuestaService
      .registrarRespuestaCuestionario(respuestaCuestionario)
      .subscribe(
        (data) => {
          if (data > 0) {
            this.cargarRespuestas();
          } else {
            this.mensajeError();
          }
        },
        (err) => this.fError(err)
      );
  }

  obtenerCuestionario(): void {
    this.cuestionarioService
      .obtenerCuestionario(this.cuestionarioCodigo)
      .subscribe((data) => {
        if (JSON.stringify(data) != '[]') {
          this.cuestionario = data[0];
        }
      });
    this.listarPreguntasCuestionario();
  }

  listarPreguntasCuestionario() {
    this.preguntaService
      .obtenerPreguntasCuestionario(this.cuestionarioCodigo)
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
        this.crearFormularioCuestionario();
      });
  }

  crearFormularioCuestionario() {
    this.formulario = this.formBuilder.group({});
    for (const pregunta of this.listadoPreguntas) {
      this.formulario.addControl(
        `respuesta${pregunta.codigo}`,
        new FormControl('', Validators.required)
      );
    }
  }

  salir() {
    const swalWithBootstrapButtons = Swal.mixin({
      customClass: {
        confirmButton: 'btn btn-ciber-v',
        cancelButton: 'btn btn-danger ml-3',
      },
      buttonsStyling: false,
    });

    swalWithBootstrapButtons
      .fire({
        title: '¡Advertencia!',
        text: 'Está a punto de salir de la trivia, si decides proceder sin guardar estos cambios, se perderán permanentemente.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Permanecer',
        cancelButtonText: 'Regresar',
        reverseButtons: false,
      })
      .then((result) => {
        if (result.isConfirmed) {
          swalWithBootstrapButtons.fire(
            'Termina tu proceso',
            'Desarrolla a cabalidad la encuesta.',
            'success'
          );
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          swalWithBootstrapButtons.fire(
            'Trivias',
            'Los cambios no se han guardado.',
            'warning'
          );
          this.router.navigate(['/trivias', this.cuestionario.cursoCodigo]);
        }
      });
  }

  cargarRespuestas() {
    this.respuestaService.obtenerUltimoRegistro().subscribe((data) => {
      this.estudianteCodigo = data;
      if (this.formulario.valid) {
        // Recoge las respuestas
        const respuestas: Respuesta[] = [];
        let calificacionTotal = 0;
        for (const pregunta of this.listadoPreguntas) {
          const respuesta = new Respuesta();
          respuesta.preguntaCodigo = pregunta.codigo;
          respuesta.preguntaRespuestaCodigo = this.formulario.get(
            `respuesta${pregunta.codigo}`
          )?.value;
          // Obtener la opción seleccionada para esta pregunta
          const opcionSeleccionada = this.listadoPreguntaRespuestas[
            pregunta.codigo
          ].find(
            (opcion) => opcion.codigo === respuesta.preguntaRespuestaCodigo
          );

          if (opcionSeleccionada) {
            respuesta.puntuacion = opcionSeleccionada.puntuacion;
            calificacionTotal += opcionSeleccionada.puntuacion;
          }
          let respuestaTriva: Respuesta = new Respuesta();
          respuestaTriva.respuestaCuestionarioCodigo = this.estudianteCodigo;
          respuestaTriva.preguntaCodigo = respuesta.preguntaCodigo;
          respuestaTriva.preguntaRespuestaCodigo =
            respuesta.preguntaRespuestaCodigo;
        }

        let respuestaCuestionario: RespuestaCuestionario =
          new RespuestaCuestionario();
        respuestaCuestionario.codigo = this.estudianteCodigo;
        respuestaCuestionario.calificacionTotal = calificacionTotal;

        Swal.fire({
          title:
            this.formularioEstudiante.get('nombre')!.value +
            ' tu calificación es de: ' +
            calificacionTotal,
          text: 'Gracias por participar',
          width: 600,
          padding: '3em',
          color: '#ffffff',
          background: '#333333',
          html: `
        <div style="display: flex; flex-direction: column; align-items: center;">
          <img src="assets/images/login.png" alt="Google Logo" style="width: 300px; margin-bottom: 20px;" />
          <button id="facebook-share-btn" style="
            background-color: #1877f2;
            color: white;
            border: none;
            padding: 10px 20px;
            font-size: 16px;
            border-radius: 5px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-top: 20px;
          ">
            <i class="fab fa-facebook-f" style="margin-right: 8px;"></i> Compartir en Facebook
          </button>
        </div>
    `,
          showConfirmButton: false,
          allowOutsideClick: false,
          allowEscapeKey: false,
          allowEnterKey: false,
          willClose: () => {
            this.router.navigate(['/trivias', this.cuestionario.cursoCodigo]);
          },
        });

        // Espera a que el modal se haya cargado en el DOM
        setTimeout(() => {
          const facebookBtn = document.getElementById('facebook-share-btn');

          facebookBtn?.addEventListener('click', () => {
            // Selecciona el modal de SweetAlert para capturarlo
            const swalContainer = document.querySelector(
              '.swal2-popup'
            ) as HTMLElement;

            if (swalContainer) {
              // Toma la captura del contenedor de SweetAlert
              html2canvas(swalContainer).then((canvas) => {
                canvas.toBlob((blob) => {
                  if (blob) {
                    const formData = new FormData();
                    formData.append('file', blob);
                    formData.append('upload_preset', this.uploadPreset);

                    // Sube la imagen a Cloudinary (o el servicio que uses)
                    this.http
                      .post(this.cloudinaryUploadUrl, formData)
                      .subscribe(
                        (response: any) => {
                          const imageUrl = response.secure_url;
                          // Llama a la función para compartir en Facebook
                          this.shareOnFacebook(imageUrl);
                        },
                        (error) => {
                          console.error(
                            'Error al subir la imagen a Cloudinary:',
                            error
                          );
                        }
                      );
                  }
                });
              });
            }
          });
        }, 0);
      } else {
        Swal.fire('Error', 'Por favor, complete todas las preguntas', 'error');
      }
    });
  }

  registrarTriva(respuesta: Respuesta) {
    this.respuestaService.registrarRespuestaTrivia(respuesta).subscribe(
      (data) => {
        if (data <= 0) {
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

  mensajeSuccses() {
    Swal.fire({
      icon: 'success',
      title: 'Proceso realizado',
      text: '¡Operación exitosa!',
      showConfirmButton: false,
      timer: 2500,
    });
  }

  fError(er: any): void {
    let err = er.error.error_description;
    let arr: string[] = err.split(':');
    if (arr[0] == 'Access token expired') {
      this.router.navigate(['login']);
    } else {
      this.mensajeError();
    }
  }
}
